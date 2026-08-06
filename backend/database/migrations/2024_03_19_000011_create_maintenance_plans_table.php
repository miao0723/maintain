<?php

use think\migration\Migrator;

class CreateMaintenancePlansTable extends Migrator
{
    public function change()
    {
        $table = $this->table('maintenance_plans', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '保养计划表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '计划ID',
            ])
            ->addColumn('plan_name', 'string', [
                'limit' => 200,
                'null' => false,
                'comment' => '计划名称',
            ])
            ->addColumn('device_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '设备ID',
            ])
            ->addColumn('plan_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '计划类型:1预防性 2周期性 3预测性',
            ])
            ->addColumn('maintenance_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '保养类型:1日常保养 2定期保养 3专项保养',
            ])
            ->addColumn('cycle_value', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'comment' => '周期数值',
            ])
            ->addColumn('cycle_unit', 'string', [
                'limit' => 20,
                'null' => false,
                'comment' => '周期单位:day week month year hour',
            ])
            ->addColumn('last_maintenance_date', 'date', [
                'null' => true,
                'comment' => '上次保养日期',
            ])
            ->addColumn('next_maintenance_date', 'date', [
                'null' => false,
                'comment' => '下次保养日期',
            ])
            ->addColumn('assigned_to', 'integer', [
                'signed' => false,
                'null' => true,
                'comment' => '负责人ID',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1启用 2停用',
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
            ->addIndex(['device_id'], ['name' => 'idx_device'])
            ->addIndex(['plan_type'], ['name' => 'idx_plan_type'])
            ->addIndex(['maintenance_type'], ['name' => 'idx_maintenance_type'])
            ->addIndex(['next_maintenance_date'], ['name' => 'idx_next_maintenance_date'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('device_id', 'devices', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('assigned_to', 'engineers', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
