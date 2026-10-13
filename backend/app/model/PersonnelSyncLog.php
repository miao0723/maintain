<?php

namespace app\model;

use think\Model;

/**
 * 人员同步日志
 */
class PersonnelSyncLog extends Model
{
    protected $table = 'personnel_sync_logs';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    protected $json = ['error_detail'];

    protected $type = [
        'id' => 'integer',
        'error_detail' => 'json',
    ];
}
