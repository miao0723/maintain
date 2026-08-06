<?php

namespace app\controller;

class MiniAdminAddressController extends MiniAdminRepairResourceController
{
    protected string $table = 'user_addresses';
    protected array $fillable = [
        'user_id', 'contact_name', 'contact_phone', 'province', 'city', 'district',
        'detail_address', 'postal_code', 'tags', 'is_default', 'created_at', 'updated_at'
    ];
    protected array $searchable = ['contact_name', 'contact_phone', 'detail_address', 'province', 'city', 'district', 'user_id'];
    protected array $likeFields = ['contact_name', 'contact_phone', 'detail_address', 'province', 'city', 'district'];
}
