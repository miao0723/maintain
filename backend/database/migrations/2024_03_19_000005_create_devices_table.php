<?php

use think\migration\Migrator;

class CreateDevicesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('devices', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '设备表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '设备ID',
            ])
            ->addColumn('device_code', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '设备编码',
            ])
            ->addColumn('device_name', 'string', [
                'limit' => 100,
                'null' => false,
                'comment' => '设备名称',
            ])
            ->addColumn('model', 'string', [
                'limit' => 100,
                'null' => true,
                'default' => null,
                'comment' => '型号规格',
            ])
            ->addColumn('category_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '分类ID',
            ])
            ->addColumn('department_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '所属部门ID',
            ])
            ->addColumn('location', 'string', [
                'limit' => 200,
                'null' => true,
                'default' => null,
                'comment' => '物理位置',
            ])
            ->addColumn('purchase_date', 'date', [
                'null' => true,
                'default' => null,
                'comment' => '购置日期',
            ])
            ->addColumn('warranty_date', 'date', [
                'null' => true,
                'default' => null,
                'comment' => '保修期至',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1正常 2维修中 3停用',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addColumn('updated_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '更新时间',
            ])
            ->addIndex(['device_code'], ['name' => 'uk_device_code', 'unique' => true])
            ->addIndex(['category_id'], ['name' => 'idx_category'])
            ->addIndex(['department_id'], ['name' => 'idx_department'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('category_id', 'device_categories', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('department_id', 'departments', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}