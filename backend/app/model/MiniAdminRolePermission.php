<?php

namespace app\model;

use think\Model;

class MiniAdminRolePermission extends Model
{
    protected $table = 'mini_admin_role_permissions';

    protected $json = ['permissions'];
    protected $type = ['permissions' => 'json'];
}
