<?php

namespace app\controller;

class MiniAdminSystemConfigController extends MiniAdminRepairResourceController
{
    protected string $table = 'system_config';
    protected array $fillable = ['config_key', 'config_value', 'description', 'created_at', 'updated_at'];
    protected array $searchable = ['config_key', 'description'];
    protected array $likeFields = ['config_key', 'description'];
    protected array $readonlyFields = ['id', 'created_at'];
}
