<?php

namespace app\validate;

use think\Validate;

class SparePartValidate extends Validate
{
    protected $rule = [
        'part_code' => 'max:50',
        'part_name' => 'max:200',
        'category' => 'max:100',
        'specification' => 'max:200',
        'unit' => 'max:20',
        'supplier_id' => 'integer',
        'purchase_price' => 'float|>=:0',
        'selling_price' => 'float|>=:0',
        'stock_quantity' => 'integer|>=:0',
        'min_stock' => 'integer|>=:0',
        'max_stock' => 'integer|>=:0',
        'location' => 'max:100',
        'status' => 'integer|in:1,2',
        'image_url' => 'max:500',
        'quantity' => 'require|integer|>:0',
        'remark' => 'max:500',
    ];

    protected $scene = [
        'create' => ['part_code' => 'require|max:50', 'part_name' => 'require|max:200', 'category', 'specification', 'unit', 'supplier_id', 'purchase_price', 'selling_price', 'stock_quantity', 'min_stock', 'max_stock', 'location', 'image_url'],
        'update' => ['part_name', 'part_code', 'category', 'specification', 'unit', 'supplier_id', 'purchase_price', 'selling_price', 'min_stock', 'max_stock', 'location', 'status', 'image_url'],
        'stock_in' => ['quantity', 'remark'],
        'stock_out' => ['quantity', 'remark'],
    ];

    protected $message = [
        'part_code.require' => '配件编号不能为空',
        'part_code.max' => '配件编号最多50个字符',
        'part_name.require' => '配件名称不能为空',
        'part_name.max' => '配件名称最多200个字符',
        'category.max' => '分类最多100个字符',
        'specification.max' => '规格型号最多200个字符',
        'unit.max' => '单位最多20个字符',
        'supplier_id.integer' => '供应商ID格式错误',
        'purchase_price.float' => '进货价格式错误',
        'purchase_price.>=' => '进货价不能为负数',
        'selling_price.float' => '销售价格式错误',
        'selling_price.>=' => '销售价不能为负数',
        'stock_quantity.integer' => '库存数量格式错误',
        'stock_quantity.>=' => '库存数量不能为负数',
        'min_stock.integer' => '最低库存格式错误',
        'min_stock.>=' => '最低库存不能为负数',
        'max_stock.integer' => '最大库存格式错误',
        'max_stock.>=' => '最大库存不能为负数',
        'location.max' => '存放位置最多100个字符',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是1(正常)或2(停用)',
        'quantity.require' => '数量不能为空',
        'quantity.integer' => '数量格式错误',
        'quantity.>' => '数量必须大于0',
        'remark.max' => '备注最多500个字符',
    ];
}
