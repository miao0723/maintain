<?php

use think\migration\Migrator;

class CreatePermissionsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('permissions', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '权限表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '权限ID',
            ])
            ->addColumn('user_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '用户ID',
            ])
            ->addColumn('module', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '模块名',
            ])
            ->addColumn('actions', 'json', [
                'null' => false,
                'comment' => '操作权限["create","read","update","delete"]',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['user_id'], ['name' => 'idx_user'])
            ->addIndex(['user_id', 'module'], ['name' => 'uk_user_module', 'unique' => true])
            ->create();
    }
}
