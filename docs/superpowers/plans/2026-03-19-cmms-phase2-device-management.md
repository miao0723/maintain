# Phase 2: Device Asset Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build device asset management CRUD with category management, supporting department relationships and status tracking.

**Architecture:** Service layer handles business logic, models manage relationships, controllers handle validation/responses, middleware enforces JWT auth and RBAC permissions.

**Tech Stack:** ThinkPHP 8.1, MySQL 8.0, Redis 7.0, PHP 8.2

---

## Task 1: Database Migrations

Create tables for device categories and devices with proper foreign key constraints and indexes.

### Task 1.1: Create device_categories Table Migration

**Files:**
- Create: `backend/database/migrations/2024_03_19_000004_create_device_categories_table.php`

- [ ] **Step 1: Create migration file**

```php
<?php

use think\migration\Migrator;

class CreateDeviceCategoriesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('device_categories', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '设备分类表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '分类ID',
            ])
            ->addColumn('name', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '分类名称',
            ])
            ->addColumn('icon', 'string', [
                'limit' => 100,
                'null' => true,
                'default' => null,
                'comment' => '图标标识',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['name'], ['name' => 'uk_name', 'unique' => true])
            ->create();
    }
}
```

- [ ] **Step 2: Run migration**

Run: `php think migrate:run`

Expected: Output showing "CreateDeviceCategoriesTable" migrated successfully

- [ ] **Step 3: Verify table structure**

Run: `mysql -u root -p123456 -e "DESCRIBE cmms.device_categories;"`

Expected: Table with columns id, name, icon, created_at

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2024_03_19_000004_create_device_categories_table.php
git commit -m "feat(migration): create device_categories table"
```

### Task 1.2: Create devices Table Migration

**Files:**
- Create: `backend/database/migrations/2024_03_19_000005_create_devices_table.php`

- [ ] **Step 1: Create migration file**

```php
<?php

use think\migration\Migrator;

