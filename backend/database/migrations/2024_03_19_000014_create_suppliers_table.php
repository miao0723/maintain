<?php

use think\migration\Migrator;

class CreateSuppliersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('suppliers', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '供应商表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '供应商ID',
            ])
            ->addColumn('supplier_code', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '供应商编码',
            ])
            ->addColumn('supplier_name', 'string', [
                'limit' => 200,
                'null' => false,
                'comment' => '供应商名称',
            ])
            ->addColumn('contact_person', 'string', [
                'limit' => 100,
                'null' => true,
                'comment' => '联系人',
            ])
            ->addColumn('contact_phone', 'string', [
                'limit' => 20,
                'null' => true,
                'comment' => '联系电话',
            ])
            ->addColumn('contact_email', 'string', [
                'limit' => 100,
                'null' => true,
                'comment' => '联系邮箱',
            ])
            ->addColumn('address', 'string', [
                'limit' => 500,
                'null' => true,
                'comment' => '地址',
            ])
            ->addColumn('business_scope', 'string', [
                'limit' => 500,
                'null' => true,
                'comment' => '经营范围',
            ])
            ->addColumn('credit_level', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 3,
                'comment' => '信用等级:1优秀 2良好 3一般 4较差',
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
            ->addIndex(['supplier_code'], ['name' => 'uk_supplier_code', 'unique' => true])
            ->addIndex(['supplier_name'], ['name' => 'idx_supplier_name'])
            ->addIndex(['credit_level'], ['name' => 'idx_credit_level'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->create();
    }
}
