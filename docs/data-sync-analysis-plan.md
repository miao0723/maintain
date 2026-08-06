# 电子维修小程序与后台管理系统数据同步与分析方案

## 1. 项目概述

### 1.1 背景
- **电子维修2.0小程序**：面向终端客户的维修服务平台，包含用户管理、订单管理、维修流程等功能
- **CMMS后台管理系统**：面向管理端的综合管理系统，包含设备管理、工单管理、统计分析等功能
- **目标**：实现两个系统间的数据同步，在后台统一展示和分析小程序业务数据

### 1.2 同步目标
1. 实时/准实时同步小程序核心业务数据到后台系统
2. 在后台管理系统提供小程序业务数据的可视化分析
3. 实现跨系统的数据关联查询和报表生成
4. 保持数据一致性和完整性

---

## 2. 数据同步策略

### 2.1 同步架构

```
小程序数据库 (repair)
    ↓
同步服务层
    ↓
后台数据库 (cmms_db)
    ↓
数据分析与展示
```

### 2.2 同步方式选择

采用 **混合同步策略**：

| 数据类型 | 同步方式 | 频率 | 说明 |
|---------|---------|------|------|
| 订单数据 | 实时同步 | 事件触发 | 订单状态变更时立即同步 |
| 用户数据 | 定时同步 | 每小时 | 批量同步用户变更 |
| 支付数据 | 实时同步 | 事件触发 | 支付完成后立即同步 |
| 维修记录 | 实时同步 | 事件触发 | 维修过程记录同步 |
| 统计数据 | 定时计算 | 每日/每小时 | 聚合统计 |

### 2.3 数据流向

```
小程序表 → 后台表映射关系：

users → miniprogram_customers (客户表)
orders → miniprogram_orders (订单表)
repair_records → repair_reports (维修报告)
online_payments → cmms_online_payments (支付表)
delivery_persons → delivery_persons (配送表)
repair_notifications → notifications (通知表)
```

---

## 3. 数据表设计

### 3.1 小程序客户表 (miniprogram_customers)