class CreateDevicesTable extends Migrator
{
    public function change()
    {
        $table = $this->table('devices', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '设备表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '设备ID',
            ])
            ->addColumn('device_code', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '设备编码',
            ])
            ->addColumn('device_name', 'string', [
                'limit' => 100,
                'null' => false,
                'comment' => '设备名称',
            ])
            ->addColumn('model', 'string', [
                'limit' => 100,
                'null' => true,
                'default' => null,
                'comment' => '型号规格',
            ])
            ->addColumn('category_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '分类ID',
            ])
            ->addColumn('department_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '所属部门ID',
            ])
            ->addColumn('location', 'string', [
                'limit' => 200,
                'null' => true,
                'default' => null,
                'comment' => '物理位置',
            ])
            ->addColumn('purchase_date', 'date', [
                'null' => true,
                'default' => null,
                'comment' => '购置日期',
            ])
            ->addColumn('warranty_date', 'date', [
                'null' => true,
                'default' => null,
                'comment' => '保修期至',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'signed' => false,
                'null' => false,
                'default' => 1,
                'comment' => '状态:1正常 2维修中 3停用',
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
            ->addIndex(['device_code'], ['name' => 'uk_device_code', 'unique' => true])
            ->addIndex(['category_id'], ['name' => 'idx_category'])
            ->addIndex(['department_id'], ['name' => 'idx_department'])
            ->addIndex(['status'], ['name' => 'idx_status'])
            ->addForeignKey('category_id', 'device_categories', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->addForeignKey('department_id', 'departments', 'id', [
                'delete' => 'RESTRICT',
                'update' => 'CASCADE',
            ])
            ->create();
    }
}
```

- [ ] **Step 2: Run migration**

Run: `php think migrate:run`

Expected: Output showing "CreateDevicesTable" migrated successfully

- [ ] **Step 3: Verify table structure**

Run: `mysql -u root -p123456 -e "DESCRIBE cmms.devices; SHOW INDEX FROM cmms.devices;"`

Expected: Table with 11 columns, indexes including uk_device_code, foreign keys to device_categories and departments

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2024_03_19_000005_create_devices_table.php
git commit -m "feat(migration): create devices table with foreign keys"
```

---

## Task 2: Models

Create Eloquent models with relationships following existing patterns (see `backend/app/model/User.php`, `backend/app/model/Department.php`).

### Task 2.1: Create DeviceCategory Model

**Files:**
- Create: `backend/app/model/DeviceCategory.php`

- [ ] **Step 1: Create model**

```php
<?php

namespace app\model;

use think\Model;

class DeviceCategory extends Model
{
    protected $table = 'device_categories';

    protected $fillable = [
        'name',
        'icon',
    ];

    /**
     * 关联设备
     */
    public function devices()
    {
        return $this->hasMany(Device::class, 'category_id');
    }
}
```

- [ ] **Step 2: Test model in PHP console**

Run: `php think`

```php
use app\model\DeviceCategory;
$cat = new DeviceCategory();
$cat->name = '泵类';
$cat->icon = 'pump';
$cat->save();
echo "Created category with ID: " . $cat->id . "\n";
```

Expected: "Created category with ID: 1"

- [ ] **Step 3: Commit**

```bash
git add backend/app/model/DeviceCategory.php
git commit -m "feat(model): create DeviceCategory model"
```

### Task 2.2: Create Device Model

**Files:**
- Create: `backend/app/model/Device.php`

- [ ] **Step 1: Create model with relationships**

```php
<?php

namespace app\model;

use think\Model;

class Device extends Model
{
    protected $table = 'devices';

    protected $fillable = [
        'device_code',
        'device_name',
        'model',
        'category_id',
        'department_id',
        'location',
        'purchase_date',
        'warranty_date',
        'status',
    ];

    protected $hidden = [];

    /**
     * 关联分类
     */
    public function category()
    {
        return $this->belongsTo(DeviceCategory::class, 'category_id');
    }

    /**
     * 关联部门
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
```

- [ ] **Step 2: Test model with relationships**

Run: `php think`

```php
use app\model\Device;
use app\model\DeviceCategory;
use app\model\Department;

// First ensure we have a category and department
$cat = DeviceCategory::find(1);
$dept = Department::find(1);

if (!$cat || !$dept) {
    echo "Please create a category and department first\n";
    exit;
}

$device = new Device();
$device->device_code = 'DEV001';
$device->device_name = '离心泵';
$device->model = 'IS50-32-125';
$device->category_id = $cat->id;
$device->department_id = $dept->id;
$device->location = '车间A区';
$device->purchase_date = '2024-01-15';
$device->warranty_date = '2026-01-15';
$device->status = 1;
$device->save();

// Test relationships
$deviceWithRelations = Device::with(['category', 'department'])->find($device->id);
echo "Device: " . $deviceWithRelations->device_name . "\n";
echo "Category: " . $deviceWithRelations->category->name . "\n";
echo "Department: " . $deviceWithRelations->department->name . "\n";
```

Expected: Output showing device with category and department names

- [ ] **Step 3: Commit**

```bash
git add backend/app/model/Device.php
git commit -m "feat(model): create Device model with relationships"
```

---

## Task 3: Validators

Create ThinkPHP validators following existing pattern (see `backend/app/validate/LoginValidate.php`).

### Task 3.1: Create DeviceCategoryValidate

**Files:**
- Create: `backend/app/validate/DeviceCategoryValidate.php`

- [ ] **Step 1: Create validator**

```php
<?php

namespace app\validate;

use think\Validate;

class DeviceCategoryValidate extends Validate
{
    protected $rule = [
        'name' => 'require|max:50|unique:device_categories',
        'icon' => 'max:100',
    ];

    protected $message = [
        'name.require' => '分类名称不能为空',
        'name.max' => '分类名称最多50个字符',
        'name.unique' => '分类名称已存在',
        'icon.max' => '图标标识最多100个字符',
    ];
}
```

- [ ] **Step 2: Test validation errors**

Run: `php think`

```php
use think\facade\Validate;
$data = ['name' => ''];
$validate = new \app\validate\DeviceCategoryValidate();
if (!$validate->check($data)) {
    echo "Validation error: " . $validate->getError() . "\n";
}
```

Expected: "Validation error: 分类名称不能为空"

- [ ] **Step 3: Commit**

```bash
git add backend/app/validate/DeviceCategoryValidate.php
git commit -m "feat(validate): create DeviceCategoryValidate"
```

### Task 3.2: Create DeviceValidate with Cross-Field Validation

**Files:**
- Create: `backend/app/validate/DeviceValidate.php`

- [ ] **Step 1: Create validator with custom rule**

```php
<?php

namespace app\validate;

use think\Validate;

class DeviceValidate extends Validate
{
    protected $rule = [
        'device_code' => 'require|max:50|unique:devices',
        'device_name' => 'require|max:100',
        'model' => 'max:100',
        'category_id' => 'require|integer',
        'department_id' => 'require|integer',
        'location' => 'max:200',
        'purchase_date' => 'date',
        'warranty_date' => 'date|checkWarrantyDate',
        'status' => 'in:1,2,3',
    ];

    protected $message = [
        'device_code.require' => '设备编码不能为空',
        'device_code.max' => '设备编码最多50个字符',
        'device_code.unique' => '设备编码已存在',
        'device_name.require' => '设备名称不能为空',
        'device_name.max' => '设备名称最多100个字符',
        'model.max' => '型号规格最多100个字符',
        'category_id.require' => '分类不能为空',
        'category_id.integer' => '分类ID格式错误',
        'department_id.require' => '部门不能为空',
        'department_id.integer' => '部门ID格式错误',
        'location.max' => '物理位置最多200个字符',
        'purchase_date.date' => '购置日期格式错误',
        'warranty_date.date' => '保修期日期格式错误',
        'warranty_date.checkWarrantyDate' => '保修期必须晚于购置日期',
        'status.in' => '状态值必须是1(正常)、2(维修中)或3(停用)',
    ];

    /**
     * 自定义验证：保修期必须晚于购置日期
     */
    protected function checkWarrantyDate($value, $rule, $data = [])
    {
        if (isset($data['purchase_date']) && !empty($data['purchase_date'])) {
            return strtotime($value) > strtotime($data['purchase_date']);
        }
        return true;
    }
}
```

- [ ] **Step 2: Test validation**

Run: `php think`

```php
use think\facade\Validate;

// Test 1: Missing required field
$data1 = ['device_name' => '泵'];
$validate = new \app\validate\DeviceValidate();
if (!$validate->check($data1)) {
    echo "Test 1: " . $validate->getError() . "\n";
}

// Test 2: Warranty before purchase
$data2 = [
    'device_code' => 'TEST001',
    'device_name' => '测试设备',
    'category_id' => 1,
    'department_id' => 1,
    'purchase_date' => '2026-01-01',
    'warranty_date' => '2025-01-01',
];
if (!$validate->check($data2)) {
    echo "Test 2: " . $validate->getError() . "\n";
}
```

Expected:
- Test 1: 设备编码不能为空
- Test 2: 保修期必须晚于购置日期

- [ ] **Step 3: Commit**

```bash
git add backend/app/validate/DeviceValidate.php
git commit -m "feat(validate): create DeviceValidate with cross-field validation"
```

---

## Task 4: Service Layer

Create service layer for business logic. Devices and categories share similar CRUD patterns.

### Task 4.1: Create DeviceService

**Files:**
- Create: `backend/app/service/DeviceService.php`

- [ ] **Step 1: Create service with CRUD methods**

```php
<?php

namespace app\service;

use app\model\Device;
use app\model\DeviceCategory;
use think\facade\Db;

class DeviceService
{
    /**
     * 获取设备列表（分页）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Device::with(['category', 'department']);

        // 按分类筛选
        if (isset($filters['category_id']) && !empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // 按部门筛选
        if (isset($filters['department_id']) && !empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        // 按状态筛选
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // 搜索设备名称或编码
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $query->where('device_name|device_code', 'like', '%' . $filters['keyword'] . '%');
        }

        $list = $query
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select();

        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取设备详情
     */
    public function getDetail($id)
    {
        $device = Device::with(['category', 'department'])->find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        return $device;
    }

    /**
     * 创建设备
     */
    public function create($data)
    {
        // 检查分类是否存在
        if (!DeviceCategory::find($data['category_id'])) {
            throw new \Exception('分类不存在');
        }

        // 检查部门是否存在
        if (!\app\model\Department::find($data['department_id'])) {
            throw new \Exception('部门不存在');
        }

        // 设置默认状态
        if (!isset($data['status'])) {
            $data['status'] = 1;
        }

        $device = new Device();
        $device->data($data);
        $device->save();

        return $device->refresh();
    }

    /**
     * 更新设备
     */
    public function update($id, $data)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // 检查分类是否存在
        if (isset($data['category_id']) && !DeviceCategory::find($data['category_id'])) {
            throw new \Exception('分类不存在');
        }

        // 检查部门是否存在
        if (isset($data['department_id']) && !\app\model\Department::find($data['department_id'])) {
            throw new \Exception('部门不存在');
        }

        $device->data($data);
        $device->save();

        return $device->refresh();
    }

    /**
     * 删除设备
     */
    public function delete($id)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // TODO: 未来检查是否有工单关联

        $device->delete();

        return true;
    }

    /**
     * 获取设备维护历史
     */
    public function getHistory($id)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // TODO: Phase 3 实现工单后补充
        return [
            'device_id' => $id,
            'work_orders' => [],
        ];
    }

    /**
     * 更新设备状态
     */
    public function updateStatus($id, $status)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        if (!in_array($status, [1, 2, 3])) {
            throw new \Exception('状态值无效');
        }

        $device->status = $status;
        $device->save();

        return $device;
    }
}
```

- [ ] **Step 2: Test service methods**

Run: `php think`

```php
use app\service\DeviceService;
$service = new DeviceService();

// Test create
$data = [
    'device_code' => 'TEST002',
    'device_name' => '测试设备2',
    'category_id' => 1,
    'department_id' => 1,
    'status' => 1,
];
$device = $service->create($data);
echo "Created device: " . $device->device_name . " (ID: " . $device->id . ")\n";

// Test list
$result = $service->getList(1, 10);
echo "Total devices: " . $result['total'] . "\n";
```

Expected: Device created and total count displayed

- [ ] **Step 3: Commit**

```bash
git add backend/app/service/DeviceService.php
git commit -m "feat(service): create DeviceService with CRUD operations"
```

### Task 4.2: Create DeviceCategoryService

**Files:**
- Create: `backend/app/service/DeviceCategoryService.php`

- [ ] **Step 1: Create service**

```php
<?php

namespace app\service;

use app\model\DeviceCategory;

class DeviceCategoryService
{
    /**
     * 获取分类列表
     */
    public function getList()
    {
        return DeviceCategory::order('id', 'asc')->select();
    }

    /**
     * 获取分类详情
     */
    public function getDetail($id)
    {
        $category = DeviceCategory::find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        return $category;
    }

    /**
     * 创建分类
     */
    public function create($data)
    {
        $category = new DeviceCategory();
        $category->data($data);
        $category->save();

        return $category->refresh();
    }

    /**
     * 更新分类
     */
    public function update($id, $data)
    {
        $category = DeviceCategory::find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        $category->data($data);
        $category->save();

        return $category->refresh();
    }

    /**
     * 删除分类
     */
    public function delete($id)
    {
        $category = DeviceCategory::find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        // 检查是否有设备关联
        if ($category->devices()->count() > 0) {
            throw new \Exception('该分类下有设备，无法删除');
        }

        $category->delete();

        return true;
    }
}
```

- [ ] **Step 2: Test service**

Run: `php think`

```php
use app\service\DeviceCategoryService;
$service = new DeviceCategoryService();

// Test list
$categories = $service->getList();
foreach ($categories as $cat) {
    echo "Category: " . $cat->name . " (ID: " . $cat->id . ")\n";
}
```

Expected: List of categories displayed

- [ ] **Step 3: Commit**

```bash
git add backend/app/service/DeviceCategoryService.php
git commit -m "feat(service): create DeviceCategoryService"
```

---

## Task 5: Controllers

Create controllers following existing pattern (see `backend/app/controller/AuthController.php`). Use unified Result response class.

### Task 5.1: Create DeviceController

**Files:**
- Create: `backend/app/controller/DeviceController.php`

- [ ] **Step 1: Create controller**

```php
<?php

namespace app\controller;

use app\service\DeviceService;
use app\validate\DeviceValidate;
use app\common\Result;

class DeviceController
{
    private $service;

    public function __construct()
    {
        $this->service = new DeviceService();
    }

    /**
     * 获取设备列表
     * GET /api/devices
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('limit', 20);

        $filters = [
            'category_id' => request()->get('category_id', ''),
            'department_id' => request()->get('department_id', ''),
            'status' => request()->get('status', ''),
            'keyword' => request()->get('keyword', ''),
        ];

        $result = $this->service->getList($page, $limit, $filters);

        return Result::success([
            'list' => $result['list'],
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ]);
    }

    /**
     * 获取设备详情
     * GET /api/devices/{id}
     */
    public function read($id)
    {
        try {
            $device = $this->service->getDetail($id);
            return Result::success($device);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建设备
     * POST /api/devices
     */
    public function save()
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(DeviceValidate::class)->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $device = $this->service->create($data);
            return Result::success($device, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新设备
     * PUT /api/devices/{id}
     */
    public function update($id)
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(DeviceValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $device = $this->service->update($id, $data);
            return Result::success($device, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除设备
     * DELETE /api/devices/{id}
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 获取设备维护历史
     * GET /api/devices/{id}/history
     */
    public function history($id)
    {
        try {
            $history = $this->service->getHistory($id);
            return Result::success($history);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }
}
```

- [ ] **Step 2: Test API endpoint with curl**

Run: `docker exec -it cmms-php bash -c "curl -X GET http://localhost/api/devices -H 'Authorization: Bearer YOUR_TOKEN'"`

Expected: JSON response with devices list

- [ ] **Step 3: Commit**

```bash
git add backend/app/controller/DeviceController.php
git commit -m "feat(controller): create DeviceController"
```

### Task 5.2: Create DeviceCategoryController

**Files:**
- Create: `backend/app/controller/DeviceCategoryController.php`

- [ ] **Step 1: Create controller**

```php
<?php

namespace app\controller;

use app\service\DeviceCategoryService;
use app\validate\DeviceCategoryValidate;
use app\common\Result;

class DeviceCategoryController
{
    private $service;

    public function __construct()
    {
        $this->service = new DeviceCategoryService();
    }

    /**
     * 获取分类列表
     * GET /api/devices/categories
     */
    public function index()
    {
        $categories = $this->service->getList();
        return Result::success($categories);
    }

    /**
     * 创建分类
     * POST /api/devices/categories
     */
    public function save()
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(DeviceCategoryValidate::class)->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $category = $this->service->create($data);
            return Result::success($category, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新分类
     * PUT /api/devices/categories/{id}
     */
    public function update($id)
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(DeviceCategoryValidate::class)->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $category = $this->service->update($id, $data);
            return Result::success($category, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除分类
     * DELETE /api/devices/categories/{id}
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }
}
```

- [ ] **Step 2: Test API endpoint**

Run: `docker exec -it cmms-php bash -c "curl -X GET http://localhost/api/devices/categories -H 'Authorization: Bearer YOUR_TOKEN'"`

Expected: JSON response with categories list

- [ ] **Step 3: Commit**

```bash
git add backend/app/controller/DeviceCategoryController.php
git commit -m "feat(controller): create DeviceCategoryController"
```

---

## Task 6: Routes

Add API routes to `backend/route/api.php` following existing pattern (see lines 29-36 in existing file).

**Files:**
- Modify: `backend/route/api.php`

- [ ] **Step 1: Add device management routes**

Add after the departments group (around line 37):

```php
    // 设备管理
    Route::group('devices', function () {
        Route::get('/', 'DeviceController/index');
        Route::get('/:id', 'DeviceController/read');
        Route::post('/', 'DeviceController/save');
        Route::put('/:id', 'DeviceController/update');
        Route::delete('/:id', 'DeviceController/delete');
        Route::get('/:id/history', 'DeviceController/history');
    })->middleware(['PermissionCheck']);

    // 设备分类管理
    Route::group('devices/categories', function () {
        Route::get('/', 'DeviceCategoryController/index');
        Route::post('/', 'DeviceCategoryController/save');
        Route::put('/:id', 'DeviceCategoryController/update');
        Route::delete('/:id', 'DeviceCategoryController/delete');
    })->middleware(['PermissionCheck']);
```

- [ ] **Step 2: Verify route registration**

Run: `php think route:list`

Expected: Output showing all device and device category routes

- [ ] **Step 3: Commit**

```bash
git add backend/route/api.php
git commit -m "feat(routes): add device management API routes"
```

---

## Task 7: Seed Device Permissions

Add device permissions to admin user and create permission seeder.

### Task 7.1: Create DevicePermissionSeeder

**Files:**
- Create: `backend/database/seeders/DevicePermissionSeeder.php`

- [ ] **Step 1: Create seeder**

```php
<?php

use think\migration\Seeder;

class DevicePermissionSeeder extends Seeder
{
    public function run()
    {
        $this->table('permissions')->insert([
            [
                'user_id' => 1,
                'module' => 'devices',
                'actions' => json_encode(['view', 'create', 'update', 'delete']),
                'created_at' => date('Y-m-d H:i:s'),
            ]
        ])->saveData();
    }
}
```

- [ ] **Step 2: Run seeder**

Run: `php think seed:run`

Expected: Output showing seeder executed successfully

- [ ] **Step 3: Verify permissions in database**

Run: `mysql -u root -p123456 -e "SELECT * FROM cmms.permissions WHERE module='devices';"`

Expected: One row with module='devices' and actions='["view","create","update","delete"]'

- [ ] **Step 4: Commit**

```bash
git add backend/database/seeders/DevicePermissionSeeder.php
git commit -m "feat(seeder): add device permissions for admin"
```

---

## Task 8: Integration Testing

Test the complete API flow with sample data.

### Task 8.1: Create Sample Data Test

**Files:**
- Create: `backend/tests/test_device_api.sh` (test script)

- [ ] **Step 1: Create test script**

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api"
TOKEN="YOUR_ADMIN_TOKEN"  # Replace with actual token from login

echo "=== Testing Device Management API ==="

# 1. List categories
echo -e "\n1. Get categories:"
curl -s -X GET "$BASE_URL/devices/categories" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 2. Create category
echo -e "\n2. Create category:"
curl -s -X POST "$BASE_URL/devices/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"泵类","icon":"pump"}' | jq '.'

# 3. Create device
echo -e "\n3. Create device:"
curl -s -X POST "$BASE_URL/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_code":"DEV001",
    "device_name":"离心泵",
    "model":"IS50-32-125",
    "category_id":1,
    "department_id":1,
    "location":"车间A区",
    "purchase_date":"2024-01-15",
    "warranty_date":"2026-01-15",
    "status":1
  }' | jq '.'

