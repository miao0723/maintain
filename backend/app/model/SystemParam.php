<?php

namespace app\model;

use think\Model;

class SystemParam extends Model
{
    protected $table = 'system_params';

    protected $json = [];

    protected $type = [
        'is_system' => 'boolean',
    ];
}
