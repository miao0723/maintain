<?php

use think\migration\Migrator;

class CreateEngineersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('engineers', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '维修工程师表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '工程师ID',
            ])
            ->addColumn('user_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '关联用户ID',
            ])
            ->addColumn('employee_code', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '员工编号',
            ])
            ->addColumn('specialty', 'string', [
                'limit' => 100,
                'null' => true,
                'comment' => '专业领域',
            ])
            ->addColumn('skill_level', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '技能等级:1初级 2中级 3高级 4专家',
            ])
            ->addColumn('phone', 'string', [
                'limit' => 20,
                'null' => true,
                'comment' => '联系电话',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1在职 2离职 3休假',
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
            ->addIndex(['user_id'], ['name' => 'idx_user'])
            ->addIndex(['employee_code'], ['name' => 'uk_employee_code', 'unique' => true])
            ->addIndex(['specialty'], ['name' => 'idx_specialty'])
            ->addIndex(['skill_level'], ['name' => 'idx_skill_level'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