```sql
CREATE TABLE `miniprogram_customers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mp_user_id` INT NOT NULL COMMENT '小程序用户ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` VARCHAR(100) NOT NULL COMMENT '用户昵称',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `gender` TINYINT DEFAULT 0 COMMENT '性别:0-未知,1-男,2-女',
  `province` VARCHAR(50) DEFAULT NULL COMMENT '省份',
  `city` VARCHAR(50) DEFAULT NULL COMMENT '城市',
  `total_orders` INT UNSIGNED DEFAULT 0 COMMENT '订单总数',
  `total_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计消费金额',
  `last_order_at` TIMESTAMP NULL COMMENT '最后下单时间',
  `first_order_at` TIMESTAMP NULL COMMENT '首次下单时间',
  `customer_level` VARCHAR(20) DEFAULT 'normal' COMMENT '客户等级:bronze/silver/gold/platinum',
  `sync_status` TINYINT DEFAULT 1 COMMENT '同步状态:1-正常,0-失败',
  `synced_at` TIMESTAMP NULL COMMENT '同步时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_mp_user_id` (`mp_user_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_customer_level` (`customer_level`),
  KEY `idx_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序客户表';
```

### 3.2 小程序订单表 (miniprogram_orders)

```sql
CREATE TABLE `miniprogram_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mp_order_id` INT NOT NULL COMMENT '小程序订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
  `customer_id` INT UNSIGNED NOT NULL COMMENT '客户ID',
  `customer_name` VARCHAR(100) NOT NULL COMMENT '客户姓名',
  `customer_phone` VARCHAR(20) NOT NULL COMMENT '客户电话',
  `order_type` ENUM('repair', 'recycle') NOT NULL COMMENT '订单类型',
  `device_type` VARCHAR(50) NOT NULL COMMENT '设备类型',
  `device_model` VARCHAR(100) NOT NULL COMMENT '设备型号',
  `fault_desc` TEXT NOT NULL COMMENT '故障描述',
  `images` JSON DEFAULT NULL COMMENT '设备图片',
  `service_type` ENUM('shop', 'home') DEFAULT 'shop' COMMENT '服务方式',
  `estimated_price` DECIMAL(10,2) DEFAULT NULL COMMENT '预估价格',
  `actual_price` DECIMAL(10,2) DEFAULT NULL COMMENT '实际价格',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '订单状态',
  `unit_id` INT DEFAULT NULL COMMENT '维修单位ID',
  `unit_name` VARCHAR(100) DEFAULT NULL COMMENT '维修单位名称',
  `address` JSON DEFAULT NULL COMMENT '收货地址',
  `progress_photo_count` INT DEFAULT 0 COMMENT '进度照片数',
  `progress_video_count` INT DEFAULT 0 COMMENT '进度视频数',
  `sync_status` TINYINT DEFAULT 1 COMMENT '同步状态',
  `synced_at` TIMESTAMP NULL COMMENT '同步时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  UNIQUE KEY `uk_mp_order_id` (`mp_order_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序订单表';
```

### 3.3 同步日志表 (sync_logs)

```sql
CREATE TABLE `sync_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sync_type` VARCHAR(50) NOT NULL COMMENT '同步类型:user/order/payment/repair',
  `source_id` INT NOT NULL COMMENT '源数据ID',
  `target_id` INT DEFAULT NULL COMMENT '目标数据ID',
  `action`' ENUM('create', 'update', 'delete') NOT NULL COMMENT '操作类型',
  `status` ENUM('success', 'failed', 'retrying') NOT NULL COMMENT '状态',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  `synced_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间',
  PRIMARY KEY (`id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_status` (`status`),
  KEY `idx_synced_at` (`synced_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='同步日志表';
```

---

## 4. 同步服务实现

### 4.1 技术选型

| 组件 | 技术 | 说明 |
|-----|------|------|
| 同步服务 | PHP (Laravel/ThinkPHP) | 复用现有技术栈 |
| 任务队列 | Redis Queue | 异步同步任务 |
| 定时任务 | Cron + Laravel Scheduler | 定时同步和统计 |
| 数据库连接 | MySQL PDO | 双数据库支持 |

### 4.2 同步服务架构

```
backend/app/services/DataSync/
├── DataSyncService.php          # 核心同步服务
├── CustomerSyncService.php      # 客户数据同步
├── OrderSyncService.php         # 订单数据同步
├── PaymentSyncService.php       # 支付数据同步
├── RepairRecordSyncService.php  # 维修记录同步
└── SyncLogService.php           # 同步日志服务
```

### 4.3 同步流程

#### 实时同步流程

```
小程序操作
    ↓
触发事件/回调
    ↓
同步服务队列入队
    ↓
后台消费者处理
    ↓
写入后台数据库
    ↓
记录同步日志
```

#### 定时同步流程

```
定时任务触发
    ↓
检查未同步数据
    ↓
批量同步
    ↓
更新同步标记
    ↓
计算统计数据
```

### 4.4 同步接口设计

#### 小程序端触发同步API

```php
// backend/app/controller/DataSyncController.php

/**
 * 触发订单同步
 */
public function triggerOrderSync($orderId)
{
    // 验证订单存在
    // 加入同步队列
    // 返回处理结果
}

/**
 * 触发支付同步
 */
public function triggerPaymentSync($paymentId)
{
    // ...
}

/**
 * 批量同步客户数据
 */
public function batchSyncCustomers($lastSyncTime)
{
    // ...
}
```

---

## 5. 数据分析功能

### 5.1 分析模块设计

#### 5.1.1 订单分析仪表板

- 订单趋势图（按日/周/月）
- 订单状态分布
- 设备类型排行
- 故障类型统计
- 服务方式对比（到店/上门）

#### 5.1.2 客户分析仪表板

- 客户增长趋势
- 客户等级分布
- 复购率分析
- 客户地域分布
- 活跃客户统计

#### 5.1.3 收入分析仪表板

- 收入趋势图
- 支付方式分布
- 客单价分析
- 收入占比分析

#### 5.1.4 维修效率分析

- 订单完成时效
- 维修阶段耗时
- 维修人员工作量
- 配件使用统计

### 5.2 统计数据表设计

```sql
-- 每日订单统计表
CREATE TABLE `daily_order_statistics` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `total_orders` INT DEFAULT 0 COMMENT '订单总数',
  `pending_orders` INT DEFAULT 0 COMMENT '待处理订单',
  `processing_orders` INT DEFAULT 0 COMMENT '处理中订单',
  `completed_orders` INT DEFAULT 0 COMMENT '已完成订单',
  `cancelled_orders` INT DEFAULT 0 COMMENT '已取消订单',
  `total_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '总金额',
  `avg_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '平均金额',
  `new_customers` INT DEFAULT 0 COMMENT '新增客户数',
  `repair_orders` INT DEFAULT 0 COMMENT '维修订单数',
  `recycle_orders` INT DEFAULT 0 COMMENT '回收订单数',
  `shop_orders` INT DEFAULT 0 COMMENT '到店订单数',
  `home_orders` INT DEFAULT 0 COMMENT '上门订单数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date` (`stat_date`)
) ENGINE=InnoDB COMMENT='每日订单统计表';

