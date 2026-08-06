# 维修全流程管理系统(CMMS) 技术设计文档

**项目名称**：维修全流程管理系统
**文档版本**：v1.1
**创建日期**：2026-03-19
**更新日期**：2026-03-19
**设计师**：Claude Sonnet 4.6

---

## 1. 项目概述

### 1.1 项目目标
构建一个企业级计算机化维护管理系统(CMMS)，完全复刻PDF需求中的13个功能模块，实现维修全流程数字化管理。

### 1.2 核心功能模块
1. 维修工单管理
2. 设备资产管理
3. 维修人员管理
4. 巡检管理
5. 预防性维护
6. 计划性维护
7. 备件库存管理
8. 供应商管理
9. 故障知识库
10. 成本分析
11. 报表中心
12. 通知功能
13. 移动端APP

### 1.3 目标用户规模
- 设备数量：50-200台
- 用户数量：10-50人
- 部署方式：单服务器部署

### 1.4 用户角色体系
- **系统管理员**：全部权限（配置、审批、报表）
- **部门/设备管理员**：管理本部门设备和工单
- **维修工程师/师傅**：接单、执行、填写记录
- **普通报修用户**：发起报修、查看进度

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端层                              │
├──────────────────┬──────────────────────────────────────┤
│  网页端           │  小程序端                           │
│  Vue 3 +          │  uni-app (Vue 3)                   │
│  Element Plus     │  微信 + 支付宝                      │
│  管理后台         │  师傅端 + 用户端                    │
└──────────────────┴──────────────────────────────────────┘
                        ↓ HTTPS + JWT
┌─────────────────────────────────────────────────────────┐
│                    API网关层                            │
│              Nginx (反向代理 + 负载均衡)                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    应用层                              │
│              ThinkPHP 8.1 应用服务                     │
├─────────────────────────────────────────────────────────┤
│  工单模块 | 设备模块 | 库存模块 | 报表模块 | 用户模块  │
│  巡检模块 | 保养模块 | 知识库 | 供应商 | 通知          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    数据层                              │
├──────────────────┬──────────────────────────────────────┤
│  MySQL 8.0       │  Redis 7                            │
│  业务数据存储    │  缓存 + 会话 + 队列                 │
└──────────────────┴──────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    外部服务                            │
│  OSS云存储  │  短信服务  │  邮件服务  │  微信支付   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

#### 后端技术栈
| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 核心框架 | ThinkPHP 8.1 | 开发效率高、文档完善、适合中小型系统 |
| ORM | ThinkORM | 数据库操作封装 |
| 认证 | JWT + 中间件 | 无状态认证 |
| 实时通信 | Workerman | WebSocket服务 |
| 数据库 | MySQL 8.0 | 关系型数据库 |
| 缓存 | Redis 7.0 | 会话、缓存、队列 |

#### 前端技术栈（网页端）
| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Vue 3 | 渐进式框架 |
| UI组件 | Element Plus | 企业级组件库 |
| 状态管理 | Pinia | 官方推荐状态管理 |
| 路由 | Vue Router | 单页应用路由 |
| 图表 | ECharts | 数据可视化 |

#### 前端技术栈（小程序端）
| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 跨端框架 | uni-app (Vue 3) | 一套代码多端运行 |
| UI组件 | uView UI 2.0 | uni-app组件库 |
| 状态管理 | Pinia | 与网页端统一 |
| 平台 | 微信 + 支付宝小程序 | 覆盖主流平台 |

---

## 3. 数据库设计

### 3.1 核心数据表详细定义

#### 用户与权限
```sql
-- 用户表
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码hash',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    role_type TINYINT NOT NULL DEFAULT 4 COMMENT '角色:1管理员 2部门管理 3工程师 4普通用户',
    department_id BIGINT UNSIGNED DEFAULT NULL COMMENT '部门ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1正常 0禁用',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_department (department_id),
    INDEX idx_role (role_type),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 部门表
CREATE TABLE departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '部门ID',
    name VARCHAR(100) NOT NULL COMMENT '部门名称',
    parent_id BIGINT UNSIGNED DEFAULT NULL COMMENT '父部门ID',
    manager_id BIGINT UNSIGNED DEFAULT NULL COMMENT '负责人ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1正常 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 权限表
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    module VARCHAR(50) NOT NULL COMMENT '模块名',
    actions JSON NOT NULL COMMENT '操作权限["create","read","update","delete"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_module (user_id, module),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';
```

