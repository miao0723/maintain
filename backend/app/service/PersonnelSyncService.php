<?php

namespace app\service;

use app\model\ExternalPersonnel;
use app\model\PersonnelSyncLog;
use think\facade\Db;

/**
 * 人员同步服务
 *
 * - 以外部系统 id 为唯一键 upsert（幂等，可重复执行）；
 * - 映射 employee_name / department / position / status / is_active / wps_user_id /
 *   合同日期 / 年假；phone / id_card / address 加密落库；
 * - 离职或停用人员本地置为禁用（is_active=0），不删除；
 * - 记录同步时间、成功条数与失败明细。
 */
class PersonnelSyncService
{
    /** @var ExternalPersonnelClient */
    protected $client;

    public function __construct(?ExternalPersonnelClient $client = null)
    {
        $this->client = $client ?: new ExternalPersonnelClient();
    }

    /**
     * 执行一次全量同步
     *
     * @param string $keyword 可选，按姓名检索后同步子集
     * @param int    $operatorId 操作人用户ID
     * @param string $triggerType manual|scheduled
     * @return array 同步摘要
     */
    public function sync(string $keyword = '', int $operatorId = 0, string $triggerType = 'manual'): array
    {
        if (!$this->client->isConfigured()) {
            throw new \RuntimeException('未配置外部人员接口地址（EXTERNAL_PERSONNEL_BASE_URL），无法同步');
        }

        $log = PersonnelSyncLog::create([
            'trigger_type' => $triggerType,
            'operator_id'   => $operatorId ?: null,
            'started_at'    => date('Y-m-d H:i:s'),
            'status'        => 'running',
        ]);

        $success = 0;
        $failed = 0;
        $disabled = 0;
        $errors = [];

        try {
            $rows = $this->client->fetchAll($keyword);
            $total = count($rows);

            foreach ($rows as $row) {
                try {
                    $mapped = $this->mapRow($row);
                    if (empty($mapped['ext_id'])) {
                        throw new \RuntimeException('缺少外部ID');
                    }
                    $this->upsert($mapped, (int) $log->id);
                    $success++;
                    if ((int) ($mapped['is_active'] ?? 1) === 0) {
                        $disabled++;
                    }
                } catch (\Throwable $e) {
                    $failed++;
                    $errors[] = [
                        'ext_id' => is_array($row) ? ($row['id'] ?? null) : null,
                        'error'  => $e->getMessage(),
                    ];
                }
            }

            $log->save([
                'finished_at' => date('Y-m-d H:i:s'),
                'total'       => $total,
                'success'     => $success,
                'failed'      => $failed,
                'disabled'    => $disabled,
                'status'      => 'success',
                'error_detail' => $errors,
                'message'     => "同步完成：拉取 {$total}，成功 {$success}，失败 {$failed}，置禁用 {$disabled}",
            ]);

            return [
                'sync_id'  => (int) $log->id,
                'total'    => $total,
                'success'  => $success,
                'failed'   => $failed,
                'disabled' => $disabled,
                'errors'   => $errors,
            ];
        } catch (\Throwable $e) {
            $log->save([
                'finished_at' => date('Y-m-d H:i:s'),
                'status'      => 'failed',
                'message'     => '同步失败：' . $e->getMessage(),
                'error_detail' => $errors,
            ]);
            throw $e;
        }
    }

    /**
     * 按姓名检索（仅查询本地已同步数据）
     */
    public function searchLocal(string $keyword, int $page = 1, int $pageSize = 20): array
    {
        $query = ExternalPersonnel::order('id', 'desc');
        if (trim($keyword) !== '') {
            $query->where('employee_name', 'like', '%' . trim($keyword) . '%');
        }
        $total = $query->count();
        $list = $query->page($page, $pageSize)->select()->toArray();
        return ['list' => $list, 'total' => $total];
    }

    /**
     * 将外部原始行映射为本地字段（含加密）
     */
    protected function mapRow(array $row): array
    {
        $fm = (array) config('external.personnel.field_map');
        $inactive = (array) config('external.personnel.inactive_status');

        $pick = function (string $key) use ($row, $fm) {
            $extKey = $fm[$key] ?? $key;
            return $row[$extKey] ?? null;
        };

        $extId = $pick('id');
        $status = $pick('status');
        $isActive = $pick('is_active');

        // 判定是否在职：优先 is_active，其次 status 是否命中“离职/停用”名单
        $active = 1;
        if ($isActive !== null && $isActive !== '') {
            $active = ((int) $isActive === 1 || in_array(strtolower((string) $isActive), ['1', 'true', 'yes', 'active', 'on'], true)) ? 1 : 0;
        } elseif ($status !== null) {
            $active = in_array((string) $status, $inactive, true) || in_array(strtolower((string) $status), array_map('strtolower', $inactive), true) ? 0 : 1;
        }

        return [
            'ext_id'              => $extId !== null ? (string) $extId : null,
            'employee_name'       => $pick('employee_name'),
            'department'          => $pick('department'),
            'position'            => $pick('position'),
            'status'              => $status !== null ? (string) $status : null,
            'is_active'           => $active,
            'wps_user_id'         => $pick('wps_user_id') !== null ? (string) $pick('wps_user_id') : null,
            'phone_enc'           => CryptoService::encrypt($this->str($pick('phone'))),
            'id_card_enc'         => CryptoService::encrypt($this->str($pick('id_card'))),
            'address_enc'         => CryptoService::encrypt($this->str($pick('address'))),
            'contract_start_date' => $this->date($pick('contract_start')),
            'contract_end_date'   => $this->date($pick('contract_end')),
            'annual_leave_days'   => $this->float($pick('annual_leave')),
            'raw_json'            => json_encode($row, JSON_UNESCAPED_UNICODE),
        ];
    }

    /**
     * upsert：以 ext_id 为唯一键，存在则更新，不存在则创建
     */
    protected function upsert(array $mapped, int $syncId): void
    {
        $mapped['source_sync_id'] = $syncId;
        $mapped['synced_at'] = date('Y-m-d H:i:s');

        $existing = ExternalPersonnel::where('ext_id', $mapped['ext_id'])->find();
        if ($existing) {
            // 更新（不含 created_at）
            $existing->save($mapped);
        } else {
            ExternalPersonnel::create($mapped);
        }
    }

    protected function str($v): ?string
    {
        if ($v === null || $v === '') return null;
        return (string) $v;
    }

    protected function date($v): ?string
    {
        if (empty($v)) return null;
        $ts = is_numeric($v) ? (int) $v : strtotime((string) $v);
        return $ts ? date('Y-m-d', $ts) : null;
    }

    protected function float($v): ?float
    {
        if ($v === null || $v === '') return null;
        return (float) $v;
    }
}
