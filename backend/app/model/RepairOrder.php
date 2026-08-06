<?php

namespace app\model;

use think\Model;
use think\facade\Db;

class RepairOrder extends Model
{
    // 使用 repair 数据库连接
    protected $connection = 'repair';

    protected $table = 'orders';

    protected $pk = 'id';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    protected $json = ['images', 'entities'];
    protected $jsonAssoc = true;

    protected $fillable = [
        'order_id', 'user_id', 'order_type', 'device_type',
        'problem_description', 'custom_description', 'images',
        'service_type', 'brand_id', 'device_model', 'device_condition',
        'estimated_price', 'actual_price', 'progress', 'status',
        'priority', 'address_id', 'unit_id', 'assigned_to'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at', 'completed_at', 'assigned_at'];

    /**
     * 订单状态常量
     */
    const STATUS_PENDING = 'pending';      // 待处理
    const STATUS_QUOTED = 'quoted';        // 待确认报价
    const STATUS_CONFIRMED = 'confirmed';  // 已确认报价
    const STATUS_PROCESSING = 'processing'; // 维修中
    const STATUS_COMPLETED = 'completed';   // 已完成
    const STATUS_REVIEW = 'review';         // 待验收
    const STATUS_CANCELLED = 'cancelled';   // 已取消

    /**
     * 订单状态映射
     */
    public static function getStatusMap()
    {
        return [
            self::STATUS_PENDING => '待处理',
            self::STATUS_QUOTED => '待确认报价',
            self::STATUS_CONFIRMED => '已确认报价',
            self::STATUS_PROCESSING => '维修中',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_REVIEW => '待验收',
            self::STATUS_CANCELLED => '已取消',
        ];
    }

    /**
     * 订单类型映射
     */
    public static function getTypeMap()
    {
        return [
            'repair' => '维修',
            'recycle' => '回收',
        ];
    }

    /**
     * 设备类型映射
     */
    public static function getDeviceTypeMap()
    {
        return [
            1 => '手机',
            2 => '电脑',
            3 => '平板',
            4 => '手表',
            5 => '其他',
        ];
    }

    /**
     * 服务方式映射
     */
    public static function getServiceTypeMap()
    {
        return [
            'shop' => '到店',
            'home' => '上门',
        ];
    }

    /**
     * 优先级映射
     */
    public static function getPriorityMap()
    {
        return [
            'low' => '低',
            'medium' => '中',
            'high' => '高',
        ];
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = self::getStatusMap();
        return $statusMap[$data['status']] ?? $data['status'];
    }

    /**
     * 获取设备类型文本
     * device_type 存的是 device_types 表真实 ID，联表取名称，避免显示数字代号
     */
    public function getDeviceTypeTextAttr($value, $data)
    {
        $id = $data['device_type'] ?? null;
        if (!$id) {
            return '未知';
        }
        $name = Db::connect('repair')->name('device_types')->where('id', intval($id))->value('name');
        return $name ?: ('设备类型#' . $id);
    }

    /**
     * 获取服务方式文本
     */
    public function getServiceTypeTextAttr($value, $data)
    {
        $typeMap = self::getServiceTypeMap();
        return $typeMap[$data['service_type']] ?? '-';
    }

    /**
     * 获取优先级文本
     * repair.orders.priority 实际为小程序整数档位（0未设置/1低/2中/3高，默认2），
     * 部分后台写入字符串（low/medium/high），此处兼容两套表示。
     */
    public function getPriorityTextAttr($value, $data)
    {
        $priority = $data['priority'] ?? null;
        $map = [
            'low' => '低', 'medium' => '中', 'high' => '高',
            0 => '未设置', 1 => '低', 2 => '中', 3 => '高',
        ];
        if (is_numeric($priority)) {
            $priority = (int) $priority;
        }
        return $map[$priority] ?? '中';
    }

    /**
     * 关联用户
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * 关联品牌
     */
    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    /**
     * 关联地址
     */
    public function address()
    {
        return $this->belongsTo(UserAddress::class, 'address_id');
    }

    /**
     * 关联分配人员
     */
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * 图片列表处理
     */
    public function getImagesListAttr($value, $data)
    {
        if (is_string($data['images'])) {
            return json_decode($data['images'], true) ?? [];
        }
        return $data['images'] ?? [];
    }
}