#### 设备资产
```sql
-- 设备表
CREATE TABLE devices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
    device_code VARCHAR(50) NOT NULL UNIQUE COMMENT '设备编号',
    device_name VARCHAR(200) NOT NULL COMMENT '设备名称',
    category_id BIGINT UNSIGNED NOT NULL COMMENT '设备分类ID',
    department_id BIGINT UNSIGNED NOT NULL COMMENT '所属部门ID',
    location VARCHAR(200) DEFAULT NULL COMMENT '位置描述',
    manufacturer VARCHAR(100) DEFAULT NULL COMMENT '厂家',
    model VARCHAR(100) DEFAULT NULL COMMENT '型号',
    serial_number VARCHAR(100) DEFAULT NULL COMMENT '序列号',
    purchase_date DATE DEFAULT NULL COMMENT '购置日期',
    warranty_date DATE DEFAULT NULL COMMENT '保修期至',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1正常 2维修中 3停用',
    qr_code VARCHAR(255) DEFAULT NULL COMMENT '二维码URL',
    description TEXT COMMENT '设备描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category_id),
    INDEX idx_department (department_id),
    INDEX idx_code (device_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- 设备分类表
CREATE TABLE device_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    parent_id BIGINT UNSIGNED DEFAULT NULL COMMENT '父分类ID',
    icon VARCHAR(255) DEFAULT NULL COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备分类表';
```

#### 维修工单
```sql
-- 工单表
CREATE TABLE work_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '工单ID',
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '工单号',
    device_id BIGINT UNSIGNED NOT NULL COMMENT '设备ID',
    reporter_id BIGINT UNSIGNED NOT NULL COMMENT '报修人ID',
    assigned_to BIGINT UNSIGNED DEFAULT NULL COMMENT '指派维修人ID',
    fault_type VARCHAR(100) DEFAULT NULL COMMENT '故障类型',
    fault_description TEXT NOT NULL COMMENT '故障描述',
    priority TINYINT NOT NULL DEFAULT 2 COMMENT '优先级:1低 2中 3高 4紧急',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待派单 1已派单 2维修中 3待验收 4已完成 5已关闭',
    start_time TIMESTAMP NULL COMMENT '开始维修时间',
    complete_time TIMESTAMP NULL COMMENT '完成时间',
    repair_record TEXT COMMENT '维修记录',
    repair_images JSON COMMENT '维修照片["url1","url2"]',
    used_parts JSON COMMENT '使用配件[{"partId":1,"quantity":2}]',
    cost_parts DECIMAL(10,2) DEFAULT 0.00 COMMENT '配件成本',
    cost_labor DECIMAL(10,2) DEFAULT 0.00 COMMENT '人工成本',
    total_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '总成本',
    reporter_rating TINYINT DEFAULT NULL COMMENT '报修人评分(1-5)',
    reporter_feedback TEXT COMMENT '报修人反馈',
    version INT DEFAULT 1 COMMENT '版本号(乐观锁)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_device (device_id),
    INDEX idx_reporter (reporter_id),
    INDEX idx_assigned (assigned_to),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单表';

-- 工单日志表
CREATE TABLE work_order_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    order_id BIGINT UNSIGNED NOT NULL COMMENT '工单ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型:created/assigned/accepted/started/completed/verified/closed',
    operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作人ID',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_order (order_id),
    INDEX idx_operator (operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单日志表';
```

