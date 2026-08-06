<?php

use think\migration\Migrator;

class CreateSparePartsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('spare_parts', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '备件表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '备件ID',
            ])
            ->addColumn('part_code', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '备件编码',
            ])
            ->addColumn('part_name', 'string', [
                'limit' => 200,
                'null' => false,
                'comment' => '备件名称',
            ])
            ->addColumn('specification', 'string', [
                'limit' => 200,
                'null' => true,
                'comment' => '规格型号',
            ])
            ->addColumn('category', 'string', [
                'limit' => 100,
                'null' => true,
                'comment' => '分类',
            ])
            ->addColumn('unit', 'string', [
                'limit' => 20,
                'null' => false,
                'default' => '件',
                'comment' => '单位',
            ])
            ->addColumn('supplier_id', 'integer', [
                'signed' => false,
                'null' => true,
                'comment' => '供应商ID',
            ])
            ->addColumn('purchase_price', 'decimal', [
                'precision' => 10,
                'scale' => 2,
                'null' => false,
                'default' => '0.00',
                'comment' => '采购价格',
            ])
            ->addColumn('selling_price', 'decimal', [
                'precision' => 10,
                'scale' => 2,
                'null' => false,
                'default' => '0.00',
                'comment' => '销售价格',
            ])
            ->addColumn('stock_quantity', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'default' => 0,
                'comment' => '库存数量',
            ])
            ->addColumn('min_stock', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => false,
                'default' => 0,
                'comment' => '最小库存',
            ])
            ->addColumn('max_stock', 'integer', [
                'limit' => 11,
                'signed' => false,
                'null' => true,
                'comment' => '最大库存',
            ])
            ->addColumn('location', 'string', [
                'limit' => 100,
                'null' => true,
                'comment' => '存放位置',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1正常 2停用',
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
            ->addIndex(['part_code'], ['name' => 'uk_part_code', 'unique' => true])
            ->addIndex(['part_name'], ['name' => 'idx_part_name'])
            ->addIndex(['category'], ['name' => 'idx_category'])
            ->addIndex(['supplier_id'], ['name' => 'idx_supplier'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('supplier_id', 'suppliers', 'id', [
                'delete' => 'SET_NULL',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
