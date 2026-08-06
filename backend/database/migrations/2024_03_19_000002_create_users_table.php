<?php

use think\migration\Migrator;

class CreateUsersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('users', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '用户表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '用户ID',
            ])
            ->addColumn('username', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '用户名',
            ])
            ->addColumn('password', 'string', [
                'limit' => 255,
                'null' => false,
                'comment' => '密码hash',
            ])
            ->addColumn('real_name', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '真实姓名',
            ])
            ->addColumn('phone', 'string', [
                'limit' => 20,
                'null' => false,
                'comment' => '手机号',
            ])
            ->addColumn('email', 'string', [
                'limit' => 100,
                'null' => true,
                'default' => null,
                'comment' => '邮箱',
            ])
            ->addColumn('role_type', 'integer', [
                'limit' => 1,
                'null' => false,
                'default' => 4,
                'signed' => false,
                'comment' => '角色:1管理员 2部门管理 3工程师 4普通用户',
            ])
            ->addColumn('department_id', 'integer', [
                'signed' => false,
                'null' => true,
                'default' => null,
                'comment' => '部门ID',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'null' => false,
                'default' => 1,
                'signed' => false,
                'comment' => '状态:1正常 0禁用',
            ])
            ->addColumn('last_login_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '最后登录时间',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addColumn('updated_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP',
                'comment' => '更新时间',
            ])
            ->addIndex(['department_id'], ['name' => 'idx_department'])
            ->addIndex(['role_type'], ['name' => 'idx_role'])
            ->addIndex(['phone'], ['name' => 'idx_phone'])
            ->addIndex(['username'], ['name' => 'uk_username', 'unique' => true])
            ->create();
    }
}
