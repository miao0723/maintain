# 后端开发指南

本文档介绍CMMS后端开发的规范和最佳实践。

---

## 📋 目录

- [项目结构](#项目结构)
- [编码规范](#编码规范)
- [开发流程](#开发流程)
- [测试指南](#测试指南)
- [性能优化](#性能优化)
- [安全规范](#安全规范)

---

## 🏗️ 项目结构

### 目录说明

```
backend/
├── app/                    # 应用目录
│   ├── controller/         # 控制器层
│   ├── model/              # 模型层
│   ├── service/            # 服务层（业务逻辑）
│   ├── validate/           # 验证器层
│   ├── middleware/         # 中间件
│   └── common/             # 公共类
├── config/                 # 配置文件
├── database/               # 数据库相关
├── public/                 # 公共入口
├── route/                  # 路由配置
├── runtime/                # 运行时目录
└── vendor/                 # Composer依赖
```

### 分层架构

```
Controller (控制器层)
    ↓
Validate (验证器层)
    ↓
Service (服务层)
    ↓
Model (模型层)
    ↓
Database (数据库层)
```

---

## 📝 编码规范

### PSR-12标准

遵循 [PSR-12](https://www.php-fig.org/psr/psr-12/) 代码规范。

### 命名规范

#### 类名

```php
// PascalCase
class WorkOrderService {}
class DeviceController {}
class WorkOrder {}
```

#### 方法名

```php
// camelCase
public function getWorkOrderList() {}
public function createWorkOrder() {}
public function validateForm() {}
```

#### 变量名

```php
// camelCase
$workOrderList = [];
$deviceId = 1;
$isValid = true;
```

#### 常量名

```php
// UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;
```

### 注释规范

#### 类注释

```php
/**
 * 工单服务类
 *
 * @author  Your Name <your.email@example.com>
 * @version 1.0.0
 */
class WorkOrderService
{
    // ...
}
```

#### 方法注释

```php
/**
 * 获取工单列表
 *
 * @param array $params 查询参数
 * @param int $page 页码
 * @param int $limit 每页数量
 * @return array 工单列表
 * @throws \Exception 数据库异常
 */
public function getWorkOrderList($params = [], $page = 1, $limit = 20)
{
    // ...
}
```

---

## 🔄 开发流程

### 1. 创建Model

```php
<?php
namespace app\model;

use think\Model;

class WorkOrder extends Model
{
    protected $table = 'work_orders';

    protected $json = ['repair_images', 'used_parts'];

    protected $jsonAssoc = true;

    // 定义关联关系
    public function device()
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
```

### 2. 创建Validate

```php
<?php
namespace app\validate;

use think\Validate;

class WorkOrderValidate extends Validate
{
    protected $rule = [
        'device_id' => 'require|integer',
        'fault_type' => 'require|max:50',
        'fault_description' => 'require|min:5',
        'priority' => 'in:1,2,3,4',
    ];

    protected $message = [
        'device_id.require' => '设备ID不能为空',
        'fault_type.require' => '故障类型不能为空',
        'fault_description.require' => '故障描述不能为空',
        'fault_description.min' => '故障描述至少5个字符',
    ];

    protected $scene = [
        'create' => ['device_id', 'fault_type', 'fault_description', 'priority'],
        'update' => ['fault_type', 'fault_description', 'priority'],
    ];
}
```

### 3. 创建Service

```php
<?php
namespace app\service;

use app\model\WorkOrder;
use think\facade\Db;

class WorkOrderService
{
    /**
     * 获取工单列表
     */
    public function getList($params = [], $page = 1, $limit = 20)
    {
        $query = WorkOrder::with(['device', 'reporter', 'assignedTo']);

        // 筛选条件
        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        if (!empty($params['priority'])) {
            $query->where('priority', $params['priority']);
        }

        if (!empty($params['keyword'])) {
            $query->whereLike('fault_description', '%' . $params['keyword'] . '%');
        }

        // 分页
        $list = $query->page($page, $limit)->order('created_at', 'desc')->select();
        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ];
    }

    /**
     * 创建工单
     */
    public function create($data)
    {
        Db::startTrans();
        try {
            // 生成工单号
            $data['order_no'] = $this->generateOrderNo();

            // 创建工单
            $order = WorkOrder::create($data);

            // 记录日志
            $this->createLog($order->id, 'created', $data['reporter_id']);

            Db::commit();
            return $order;
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }
}
```

### 4. 创建Controller

```php
<?php
namespace app\controller;

use app\service\WorkOrderService;
use app\validate\WorkOrderValidate;
use think\facade\Request;
use app\common\RequestHelper;
use app\common\Result;

class WorkOrderController
{
    protected $service;

    public function __construct()
    {
        $this->service = new WorkOrderService();
    }

    /**
     * 获取工单列表
     */
    public function index()
    {
        $data = RequestHelper::getData();
        $page = $data['page'] ?? 1;
        $limit = $data['limit'] ?? 20;

        $result = $this->service->getList($data, $page, $limit);

        return Result::success($result);
    }

    /**
     * 创建工单
     */
    public function save()
    {
        $data = RequestHelper::getData();
        $userId = Request::instance()->userId; // 从中间件获取

        // 验证
        validate(WorkOrderValidate::class)->scene('create')->check($data);

        // 添加报修人ID
        $data['reporter_id'] = $userId;

        // 创建
        $order = $this->service->create($data);

        return Result::success($order, '创建成功');
    }
}
```

### 5. 配置路由

```php
<?php
use think\facade\Route;

// 工单路由组
Route::group('workorders', function () {
    Route::get('', 'WorkOrderController/index');
    Route::get('/:id', 'WorkOrderController/read');
    Route::post('', 'WorkOrderController/save');
    Route::put('/:id', 'WorkOrderController/update');
    Route::delete('/:id', 'WorkOrderController/delete');

    // 工单操作
    Route::post('/:id/assign', 'WorkOrderController/assign');
    Route::post('/:id/accept', 'WorkOrderController/accept');
    Route::post('/:id/start', 'WorkOrderController/start');
    Route::post('/:id/complete', 'WorkOrderController/complete');
    Route::post('/:id/verify', 'WorkOrderController/verify');
    Route::post('/:id/close', 'WorkOrderController/close');
})->middleware(\app\middleware\JwtAuth::class)
  ->middleware(\app\middleware\PermissionCheck::class);
```

---

## 🧪 测试指南

### 单元测试

```php
<?php
namespace tests;

use PHPUnit\Framework\TestCase;
use app\service\WorkOrderService;

class WorkOrderServiceTest extends TestCase
{
    protected $service;

    protected function setUp(): void
    {
        $this->service = new WorkOrderService();
    }

    public function testGetList()
    {
        $result = $this->service->getList([], 1, 20);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('list', $result);
        $this->assertArrayHasKey('total', $result);
    }

    public function testCreate()
    {
        $data = [
            'device_id' => 1,
            'fault_type' => '电气故障',
            'fault_description' => '设备无法启动',
            'priority' => 2,
            'reporter_id' => 1,
        ];

        $order = $this->service->create($data);

        $this->assertIsObject($order);
        $this->assertNotEmpty($order->order_no);
    }
}
```

### 运行测试

```bash
# 运行所有测试
php think unit

# 运行指定测试
php think unit WorkOrderServiceTest

# 运行带覆盖率的测试
php think unit --coverage
```

---

## ⚡ 性能优化

### 1. 使用Eager Loading

```php
// ❌ N+1查询
$orders = WorkOrder::select();
foreach ($orders as $order) {
    echo $order->device->name; // 每次都查询数据库
}

// ✅ Eager Loading
$orders = WorkOrder::with(['device', 'reporter'])->select();
foreach ($orders as $order) {
    echo $order->device->name; // 不会再次查询
}
```

### 2. 使用聚合查询

```php
// ❌ 多次COUNT查询
$total = WorkOrder::count();
$completed = WorkOrder::where('status', 4)->count();
$pending = WorkOrder::where('status', 0)->count();

// ✅ 单次GROUP BY查询
$stats = WorkOrder::field('status, COUNT(*) as count')
    ->group('status')
    ->select()
    ->column('count', 'status');
```

### 3. 使用索引

```php
// 确保常用查询字段有索引
// 在migration中添加
$this->index('status');
$this->index('priority');
$this->index(['status', 'priority']); // 复合索引
```

### 4. 使用缓存

```php
use think\facade\Cache;

public function getCategories()
{
    return Cache::remember('device_categories', 3600, function () {
        return DeviceCategory::select()->toArray();
    });
}
```

---

## 🔒 安全规范

### 1. 输入验证

```php
// 始终验证用户输入
validate(WorkOrderValidate::class)->check($data);
```

### 2. SQL注入防护

```php
// 使用参数化查询
WorkOrder::where('id', $id)->find(); // ✅

// 禁止
WorkOrder::where("id = {$id}")->find(); // ❌
```

### 3. XSS防护

```php
// 输出时转义
{{ $content }} // ✅

{$content} // ❌
```

### 4. 权限检查

```php
// 在Controller中检查权限
if (!Auth::can('workorder', 'create')) {
    return Result::error('无权限', 403);
}
```

### 5. 敏感数据处理

```php
// 密码使用hash
$user->password = password_hash($password, PASSWORD_BCRYPT);

// 敏感信息不记录日志
$Log::record('User login', ['user_id' => $user->id]); // ✅
$Log::record('User login', ['password' => $password]); // ❌
```

---

## 📚 最佳实践

### 1. 使用Helper类

```php
use app\common\RequestHelper;
use app\common\QueryHelper;

// 统一的请求处理
$data = RequestHelper::getData();

// 统一的查询构建
QueryHelper::applyKeywordSearch($query, $keyword, ['name', 'code']);
```

### 2. 统一响应格式

```php
use app\common\Result;

return Result::success($data);
return Result::error('错误信息');
```

### 3. 使用事务

```php
use think\facade\Db;

Db::startTrans();
try {
    // 多个数据库操作
    Db::commit();
} catch (\Exception $e) {
    Db::rollback();
    throw $e;
}
```

### 4. 异常处理

```php
try {
    // 业务逻辑
} catch (\Exception $e) {
    Log::error('Error: ' . $e->getMessage());
    return Result::error('操作失败');
}
```

---

## 🔧 调试技巧

### 1. 查看SQL

```php
// 开启SQL日志
'query_listener' => true,

// 在代码中
Db::listen(function ($sql) {
    Log::record($sql, 'sql');
});
```

### 2. 使用dump

```php
// 调试时使用
halt($data); // 停止并输出
dump($data); // 输出但不停止
```

### 3. 使用Log

```php
use think\facade\Log;

Log::info('信息', $data);
Log::error('错误', $data);
Log::debug('调试', $data);
```

---

## 📖 参考资源

- [ThinkPHP 8.1文档](https://www.thinkphp.cn/)
- [PSR-12编码规范](https://www.php-fig.org/psr/psr-12/)
- [PHPUnit文档](https://phpunit.de/)
- [MySQL 8.0文档](https://dev.mysql.com/doc/)
