<?php

use think\migration\Migrator;

class CreateWorkOrderLogsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('work_order_logs', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '工单日志表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '日志ID',
            ])
            ->addColumn('work_order_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '工单ID',
            ])
            ->addColumn('user_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '操作人ID',
            ])
            ->addColumn('action', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '操作类型:created assigned started completed',
            ])
            ->addColumn('old_status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => true,
                'comment' => '原状态',
            ])
            ->addColumn('new_status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => true,
                'comment' => '新状态',
            ])
            ->addColumn('notes', 'text', [
                'null' => true,
                'comment' => '备注说明',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['work_order_id'], ['name' => 'idx_work_order'])
            ->addIndex(['user_id'], ['name' => 'idx_user'])
            ->addIndex(['action'], ['name' => 'idx_action'])
            ->addIndex(['created_at'], ['name' => 'idx_created_at'])
            ->addForeignKey('work_order_id', 'work_orders', 'id', [
                'delete' => 'CASCADE',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
