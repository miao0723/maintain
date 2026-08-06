<?php

use think\migration\Migrator;

class CreateNotificationsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('notifications', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '通知表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '通知ID',
            ])
            ->addColumn('user_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '接收人ID',
            ])
            ->addColumn('notification_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '通知类型:1工单 2巡检 3保养 4库存 5系统',
            ])
            ->addColumn('title', 'string', [
                'limit' => 200,
                'null' => false,
                'comment' => '通知标题',
            ])
            ->addColumn('content', 'text', [
                'null' => false,
                'comment' => '通知内容',
            ])
            ->addColumn('related_type', 'string', [
                'limit' => 50,
                'null' => true,
                'comment' => '关联类型',
            ])
            ->addColumn('related_id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => true,
                'comment' => '关联ID',
            ])
            ->addColumn('priority', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 2,
                'comment' => '优先级:1低 2中 3高',
            ])
            ->addColumn('is_read', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 0,
                'comment' => '是否已读:0未读 1已读',
            ])
            ->addColumn('read_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '阅读时间',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['user_id'], ['name' => 'idx_user'])
            ->addIndex(['notification_type'], ['name' => 'idx_notification_type'])
            ->addIndex(['is_read'], ['name' => 'idx_is_read'])
            ->addIndex(['created_at'], ['name' => 'idx_created_at'])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'CASCADE',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
