<?php

use think\migration\Migrator;

class CreateKnowledgeBaseTable extends Migrator
{
    public function change()
    {
        $table = $this->table('knowledge_base', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '故障知识库表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '知识ID',
            ])
            ->addColumn('title', 'string', [
                'limit' => 200,
                'null' => false,
                'comment' => '故障标题',
            ])
            ->addColumn('device_category_id', 'integer', [
                'signed' => false,
                'null' => true,
                'comment' => '设备分类ID',
            ])
            ->addColumn('fault_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '故障类型:1机械 2电气 3液压 4其他',
            ])
            ->addColumn('fault_phenomenon', 'text', [
                'null' => false,
                'comment' => '故障现象',
            ])
            ->addColumn('fault_cause', 'text', [
                'null' => true,
                'comment' => '故障原因',
            ])
            ->addColumn('solution', 'text', [
                'null' => false,
                'comment' => '解决方案',
            ])
            ->addColumn('prevention', 'text', [
                'null' => true,
                'comment' => '预防措施',
            ])
            ->addColumn('tags', 'json', [
                'null' => true,
                'comment' => '标签JSON数组',
            ])
            ->addColumn('attachments', 'json', [
                'null' => true,
                'comment' => '附件JSON数组',
            ])
            ->addColumn('view_count', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'default' => 0,
                'comment' => '浏览次数',
            ])
            ->addColumn('useful_count', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'default' => 0,
                'comment' => '有用次数',
            ])
            ->addColumn('created_by', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '创建人ID',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1草稿 2已发布 3已归档',
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
            ->addIndex(['device_category_id'], ['name' => 'idx_device_category'])
            ->addIndex(['fault_type'], ['name' => 'idx_fault_type'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addIndex(['created_by'], ['name' => 'idx_created_by'])
            ->addIndex(['created_at'], ['name' => 'idx_created_at'])
            ->addForeignKey('device_category_id', 'device_categories', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('created_by', 'users', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
