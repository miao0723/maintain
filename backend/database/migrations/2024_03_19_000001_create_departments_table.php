<?php

use think\migration\Migrator;
use Phinx\Db\Adapter\AdapterInterface;

class CreateDepartmentsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('departments', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '部门表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '部门ID',
            ])
            ->addColumn('name', 'string', [
                'limit' => 100,
                'null' => false,
                'comment' => '部门名称',
            ])
            ->addColumn('parent_id', 'integer', [
                'signed' => false,
                'null' => true,
                'default' => null,
                'comment' => '父部门ID',
                'after' => 'name',
            ])
            ->addColumn('manager_id', 'integer', [
                'signed' => false,
                'null' => true,
                'default' => null,
                'comment' => '负责人ID',
                'after' => 'parent_id',
            ])
            ->addColumn('sort_order', 'integer', [
                'null' => false,
                'default' => 0,
                'comment' => '排序',
                'after' => 'manager_id',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'null' => false,
                'default' => 1,
                'signed' => false,
                'comment' => '状态:1正常 0禁用',
                'after' => 'sort_order',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
                'after' => 'status',
            ])
            ->addIndex(['parent_id'], ['name' => 'idx_parent'])
            ->create();
    }
}