-- 每小时订单统计表
CREATE TABLE `hourly_order_statistics` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `stat_hour` TINYINT NOT NULL COMMENT '统计小时(0-23)',
  `order_count` INT DEFAULT 0 COMMENT '订单数',
  `total_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '总金额',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date_hour` (`stat_date`, `stat_hour`)
) ENGINE=InnoDB COMMENT='每小时订单统计表';
```

### 5.3 数据分析API

```php
// backend/app/controller/AnalysisController.php

/**
 * 获取订单趋势数据
 */
public function getOrderTrend($startDate, $endDate, $type = 'day')
{
    // 返回图表数据
}

/**
 * 获取客户分析数据
 */
public function getCustomerAnalysis($startDate, $endDate)
{
    // 返回客户分析数据
}

/**
 * 获取收入分析数据
 */
public function getIncomeAnalysis($startDate, $endDate)
{
    // 返回收入分析数据
}

/**
 * 获取设备类型排行
 */
public function getDeviceRanking($limit = 10)
{
    // 返回排行数据
}
```

---

## 6. 前端展示功能

### 6.1 菜单结构

```
数据分析
├── 小程序业务
│   ├── 概览仪表板
│   ├── 订单分析
│   ├── 客户分析
│   ├── 收入分析
│   └── 维修效率
├── 同步管理
│   ├── 同步状态
│   ├── 同步日志
│   └── 同步配置
└── 综合报表
    ├── 月度报表
    ├── 季度报表
    └── 自定义报表
```

### 6.2 仪表板设计

#### 小程序业务概览

```
┌─────────────────────────────────────────────────────┐
│  今日订单: 128    今日收入: ¥45,678.00             │
├─────────────────────────────────────────────────────┤
│  待处理: 23   处理中: 45   已完成: 60   已取消: 0│
├─────────────────────────────────────────────────────┤
│  [订单趋势图]          [订单状态饼图]              │
├─────────────────────────────────────────────────────┤
│  [设备类型排行]        [客户地域分布]              │
└─────────────────────────────────────────────────────┘
```

### 6.3 前端组件

```javascript
// frontend-web/src/views/analysis/MiniProgramOverview.vue