#### 备件库存
```sql
-- 配件表
CREATE TABLE spare_parts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '配件ID',
    part_code VARCHAR(50) NOT NULL UNIQUE COMMENT '配件编号',
    part_name VARCHAR(200) NOT NULL COMMENT '配件名称',
    category_id BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
    specification VARCHAR(200) DEFAULT NULL COMMENT '规格型号',
    unit VARCHAR(20) DEFAULT NULL COMMENT '单位',
    supplier_id BIGINT UNSIGNED DEFAULT NULL COMMENT '供应商ID',
    purchase_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '进货价',
    sale_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '销售价',
    stock_quantity INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    min_stock INT NOT NULL DEFAULT 0 COMMENT '最低库存预警',
    warehouse_id BIGINT UNSIGNED DEFAULT NULL COMMENT '仓库ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1正常 0停用',
    description TEXT COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_code (part_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件表';

-- 库存记录表
CREATE TABLE stock_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    part_id BIGINT UNSIGNED NOT NULL COMMENT '配件ID',
    type TINYINT NOT NULL COMMENT '类型:1入库 2出库 3盘点',
    quantity INT NOT NULL COMMENT '数量',
    before_quantity INT NOT NULL COMMENT '变更前数量',
    after_quantity INT NOT NULL COMMENT '变更后数量',
    order_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联工单ID',
    operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作人ID',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_part (part_id),
    INDEX idx_order (order_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存记录表';
```

#### 巡检与保养
```sql
-- 巡检任务表
CREATE TABLE inspection_tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    task_name VARCHAR(200) NOT NULL COMMENT '任务名称',
    device_id BIGINT UNSIGNED NOT NULL COMMENT '设备ID',
    inspector_id BIGINT UNSIGNED NOT NULL COMMENT '巡检员ID',
    plan_time DATE NOT NULL COMMENT '计划日期',
    actual_time DATE DEFAULT NULL COMMENT '实际日期',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待执行 1进行中 2已完成 3已逾期',
    result TEXT COMMENT '巡检结果',
    images JSON COMMENT '照片["url1","url2"]',
    is_abnormal TINYINT DEFAULT 0 COMMENT '是否异常:0正常 1异常',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_device (device_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_plan_time (plan_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检任务表';

-- 保养计划表
CREATE TABLE maintenance_plans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '计划ID',
    plan_name VARCHAR(200) NOT NULL COMMENT '计划名称',
    device_id BIGINT UNSIGNED NOT NULL COMMENT '设备ID',
    type TINYINT NOT NULL COMMENT '类型:1预防性 2计划性',
    cycle_type VARCHAR(20) NOT NULL COMMENT '周期类型:day/week/month/year',
    cycle_value INT NOT NULL COMMENT '周期值',
    next_execute_time DATE NOT NULL COMMENT '下次执行时间',
    executor_id BIGINT UNSIGNED NOT NULL COMMENT '执行人ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1启用 0停用',
    last_execute_time DATE DEFAULT NULL COMMENT '上次执行时间',
    description TEXT COMMENT '保养内容描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_device (device_id),
    INDEX idx_executor (executor_id),
    INDEX idx_next_time (next_execute_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='保养计划表';

-- 保养记录表
CREATE TABLE maintenance_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    plan_id BIGINT UNSIGNED NOT NULL COMMENT '计划ID',
    device_id BIGINT UNSIGNED NOT NULL COMMENT '设备ID',
    executor_id BIGINT UNSIGNED NOT NULL COMMENT '执行人ID',
    execute_time DATE NOT NULL COMMENT '执行日期',
    content TEXT COMMENT '保养内容',
    images JSON COMMENT '照片',
    cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '费用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_plan (plan_id),
    INDEX idx_device (device_id),
    INDEX idx_executor (executor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='保养记录表';
```

