<?php

namespace app\model;

use think\Model;
use app\service\CryptoService;

/**
 * 外部系统人员（同步）
 */
class ExternalPersonnel extends Model
{
    protected $table = 'external_personnel';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    // 允许批量填充的字段
    protected $field = [
        'ext_id', 'employee_name', 'department', 'position', 'status', 'is_active',
        'wps_user_id', 'phone_enc', 'id_card_enc', 'address_enc',
        'contract_start_date', 'contract_end_date', 'annual_leave_days',
        'raw_json', 'source_sync_id', 'synced_at',
    ];

    protected $type = [
        'id' => 'integer',
        'is_active' => 'integer',
        'annual_leave_days' => 'float',
    ];

    /**
     * 输出时对加密字段做脱敏（除非显式请求解密）
     *
     * @param array $row 数据库行
     * @param bool  $reveal 是否解密还原（需敏感查看权限）
     */
    public static function present(array $row, bool $reveal = false): array
    {
        $out = $row;
        foreach (['phone_enc' => 'phone', 'id_card_enc' => 'id_card', 'address_enc' => 'address'] as $encKey => $plainKey) {
            $stored = $row[$encKey] ?? null;
            unset($out[$encKey]);
            if ($reveal) {
                $out[$plainKey] = CryptoService::decrypt($stored);
            } else {
                $out[$plainKey] = CryptoService::mask($plainKey, CryptoService::decrypt($stored));
            }
        }
        // 不把原始备份直接吐给前端
        unset($out['raw_json']);
        return $out;
    }
}