# 4. List devices
echo -e "\n4. List devices:"
curl -s -X GET "$BASE_URL/devices?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Get device detail
echo -e "\n5. Get device detail:"
curl -s -X GET "$BASE_URL/devices/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Update device
echo -e "\n6. Update device:"
curl -s -X PUT "$BASE_URL/devices/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location":"车间B区"}' | jq '.'

# 7. Get device history
echo -e "\n7. Get device history:"
curl -s -X GET "$BASE_URL/devices/1/history" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 8. Test validation - duplicate device_code
echo -e "\n8. Test validation (duplicate code):"
curl -s -X POST "$BASE_URL/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_code":"DEV001",
    "device_name":"Duplicate Device",
    "category_id":1,
    "department_id":1
  }' | jq '.'

# 9. Test validation - warranty before purchase
echo -e "\n9. Test validation (warranty date):"
curl -s -X POST "$BASE_URL/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_code":"DEV002",
    "device_name":"Test Device",
    "category_id":1,
    "department_id":1,
    "purchase_date":"2026-01-01",
    "warranty_date":"2025-01-01"
  }' | jq '.'

echo -e "\n=== Tests Complete ==="
```

- [ ] **Step 2: Make script executable**

Run: `chmod +x backend/tests/test_device_api.sh`

- [ ] **Step 3: Run tests**

Run: `cd backend && ./tests/test_device_api.sh`

Expected: All API calls return valid JSON responses

- [ ] **Step 4: Commit**

```bash
git add backend/tests/test_device_api.sh
git commit -m "test: add device API integration test script"
```

---

## Task 9: Documentation

Update API documentation.

### Task 9.1: Update API Documentation

**Files:**
- Modify: `docs/api/phase2-device-management.md`

- [ ] **Step 1: Create API documentation**

```markdown
# Device Management API