#### 知识库与供应商
```sql
-- 故障知识库表
CREATE TABLE fault_knowledge (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '知识ID',
    fault_type VARCHAR(100) NOT NULL COMMENT '故障类型',
    fault_desc VARCHAR(500) NOT NULL COMMENT '故障描述',
    fault_reason TEXT COMMENT '故障原因',
    solution TEXT NOT NULL COMMENT '解决方案',
    device_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联设备ID',
    category_id BIGINT UNSIGNED DEFAULT NULL COMMENT '设备分类ID',
    views INT DEFAULT 0 COMMENT '浏览次数',
    useful_count INT DEFAULT 0 COMMENT '有用次数',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1发布 0草稿',
    created_by BIGINT UNSIGNED NOT NULL COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (fault_type),
    INDEX idx_device (device_id),
    FULLTEXT idx_search (fault_desc, fault_reason, solution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='故障知识库表';

-- 供应商表
CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '供应商ID',
    name VARCHAR(200) NOT NULL COMMENT '供应商名称',
    contact VARCHAR(50) DEFAULT NULL COMMENT '联系人',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    address VARCHAR(500) DEFAULT NULL COMMENT '地址',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    bank_name VARCHAR(100) DEFAULT NULL COMMENT '开户银行',
    bank_account VARCHAR(50) DEFAULT NULL COMMENT '银行账号',
    tax_number VARCHAR(50) DEFAULT NULL COMMENT '税号',
    credit_level TINYINT DEFAULT 3 COMMENT '信用等级:1-5',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1正常 0停用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商表';
```

#### 通知消息
```sql
-- 通知消息表
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '接收人ID',
    type VARCHAR(50) NOT NULL COMMENT '通知类型',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    related_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联ID(工单ID等)',
    is_read TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读:0未读 1已读',
    read_time TIMESTAMP NULL COMMENT '阅读时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知消息表';
```

#### 维修人员管理
```sql
-- 维修人员表(扩展用户表)
CREATE TABLE engineers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '工程师ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    skill_level TINYINT DEFAULT 3 COMMENT '技能等级:1初级 2中级 3高级 4专家',
    specialties JSON COMMENT '专长["空调","电气"]',
    work_years INT DEFAULT 0 COMMENT '工作年限',
    certification VARCHAR(200) DEFAULT NULL COMMENT '资质证书',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1在岗 2休假 3离职',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修人员表';

-- 排班表
CREATE TABLE schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '排班ID',
    engineer_id BIGINT UNSIGNED NOT NULL COMMENT '工程师ID',
    work_date DATE NOT NULL COMMENT '工作日期',
    shift_type VARCHAR(20) NOT NULL COMMENT '班次类型:morning/afternoon/night',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:1正常 2请假',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_engineer_date (engineer_id, work_date),
    INDEX idx_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='排班表';
```

#### 报表配置
```sql
-- 报表配置表
CREATE TABLE report_configs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    name VARCHAR(100) NOT NULL COMMENT '报表名称',
    type VARCHAR(50) NOT NULL COMMENT '报表类型:workorder/cost/device/engineer/parts',
    config JSON NOT NULL COMMENT '报表配置(时间范围、筛选条件等)',
    created_by BIGINT UNSIGNED NOT NULL COMMENT '创建人ID',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认:0否 1是',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报表配置表';
```

---

## 4. API接口设计

### 4.1 接口规范
- **基础URL**: `https://api.yourdomain.com/v1`
- **认证方式**: JWT Token (Header: `Authorization: Bearer {token}`)
- **响应格式**: JSON
- **请求方法**: RESTful (GET/POST/PUT/DELETE)

### 4.2 核心接口清单

#### 认证模块
```
POST   /auth/login              用户登录
POST   /auth/logout             用户登出
POST   /auth/refresh            刷新Token
GET    /auth/profile            获取个人信息
PUT    /auth/profile            更新个人信息
POST   /auth/password           修改密码
```

#### 设备管理
```
GET    /devices                 设备列表
GET    /devices/{id}            设备详情
POST   /devices                 创建设备
PUT    /devices/{id}            更新设备
DELETE /devices/{id}            删除设备
GET    /devices/categories      设备分类列表
GET    /devices/{id}/history    设备维修历史
POST   /devices/{id}/qrcode     生成设备二维码
```

#### 维修工单
```
GET    /workorders               工单列表
GET    /workorders/{id}          工单详情
POST   /workorders               创建工单
PUT    /workorders/{id}          更新工单
DELETE /workorders/{id}          删除工单
POST   /workorders/{id}/assign   指派维修人
POST   /workorders/{id}/accept   维修人接单
POST   /workorders/{id}/start    开始维修
POST   /workorders/{id}/complete 完成维修
POST   /workorders/{id}/verify   验收工单
POST   /workorders/{id}/close    关闭工单
GET    /workorders/my            我的工单
GET    /workorders/statistics    工单统计
```

