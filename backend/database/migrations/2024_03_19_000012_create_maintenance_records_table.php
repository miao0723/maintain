<?php

use think\migration\Migrator;

class CreateMaintenanceRecordsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('maintenance_records', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '保养记录表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '记录ID',
            ])
            ->addColumn('plan_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '保养计划ID',
            ])
            ->addColumn('device_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '设备ID',
            ])
            ->addColumn('maintenance_date', 'date', [
                'null' => false,
                'comment' => '保养日期',
            ])
            ->addColumn('engineer_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '执行工程师ID',
            ])
            ->addColumn('maintenance_items', 'json', [
                'null' => false,
                'comment' => '保养项JSON数组',
            ])
            ->addColumn('maintenance_results', 'json', [
                'null' => true,
                'comment' => '保养结果JSON数组',
            ])
            ->addColumn('findings', 'text', [
                'null' => true,
                'comment' => '发现的问题',
            ])
            ->addColumn('cost_parts', 'decimal', [
                'precision' => 10,
                'scale' => 2,
                'null' => false,
                'default' => '0.00',
                'comment' => '备件成本',
            ])
            ->addColumn('cost_labor', 'decimal', [
                'precision' => 10,
                'scale' => 2,
                'null' => false,
                'default' => '0.00',
                'comment' => '人工成本',
            ])
            ->addColumn('total_cost', 'decimal', [
                'precision' => 10,
                'scale' => 2,
                'null' => false,
                'default' => '0.00',
                'comment' => '总成本',
            ])
            ->addColumn('images', 'json', [
                'null' => true,
                'comment' => '保养照片JSON数组',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['plan_id'], ['name' => 'idx_plan'])
            ->addIndex(['device_id'], ['name' => 'idx_device'])
            ->addIndex(['maintenance_date'], ['name' => 'idx_maintenance_date'])
            ->addIndex(['engineer_id'], ['name' => 'idx_engineer'])
            ->addForeignKey('plan_id', 'maintenance_plans', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('device_id', 'devices', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('engineer_id', 'engineers', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