## Base URL
```
http://your-domain/api
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer {access_token}
```

## Permissions
- `devices:view` - View devices and categories
- `devices:create` - Create devices and categories
- `devices:update` - Update devices and categories
- `devices:delete` - Delete devices and categories

---

## Device Endpoints

### List Devices
```http
GET /api/devices?page=1&limit=20&category_id=1&department_id=1&status=1&keyword=pump
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `category_id` (optional): Filter by category
- `department_id` (optional): Filter by department
- `status` (optional): Filter by status (1=正常, 2=维修中, 3=停用)
- `keyword` (optional): Search in device_name or device_code

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Get Device Detail
```http
GET /api/devices/{id}
```

### Create Device
```http
POST /api/devices
Content-Type: application/json

{
  "device_code": "DEV001",
  "device_name": "离心泵",
  "model": "IS50-32-125",
  "category_id": 1,
  "department_id": 1,
  "location": "车间A区",
  "purchase_date": "2024-01-15",
  "warranty_date": "2026-01-15",
  "status": 1
}
```

### Update Device
```http
PUT /api/devices/{id}
Content-Type: application/json

{
  "location": "车间B区",
  "status": 2
}
```

### Delete Device
```http
DELETE /api/devices/{id}
```

### Get Device History
```http
GET /api/devices/{id}/history
```

---

## Category Endpoints

### List Categories
```http
GET /api/devices/categories
```

### Create Category
```http
POST /api/devices/categories
Content-Type: application/json

