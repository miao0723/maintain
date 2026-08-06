<?php

namespace app\controller;

class MiniAdminUnitController extends MiniAdminRepairResourceController
{
    protected string $table = 'user_units';
    protected array $fillable = [
        'user_id', 'name', 'address', 'contact_name', 'contact_phone',
        'is_default', 'created_at', 'updated_at'
    ];
    protected array $searchable = ['name', 'address', 'contact_name', 'contact_phone', 'user_id'];
    protected array $likeFields = ['name', 'address', 'contact_name', 'contact_phone'];
}