#### 备件库存
```
GET    /parts                    配件列表
GET    /parts/{id}               配件详情
POST   /parts                    创建配件
PUT    /parts/{id}               更新配件
DELETE /parts/{id}               删除配件
GET    /parts/alerts             库存预警列表
POST   /parts/{id}/in            配件入库
POST   /parts/{id}/out           配件出库
GET    /parts/records            出入库记录
```

#### 巡检管理
```
GET    /inspections              巡检任务列表
GET    /inspections/{id}         巡检任务详情
POST   /inspections              创建巡检任务
PUT    /inspections/{id}         更新巡检任务
DELETE /inspections/{id}         删除巡检任务
POST   /inspections/{id}/execute 执行巡检
GET    /inspections/my           我的巡检任务
GET    /inspections/overdue      逾期任务列表
```

#### 保养管理
```
GET    /maintenance/plans        保养计划列表
GET    /maintenance/plans/{id}   保养计划详情
POST   /maintenance/plans        创建保养计划
PUT    /maintenance/plans/{id}   更新保养计划
DELETE /maintenance/plans/{id}   删除保养计划
POST   /maintenance/plans/{id}/execute 执行保养
GET    /maintenance/history      保养历史
GET    /maintenance/due          待执行保养列表
```

#### 知识库
```
GET    /knowledge                知识库列表
GET    /knowledge/{id}           知识详情
POST   /knowledge                创建知识
PUT    /knowledge/{id}           更新知识
DELETE /knowledge/{id}           删除知识
GET    /knowledge/search         搜索知识
POST   /knowledge/{id}/useful    标记有用
```

#### 供应商
```
GET    /suppliers                供应商列表
GET    /suppliers/{id}           供应商详情
POST   /suppliers                创建供应商
PUT    /suppliers/{id}           更新供应商
DELETE /suppliers/{id}           删除供应商
```

#### 维修人员
```
GET    /engineers                维修人员列表
GET    /engineers/{id}           维修人员详情
POST   /engineers                创建维修人员
PUT    /engineers/{id}           更新维修人员
DELETE /engineers/{id}           删除维修人员
GET    /engineers/{id}/performance 绩效统计
GET    /schedules                排班列表
POST   /schedules                创建排班
```

#### 报表中心
```
GET    /reports/workorder        工单报表
GET    /reports/cost             成本报表
GET    /reports/device           设备故障分析
GET    /reports/engineer         维修工绩效
GET    /reports/parts            配件消耗统计
GET    /reports/export           导出报表(Excel)
POST   /reports/custom           自定义报表
GET    /reports/configs          报表配置列表
```

#### 通知消息
```
GET    /notifications            通知列表
GET    /notifications/{id}       通知详情
PUT    /notifications/{id}/read  标记已读
PUT   /notifications/read-all   全部已读
GET    /notifications/unread-count 未读数量
```

#### 系统管理
```
GET    /users                    用户列表
POST   /users                    创建用户
PUT    /users/{id}               更新用户
DELETE /users/{id}               删除用户
GET    /departments              部门列表
POST   /departments              创建部门
PUT    /departments/{id}         更新部门
DELETE /departments/{id}         删除部门
GET    /settings                 系统设置
PUT    /settings                 更新系统设置
POST   /upload                   文件上传
```

### 4.3 请求/响应示例

#### 创建工单请求示例
```json
POST /workorders
{
  "device_id": 123,
  "fault_type": "制冷故障",
  "fault_description": "空调制冷效果明显下降",
  "priority": 3,
  "images": ["https://oss.example.com/image1.jpg"]
}
```

#### 工单列表响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "order_no": "WO20260319001",
        "device_name": "中央空调A机组",
        "fault_description": "制冷效果差",
        "priority": 3,
        "status": 1,
        "created_at": "2026-03-19 10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

