<?php

use think\migration\Migrator;

class CreateWorkOrdersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('work_orders', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '维修工单表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '工单ID',
            ])
            ->addColumn('order_no', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '工单编号',
            ])
            ->addColumn('device_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '设备ID',
            ])
            ->addColumn('fault_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '故障类型:1机械 2电气 3液压 4其他',
            ])
            ->addColumn('fault_description', 'text', [
                'null' => false,
                'comment' => '故障描述',
            ])
            ->addColumn('priority', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 2,
                'comment' => '优先级:1低 2中 3高 4紧急',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1待接单 2已接单 3维修中 4待验收 5已完成 6已关闭',
            ])
            ->addColumn('reported_by', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '报修人ID',
            ])
            ->addColumn('assigned_to', 'integer', [
                'signed' => false,
                'null' => true,
                'comment' => '指派工程师ID',
            ])
            ->addColumn('started_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '开始维修时间',
            ])
            ->addColumn('completed_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '完成时间',
            ])
            ->addColumn('repair_notes', 'text', [
                'null' => true,
                'comment' => '维修记录',
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
                'comment' => '故障图片JSON数组',
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
            ->addIndex(['order_no'], ['name' => 'uk_order_no', 'unique' => true])
            ->addIndex(['device_id'], ['name' => 'idx_device'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addIndex(['priority'], ['name' => 'idx_priority'])
            ->addIndex(['reported_by'], ['name' => 'idx_reported_by'])
            ->addIndex(['assigned_to'], ['name' => 'idx_assigned_to'])
            ->addIndex(['created_at'], ['name' => 'idx_created_at'])
            ->addForeignKey('device_id', 'devices', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('reported_by', 'users', 'id', [
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
