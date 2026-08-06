<?php

use think\migration\Migrator;

class CreateInspectionTasksTable extends Migrator
{
    public function change()
    {
        $table = $this->table('inspection_tasks', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '巡检任务表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '任务ID',
            ])
            ->addColumn('task_name', 'string', [
                'limit' => 200,
                'null' => false,
                'comment' => '任务名称',
            ])
            ->addColumn('device_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '设备ID',
            ])
            ->addColumn('inspection_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '巡检类型:1日常 2周检 3月检 4季检 5年检',
            ])
            ->addColumn('assigned_to', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '指派工程师ID',
            ])
            ->addColumn('scheduled_date', 'date', [
                'null' => false,
                'comment' => '计划日期',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1待执行 2进行中 3已完成 4已逾期',
            ])
            ->addColumn('check_items', 'json', [
                'null' => false,
                'comment' => '检查项JSON数组',
            ])
            ->addColumn('check_results', 'json', [
                'null' => true,
                'comment' => '检查结果JSON数组',
            ])
            ->addColumn('findings', 'text', [
                'null' => true,
                'comment' => '发现的问题',
            ])
            ->addColumn('completed_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '完成时间',
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
            ->addIndex(['assigned_to'], ['name' => 'idx_assigned_to'])
            ->addIndex(['inspection_type'], ['name' => 'idx_inspection_type'])
            ->addIndex(['scheduled_date'], ['name' => 'idx_scheduled_date'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('device_id', 'devices', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('assigned_to', 'engineers', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