### 4.4 错误码定义
```json
{
  "200": "成功",
  "400": "参数错误",
  "401": "未授权/Token过期",
  "403": "无权限",
  "404": "资源不存在",
  "422": "验证失败",
  "500": "服务器错误",
  "1001": "设备不存在",
  "1002": "库存不足",
  "1003": "工单状态不允许此操作"
}
```
```json
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 5. 前端页面结构

### 5.1 网页端（管理后台）

**主菜单结构**：
- 首页仪表盘
- 维修工单
- 设备资产
- 维修人员
- 巡检管理
- 保养管理
- 备件库存
- 故障知识库
- 报表中心
- 系统管理

### 5.2 小程序端

#### 用户端小程序
**Tabbar**: 首页 | 报修 | 记录 | 我的

**核心功能**：
- 扫码报修（调用摄像头扫描设备二维码）
- 选择设备报修
- 查看报修进度
- 工单验收

#### 师傅端小程序
**Tabbar**: 工作台 | 任务 | 我的

**核心功能**：
- 查看待办任务
- 一键接单/拒单
- 填写维修记录
- 拍照上传维修前后对比
- 联系报修人
- 巡检任务执行
- 保养任务执行

### 5.3 扫码报修流程
```
用户点击"扫码报修"
  ↓
调用 uni.scanCode() 扫描设备二维码
  ↓
获取设备ID，自动填充设备信息
  ↓
用户填写故障详情、上传照片
  ↓
提交工单
  ↓
系统派单给维修工
  ↓
维修工小程序收到推送通知
```

---

## 6. 数据流与状态管理

### 6.1 网页端状态管理（Pinia）

```javascript
// Store 模块划分
auth Store (认证状态)
  └── state: { token, userInfo, permissions }

device Store (设备数据)
  └── state: { deviceList, currentDevice, categories }

workorder Store (工单数据)
  └── state: { orderList, currentOrder, statistics }

inventory Store (库存数据)
  └── state: { partsList, stockAlerts }

notification Store (通知消息)
  └── state: { unreadCount, messageList }
