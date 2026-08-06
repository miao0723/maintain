<?php

namespace app\validate;

use think\Validate;

class DeviceValidate extends Validate
{
    protected $rule = [
        'code' => 'require|max:50|unique:devices,code',
        'name' => 'require|max:100',
        'specification' => 'max:255',
        'category_id' => 'require|integer',
        'department_id' => 'require|integer',
        'location' => 'max:255',
        'purchase_date' => 'date',
        'warranty_expiry' => 'date|checkWarrantyDate',
        'status' => 'integer|in:1,2,3',
    ];

    protected $scene = [
        'create' => ['code', 'name', 'specification', 'category_id', 'department_id', 'location', 'purchase_date', 'warranty_expiry', 'status'],
        'update' => ['name', 'specification', 'category_id', 'department_id', 'location', 'purchase_date', 'warranty_expiry', 'status'],
    ];

    protected $message = [
        'code.require' => '设备编码不能为空',
        'code.max' => '设备编码最多50个字符',
        'code.unique' => '设备编码已存在',
        'name.require' => '设备名称不能为空',
        'name.max' => '设备名称最多100个字符',
        'specification.max' => '规格型号最多255个字符',
        'category_id.require' => '分类不能为空',
        'category_id.integer' => '分类ID格式错误',
        'department_id.require' => '部门不能为空',
        'department_id.integer' => '部门ID格式错误',
        'location.max' => '存放位置最多255个字符',
        'purchase_date.date' => '购买日期格式错误',
        'warranty_expiry.date' => '保修截止日期格式错误',
        'warranty_expiry.checkWarrantyDate' => '保修截止日期必须晚于购买日期',
        'status.integer' => '状态值错误',
        'status.in' => '状态值必须是1(正常)、2(维修中)或3(报废)',
    ];

    /**
     * 自定义验证：保修期必须晚于购置日期
     */
    protected function checkWarrantyDate($value, $rule, $data = [])
    {
        if (isset($data['purchase_date']) && !empty($data['purchase_date'])) {
            $purchaseTime = strtotime($data['purchase_date']);
            $warrantyTime = strtotime($value);

            // Check if both dates are valid
            if ($purchaseTime === false || $warrantyTime === false) {
                return false;
            }

            return $warrantyTime > $purchaseTime;
        }
        return true;
    }
}