{
  "name": "泵类",
  "icon": "pump"
}
```

### Update Category
```http
PUT /api/devices/categories/{id}
Content-Type: application/json

{
  "name": "水泵",
  "icon": "water-pump"
}
```

### Delete Category
```http
DELETE /api/devices/categories/{id}
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/api/phase2-device-management.md
git commit -m "docs: add Phase 2 device management API documentation"
```

---

## Task 10: Final Verification

Verify all components work together.

### Task 10.1: Complete Integration Check

- [ ] **Step 1: Verify database schema**

Run: `mysql -u root -p123456 -e "SHOW TABLES FROM cmms; DESCRIBE cmms.devices; DESCRIBE cmms.device_categories;"`

Expected: Both tables exist with correct structure

- [ ] **Step 2: Verify model relationships**

Run: `php think`

```php
use app\model\Device;
$device = Device::with(['category', 'department'])->find(1);
echo "Device: " . $device->device_name . "\n";
echo "Category: " . $device->category->name . "\n";
echo "Department: " . $device->device_name . "\n";
```

Expected: No errors, relationships work

- [ ] **Step 3: Verify all endpoints**

Run: `cd backend && ./tests/test_device_api.sh`

Expected: All tests pass

- [ ] **Step 4: Verify permissions**

Test with non-admin user (without device permissions):
```bash
curl -X GET "http://localhost/api/devices" \
  -H "Authorization: Bearer NON_ADMIN_TOKEN"
```

Expected: 403 Forbidden

- [ ] **Step 5: Check code quality**

Verify:
- All models use proper relationships
- All services handle exceptions
- All controllers use Result class
- All validators have proper rules and messages
- No hardcoded values
- Consistent naming conventions

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: final adjustments and verification"
```

---

## Summary

This plan creates:
- 2 database migrations
- 2 models with relationships
- 2 validators with cross-field validation
- 2 service layers with business logic
- 2 controllers with RESTful endpoints
- 11 API endpoints (6 device + 4 category + 1 history)
- 1 permission seeder
- Integration tests
- API documentation

**Total Tasks:** 10
**Estimated Time:** 4-6 hours
**Dependencies:** Phase 1 must be complete
