<?php

namespace app\controller;

class MiniAdminDeviceTypeController extends MiniAdminRepairResourceController
{
    protected string $table = 'device_types';
    protected array $fillable = ['name', 'icon', 'created_at'];
    protected array $searchable = ['name'];
    protected array $likeFields = ['name'];
}