export default {
  data() {
    return {
      stats: {
        todayOrders: 0,
        todayIncome: 0,
        pendingOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0
      },
      orderTrendData: [],
      deviceRankingData: [],
      customerDistribution: []
    }
  },
  methods: {
    async loadOverview() {
      // 调用分析API获取数据
    }
  }
}
```

---

## 7. 实施计划

### 7.1 分阶段实施

#### 第一阶段：基础设施搭建 (1-2周)

- [ ] 创建同步所需数据表
- [ ] 搭建同步服务基础框架
- [ ] 配置双数据库连接
- [ ] 实现同步日志记录
- [ ] 实现基础同步接口

#### 第二阶段：核心数据同步 (2-3周)

- [ ] 实现客户数据同步
- [ ] 实现订单数据同步
- [ ] 实现支付数据同步
- [ ] 实现维修记录同步
- [ ] 实现同步失败重试机制

#### 第三阶段：统计分析功能 (2-3周)

- [ ] 实现定时统计任务
- [ ] 创建统计数据表
- [ ] 实现订单统计分析
- [ ] 实现客户统计分析
- [ ] 实现收入统计分析

#### 第四阶段：前端展示 (2-3周)

- [ ] 创建数据分析菜单
- [ ] 实现概览仪表板
- [ ] 实现订单分析页面
- [ ] 实现客户分析页面
- [ ] 实现收入分析页面

#### 第五阶段：测试与优化 (1-2周)

- [ ] 功能测试
- [ ] 性能优化
- [ ] 异常处理完善
- [ ] 文档编写

### 7.2 时间表

| 阶段 | 任务 | 预计工期 | 负责人 |
|-----|------|---------|--------|
| 1 | 基础设施搭建 | 1-2周 | - |
| 2 | 核心数据同步 | 2-3周 | - |
| 3 | 统计分析功能 | 2-3周 | - |
| 4 | 前端展示 | 2-3周 | - |
| 5 | 测试与优化 | 1-2周 | - |
| **总计** | | **8-13周** | |

---

## 8. 技术细节

### 8.1 双数据库配置

```php
// backend/config/database.php

return [
    'default' => env('DB_CONNECTION', 'cmms'),
    
    'connections' => [
        // 后台管理系统数据库
        'cmms' => [
            'driver' => 'mysql',
            'host' => env('DB_CMMS_HOST', 'localhost'),
            'database' => env('DB_CMMS_DATABASE', 'cmms_db'),
            // ...
        ],
        
        // 小程序数据库
        'miniprogram' => [
            'driver' => 'mysql',
            'host' => env('DB_MP_HOST', 'localhost'),
            'database' => env('DB_MP_DATABASE', 'repair'),
            // ...
        ]
    ]
];
```

### 8.2 同步服务示例

```php
<?php
// backend/app/services/DataSync/OrderSyncService.php

namespace App\Services\DataSync;

class OrderSyncService
{
    protected $mpDb;
    protected $cmmsDb;
    protected $logger;
    
    public function __construct()
    {
        $this->mpDb = \DB::connection('miniprogram');
        $this->cmmsDb = \DB::connection('cmms');
        $this->logger = new SyncLogService();
    }
    
    /**
     * 同步单个订单
     */
    public function syncOrder($mpOrderId)
    {
        try {
            // 1. 从小程序获取订单数据
            $mpOrder = $this->mpDb->table('orders')
                ->where('id', $mpOrderId)
                ->first();
            
            if (!$mpOrder) {
                throw new \Exception("订单不存在: {$mpOrderId}");
            }
            
            // 2. 同步客户数据
            $customerId = $this->syncCustomer($mpOrder->user_id);
            
            // 3. 检查后台是否已存在
            $existing = $this->cmmsDb->table('miniprogram_orders')
                ->where('mp_order_id', $mpOrderId)
                ->first();
            
            if ($existing) {
                // 更新
                $this->updateOrder($existing->id, $mpOrder, $customerId);
            } else {
                // 新增
                $this->createOrder($mpOrder, $customerId);
            }
            
            // 4. 记录同步日志
            $this->logger->logSuccess('order', $mpOrderId, $existing->id ?? null, 'update');
            
            return true;
        } catch (\Exception $e) {
            $this->logger->logError('order', $mpOrderId, null, 'update', $e->getMessage());
            return false;
        }
    }
    
    /**
     * 批量同步订单
     */
    public function batchSync($limit = 100)
    {
        // 获取需要同步的订单
        $orders = $this->mpDb->table('orders')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();
        
        $success = 0;
        $failed = 0;
        
        foreach ($orders as $order) {
            if ($this->syncOrder($order->id)) {
                $success++;
            } else {
                $failed++;
            }
        }
        
        return [
            'total' => $orders->count(),
            'success' => $success,
            'failed' => $failed
        ];
    }
    