```

### 6.2 小程序端状态管理

**用户端 Store**：
- auth: { token, userInfo }
- myOrders: { list, statusCount }
- devices: { commonDevices }

**师傅端 Store**：
- auth: { token, engineerInfo }
- tasks: { todoList, inProgressList, completedList }
- inspection: { taskList, currentTask }
- maintenance: { planList, history }

### 6.3 实时通信流程

**WebSocket 推送场景**：
- workorder.created - 新工单通知
- workorder.assigned - 工单已派送
- workorder.accepted - 师傅接单通知
- workorder.completed - 维修完成通知
- inspection.assigned - 新巡检任务
- stock.alert - 库存预警

### 6.4 数据同步策略

1. **乐观锁机制**：防止并发修改冲突
2. **数据版本控制**：响应头携带 data-version
3. **离线数据缓存**：小程序使用 uni.setStorageSync
4. **轮询兜底机制**：WebSocket断线时启用

---

## 7. 部署架构

### 7.1 生产环境配置

**服务器规格**：
- 阿里云/腾讯云 4核8G
- 操作系统：Ubuntu 22.04 LTS

**软件栈**：
- Nginx 1.24 (Web服务器 + 反向代理)
- PHP 8.2 + FPM (后端运行环境)
- MySQL 8.0 (关系型数据库)
- Redis 7.0 (缓存 + 队列 + 会话)
- Workerman (WebSocket 服务)
- Supervisor (进程守护)

**外部服务**：
- OSS云存储（阿里云OSS / 腾讯云COS）
- 短信服务（阿里云SMS / 腾讯云SMS）
- 微信小程序 + 支付宝小程序

### 7.2 目录结构

```
project/
├─ backend/                    # 后端项目
├─ frontend-web/              # 网页端管理后台
├─ frontend-miniprogram/      # 小程序端
│  ├─ user-mini/              # 用户端小程序
│  └─ engineer-mini/          # 师傅端小程序
├─ docs/                      # 项目文档
└─ deploy/                    # 部署相关
```

---

## 8. 开发计划

### 8.1 开发周期：3-4个月

**第一阶段：基础架构搭建（2周）**
- 后端框架初始化 + 数据库设计
- 前端项目脚手架 + UI框架集成
- JWT认证体系 + 权限中间件
- WebSocket实时通信搭建

**第二阶段：核心功能开发（6周）**
- 设备资产管理模块
- 维修工单全流程
- 用户管理 + 角色权限体系
- 网页端管理后台基础功能

**第三阶段：小程序开发（4周）**
- 用户端小程序（报修、跟踪）
- 师傅端小程序（接单、维修）

**第四阶段：扩展功能开发（4周）**
- 巡检管理
- 预防性/计划性保养
- 备件库存管理
- 故障知识库
- 供应商管理

**第五阶段：报表与数据分析（2周）**
- 各类统计报表
- 成本分析
- 报表导出功能

**第六阶段：测试与优化（2周）**
- 功能测试
- 性能优化
- 安全加固
- Bug修复

**第七阶段：部署上线（1周）**
- 生产环境部署
- 小程序审核发布

---

## 9. 技术难点与解决方案

### 9.1 核心技术挑战

| 技术难点 | 解决方案 | 风险等级 |
|---------|---------|---------|
| 多端数据实时同步 | WebSocket + 版本控制 | 高 |
| 高并发工单提交 | Redis队列 + 异步处理 | 中 |
| 图片/文件上传 | OSS云存储 + CDN加速 | 低 |
| 二维码扫描报修 | uni.scanCode + 设备绑定 | 低 |
| 复杂权限控制 | RBAC模型 + 中间件 | 中 |
| 报表大数据查询 | MySQL索引 + 分页 + 缓存 | 中 |
| 消息推送可靠性 | WebSocket + 轮询兜底 | 高 |
| 小程序性能优化 | 分包加载 + 图片懒加载 | 中 |

### 9.2 详细技术风险分析

#### 9.2.1 ThinkPHP + Workerman 集成风险
**问题描述**：ThinkPHP 8.1 与 Workerman WebSocket 服务集成存在复杂性，需要解决进程管理和数据共享问题。

**解决方案**：
- Workerman 作为独立进程运行，通过 Supervisor 守护
- 使用 Redis 作为中间件实现 ThinkPHP 与 Workerman 的消息通信
- WebSocket 服务使用独立的端口（2346），Nginx 配置反向代理
- 共享 Session 和 JWT 验证逻辑

**验证方案**：
- 第一阶段搭建 POC 验证集成可行性
- 压力测试验证并发连接稳定性

#### 9.2.2 小程序 WebSocket 限制
**问题描述**：微信小程序对 WebSocket 有特定限制（域名白名单、连接数限制、长时间连接可能被断开）。

**解决方案**：
- 配置小程序 WebSocket 域名白名单
- 实现心跳保活机制（每30秒发送 ping）
- 断线自动重连机制
- 轮询兜底：WebSocket 断开时自动切换为 30 秒轮询

**离线处理策略**：
- 关键数据本地缓存（uni.setStorageSync）
- 离线操作记录队列，联网后同步
- 冲突解决：以服务器数据为准，本地数据作为参考

#### 9.2.3 多端数据一致性保障
**问题描述**：网页端、用户小程序、师傅小程序同时操作同一工单可能导致数据冲突。

**解决方案**：
- 乐观锁机制：工单表增加 version 字段
- API 请求携带 version，后端校验版本
- 冲突时返回 409 错误，前端提示用户刷新
- WebSocket 推送数据变更通知，其他端自动更新

#### 9.2.4 数据备份与恢复
**问题描述**：生产环境需要可靠的数据备份和灾难恢复机制。

**解决方案**：
- MySQL 每日全量备份（凌晨 2 点执行）
- 保留 30 天备份文件
- 备份文件上传至 OSS 存储
- 每月进行一次恢复演练
- RPO（恢复点目标）：≤ 24 小时
- RTO（恢复时间目标）：≤ 4 小时

### 9.3 性能优化策略

#### 数据库优化
- 热点数据索引优化（工单状态、设备查询）
- 分页查询避免 SELECT *
- 报表统计使用预聚合表
- 慢查询日志监控（阈值 100ms）

#### 缓存策略
- 设备列表缓存 5 分钟
- 用户信息缓存 30 分钟
- 字典数据（分类、部门）缓存 1 小时
- 工单统计数据缓存 10 分钟

#### 前端优化
- 路由懒加载
- 图片压缩和 CDN 加速
- 大列表虚拟滚动
- 防抖节流优化频繁操作

---

## 10. 性能指标与SLA

### 10.1 性能要求
| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| 并发用户 | 50+ 在线用户 | 同时在线 Session 数 |
| API 响应时间 | P50 < 100ms, P95 < 200ms | APM 监控 |
| 页面加载时间 | 首屏 < 2 秒 | 浏览器性能 API |
| WebSocket 连接稳定性 | 99%+ 心跳成功率 | 服务端日志 |
| 小程序启动时间 | 冷启动 < 3 秒 | 小程序性能监控 |

### 10.2 数据容量
| 项目 | 容量 | 说明 |
|------|------|------|
| 设备数量 | 200+ 台 | 单实例支持 |
| 用户数量 | 50+ 人 | 同时使用 |
| 工单记录 | 10000+ 条 | 历史数据保留 |
| 月均工单 | 500+ 条 | 正常业务量 |
| 图片存储 | 10GB+ 年增长 | OSS 存储 |

### 10.3 可用性 SLA
| 指标 | 目标 | 说明 |
|------|------|------|
| 系统可用性 | 99.5% | 月度 |
| 计划内停机 | 每月 < 4 小时 | 维护窗口 |
| 数据持久性 | 99.99% | OSS 存储 |
| 备份成功率 | 100% | 每日备份 |
| 灾难恢复时间 | < 4 小时 | RTO |

### 10.4 监控指标
- API 成功率、错误率
- 数据库连接数、慢查询
- Redis 内存使用、命中率
- WebSocket 连接数、消息吞吐
- 服务器 CPU、内存、磁盘使用率

---

## 11. 安全设计

### 11.1 认证与授权
| 机制 | 实现 | 说明 |
|------|------|------|
| 用户认证 | JWT Token | 无状态认证，有效期 2 小时 |
| Token 刷新 | Refresh Token | 自动刷新机制 |
| 密码策略 | 8 位以上，必须含字母数字 | bcrypt hash 存储 |
| 会话超时 | 30 分钟无操作自动登出 | 前后端配合 |
| 多设备控制 | 单用户最多 3 个设备在线 | Redis 记录 |

### 11.2 权限控制
- **RBAC 模型**：用户-角色-权限三级体系
- **接口级权限**：每个 API 验证用户权限
- **数据级权限**：部门管理员只能查看本部门数据
- **操作审计**：关键操作记录日志（创建、删除、审批）

### 11.3 数据安全
| 措施 | 实现 |
|------|------|
| 传输加密 | HTTPS (TLS 1.3) |
| 密码存储 | bcrypt hash |
| 敏感数据 | 手机号脱敏显示 |
| SQL 注入防护 | ORM 参数化查询 |
| XSS 防护 | 前端数据转义 |
| CSRF 防护 | Token 验证 |

### 11.4 安全审计
- 登录日志（成功/失败）
- 操作日志（关键操作）
- 数据变更日志（工单状态、库存变更）
- 异常检测（频繁登录失败、异常请求）
- 日志保留 90 天

### 11.5 备份与容灾
- **数据库备份**：每日全量备份 + OSS 存储
- **配置备份**：代码仓库管理配置文件
- **容灾恢复**：定期演练恢复流程
- **应急预案**：安全事故响应流程

---

## 12. 附录

### 12.1 工单状态流转
```
待派单(0) → 已派单(1) → 维修中(2) → 待验收(3) → 已完成(4) → 已关闭(5)
```

### 12.2 优先级定义
```
1 - 低优先级
2 - 中优先级
3 - 高优先级
4 - 紧急
```

### 12.3 参考文档
- ThinkPHP 8.1 官方文档
- Vue 3 官方文档
- uni-app 官方文档
- Element Plus 官方文档

---

**文档结束**
