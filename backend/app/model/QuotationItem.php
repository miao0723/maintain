<?php

namespace app\model;

use think\Model;

class QuotationItem extends Model
{
    protected $table = 'quotation_items';

    protected $pk = 'id';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    protected $type = [
        'quantity' => 'decimal',
        'unit_price' => 'decimal',
        'total_price' => 'decimal',
    ];

    /**
     * 项目类型映射
     */
    public static function getItemTypeMap()
    {
        return [
            1 => '维修费',
            2 => '配件费',
            3 => '材料费',
            4 => '上门费',
            5 => '其他',
        ];
    }

    /**
     * 获取项目类型文本
     */
    public function getItemTypeTextAttr($value, $data)
    {
        $typeMap = self::getItemTypeMap();
        return $typeMap[$data['item_type']] ?? '未知';
    }
}
