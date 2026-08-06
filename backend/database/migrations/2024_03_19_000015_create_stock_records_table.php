<?php

use think\migration\Migrator;

class CreateStockRecordsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('stock_records', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '库存记录表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '记录ID',
            ])
            ->addColumn('spare_part_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '备件ID',
            ])
            ->addColumn('record_type', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'comment' => '记录类型:1入库 2出库 3盘点',
            ])
            ->addColumn('quantity', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'comment' => '数量',
            ])
            ->addColumn('before_stock', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'comment' => '变动前库存',
            ])
            ->addColumn('after_stock', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'comment' => '变动后库存',
            ])
            ->addColumn('related_type', 'string', [
                'limit' => 50,
                'null' => true,
                'comment' => '关联类型:purchase work_order maintenance',
            ])
            ->addColumn('related_id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => true,
                'comment' => '关联ID',
            ])
            ->addColumn('operator_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '操作人ID',
            ])
            ->addColumn('notes', 'string', [
                'limit' => 500,
                'null' => true,
                'comment' => '备注',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['spare_part_id'], ['name' => 'idx_spare_part'])
            ->addIndex(['record_type'], ['name' => 'idx_record_type'])
            ->addIndex(['related_type', 'related_id'], ['name' => 'idx_related'])
            ->addIndex(['operator_id'], ['name' => 'idx_operator'])
            ->addIndex(['created_at'], ['name' => 'idx_created_at'])
            ->addForeignKey('spare_part_id', 'spare_parts', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('operator_id', 'users', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
