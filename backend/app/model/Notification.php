<?php

namespace app\model;

use think\Model;

class Notification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'user_id', 'type', 'title', 'content',
        'related_type', 'related_id', 'priority',
        'is_read', 'read_at', 'extra_data'
    ];

    protected $guarded = ['id', 'created_at'];

    protected $json = ['extra_data'];
    protected $jsonAssoc = true;

    // 通知类型常量
    const TYPE_WORK_ORDER = 'work_order';           // 工单通知
    const TYPE_WORK_ORDER_ASSIGNED = 'work_order_assigned';     // 工单指派
    const TYPE_WORK_ORDER_ACCEPTED = 'work_order_accepted';     // 工单接受
    const TYPE_WORK_ORDER_STARTED = 'work_order_started';       // 工单开始
    const TYPE_WORK_ORDER_COMPLETED = 'work_order_completed';   // 工单完成
    const TYPE_WORK_ORDER_VERIFIED = 'work_order_verified';     // 工单验收
    const TYPE_WORK_ORDER_CLOSED = 'work_order_closed';         // 工单关闭

    const TYPE_STOCK_ALERT = 'stock_alert';         // 库存预警
    const TYPE_STOCK_OUT = 'stock_out';             // 零库存
    const TYPE_STOCK_LOW = 'stock_low';             // 低库存

    const TYPE_MAINTENANCE_DUE = 'maintenance_due'; // 保养到期
    const TYPE_INSPECTION_OVERDUE = 'inspection_overdue'; // 巡检逾期

    const TYPE_SYSTEM = 'system';                   // 系统通知

    // 优先级常量
    const PRIORITY_LOW = 1;      // 低
    const PRIORITY_NORMAL = 2;   // 普通
    const PRIORITY_HIGH = 3;     // 高
    const PRIORITY_URGENT = 4;   // 紧急

    /**
     * 关联用户
     */
    public function user()
    {
        return $this->belongsTo('app\model\User', 'user_id');
    }

    /**
     * 关联工单（如果related_type是work_order）
     */
    public function workOrder()
    {
        return $this->belongsTo('app\model\WorkOrder', 'related_id');
    }

    /**
     * 获取类型文本
     */
    public function getTypeTextAttr($value, $data)
    {
        $typeMap = [
            self::TYPE_WORK_ORDER => '工单通知',
            self::TYPE_WORK_ORDER_ASSIGNED => '工单指派',
            self::TYPE_WORK_ORDER_ACCEPTED => '工单接受',
            self::TYPE_WORK_ORDER_STARTED => '工单开始',
            self::TYPE_WORK_ORDER_COMPLETED => '工单完成',
            self::TYPE_WORK_ORDER_VERIFIED => '工单验收',
            self::TYPE_WORK_ORDER_CLOSED => '工单关闭',
            self::TYPE_STOCK_ALERT => '库存预警',
            self::TYPE_STOCK_OUT => '零库存',
            self::TYPE_STOCK_LOW => '低库存',
            self::TYPE_MAINTENANCE_DUE => '保养到期',
            self::TYPE_INSPECTION_OVERDUE => '巡检逾期',
            self::TYPE_SYSTEM => '系统通知',
        ];
        return $typeMap[$data['type']] ?? '未知';
    }

    /**
     * 获取优先级文本
     */
    public function getPriorityTextAttr($value, $data)
    {
        $priorityMap = [
            self::PRIORITY_LOW => '低',
            self::PRIORITY_NORMAL => '普通',
            self::PRIORITY_HIGH => '高',
            self::PRIORITY_URGENT => '紧急',
        ];
        return $priorityMap[$data['priority']] ?? '未知';
    }

    /**
     * 标记为已读
     */
    public function markAsRead()
    {
        if (!$this->is_read) {
            $this->is_read = 1;
            $this->read_at = date('Y-m-d H:i:s');
            $this->save();
        }
    }

    /**
     * 标记为未读
     */
    public function markAsUnread()
    {
        if ($this->is_read) {
            $this->is_read = 0;
            $this->read_at = null;
            $this->save();
        }
    }

    /**
     * 检查是否已读
     */
    public function isRead()
    {
        return $this->is_read == 1;
    }
}
