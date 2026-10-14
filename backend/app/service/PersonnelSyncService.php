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
        $skipped = 0;         // 非维修部 / 无法归类，不同步
        $createdWorkers = 0;  // 新建维修工账号
        $linkedWorkers = 0;   // 匹配到已有维修工档案（仅回写 ext_id）
        $errors = [];

        try {
            $rows = $this->client->fetchAll($keyword);
            $total = count($rows);

            foreach ($rows as $row) {
                // 仅同步“维修部”人员：其他部门/同事不同步到本系统
                if (!$this->isRepairDept($row)) {
                    $skipped++;
                    continue;
                }
                try {
                    $mapped = $this->mapRow($row);
                    if (empty($mapped['ext_id'])) {
                        throw new \RuntimeException('缺少外部ID');
                    }
                    // 1) 外部人员名册（脱敏存储，仅维修部）
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
                    continue;
                }
                // 2) 同步为维修工账号（perf_engineers + users），已存在则只回写关联不覆盖
                try {
                    $wr = $this->syncRepairWorker($row, $mapped);
                    if ($wr['action'] === 'created') {
                        $createdWorkers++;
                    } elseif ($wr['action'] === 'linked') {
                        $linkedWorkers++;
                    }
                } catch (\Throwable $e) {
                    $failed++;
                    $errors[] = [
                        'ext_id' => $mapped['ext_id'] ?? (is_array($row) ? ($row['id'] ?? null) : null),
                        'error'  => '维修工同步失败：' . $e->getMessage(),
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
                'message'     => "同步完成：拉取 {$total}，维修部同步成功 {$success}（新建账号 {$createdWorkers}，关联已有 {$linkedWorkers}），跳过其他部门 {$skipped}，失败 {$failed}，置禁用 {$disabled}",
            ]);

            return [
                'sync_id'         => (int) $log->id,
                'total'           => $total,
                'success'         => $success,
                'skipped'         => $skipped,
                'created_workers' => $createdWorkers,
                'linked_workers'  => $linkedWorkers,
                'failed'          => $failed,
                'disabled'        => $disabled,
                'errors'          => $errors,
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

    /**
     * 判断外部人员是否属于“维修部”（仅此类同步到本系统）。
     * department 或 position 含配置关键字（默认“维修部”），兜底含“维修”二字，
     * 兼容“维修一组/维修部”等写法。其他部门/同事不同步。
     */
    protected function isRepairDept(array $row): bool
    {
        $fm = (array) config('external.personnel.field_map');
        $keyword = trim((string) (config('external.personnel.department') ?: '维修部'));
        $get = function (string $key) use ($row, $fm) {
            $extKey = $fm[$key] ?? $key;
            return $row[$extKey] ?? null;
        };
        foreach ([$get('department'), $get('position')] as $value) {
            if ($value !== null && $value !== '') {
                $s = (string) $value;
                if (mb_stripos($s, $keyword) !== false || mb_stripos($s, '维修') !== false) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 将一名“维修部”外部人员同步为本地维修工账号。
     *
     * 行为：
     *  - 已存在（ext_id 或 姓名匹配到 perf_engineers）：仅回写缺失的 ext_id 关联，
     *    绝不覆盖人工维护字段（满足“先别改王刚账号”）。
     *  - 不存在：新建 users 登录账号（role=维修人员=8，初始密码 123456）+ perf_engineers 档案。
     *
     * @return array {action: created|linked, engineer_id, user_id?}
     */
    protected function syncRepairWorker(array $row, array $mapped): array
    {
        $extId = (string) $mapped['ext_id'];
        $name  = $mapped['employee_name'];
        if (empty($name)) {
            throw new \RuntimeException('缺少姓名，跳过维修工创建');
        }

        $fm = (array) config('external.personnel.field_map');
        $pick = function (string $key) use ($row, $fm) {
            $extKey = $fm[$key] ?? $key;
            return $row[$extKey] ?? null;
        };
        $phone  = $this->str($pick('phone'));
        $dept   = $this->str($pick('department'));
        $pos    = $this->str($pick('position'));
        $active = (int) ($mapped['is_active'] ?? 1);

        // 1) 匹配已有维修工档案（ext_id 优先，其次姓名）
        $eng = Db::table('perf_engineers')->where('ext_id', $extId)->find();
        if (empty($eng)) {
            $eng = Db::table('perf_engineers')->where('name', $name)->find();
        }
        if (!empty($eng)) {
            // 仅回写缺失的 ext_id 关联，不覆盖任何人工维护字段
            if (empty($eng['ext_id'])) {
                Db::table('perf_engineers')->where('id', $eng['id'])->update(['ext_id' => $extId]);
            }
            if (!empty($eng['user_id'])) {
                $uExt = Db::table('users')->where('id', $eng['user_id'])->value('ext_id');
                if (empty($uExt)) {
                    Db::table('users')->where('id', $eng['user_id'])->update(['ext_id' => $extId]);
                }
            }
            return ['action' => 'linked', 'engineer_id' => $eng['id']];
        }

        // 2) 新建 users 登录账号（username=repair_<ext_id>，初始密码 123456，role=维修人员）
        $username = 'repair_' . $extId;
        $userId = Db::table('users')->where('username', $username)->value('id');
        if (empty($userId)) {
            $userId = Db::table('users')->insertGetId([
                'username'   => $username,
                'password'   => password_hash('123456', PASSWORD_BCRYPT),
                'real_name'  => $name,
                'role_type'  => 4,
                'role_id'    => 8,
                'status'     => $active,
                'phone'      => $phone,
                'position'   => $pos,
                'ext_id'     => $extId,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        } else {
            // 账号已存在但无 ext_id 关联，补回写
            Db::table('users')->where('id', $userId)->update(['ext_id' => $extId]);
        }

        // 3) 新建 perf_engineers 维修工档案（工号碰撞演示种子 E1001~E4001 时回退 EXT 前缀）
        $engNo = 'E' . $extId;
        if (Db::table('perf_engineers')->where('engineer_no', $engNo)->find()) {
            $engNo = 'EXT' . $extId;
        }
        $engId = Db::table('perf_engineers')->insertGetId([
            'ext_id'      => $extId,
            'engineer_no' => $engNo,
            'name'        => $name,
            'team'        => $dept ?: '维修部',
            'level'       => '初级',
            'phone'       => $phone,
            'status'      => $active,
            'user_id'     => $userId,
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);

        return ['action' => 'created', 'engineer_id' => $engId, 'user_id' => $userId];
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
