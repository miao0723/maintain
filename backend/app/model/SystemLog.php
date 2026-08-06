<?php

namespace app\model;

use think\Model;

class SystemLog extends Model
{
    protected $table = 'system_logs';

    protected $json = ['params'];

    protected $type = [
        'created_at' => 'datetime',
    ];

    protected $autoWriteTimestamp = true;

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
