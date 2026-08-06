<?php

use think\migration\Migrator;

class CreateDeviceCategoriesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('device_categories', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '设备分类表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '分类ID',
            ])
            ->addColumn('name', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '分类名称',
            ])
            ->addColumn('icon', 'string', [
                'limit' => 100,
                'null' => true,
                'default' => null,
                'comment' => '图标标识',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['name'], ['name' => 'uk_name', 'unique' => true])
            ->create();
    }
}