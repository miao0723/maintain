<?php

use think\migration\Migrator;

class CreateSchedulesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('schedules', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '排班表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '排班ID',
            ])
            ->addColumn('engineer_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '工程师ID',
            ])
            ->addColumn('shift_date', 'date', [
                'null' => false,
                'comment' => '排班日期',
            ])
            ->addColumn('shift_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '班次类型:1早班 2中班 3晚班',
            ])
            ->addColumn('start_time', 'time', [
                'null' => false,
                'comment' => '开始时间',
            ])
            ->addColumn('end_time', 'time', [
                'null' => false,
                'comment' => '结束时间',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1正常 2请假 3调休',
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
            ->addIndex(['engineer_id'], ['name' => 'idx_engineer'])
            ->addIndex(['shift_date'], ['name' => 'idx_shift_date'])
            ->addIndex(['shift_type'], ['name' => 'idx_shift_type'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('engineer_id', 'engineers', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