    // ... 其他方法
}
```

### 8.3 定时统计任务

```php
<?php
// backend/app/commands/CalculateDailyStatistics.php

namespace App\Commands;

use Illuminate\Console\Command;

class CalculateDailyStatistics extends Command
{
    protected $signature = 'stats:daily {date?}';
    protected $description = '计算每日统计数据';
    
    public function handle()
    {
        $date = $this->argument('date') ?? date('Y-m-d');
        
        // 计算订单统计
        $this->calculateOrderStats($date);
        
        // 计算客户统计
        $this->calculateCustomerStats($date);
        
        // 计算收入统计
        $this->calculateIncomeStats($date);
        
        $this->info("Daily statistics calculated for {$date}");
    }
    
    protected function calculateOrderStats($date)
    {
        $stats = \DB::table('miniprogram_orders')
            ->whereDate('created_at', $date)
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = "processing" THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_orders,
                COALESCE(SUM(actual_price), 0) as total_amount,
                COALESCE(AVG(actual_price), 0) as avg_amount
            ')
            ->first();
        
        // 插入或更新统计记录
        \DB::table('daily_order_statistics')
            ->updateOrInsert(
                ['stat_date' => $date],
                (array)$stats
            );
    }
}
```

---

## 9. 监控与运维

### 9.1 同步监控指标

- 同步成功率
- 同步延迟时间
- 待同步数据量
- 同步失败队列长度
- 统计计算耗时

### 9.2 告警机制

- 同步失败率达到阈值时告警
- 数据不一致检测告警
- 统计计算超时告警

### 9.3 监控仪表板

```
┌─────────────────────────────────────────┐
│  同步状态监控                           │
├─────────────────────────────────────────┤
│  最后同步时间: 2025-01-15 14:30:25    │
│  同步成功率: 99.5%                     │
│  平均延迟: 2.3秒                       │
│  待处理数据: 15                         │
│  失败队列: 3                            │
├─────────────────────────────────────────┤
│  [同步成功率趋势图]                     │
└─────────────────────────────────────────┘
```

---

## 10. 风险评估与应对

### 10.1 数据一致性风险

**风险描述**：两个系统间数据可能不一致

**应对措施**：
- 实现数据版本控制
- 定期进行数据一致性校验
- 提供手动重新同步功能

### 10.2 性能影响风险

**风险描述**：同步操作可能影响小程序性能

**应对措施**：
- 使用异步队列处理同步
- 限制同步并发数
- 低峰期进行批量同步

### 10.3 数据库连接风险

**风险描述**：双数据库连接可能失败

**应对措施**：
- 实现连接池管理
- 连接失败自动重试
- 提供降级方案

### 10.4 数据安全风险

**风险描述**：敏感数据同步可能存在安全隐患

**应对措施**：
- 加密传输敏感数据
- 实现访问权限控制
- 记录详细操作日志

---

## 11. 后续扩展

### 11.1 功能扩展方向

1. **预测分析**
   - 订单量预测
   - 收入预测
   - 客户流失预测

2. **智能推荐**
   - 基于历史数据的维修建议
   - 配件推荐
   - 价格建议

3. **实时监控**
   - WebSocket实时数据推送
   - 移动端实时监控
   - 大屏展示

4. **数据导出**
   - Excel导出
   - PDF报表生成
   - 自定义报表

### 11.2 技术升级方向

1. 使用消息队列替代Redis Queue
2. 引入Elasticsearch提升搜索性能
3. 使用ClickHouse进行大数据分析
4. 引入数据可视化高级图表库

---

## 12. 总结

本方案提供了完整的小程序与后台管理系统数据同步与分析解决方案，包括：

✅ **数据同步**：支持实时和定时同步，确保数据一致性
✅ **统计分析**：提供多维度数据分析功能
✅ **前端展示**：直观的数据可视化界面
✅ **可扩展性**：架构设计支持后续功能扩展

**预期效果**：
- 实现小程序业务数据在后台的统一管理
- 提供全面的数据分析支持决策
- 提升运营效率和数据价值利用率

---

*文档版本：v1.0*
*创建日期：2025-01-15*
*最后更新：2025-01-15*
