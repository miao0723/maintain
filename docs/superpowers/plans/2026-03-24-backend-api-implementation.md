# Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete RESTful backend API for CMMS system with 7 modules following the API design specification

**Architecture:** ThinkPHP 8.1 with MVC pattern, JWT authentication, RBAC authorization, MySQL database

**Tech Stack:** PHP 8.1+, ThinkPHP 8.1, MySQL 8.0+, Composer, firebase/php-jwt

---

## File Structure

### Important Architecture Decision

**This plan extends the EXISTING backend structure**, not creating a new v1 structure. All new controllers are placed at the root level (`backend/app/controller/`) alongside existing controllers.

**Controller Organization:**
- ✅ **All controllers at root level**: `backend/app/controller/{Name}Controller.php`
- ✅ **No v1/ subdirectory**: Routes map directly to controllers
- ✅ **Existing controllers unchanged**: WorkOrder, Device, SparePart, etc. remain as-is
- ✅ **New controllers added**: Role, Permission, Machine, Report, Payment, etc.

### New Files to Create

**Database Migrations:**
- `backend/database/migrations/002_create_new_tables.sql` - SQL migration for NEW tables only

**Controllers (NEW - at root level):**
- `backend/app/controller/RoleController.php` - Role management
- `backend/app/controller/PermissionController.php` - Permission management
- `backend/app/controller/PersonnelController.php` - Personnel management
- `backend/app/controller/SystemLogController.php` - System logs
- `backend/app/controller/SystemParamController.php` - System parameters
- `backend/app/controller/MachineCategoryController.php` - Machine categories
- `backend/app/controller/MachineController.php` - Machine management
- `backend/app/controller/TestReportController.php` - Test reports
- `backend/app/controller/RepairReportController.php` - Repair reports
- `backend/app/controller/RepairContractController.php` - Repair contracts
- `backend/app/controller/RepairReminderController.php` - Repair reminders
- `backend/app/controller/ExternalRepairController.php` - External repairs
- `backend/app/controller/RepairProgressController.php` - Repair progress
- `backend/app/controller/TransferController.php` - Transfer payments
- `backend/app/controller/OnlinePaymentController.php` - Online payments
- `backend/app/controller/InvoiceController.php` - Invoice management
- `backend/app/controller/StatisticsController.php` - Statistics endpoints
- `backend/app/controller/CaseController.php` - Success cases
- `backend/app/controller/CustomerServiceController.php` - Customer service
- `backend/app/controller/DouyinController.php` - Douyin content
- `backend/app/controller/PartnerController.php` - Partner management

**Models (NEW):**
- `backend/app/model/Role.php`
- `backend/app/model/Permission.php`
- `backend/app/model/RolePermission.php`
- `backend/app/model/Personnel.php`
- `backend/app/model/SystemLog.php`
- `backend/app/model/SystemParam.php`
- `backend/app/model/MachineCategory.php`
- `backend/app/model/Machine.php`
- `backend/app/model/Order.php`
- `backend/app/model/TestReport.php`
- `backend/app/model/RepairReport.php`
- `backend/app/model/RepairContract.php`
- `backend/app/model/RepairReminder.php`
- `backend/app/model/ExternalRepair.php`
- `backend/app/model/RepairProgress.php`
- `backend/app/model/Transfer.php`
- `backend/app/model/OnlinePayment.php`
- `backend/app/model/Invoice.php`
- `backend/app/model/Case.php`
- `backend/app/model/CustomerService.php`
- `backend/app/model/DouyinContent.php`
- `backend/app/model/Partner.php`

**Services:**
- Modify: `backend/app/service/JwtService.php` - Add refresh token methods

**Validators:**
- `backend/app/validate/UserValidate.php` - User validation rules
- `backend/app/validate/OrderValidate.php` - Order validation rules
- `backend/app/validate/PaymentValidate.php` - Payment validation rules

**Tests:**
- `backend/tests/Feature/AuthTest.php` - Authentication tests
- `backend/tests/Feature/UserTest.php` - User management tests
- `backend/tests/Feature/OrderWorkflowTest.php` - Order workflow tests
- `backend/tests/Feature/PaymentTest.php` - Payment module tests

**Documentation:**
- `docs/ARCHITECTURE-DECISION.md` - Architecture decision record
- `backend/docs/API-REFERENCE.md` - Complete API documentation
- `backend/docs/postman-collection.json` - Postman collection for testing
- `backend/docs/TESTING-GUIDE.md` - Testing instructions
- `backend/DEPLOYMENT-CHECKLIST.md` - Deployment checklist

### Files to Modify

- `backend/route/app.php` - Add new module routes with permission checking
- `backend/app/service/JwtService.php` - Add refresh token support
- `backend/app/controller/AuthController.php` - Add refresh endpoint
- `backend/.env` - Add JWT configuration
- `composer.json` - Add firebase/php-jwt dependency

### Files That Remain Unchanged

**Existing Controllers (do not modify):**
- `backend/app/controller/DeviceController.php` - Keep as-is
- `backend/app/controller/WorkOrderController.php` - Keep as-is
- `backend/app/controller/SparePartController.php` - Keep as-is
- `backend/app/controller/SupplierController.php` - Keep as-is
- `backend/app/controller/EngineerController.php` - Keep as-is
- `backend/app/controller/ScheduleController.php` - Keep as-is
- `backend/app/controller/InspectionTaskController.php` - Keep as-is
- `backend/app/controller/MaintenancePlanController.php` - Keep as-is
- All other existing controllers

**Existing Models (do not modify):**
- `backend/app/model/Device.php`
- `backend/app/model/WorkOrder.php`
- `backend/app/model/SparePart.php`
- All other existing models

**Existing Tables (do not drop or modify):**
- `devices` table
- `work_orders` table
- `spare_parts` table
- `suppliers` table
- All other existing tables
- `backend/app/controller/v1/PermissionController.php` - Permission management
- `backend/app/controller/v1/PersonnelController.php` - Personnel management
- `backend/app/controller/v1/OrganizationController.php` - Organization management
- `backend/app/controller/v1/SystemLogController.php` - System logs
- `backend/app/controller/v1/SystemParamController.php` - System parameters
- `backend/app/controller/v1/MachineCategoryController.php` - Machine categories
- `backend/app/controller/v1/MachineController.php` - Machine management
- `backend/app/controller/v1/OrderController.php` - Order management
- `backend/app/controller/v1/TestReportController.php` - Test reports
- `backend/app/controller/v1/MeasureReportController.php` - Measure/repair reports
- `backend/app/controller/v1/RepairContractController.php` - Repair contracts
- `backend/app/controller/v1/RepairReminderController.php` - Repair reminders
- `backend/app/controller/v1/ExternalRepairController.php` - External repairs
- `backend/app/controller/v1/RepairProgressController.php` - Repair progress
- `backend/app/controller/v1/TransferController.php` - Transfer payments
- `backend/app/controller/v1/OnlinePaymentController.php` - Online payments
- `backend/app/controller/v1/InvoiceController.php` - Invoice management
- `backend/app/controller/v1/PartController.php` - Parts management
- `backend/app/controller/v1/StatisticsController.php` - Statistics endpoints
- `backend/app/controller/v1/CaseController.php` - Success cases
- `backend/app/controller/v1/CustomerServiceController.php` - Customer service
- `backend/app/controller/v1/DouyinController.php` - Douyin content
- `backend/app/controller/v1/PartnerController.php` - Partner management

**Models:**
- `backend/app/model/Role.php`
- `backend/app/model/Permission.php`
- `backend/app/model/RolePermission.php`
- `backend/app/model/Personnel.php`
- `backend/app/model/Organization.php`
- `backend/app/model/SystemLog.php`
- `backend/app/model/SystemParam.php`
- `backend/app/model/MachineCategory.php`
- `backend/app/model/Machine.php`
- `backend/app/model/Order.php`
- `backend/app/model/TestReport.php`
- `backend/app/model/RepairReport.php`
- `backend/app/model/RepairContract.php`
- `backend/app/model/RepairReminder.php`
- `backend/app/model/ExternalRepair.php`
- `backend/app/model/RepairProgress.php`
- `backend/app/model/Transfer.php`
- `backend/app/model/OnlinePayment.php`
- `backend/app/model/Invoice.php`
- `backend/app/model/Part.php`
- `backend/app/model/Case.php`
- `backend/app/model/CustomerService.php`
- `backend/app/model/DouyinContent.php`
- `backend/app/model/Partner.php`

**Services:**
- `backend/app/service/v1/RoleService.php`
- `backend/app/service/v1/PermissionService.php`
- `backend/app/service/v1/MachineService.php`
- `backend/app/service/v1/OrderService.php`
- `backend/app/service/v1/PaymentService.php`
- `backend/app/service/v1/StatisticsService.php`
- `backend/app/service/v1/FileUploadService.php`

**Validators:**
- `backend/app/validate/v1/UserValidate.php`
- `backend/app/validate/v1/OrderValidate.php`
- `backend/app/validate/v1/PaymentValidate.php`

### Files to Modify

- `backend/route/app.php` - Add v1 API routes
- `backend/app/middleware/JwtAuth.php` - Enhance JWT authentication
- `backend/app/middleware/PermissionCheck.php` - Enhance permission checking
- `backend/.env` - Add database configuration
- `composer.json` - Add JWT library dependency

---

## Task 0: Architecture Assessment and Decision

**Goal:** Evaluate existing codebase and decide on implementation strategy

- [ ] **Step 1: Audit existing controllers**

```bash
ls -la backend/app/controller/
```

Document existing functionality:
- AuthController - Authentication (login, profile)
- UserController - User management
- DepartmentController - Department management
- DeviceController - Device management
- WorkOrderController - Work order management
- EngineerController - Engineer management
- ScheduleController - Schedule management
- InspectionTaskController - Inspection tasks
- MaintenancePlanController - Maintenance plans
- SparePartController - Spare parts
- SupplierController - Suppliers
- KnowledgeBaseController - Knowledge base
- NotificationController - Notifications
- CostAnalysisController - Cost analysis
- ReportController - Reports

- [ ] **Step 2: Map existing tables to new requirements**

Create mapping document:
```
Existing API Design      |  Existing Table    |  Decision
-------------------------|--------------------|------------------
Device                →  | devices            |  Keep as-is, enhance
WorkOrder             →  | work_orders        |  Keep as-is, enhance
SparePart             →  | spare_parts        |  Keep as-is, verify
Department            →  | departments        |  Rename to organizations
MachineCategory       →  | NEW TABLE          |  Create new
TestReport            →  | NEW TABLE          |  Create new
RepairReport          →  | NEW TABLE          |  Create new
RepairContract        →  | NEW TABLE          |  Create new
RepairReminder        →  | NEW TABLE          |  Create new
ExternalRepair        →  | NEW TABLE          |  Create new
RepairProgress        →  | NEW TABLE          |  Create new
Transfer              →  | NEW TABLE          |  Create new
OnlinePayment         →  | NEW TABLE          |  Create new
Invoice               →  | NEW TABLE          |  Create new
Case                  →  | NEW TABLE          |  Create new
CustomerService       →  | NEW TABLE          |  Create new
DouyinContent         →  | NEW TABLE          |  Create new
Partner               →  | NEW TABLE          |  Create new
Role                  →  | NEW TABLE          |  Create new
Permission            →  | NEW TABLE          |  Create new
RolePermission        →  | NEW TABLE          |  Create new
```

- [ ] **Step 3: Decision on strategy**

**DECISION: EXTEND EXISTING STRUCTURE**
- Keep existing controllers and tables
- Add new controllers for missing functionality
- Enhance existing controllers to match API design
- No data migration required
- Gradual rollout possible

- [ ] **Step 4: Document the decision**

Create `docs/ARCHITECTURE-DECISION.md`:
```markdown
# Architecture Decision: Extend Existing Backend

## Date: 2026-03-24

## Decision
Extend the existing backend structure rather than creating new v1 API.

## Rationale
1. Existing codebase has 12+ controllers with working functionality
2. No data migration required
3. Frontend can integrate gradually
4. Lower risk of breaking existing features
5. Faster implementation time

## Implementation Strategy
1. Keep existing tables: devices, work_orders, spare_parts, suppliers
2. Add new tables for: roles, permissions, reports, payments, marketing
3. Enhance existing controllers with missing endpoints
4. Add new controllers for new functionality
5. Maintain backward compatibility with existing API routes
```

- [ ] **Step 5: Update API routes to support both old and new**

Modify `backend/route/app.php` to add new routes alongside existing ones.

- [ ] **Step 6: Create backward compatibility strategy**

Create `docs/BACKWARD-COMPATIBILITY.md`:

```markdown
# Backward Compatibility Strategy

## Existing Routes (Must Not Break)

All existing routes continue working unchanged:
- /api/auth/login - Unchanged
- /api/users/* - Unchanged
- /api/devices/* - Unchanged
- /api/workorders/* - Unchanged
- /api/parts/* - Unchanged
- /api/suppliers/* - Unchanged
- All other existing routes - Unchanged

## New Routes (Additive Only)

New routes added without modifying existing:
- /api/roles/* - NEW
- /api/permissions/* - NEW
- /api/machines/* - NEW (separate from /devices)
- /api/orders/* - NEW (separate from /api/workorders)
- /api/test-reports/* - NEW
- /api/repair-reports/* - NEW
- /api/transfers/* - NEW
- /api/invoices/* - NEW
- /api/statistics/* - NEW
- /api/cases/* - NEW
- /api/customer-service/* - NEW
- /api/douyin/* - NEW
- /api/partners/* - NEW

## Migration Path

### Phase 1: Parallel Operation
- Frontend continues using existing API endpoints
- New endpoints available for testing
- No breaking changes

### Phase 2: Gradual Migration (Future)
- Frontend migrates to new endpoints one module at a time
- Old and new endpoints operate in parallel
- Feature flags control which endpoints are used
```

- [ ] **Step 7: Commit**

```bash
git add docs/ARCHITECTURE-DECISION.md docs/BACKWARD-COMPATIBILITY.md
git commit -m "docs: document architecture decision and backward compatibility strategy"
```

---

## Task 1: Project Setup and Dependencies

**Files:**
- Modify: `backend/composer.json`
- Modify: `backend/.env`
- Create: `backend/database/migrations/`

- [ ] **Step 1: Install JWT library**

```bash
cd backend
composer require firebase/php-jwt
```

Expected: Package installed successfully

- [ ] **Step 2: Configure environment**

Create `.env` file:
```env
APP_DEBUG = true

DATABASE_TYPE = mysql
DATABASE_HOSTNAME = 127.0.0.1
DATABASE_DATABASE = cmms_db
DATABASE_USERNAME = root
DATABASE_PASSWORD = your_password
DATABASE_HOSTPORT = 3306
DATABASE_CHARSET = utf8mb4
DATABASE_PREFIX =

JWT_SECRET = your_secret_key_change_this_in_production
JWT_ALGORITHM = HS256
JWT_ISSUER = cmms_api
JWT_AUDIENCE = cmms_web
```

- [ ] **Step 3: Create migration directories**

```bash
mkdir -p backend/database/migrations
mkdir -p backend/database/seeds
```

- [ ] **Step 4: Commit**

```bash
git add backend/composer.json backend/composer.lock backend/.env backend/database/
git commit -m "feat: setup project dependencies and configuration"
```

---

## Task 2: Database Schema Creation (NEW TABLES ONLY)

**IMPORTANT:** This task creates ONLY NEW tables. Existing tables (devices, work_orders, spare_parts, suppliers, departments) remain untouched.

**Files:**
- Create: `backend/database/migrations/002_create_new_tables.sql`

- [ ] **Step 1: Write migration SQL file for NEW tables**

Create `backend/database/migrations/002_create_new_tables.sql`:

```sql
-- ============================================
-- CMMS Database Schema - NEW Tables Only
-- ============================================
-- This migration adds NEW tables for features not in the existing system
-- Existing tables are NOT modified or dropped
-- Safe to run on production database

-- 1. Roles Table (NEW)
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Roles table';

-- 2. Permissions Table (NEW)
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT UNSIGNED DEFAULT 0,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    type ENUM('module', 'page', 'action') NOT NULL,
    sort INT DEFAULT 0,
    icon VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permissions table';

-- 3. Role Permissions Junction Table (NEW)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Role permissions junction table';

-- 4. Personnel Table (NEW)
CREATE TABLE IF NOT EXISTS personnel (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    employee_no VARCHAR(50) UNIQUE NOT NULL,
    gender ENUM('male', 'female') DEFAULT 'male',
    phone VARCHAR(20),
    email VARCHAR(100),
    department_id INT UNSIGNED,
    position VARCHAR(50),
    hire_date DATE,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Personnel table';

-- 5. System Logs Table (NEW)
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    module VARCHAR(50),
    action VARCHAR(50),
    method VARCHAR(10),
    url VARCHAR(255),
    ip VARCHAR(50),
    user_agent VARCHAR(255),
    request_data TEXT,
    response_data TEXT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='System logs table';

-- 6. System Parameters Table (NEW)
CREATE TABLE IF NOT EXISTS system_params (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    param_key VARCHAR(100) UNIQUE NOT NULL,
    param_value TEXT,
    param_type VARCHAR(20) DEFAULT 'string',
    description VARCHAR(255),
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='System parameters table';

-- 7. Machine Categories Table (NEW - separate from device_categories)
CREATE TABLE IF NOT EXISTS machine_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Machine categories table';

-- 8. Machines Table (NEW - separate from devices)
CREATE TABLE IF NOT EXISTS machines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(100),
    category_id BIGINT UNSIGNED NOT NULL,
    manufacturer VARCHAR(100),
    power DECIMAL(10,2),
    weight DECIMAL(10,2),
    specifications TEXT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES machine_categories(id),
    INDEX idx_category (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Machines table';

-- 9. Orders Table (NEW - separate from work_orders)
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address VARCHAR(255),
    machine_id BIGINT UNSIGNED,
    fault_desc TEXT,
    priority ENUM('low', 'normal', 'urgent', 'emergency') DEFAULT 'normal',
    status ENUM('pending', 'assigned', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    estimated_amount DECIMAL(10,2),
    actual_amount DECIMAL(10,2),
    assigned_to BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    INDEX idx_status (status),
    INDEX idx_customer (customer_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Orders table';

-- 10. Test Reports Table (NEW)
CREATE TABLE IF NOT EXISTS test_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_no VARCHAR(50) UNIQUE NOT NULL,
    order_id BIGINT UNSIGNED,
    customer_name VARCHAR(100),
    machine_name VARCHAR(200),
    machine_model VARCHAR(100),
    test_items TEXT,
    test_result ENUM('qualified', 'unqualified', 'partial'),
    test_description TEXT,
    suggestion TEXT,
    tester VARCHAR(50),
    test_date DATE,
    status ENUM('pending', 'testing', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status),
    INDEX idx_test_date (test_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Test reports table';

-- 11. Repair Reports Table (NEW)
CREATE TABLE IF NOT EXISTS repair_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_no VARCHAR(50) UNIQUE NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    fault_description TEXT,
    repair_content TEXT,
    parts JSON,
    work_hours DECIMAL(4,1),
    labor_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    repairer VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    notes TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status),
    INDEX idx_repairer (repairer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair reports table';

-- 12. Repair Contracts Table (NEW)
CREATE TABLE IF NOT EXISTS repair_contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contract_no VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    contract_type ENUM('maintenance', 'repair', 'inspection') NOT NULL,
    start_date DATE,
    end_date DATE,
    amount DECIMAL(10,2),
    content TEXT,
    status ENUM('draft', 'active', 'expired', 'terminated') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair contracts table';

-- 13. Repair Reminders Table (NEW)
CREATE TABLE IF NOT EXISTS repair_reminders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    reminder_type ENUM('response', 'repair', 'delivery') NOT NULL,
    reminder_time DATETIME NOT NULL,
    status ENUM('pending', 'sent', 'cancelled') DEFAULT 'pending',
    sent_at DATETIME,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status),
    INDEX idx_reminder_time (reminder_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair reminders table';

-- 14. External Repairs Table (NEW)
CREATE TABLE IF NOT EXISTS external_repairs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    external_unit VARCHAR(100) NOT NULL,
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    cooperation_type ENUM('outsourcing', 'collaboration') NOT NULL,
    cost DECIMAL(10,2),
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='External repairs table';

-- 15. Repair Progress Table (NEW)
CREATE TABLE IF NOT EXISTS repair_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    stage VARCHAR(50) NOT NULL,
    progress INT DEFAULT 0,
    status ENUM('pending', 'in_progress', 'completed', 'delayed') DEFAULT 'pending',
    start_time DATETIME,
    end_time DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_order (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair progress table';

-- 16. Transfers Table (NEW)
CREATE TABLE IF NOT EXISTS transfers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    payee_name VARCHAR(100) NOT NULL,
    payee_account VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    transfer_time DATETIME,
    voucher VARCHAR(255),
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_transfer_time (transfer_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Transfers table';

-- 17. Online Payments Table (NEW)
CREATE TABLE IF NOT EXISTS online_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    trade_no VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('wechat', 'alipay', 'unionpay') NOT NULL,
    status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    INDEX idx_status (status),
    INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Online payments table';

-- 18. Invoices Table (NEW)
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('special', 'normal', 'electronic') NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    tax_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(4,4) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    issue_date DATE,
    status ENUM('pending', 'issued', 'void') DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Invoices table';

-- 19. Cases Table (NEW)
CREATE TABLE IF NOT EXISTS cases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    industry VARCHAR(50),
    cover_image VARCHAR(255),
    content TEXT,
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Success cases table';

-- 20. Customer Service Table (NEW)
CREATE TABLE IF NOT EXISTS customer_service (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20),
    wechat VARCHAR(50),
    qq VARCHAR(20),
    email VARCHAR(100),
    work_time VARCHAR(100),
    qrcode VARCHAR(255),
    description TEXT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Customer service table';

-- 21. Douyin Contents Table (NEW)
CREATE TABLE IF NOT EXISTS douyin_contents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    cover_image VARCHAR(255),
    description TEXT,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    publish_date DATE,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Douyin contents table';

-- 22. Partners Table (NEW)
CREATE TABLE IF NOT EXISTS partners (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    status TINYINT DEFAULT 1,
    rating TINYINT DEFAULT 5,
    cooperation_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Partners table';

-- Insert Default Data
INSERT INTO roles (name, code, description) VALUES
('Administrator', 'admin', 'Full system access'),
('Manager', 'manager', 'Management access'),
('Operator', 'operator', 'Operator access')
ON DUPLICATE KEY UPDATE name=VALUES(name);
```

-- 1. Users Table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    department_id INT UNSIGNED,
    role_id INT UNSIGNED,
    avatar VARCHAR(255),
    status TINYINT DEFAULT 1 COMMENT '1:enabled 0:disabled',
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department (department_id),
    INDEX idx_role (role_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Users table';

-- 2. Roles Table
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Roles table';

-- 3. Permissions Table
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT UNSIGNED DEFAULT 0,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    type ENUM('module', 'page', 'action') NOT NULL,
    sort INT DEFAULT 0,
    icon VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permissions table';

-- 4. Role Permissions Junction Table
CREATE TABLE role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Role permissions junction table';

-- 5. Personnel Table
CREATE TABLE personnel (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    employee_no VARCHAR(50) UNIQUE NOT NULL,
    gender ENUM('male', 'female') DEFAULT 'male',
    phone VARCHAR(20),
    email VARCHAR(100),
    department_id INT UNSIGNED,
    position VARCHAR(50),
    hire_date DATE,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Personnel table';

-- 6. Organizations Table
CREATE TABLE organizations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    parent_id BIGINT UNSIGNED DEFAULT 0,
    level INT DEFAULT 1,
    sort INT DEFAULT 0,
    leader VARCHAR(50),
    phone VARCHAR(20),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Organizations table';

-- 7. System Logs Table
CREATE TABLE system_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    module VARCHAR(50),
    action VARCHAR(50),
    method VARCHAR(10),
    url VARCHAR(255),
    ip VARCHAR(50),
    user_agent VARCHAR(255),
    request_data TEXT,
    response_data TEXT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='System logs table';

-- 8. System Parameters Table
CREATE TABLE system_params (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    param_key VARCHAR(100) UNIQUE NOT NULL,
    param_value TEXT,
    param_type VARCHAR(20) DEFAULT 'string',
    description VARCHAR(255),
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='System parameters table';

-- 9. Machine Categories Table
CREATE TABLE machine_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Machine categories table';

-- 10. Machines Table
CREATE TABLE machines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(100),
    category_id BIGINT UNSIGNED NOT NULL,
    manufacturer VARCHAR(100),
    power DECIMAL(10,2),
    weight DECIMAL(10,2),
    specifications TEXT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES machine_categories(id),
    INDEX idx_category (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Machines table';

-- 11. Orders Table
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address VARCHAR(255),
    machine_id BIGINT UNSIGNED,
    fault_desc TEXT,
    priority ENUM('low', 'normal', 'urgent', 'emergency') DEFAULT 'normal',
    status ENUM('pending', 'assigned', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    estimated_amount DECIMAL(10,2),
    actual_amount DECIMAL(10,2),
    assigned_to BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    INDEX idx_status (status),
    INDEX idx_customer (customer_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Orders table';

-- 12. Test Reports Table
CREATE TABLE test_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_no VARCHAR(50) UNIQUE NOT NULL,
    order_id BIGINT UNSIGNED,
    customer_name VARCHAR(100),
    machine_name VARCHAR(200),
    machine_model VARCHAR(100),
    test_items TEXT,
    test_result ENUM('qualified', 'unqualified', 'partial'),
    test_description TEXT,
    suggestion TEXT,
    tester VARCHAR(50),
    test_date DATE,
    status ENUM('pending', 'testing', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status),
    INDEX idx_test_date (test_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Test reports table';

-- 13. Repair Reports Table (Measure Reports)
CREATE TABLE repair_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_no VARCHAR(50) UNIQUE NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    fault_description TEXT,
    repair_content TEXT,
    parts JSON,
    work_hours DECIMAL(4,1),
    labor_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    repairer VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    notes TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status),
    INDEX idx_repairer (repairer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair reports table';

-- 14. Repair Contracts Table
CREATE TABLE repair_contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contract_no VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    contract_type ENUM('maintenance', 'repair', 'inspection') NOT NULL,
    start_date DATE,
    end_date DATE,
    amount DECIMAL(10,2),
    content TEXT,
    status ENUM('draft', 'active', 'expired', 'terminated') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair contracts table';

-- 15. Repair Reminders Table
CREATE TABLE repair_reminders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    reminder_type ENUM('response', 'repair', 'delivery') NOT NULL,
    reminder_time DATETIME NOT NULL,
    status ENUM('pending', 'sent', 'cancelled') DEFAULT 'pending',
    sent_at DATETIME,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status),
    INDEX idx_reminder_time (reminder_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair reminders table';

-- 16. External Repairs Table
CREATE TABLE external_repairs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    external_unit VARCHAR(100) NOT NULL,
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    cooperation_type ENUM(' outsourcing', 'collaboration') NOT NULL,
    cost DECIMAL(10,2),
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='External repairs table';

-- 17. Repair Progress Table
CREATE TABLE repair_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    stage VARCHAR(50) NOT NULL,
    progress INT DEFAULT 0,
    status ENUM('pending', 'in_progress', 'completed', 'delayed') DEFAULT 'pending',
    start_time DATETIME,
    end_time DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_order (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Repair progress table';

-- 18. Transfers Table
CREATE TABLE transfers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    payee_name VARCHAR(100) NOT NULL,
    payee_account VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    transfer_time DATETIME,
    voucher VARCHAR(255),
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_transfer_time (transfer_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Transfers table';

-- 19. Online Payments Table
CREATE TABLE online_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    trade_no VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('wechat', 'alipay', 'unionpay') NOT NULL,
    status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    INDEX idx_status (status),
    INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Online payments table';

-- 20. Invoices Table
CREATE TABLE invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('special', 'normal', 'electronic') NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    tax_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(4,4) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    issue_date DATE,
    status ENUM('pending', 'issued', 'void') DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Invoices table';

-- 21. Parts Table
CREATE TABLE parts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INT UNSIGNED,
    specification VARCHAR(200),
    unit VARCHAR(20) DEFAULT '个',
    quantity INT DEFAULT 0,
    min_stock INT DEFAULT 10,
    purchase_price DECIMAL(10,2),
    supplier_id BIGINT UNSIGNED,
    location VARCHAR(100),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Parts table';

-- 22. Suppliers Table
CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    status TINYINT DEFAULT 1,
    rating TINYINT DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Suppliers table';

-- 23. Cases Table
CREATE TABLE cases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    industry VARCHAR(50),
    cover_image VARCHAR(255),
    content TEXT,
    sort INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Success cases table';

-- 24. Customer Service Table
CREATE TABLE customer_service (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20),
    wechat VARCHAR(50),
    qq VARCHAR(20),
    email VARCHAR(100),
    work_time VARCHAR(100),
    qrcode VARCHAR(255),
    description TEXT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Customer service table';

-- 25. Douyin Contents Table
CREATE TABLE douyin_contents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    cover_image VARCHAR(255),
    description TEXT,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    publish_date DATE,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Douyin contents table';

-- Insert Default Admin User (password: admin123)
INSERT INTO users (username, password, real_name, role_id, status) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 1, 1);

-- Insert Default Roles
INSERT INTO roles (name, code, description) VALUES
('Administrator', 'admin', 'Full system access'),
('Manager', 'manager', 'Management access'),
('Operator', 'operator', 'Operator access');
```

- [ ] **Step 2: Execute migration**

```bash
mysql -u root -p cmms_db < backend/database/migrations/001_create_tables.sql
```

Expected: Tables created successfully, default data inserted

- [ ] **Step 3: Verify tables created**

```bash
mysql -u root -p cmms_db -e "SHOW TABLES;"
```

Expected: List of 25 tables displayed

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/001_create_tables.sql
git commit -m "feat: create database schema with all tables"
```

---

## Task 3: Enhance Existing JWT Authentication

**Files:**
- Modify: `backend/app/service/JwtService.php` (extend existing)
- Modify: `backend/app/middleware/JwtAuth.php` (enhance existing)
- Modify: `backend/app/controller/AuthController.php` (add refresh token)

**Note:** The existing JwtService already handles JWT tokens. We're adding refresh token support.

- [ ] **Step 1: Enhance existing JwtService**

Add refresh token methods to `backend/app/service/JwtService.php`:

```php
    /**
     * Generate refresh token (30 days valid)
     * @param array $user User data
     * @return string
     */
    public static function generateRefreshToken($user)
    {
        $payload = [
            'iss' => 'cmms_api',
            'aud' => 'cmms_web',
            'iat' => time(),
            'exp' => time() + (30 * 86400), // 30 days
            'data' => [
                'id' => $user['id'],
            ]
        ];

        return self::encode($payload);
    }

    /**
     * Generate both access and refresh tokens
     * @param array $user User data
     * @return array
     */
    public static function generateTokenPair($user)
    {
        return [
            'token' => self::generateToken($user),
            'refresh_token' => self::generateRefreshToken($user),
            'expires_in' => 7200,
        ];
    }
```

- [ ] **Step 2: Add refresh endpoint to AuthController**

Add to `backend/app/controller/AuthController.php`:

```php
    /**
     * Refresh access token
     * POST /api/refresh-token
     */
    public function refresh()
    {
        $data = request()->post();
        $refreshToken = $data['refresh_token'] ?? '';

        if (empty($refreshToken)) {
            return $this->error('Refresh token is required', 400);
        }

        try {
            $decoded = \app\service\JwtService::decode($refreshToken);
            $userId = $decoded->data->id ?? 0;

            $user = \app\model\User::find($userId);
            if (!$user) {
                return $this->error('Invalid refresh token', 401);
            }

            $tokenData = \app\service\JwtService::generateTokenPair($user->toArray());

            return $this->success($tokenData, 'Token refreshed successfully');
        } catch (\Exception $e) {
            return $this->error('Invalid or expired refresh token', 401);
        }
    }
```

- [ ] **Step 3: Test refresh token**

```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# Refresh token
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/service/JwtService.php backend/app/controller/AuthController.php
git commit -m "feat: add refresh token support to JWT authentication"
```

---

## Task 4: Add API Routes with Permission Integration

**IMPORTANT:** This task adds routes for NEW controllers only. Existing routes remain unchanged.

**Files:**
- Modify: `backend/route/app.php`

- [ ] **Step 1: Add routes for NEW controllers with permission checking**

Add to `backend/route/app.php` AFTER the existing routes (around line 200):

```php
// ============================================
// NEW MODULE ROUTES (CMMS 7-Module System)
// ============================================

// All new routes require both JWT authentication AND permission checking
Route::group(function () {

    // Role & Permission Management (NEW)
    Route::group('roles', function () {
        Route::get('/', 'RoleController/index');
        Route::get('/:id', 'RoleController/read');
        Route::post('/', 'RoleController/save');
        Route::put('/:id', 'RoleController/update');
        Route::delete('/:id', 'RoleController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('permissions', function () {
        Route::get('/', 'PermissionController/index');
        Route::get('/tree', 'PermissionController/tree');
        Route::post('/', 'PermissionController/save');
        Route::put('/:id', 'PermissionController/update');
        Route::delete('/:id', 'PermissionController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    // Machine Management (NEW - separate from existing Device)
    Route::group('machine-categories', function () {
        Route::get('/', 'MachineCategoryController/index');
        Route::post('/', 'MachineCategoryController/save');
        Route::put('/:id', 'MachineCategoryController/update');
        Route::delete('/:id', 'MachineCategoryController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('machines', function () {
        Route::get('/', 'MachineController/index');
        Route::get('/:id', 'MachineController/read');
        Route::post('/', 'MachineController/save');
        Route::put('/:id', 'MachineController/update');
        Route::delete('/:id', 'MachineController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    // Report Management (NEW)
    Route::group('test-reports', function () {
        Route::get('/', 'TestReportController/index');
        Route::get('/:id', 'TestReportController/read');
        Route::post('/', 'TestReportController/save');
        Route::put('/:id', 'TestReportController/update');
        Route::delete('/:id', 'TestReportController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('repair-reports', function () {
        Route::get('/', 'RepairReportController/index');
        Route::get('/:id', 'RepairReportController/read');
        Route::post('/', 'RepairReportController/save');
        Route::put('/:id', 'RepairReportController/update');
        Route::delete('/:id', 'RepairReportController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    // Repair Business (NEW)
    Route::group('repair-contracts', function () {
        Route::get('/', 'RepairContractController/index');
        Route::post('/', 'RepairContractController/save');
        Route::put('/:id', 'RepairContractController/update');
        Route::delete('/:id', 'RepairContractController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('repair-reminders', function () {
        Route::get('/', 'RepairReminderController/index');
        Route::post('/', 'RepairReminderController/save');
        Route::put('/:id', 'RepairReminderController/update');
        Route::delete('/:id', 'RepairReminderController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('external-repairs', function () {
        Route::get('/', 'ExternalRepairController/index');
        Route::post('/', 'ExternalRepairController/save');
        Route::put('/:id', 'ExternalRepairController/update');
        Route::delete('/:id', 'ExternalRepairController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('repair-progress', function () {
        Route::get('/', 'RepairProgressController/index');
        Route::post('/', 'RepairProgressController/save');
        Route::put('/:id', 'RepairProgressController/update');
    })->middleware(\app\middleware\PermissionCheck::class);

    // Payment Module (NEW)
    Route::group('transfers', function () {
        Route::get('/', 'TransferController/index');
        Route::post('/', 'TransferController/save');
        Route::put('/:id', 'TransferController/update');
        Route::delete('/:id', 'TransferController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('online-payments', function () {
        Route::get('/', 'OnlinePaymentController/index');
        Route::post('/', 'OnlinePaymentController/save');
        Route::put('/:id', 'OnlinePaymentController/update');
        Route::delete('/:id', 'OnlinePaymentController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('invoices', function () {
        Route::get('/', 'InvoiceController/index');
        Route::post('/', 'InvoiceController/save');
        Route::put('/:id', 'InvoiceController/update');
        Route::delete('/:id', 'InvoiceController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    // Statistics Module (NEW)
    Route::group('statistics', function () {
        Route::get('income', 'StatisticsController/income');
        Route::get('expense', 'StatisticsController/expense');
        Route::get('orders', 'StatisticsController/orders');
        Route::get('timeout', 'StatisticsController/timeout');
    })->middleware(\app\middleware\PermissionCheck::class);

    // Marketing Module (NEW)
    Route::group('cases', function () {
        Route::get('/', 'CaseController/index');
        Route::post('/', 'CaseController/save');
        Route::put('/:id', 'CaseController/update');
        Route::delete('/:id', 'CaseController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('customer-service', function () {
        Route::get('/', 'CustomerServiceController/index');
        Route::put('/', 'CustomerServiceController/update');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('douyin', function () {
        Route::get('/', 'DouyinController/index');
        Route::post('/', 'DouyinController/save');
        Route::put('/:id', 'DouyinController/update');
        Route::delete('/:id', 'DouyinController/delete');
        Route::get('statistics', 'DouyinController/statistics');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('partners', function () {
        Route::get('/', 'PartnerController/index');
        Route::post('/', 'PartnerController/save');
        Route::put('/:id', 'PartnerController/update');
        Route::delete('/:id', 'PartnerController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    // System Management (NEW)
    Route::group('personnel', function () {
        Route::get('/', 'PersonnelController/index');
        Route::post('/', 'PersonnelController/save');
        Route::put('/:id', 'PersonnelController/update');
        Route::delete('/:id', 'PersonnelController/delete');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('system-logs', function () {
        Route::get('/', 'SystemLogController/index');
    })->middleware(\app\middleware\PermissionCheck::class);

    Route::group('system-params', function () {
        Route::get('/', 'SystemParamController/index');
        Route::post('/', 'SystemParamController/save');
        Route::put('/:id', 'SystemParamController/update');
    })->middleware(\app\middleware\PermissionCheck::class);

})->middleware(\app\middleware\JwtAuth::class)->allowCrossDomain();

// END OF NEW MODULE ROUTES
```

**Key Points:**
- All new routes are wrapped in JwtAuth middleware (outer layer)
- Each route group has PermissionCheck middleware (inner layer)
- Existing routes remain untouched - no breaking changes
- Clear comment markers show where new routes begin/end

- [ ] **Step 2: Verify existing routes still work**

```bash
# Test existing route
curl -X GET http://localhost:8000/api/devices \
  -H "Authorization: Bearer $TOKEN"

# Should still work - no changes to existing routes
```

Expected: Existing routes return data successfully

- [ ] **Step 3: Test new route with permission check**

```bash
# This will require proper permission setup
curl -X GET http://localhost:8000/api/roles \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Either 200 (success) or 403 (no permission) - both show middleware working

- [ ] **Step 4: Commit**

```bash
git add backend/route/app.php
git commit -m "feat: add new module routes with permission checking"
```

---

## Task 5: User Management Enhancement

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\User;
use app\service\v1\JwtService;

class AuthController extends BaseController
{
    /**
     * User login
     * POST /api/v1/login
     */
    public function login()
    {
        $data = $this->getRequestData([
            'username' => 'require',
            'password' => 'require',
        ], [
            'username.require' => 'Username is required',
            'password.require' => 'Password is required',
        ]);

        $user = User::where('username', $data['username'])
            ->where('status', 1)
            ->find();

        if (!$user) {
            return $this->error('User not found or disabled', 404);
        }

        if (!password_verify($data['password'], $user->password)) {
            return $this->error('Incorrect password', 401);
        }

        // Update last login time
        $user->last_login_at = date('Y-m-d H:i:s');
        $user->save();

        // Generate token
        $tokenData = JwtService::generateToken($user->toArray());

        return $this->success([
            'token' => $tokenData['token'],
            'refresh_token' => $tokenData['refresh_token'],
            'expires_in' => $tokenData['expires_in'],
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'real_name' => $user->real_name,
                'avatar' => $user->avatar,
                'role_id' => $user->role_id,
            ]
        ], 'Login successful');
    }

    /**
     * Refresh token
     * POST /api/v1/refresh-token
     */
    public function refresh()
    {
        $data = $this->getRequestData([
            'refresh_token' => 'require',
        ]);

        $tokenData = JwtService::refreshToken($data['refresh_token']);

        if (!$tokenData) {
            return $this->error('Invalid refresh token', 401);
        }

        return $this->success($tokenData, 'Token refreshed successfully');
    }

    /**
     * User logout
     * POST /api/v1/logout
     */
    public function logout()
    {
        // In a stateless JWT system, logout is typically handled client-side
        // by removing the token. This endpoint can be used for logging purposes.
        return $this->success(null, 'Logout successful');
    }

    /**
     * Get current user profile
     * GET /api/v1/profile
     */
    public function profile()
    {
        $userData = request()->userData;
        $user = User::find($userData['id']);

        if (!$user) {
            return $this->error('User not found', 404);
        }

        return $this->success($user->toArray());
    }
}
```

- [ ] **Step 4: Test login endpoint**

```bash
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: JSON response with token and user data

- [ ] **Step 5: Commit**

```bash
git add backend/app/service/v1/JwtService.php backend/app/middleware/JwtAuth.php backend/app/controller/v1/AuthController.php
git commit -m "feat: implement JWT authentication"
```

---

## Task 4: V1 API Routes Configuration

**Files:**
- Modify: `backend/route/app.php`

- [ ] **Step 1: Update routes file**

Add to `backend/route/app.php` after existing routes:

```php
// V1 API Routes (New Structure)
Route::group('api/v1', function () {
    // Authentication (no token required)
    Route::post('login', 'v1.AuthController/login');
    Route::post('refresh-token', 'v1.AuthController/refresh');

    // Protected routes (require authentication)
    Route::group(function () {
        // Auth
        Route::post('logout', 'v1.AuthController/logout');
        Route::get('profile', 'v1.AuthController/profile');

        // Basic Management Module
        Route::group('users', function () {
            Route::get('/', 'v1.UserController/index');
            Route::get('/:id', 'v1.UserController/read');
            Route::post('/', 'v1.UserController/save');
            Route::put('/:id', 'v1.UserController/update');
            Route::delete('/:id', 'v1.UserController/delete');
        });

        Route::group('roles', function () {
            Route::get('/', 'v1.RoleController/index');
            Route::get('/:id', 'v1.RoleController/read');
            Route::post('/', 'v1.RoleController/save');
            Route::put('/:id', 'v1.RoleController/update');
            Route::delete('/:id', 'v1.RoleController/delete');
        });

        Route::group('permissions', function () {
            Route::get('/', 'v1.PermissionController/index');
            Route::get('/tree', 'v1.PermissionController/tree');
            Route::post('/', 'v1.PermissionController/save');
            Route::put('/:id', 'v1.PermissionController/update');
            Route::delete('/:id', 'v1.PermissionController/delete');
        });

        // Additional routes will be added in subsequent tasks

    })->middleware(\app\middleware\JwtAuth::class);
})->allowCrossDomain();
```

- [ ] **Step 2: Commit**

```bash
git add backend/route/app.php
git commit -m "feat: add v1 API routes structure"
```

---

## Task 5: User Management API

**Files:**
- Create: `backend/app/model/User.php`
- Create: `backend/app/controller/v1/UserController.php`
- Create: `backend/app/validate/v1/UserValidate.php`

- [ ] **Step 1: Create User model**

Create `backend/app/model/User.php`:

```php
<?php

namespace app\model;

use think\Model;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'username', 'password', 'real_name', 'email',
        'phone', 'department_id', 'role_id', 'avatar', 'status'
    ];

    protected $hidden = ['password'];

    // Relationship with Role
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // Relationship with Department
    public function department()
    {
        return $this->belongsTo(Organization::class, 'department_id');
    }
}
```

- [ ] **Step 2: Create UserValidate**

Create `backend/app/validate/v1/UserValidate.php`:

```php
<?php

namespace app\validate\v1;

use think\Validate;

class UserValidate extends Validate
{
    protected $rule = [
        'username' => 'require|alphaNum|length:3,50|unique:users',
        'password' => 'require|length:6,50',
        'real_name' => 'require|max:50',
        'email' => 'email',
        'phone' => 'mobile',
        'role_id' => 'integer',
        'status' => 'in:0,1',
    ];

    protected $message = [
        'username.require' => 'Username is required',
        'username.alphaNum' => 'Username must be alphanumeric',
        'username.unique' => 'Username already exists',
        'password.require' => 'Password is required',
        'password.length' => 'Password must be 6-50 characters',
        'real_name.require' => 'Real name is required',
        'email.email' => 'Invalid email format',
        'phone.mobile' => 'Invalid phone number format',
    ];
}
```

- [ ] **Step 3: Create UserController**

Create `backend/app/controller/v1/UserController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\User;
use think\facade\Db;

class UserController extends BaseController
{
    /**
     * Get user list
     * GET /api/v1/users?page=1&per_page=20&keyword=xxx&status=1
     */
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);
        $keyword = request()->param('keyword', '');
        $status = request()->param('status', '');
        $departmentId = request()->param('department_id', '');

        $query = User::with(['role', 'department']);

        if ($keyword) {
            $query->where(function($q) use ($keyword) {
                $q->whereLike('username', "%{$keyword}%")
                  ->whereOr('real_name', 'like', "%{$keyword}%")
                  ->whereOr('phone', 'like', "%{$keyword}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $list = $query->order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
                'from' => $list->listRows() * ($list->currentPage() - 1) + 1,
                'to' => $list->listRows() * $list->currentPage(),
            ]
        ]);
    }

    /**
     * Get user detail
     * GET /api/v1/users/:id
     */
    public function read($id)
    {
        $user = User::with(['role', 'department'])->find($id);

        if (!$user) {
            return $this->error('User not found', 404);
        }

        return $this->success($user);
    }

    /**
     * Create user
     * POST /api/v1/users
     */
    public function save()
    {
        $data = $this->getRequestData([
            'username' => 'require',
            'password' => 'require',
            'real_name' => 'require',
            'email' => 'email',
            'phone' => 'mobile',
        ]);

        // Check if username exists
        if (User::where('username', $data['username'])->find()) {
            return $this->error('Username already exists', 400);
        }

        // Hash password
        $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);

        try {
            $user = User::create($data);
            return $this->success($user, 'User created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Update user
     * PUT /api/v1/users/:id
     */
    public function update($id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error('User not found', 404);
        }

        $data = request()->post();

        // If password is being updated, hash it
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        try {
            $user->save($data);
            return $this->success($user, 'User updated successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete user
     * DELETE /api/v1/users/:id
     */
    public function delete($id)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error('User not found', 404);
        }

        try {
            $user->delete();
            return $this->success(null, 'User deleted successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
```

- [ ] **Step 4: Test user endpoints**

```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# Get users
curl -X GET "http://localhost:8000/api/v1/users?page=1&per_page=20" \
  -H "Authorization: Bearer $TOKEN"

# Create user
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","real_name":"Test User"}'
```

Expected: Successful responses with user data

- [ ] **Step 5: Commit**

```bash
git add backend/app/model/User.php backend/app/controller/v1/UserController.php backend/app/validate/v1/UserValidate.php
git commit -m "feat: implement user management API"
```

---

## Task 6: Role Management API

**Files:**
- Create: `backend/app/model/Role.php`
- Create: `backend/app/controller/v1/RoleController.php`

- [ ] **Step 1: Create Role model**

Create `backend/app/model/Role.php`:

```php
<?php

namespace app\model;

use think\Model;

class Role extends Model
{
    protected $table = 'roles';

    protected $fillable = ['name', 'code', 'description', 'status'];

    // Relationship with permissions
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }
}
```

- [ ] **Step 2: Create RoleController**

Create `backend/app/controller/v1/RoleController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\Role;
use think\facade\Db;

class RoleController extends BaseController
{
    /**
     * Get role list
     * GET /api/v1/roles
     */
    public function index()
    {
        $roles = Role::with(['permissions'])->select();
        return $this->success($roles);
    }

    /**
     * Get role detail
     * GET /api/v1/roles/:id
     */
    public function read($id)
    {
        $role = Role::with(['permissions'])->find($id);

        if (!$role) {
            return $this->error('Role not found', 404);
        }

        return $this->success($role);
    }

    /**
     * Create role
     * POST /api/v1/roles
     */
    public function save()
    {
        $data = $this->getRequestData([
            'name' => 'require',
            'code' => 'require',
        ]);

        if (Role::where('code', $data['code'])->find()) {
            return $this->error('Role code already exists', 400);
        }

        try {
            $role = Role::create($data);

            // Assign permissions if provided
            if (isset($data['permission_ids'])) {
                $role->permissions()->saveAll($data['permission_ids']);
            }

            return $this->success($role, 'Role created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Update role
     * PUT /api/v1/roles/:id
     */
    public function update($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return $this->error('Role not found', 404);
        }

        $data = request()->post();

        try {
            $role->save($data);

            // Update permissions if provided
            if (isset($data['permission_ids'])) {
                Db::table('role_permissions')->where('role_id', $id)->delete();
                foreach ($data['permission_ids'] as $permissionId) {
                    Db::table('role_permissions')->insert([
                        'role_id' => $id,
                        'permission_id' => $permissionId,
                    ]);
                }
            }

            return $this->success($role, 'Role updated successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Delete role
     * DELETE /api/v1/roles/:id
     */
    public function delete($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return $this->error('Role not found', 404);
        }

        try {
            $role->delete();
            return $this->success(null, 'Role deleted successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/model/Role.php backend/app/controller/v1/RoleController.php
git commit -m "feat: implement role management API"
```

---

## Task 7: Machine Management API

**Files:**
- Create: `backend/app/model/MachineCategory.php`
- Create: `backend/app/model/Machine.php`
- Create: `backend/app/controller/v1/MachineCategoryController.php`
- Create: `backend/app/controller/v1/MachineController.php`

- [ ] **Step 1: Create MachineCategory model**

Create `backend/app/model/MachineCategory.php`:

```php
<?php

namespace app\model;

use think\Model;

class MachineCategory extends Model
{
    protected $table = 'machine_categories';

    protected $fillable = ['name', 'code', 'description', 'sort', 'status'];

    public function machines()
    {
        return $this->hasMany(Machine::class, 'category_id');
    }
}
```

- [ ] **Step 2: Create Machine model**

Create `backend/app/model/Machine.php`:

```php
<?php

namespace app\model;

use think\Model;

class Machine extends Model
{
    protected $table = 'machines';

    protected $fillable = [
        'name', 'model', 'category_id', 'manufacturer',
        'power', 'weight', 'specifications', 'status'
    ];

    public function category()
    {
        return $this->belongsTo(MachineCategory::class, 'category_id');
    }
}
```

- [ ] **Step 3: Create MachineCategoryController**

Create `backend/app/controller/v1/MachineCategoryController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\MachineCategory;

class MachineCategoryController extends BaseController
{
    public function index()
    {
        $list = MachineCategory::with(['machines'])
            ->order('sort', 'asc')
            ->select();
        return $this->success($list);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'name' => 'require',
            'code' => 'require',
        ]);

        $category = MachineCategory::create($data);
        return $this->success($category, 'Category created successfully', 201);
    }

    public function update($id)
    {
        $category = MachineCategory::find($id);
        if (!$category) {
            return $this->error('Category not found', 404);
        }

        $category->save(request()->post());
        return $this->success($category, 'Category updated successfully');
    }

    public function delete($id)
    {
        $category = MachineCategory::find($id);
        if (!$category) {
            return $this->error('Category not found', 404);
        }

        $category->delete();
        return $this->success(null, 'Category deleted successfully');
    }
}
```

- [ ] **Step 4: Create MachineController**

Create `backend/app/controller/v1/MachineController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\Machine;

class MachineController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);
        $categoryId = request()->param('category_id', '');
        $keyword = request()->param('keyword', '');

        $query = Machine::with(['category']);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        $list = $query->order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ]
        ]);
    }

    public function read($id)
    {
        $machine = Machine::with(['category'])->find($id);
        if (!$machine) {
            return $this->error('Machine not found', 404);
        }
        return $this->success($machine);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'name' => 'require',
            'category_id' => 'require|integer',
        ]);

        $machine = Machine::create($data);
        return $this->success($machine, 'Machine created successfully', 201);
    }

    public function update($id)
    {
        $machine = Machine::find($id);
        if (!$machine) {
            return $this->error('Machine not found', 404);
        }

        $machine->save(request()->post());
        return $this->success($machine, 'Machine updated successfully');
    }

    public function delete($id)
    {
        $machine = Machine::find($id);
        if (!$machine) {
            return $this->error('Machine not found', 404);
        }

        $machine->delete();
        return $this->success(null, 'Machine deleted successfully');
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/model/MachineCategory.php backend/app/model/Machine.php backend/app/controller/v1/MachineCategoryController.php backend/app/controller/v1/MachineController.php
git commit -m "feat: implement machine management API"
```

---

## Task 8: Order Management API

**Files:**
- Create: `backend/app/model/Order.php`
- Create: `backend/app/controller/v1/OrderController.php`

- [ ] **Step 1: Create Order model**

Create `backend/app/model/Order.php`:

```php
<?php

namespace app\model;

use think\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'order_no', 'customer_id', 'customer_name', 'customer_phone',
        'customer_address', 'machine_id', 'fault_desc', 'priority',
        'status', 'estimated_amount', 'actual_amount', 'assigned_to'
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_id');
    }

    public function testReports()
    {
        return $this->hasMany(TestReport::class, 'order_id');
    }

    public function repairReports()
    {
        return $this->hasMany(RepairReport::class, 'order_id');
    }
}
```

- [ ] **Step 2: Create OrderController**

Create `backend/app/controller/v1/OrderController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\Order;
use think\facade\Db;

class OrderController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);
        $status = request()->param('status', '');
        $keyword = request()->param('keyword', '');

        $query = Order::with(['machine']);

        if ($status) {
            $query->where('status', $status);
        }

        if ($keyword) {
            $query->where('order_no|customer_name', 'like', "%{$keyword}%");
        }

        $list = $query->order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ]
        ]);
    }

    public function read($id)
    {
        $order = Order::with(['machine', 'testReports', 'repairReports'])->find($id);
        if (!$order) {
            return $this->error('Order not found', 404);
        }
        return $this->success($order);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'customer_name' => 'require',
            'customer_phone' => 'require',
        ]);

        // Generate order number
        $data['order_no'] = 'ORD' . date('Ymd') . str_pad(Order::count() + 1, 4, '0', STR_PAD_LEFT);
        $data['status'] = 'pending';

        $order = Order::create($data);
        return $this->success($order, 'Order created successfully', 201);
    }

    public function update($id)
    {
        $order = Order::find($id);
        if (!$order) {
            return $this->error('Order not found', 404);
        }

        $order->save(request()->post());
        return $this->success($order, 'Order updated successfully');
    }

    public function delete($id)
    {
        $order = Order::find($id);
        if (!$order) {
            return $this->error('Order not found', 404);
        }

        $order->delete();
        return $this->success(null, 'Order deleted successfully');
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/model/Order.php backend/app/controller/v1/OrderController.php
git commit -m "feat: implement order management API"
```

---

## Task 9: Report Management APIs (Test & Repair)

**Files:**
- Create: `backend/app/model/TestReport.php`
- Create: `backend/app/model/RepairReport.php`
- Create: `backend/app/controller/v1/TestReportController.php`
- Create: `backend/app/controller/v1/RepairReportController.php`

- [ ] **Step 1: Create TestReport model**

Create `backend/app/model/TestReport.php`:

```php
<?php

namespace app\model;

use think\Model;

class TestReport extends Model
{
    protected $table = 'test_reports';

    protected $fillable = [
        'report_no', 'order_id', 'customer_name', 'machine_name',
        'machine_model', 'test_items', 'test_result',
        'test_description', 'suggestion', 'tester', 'test_date', 'status'
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
```

- [ ] **Step 2: Create RepairReport model**

Create `backend/app/model/RepairReport.php`:

```php
<?php

namespace app\model;

use think\Model;

class RepairReport extends Model
{
    protected $table = 'repair_reports';

    protected $fillable = [
        'report_no', 'order_id', 'fault_description', 'repair_content',
        'parts', 'work_hours', 'labor_cost', 'parts_cost', 'total_cost',
        'repairer', 'start_time', 'end_time', 'notes', 'status'
    ];

    protected $json = ['parts'];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
```

- [ ] **Step 3: Create TestReportController**

Create `backend/app/controller/v1/TestReportController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\TestReport;

class TestReportController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);

        $list = TestReport::with(['order'])
            ->order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ]
        ]);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'customer_name' => 'require',
            'machine_name' => 'require',
        ]);

        $data['report_no'] = 'TR' . date('Ymd') . str_pad(TestReport::count() + 1, 4, '0', STR_PAD_LEFT);
        $data['status'] = 'pending';

        $report = TestReport::create($data);
        return $this->success($report, 'Test report created successfully', 201);
    }

    public function update($id)
    {
        $report = TestReport::find($id);
        if (!$report) {
            return $this->error('Report not found', 404);
        }

        $report->save(request()->post());
        return $this->success($report, 'Test report updated successfully');
    }

    public function delete($id)
    {
        $report = TestReport::find($id);
        if (!$report) {
            return $this->error('Report not found', 404);
        }

        $report->delete();
        return $this->success(null, 'Test report deleted successfully');
    }
}
```

- [ ] **Step 4: Create RepairReportController**

Create `backend/app/controller/v1/RepairReportController.php`:

```php
<?php

namespace app\controller\v1;

use app\controller\BaseController;
use app\model\RepairReport;

class RepairReportController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);

        $list = RepairReport::with(['order'])
            ->order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ]
        ]);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'order_id' => 'require|integer',
            'fault_description' => 'require',
            'repair_content' => 'require',
        ]);

        $data['report_no'] = 'RR' . date('Ymd') . str_pad(RepairReport::count() + 1, 4, '0', STR_PAD_LEFT);
        $data['status'] = 'pending';

        // Calculate total cost
        if (isset($data['labor_cost']) && isset($data['parts_cost'])) {
            $data['total_cost'] = $data['labor_cost'] + $data['parts_cost'];
        }

        $report = RepairReport::create($data);
        return $this->success($report, 'Repair report created successfully', 201);
    }

    public function update($id)
    {
        $report = RepairReport::find($id);
        if (!$report) {
            return $this->error('Report not found', 404);
        }

        $data = request()->post();

        // Recalculate total cost if costs updated
        if (isset($data['labor_cost']) && isset($data['parts_cost'])) {
            $data['total_cost'] = $data['labor_cost'] + $data['parts_cost'];
        }

        $report->save($data);
        return $this->success($report, 'Repair report updated successfully');
    }

    public function delete($id)
    {
        $report = RepairReport::find($id);
        if (!$report) {
            return $this->error('Report not found', 404);
        }

        $report->delete();
        return $this->success(null, 'Repair report deleted successfully');
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/model/TestReport.php backend/app/model/RepairReport.php backend/app/controller/v1/TestReportController.php backend/app/controller/v1/RepairReportController.php
git commit -m "feat: implement test and repair report APIs"
```

---

## Task 10: Payment Management APIs (DETAILED)

**Files:**
- Create: `backend/app/model/Transfer.php`
- Create: `backend/app/model/OnlinePayment.php`
- Create: `backend/app/model/Invoice.php`
- Create: `backend/app/controller/TransferController.php`
- Create: `backend/app/controller/OnlinePaymentController.php`
- Create: `backend/app/controller/InvoiceController.php`

- [ ] **Step 1: Create Transfer model**

Create `backend/app/model/Transfer.php`:

```php
<?php

namespace app\model;

use think\Model;

class Transfer extends Model
{
    protected $table = 'transfers';

    protected $fillable = [
        'order_no', 'payee_name', 'payee_account', 'bank_name',
        'amount', 'transfer_time', 'voucher', 'status', 'remark'
    ];

    protected $type = [
        'amount' => 'float',
        'transfer_time' => 'datetime',
    ];
}
```

- [ ] **Step 2: Create OnlinePayment model**

Create `backend/app/model/OnlinePayment.php`:

```php
<?php

namespace app\model;

use think\Model;

class OnlinePayment extends Model
{
    protected $table = 'online_payments';

    protected $fillable = [
        'order_no', 'trade_no', 'customer_name', 'amount',
        'payment_method', 'status', 'created_at', 'paid_at'
    ];

    protected $type = [
        'amount' => 'float',
        'paid_at' => 'datetime',
    ];
}
```

- [ ] **Step 3: Create Invoice model with tax calculation**

Create `backend/app/model/Invoice.php`:

```php
<?php

namespace app\model;

use think\Model;

class Invoice extends Model
{
    protected $table = 'invoices';

    protected $fillable = [
        'invoice_no', 'type', 'company_name', 'tax_no',
        'amount', 'tax_rate', 'tax_amount', 'total_amount',
        'issue_date', 'status', 'remark'
    ];

    protected $type = [
        'amount' => 'float',
        'tax_rate' => 'float',
        'tax_amount' => 'float',
        'total_amount' => 'float',
        'issue_date' => 'date',
    ];

    /**
     * Calculate tax and total amounts
     */
    public function calculateTax()
    {
        $this->tax_amount = round($this->amount * $this->tax_rate, 2);
        $this->total_amount = round($this->amount + $this->tax_amount, 2);
    }

    /**
     * Model event: auto-calculate before saving
     */
    public static function onBeforeInsert($invoice)
    {
        $invoice->calculateTax();
    }

    public static function onBeforeUpdate($invoice)
    {
        if ($invoice->isDirty('amount') || $invoice->isDirty('tax_rate')) {
            $invoice->calculateTax();
        }
    }
}
```

- [ ] **Step 4: Create TransferController**

Create `backend/app/controller/TransferController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\Transfer;

class TransferController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);
        $status = request()->param('status', '');

        $query = Transfer::order('id', 'desc');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $list = $query->paginate([
            'page' => $page,
            'list_rows' => $perPage,
        ]);

        // Calculate statistics
        $statistics = [
            'total' => Transfer::sum('amount'),
            'pending' => Transfer::where('status', 'pending')->sum('amount'),
            'completed' => Transfer::where('status', 'completed')->sum('amount'),
            'today' => Transfer::whereDate('transfer_time', date('Y-m-d'))->sum('amount'),
        ];

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ],
            'statistics' => $statistics,
        ]);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'order_no' => 'require',
            'payee_name' => 'require',
            'payee_account' => 'require',
            'amount' => 'require|float|gt:0',
        ]);

        $data['status'] = 'pending';
        $transfer = Transfer::create($data);

        return $this->success($transfer, 'Transfer record created', 201);
    }

    public function update($id)
    {
        $transfer = Transfer::find($id);
        if (!$transfer) {
            return $this->error('Transfer not found', 404);
        }

        $transfer->save(request()->post());
        return $this->success($transfer, 'Transfer updated');
    }

    public function delete($id)
    {
        $transfer = Transfer::find($id);
        if (!$transfer) {
            return $this->error('Transfer not found', 404);
        }

        $transfer->delete();
        return $this->success(null, 'Transfer deleted');
    }
}
```

- [ ] **Step 5: Create OnlinePaymentController**

Create `backend/app/controller/OnlinePaymentController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\OnlinePayment;

class OnlinePaymentController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);
        $status = request()->param('status', '');
        $paymentMethod = request()->param('payment_method', '');

        $query = OnlinePayment::order('id', 'desc');

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($paymentMethod !== '') {
            $query->where('payment_method', $paymentMethod);
        }

        $list = $query->paginate([
            'page' => $page,
            'list_rows' => $perPage,
        ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ],
        ]);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'order_no' => 'require',
            'trade_no' => 'require',
            'amount' => 'require|float|gt:0',
            'payment_method' => 'require|in:wechat,alipay,unionpay',
        ]);

        $data['status'] = 'pending';
        $payment = OnlinePayment::create($data);

        return $this->success($payment, 'Payment record created', 201);
    }
}
```

- [ ] **Step 6: Create InvoiceController with auto-calculation**

Create `backend/app/controller/InvoiceController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\Invoice;

class InvoiceController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);

        $list = Invoice::order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ],
        ]);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'invoice_no' => 'require',
            'type' => 'require|in:special,normal,electronic',
            'company_name' => 'require',
            'tax_no' => 'require',
            'amount' => 'require|float|gt:0',
            'tax_rate' => 'require|float|between:0,1',
        ]);

        $invoice = new Invoice($data);
        $invoice->calculateTax(); // Auto-calculate tax_amount and total_amount
        $invoice->save();

        return $this->success($invoice, 'Invoice created', 201);
    }

    public function update($id)
    {
        $invoice = Invoice::find($id);
        if (!$invoice) {
            return $this->error('Invoice not found', 404);
        }

        $data = request()->post();
        $invoice->save($data); // Model event will auto-recalculate

        return $this->success($invoice, 'Invoice updated');
    }
}
```

- [ ] **Step 7: Add routes**

Add to `backend/route/app.php`:

```php
// Payment module routes
Route::group('transfers', function () {
    Route::get('/', 'TransferController/index');
    Route::post('/', 'TransferController/save');
    Route::put('/:id', 'TransferController/update');
    Route::delete('/:id', 'TransferController/delete');
});

Route::group('online-payments', function () {
    Route::get('/', 'OnlinePaymentController/index');
    Route::post('/', 'OnlinePaymentController/save');
});

Route::group('invoices', function () {
    Route::get('/', 'InvoiceController/index');
    Route::post('/', 'InvoiceController/save');
    Route::put('/:id', 'InvoiceController/update');
    Route::delete('/:id', 'InvoiceController/delete');
});
```

- [ ] **Step 8: Test payment APIs**

```bash
# Test transfer
curl -X POST http://localhost:8000/api/transfers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_no": "TRF001",
    "payee_name": "Test Payee",
    "payee_account": "6222021234567890",
    "amount": 1000.00
  }'

# Test invoice with tax calculation
curl -X POST http://localhost:8000/api/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_no": "INV001",
    "type": "normal",
    "company_name": "Test Company",
    "tax_no": "123456789",
    "amount": 1000.00,
    "tax_rate": 0.13
  }'
```

Expected: Invoice created with tax_amount=130.00, total_amount=1130.00

- [ ] **Step 9: Commit**

```bash
git add backend/app/model/Transfer.php backend/app/model/OnlinePayment.php backend/app/model/Invoice.php backend/app/controller/TransferController.php backend/app/controller/OnlinePaymentController.php backend/app/controller/InvoiceController.php backend/route/app.php
git commit -m "feat: implement payment management APIs with tax calculation"
```

---

## Task 11: Verify and Enhance Existing Inventory APIs

**Files:**
- Create: `backend/app/model/Part.php`
- Create: `backend/app/model/Supplier.php`
- Create: `backend/app/controller/v1/PartController.php`
- Create: `backend/app/controller/v1/SupplierController.php`

- [ ] **Step 1: Create Part and Supplier models**

- [ ] **Step 2: Create Part and Supplier controllers**

- [ ] **Step 3: Commit**

```bash
git add backend/app/model/Part.php backend/app/model/Supplier.php backend/app/controller/v1/PartController.php backend/app/controller/v1/SupplierController.php
git commit -m "feat: implement inventory management APIs"
```

---

## Task 12: Statistics API

**Files:**
- Create: `backend/app/controller/v1/StatisticsController.php`

- [ ] **Step 1: Create StatisticsController**

Create comprehensive statistics endpoints for income, expense, orders, and timeout analysis.

- [ ] **Step 2: Commit**

```bash
git add backend/app/controller/v1/StatisticsController.php
git commit -m "feat: implement statistics API"
```

---

## Task 13: Marketing Module APIs (DETAILED)

**Files:**
- Create: `backend/app/model/Case.php`
- Create: `backend/app/model/CustomerService.php`
- Create: `backend/app/model/DouyinContent.php`
- Create: `backend/app/model/Partner.php`
- Create: `backend/app/controller/CaseController.php`
- Create: `backend/app/controller/CustomerServiceController.php`
- Create: `backend/app/controller/DouyinController.php`
- Create: `backend/app/controller/PartnerController.php`

- [ ] **Step 1: Create Case model**

Create `backend/app/model/Case.php`:

```php
<?php

namespace app\model;

use think\Model;

class Case extends Model
{
    protected $table = 'cases';

    protected $fillable = [
        'title', 'client_name', 'industry', 'cover_image',
        'content', 'sort', 'status'
    ];

    protected $type = [
        'sort' => 'integer',
        'status' => 'integer',
    ];
}
```

- [ ] **Step 2: Create CustomerService model**

Create `backend/app/model/CustomerService.php`:

```php
<?php

namespace app\model;

use think\Model;

class CustomerService extends Model
{
    protected $table = 'customer_service';

    protected $fillable = [
        'phone', 'wechat', 'qq', 'email', 'work_time',
        'qrcode', 'description', 'status'
    ];

    /**
     * Get singleton instance
     */
    public static function getInstance()
    {
        return self::findOrEmpty(1);
    }
}
```

- [ ] **Step 3: Create DouyinContent model**

Create `backend/app/model/DouyinContent.php`:

```php
<?php

namespace app\model;

use think\Model;

class DouyinContent extends Model
{
    protected $table = 'douyin_contents';

    protected $fillable = [
        'title', 'video_url', 'cover_image', 'description',
        'views', 'likes', 'comments', 'shares',
        'publish_date', 'status'
    ];

    protected $type = [
        'views' => 'integer',
        'likes' => 'integer',
        'comments' => 'integer',
        'shares' => 'integer',
        'publish_date' => 'date',
        'status' => 'integer',
    ];
}
```

- [ ] **Step 4: Create Partner model**

Create `backend/app/model/Partner.php`:

```php
<?php

namespace app\model;

use think\Model;

class Partner extends Model
{
    protected $table = 'partners';

    protected $fillable = [
        'name', 'code', 'contact', 'phone', 'email',
        'address', 'status', 'rating', 'cooperation_date'
    ];

    protected $type = [
        'status' => 'integer',
        'rating' => 'integer',
        'cooperation_date' => 'date',
    ];
}
```

- [ ] **Step 5: Create CaseController**

Create `backend/app/controller/CaseController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\Case;

class CaseController extends BaseController
{
    public function index()
    {
        $status = request()->param('status', '');

        $query = Case::order('sort', 'asc')->order('id', 'desc');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $list = $query->select();

        return $this->success($list);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'title' => 'require',
            'client_name' => 'require',
        ]);

        $case = Case::create($data);
        return $this->success($case, 'Case created', 201);
    }

    public function update($id)
    {
        $case = Case::find($id);
        if (!$case) {
            return $this->error('Case not found', 404);
        }

        $case->save(request()->post());
        return $this->success($case, 'Case updated');
    }

    public function delete($id)
    {
        $case = Case::find($id);
        if (!$case) {
            return $this->error('Case not found', 404);
        }

        $case->delete();
        return $this->success(null, 'Case deleted');
    }
}
```

- [ ] **Step 6: Create CustomerServiceController**

Create `backend/app/controller/CustomerServiceController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\CustomerService;

class CustomerServiceController extends BaseController
{
    /**
     * Get customer service config (singleton)
     */
    public function index()
    {
        $service = CustomerService::getInstance();

        if ($service->isEmpty()) {
            return $this->success([
                'phone' => '',
                'wechat' => '',
                'qq' => '',
                'email' => '',
                'work_time' => '',
                'qrcode' => '',
                'description' => '',
                'status' => 1,
            ]);
        }

        return $this->success($service);
    }

    /**
     * Update customer service config
     */
    public function update()
    {
        $service = CustomerService::getInstance();

        $data = request()->post();

        if ($service->isEmpty()) {
            $service = CustomerService::create($data);
        } else {
            $service->save($data);
        }

        return $this->success($service, 'Customer service updated');
    }
}
```

- [ ] **Step 7: Create DouyinController**

Create `backend/app/controller/DouyinController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\DouyinContent;

class DouyinController extends BaseController
{
    public function index()
    {
        $page = request()->param('page', 1);
        $perPage = request()->param('per_page', 20);

        $list = DouyinContent::order('id', 'desc')
            ->paginate([
                'page' => $page,
                'list_rows' => $perPage,
            ]);

        return $this->success([
            'items' => $list->items(),
            'pagination' => [
                'total' => $list->total(),
                'per_page' => $list->listRows(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ],
        ]);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'title' => 'require',
            'video_url' => 'require',
        ]);

        $content = DouyinContent::create($data);
        return $this->success($content, 'Content created', 201);
    }

    public function update($id)
    {
        $content = DouyinContent::find($id);
        if (!$content) {
            return $this->error('Content not found', 404);
        }

        $content->save(request()->post());
        return $this->success($content, 'Content updated');
    }

    public function delete($id)
    {
        $content = DouyinContent::find($id);
        if (!$content) {
            return $this->error('Content not found', 404);
        }

        $content->delete();
        return $this->success(null, 'Content deleted');
    }

    /**
     * Get statistics
     */
    public function statistics()
    {
        $totalViews = DouyinContent::sum('views');
        $totalLikes = DouyinContent::sum('likes');
        $totalComments = DouyinContent::sum('comments');
        $totalShares = DouyinContent::sum('shares');

        return $this->success([
            'total_views' => $totalViews,
            'total_likes' => $totalLikes,
            'total_comments' => $totalComments,
            'total_shares' => $totalShares,
            'total_videos' => DouyinContent::count(),
        ]);
    }
}
```

- [ ] **Step 8: Create PartnerController**

Create `backend/app/controller/PartnerController.php`:

```php
<?php

namespace app\controller;

use app\controller\BaseController;
use app\model\Partner;

class PartnerController extends BaseController
{
    public function index()
    {
        $list = Partner::order('id', 'desc')->select();
        return $this->success($list);
    }

    public function save()
    {
        $data = $this->getRequestData([
            'name' => 'require',
            'code' => 'require',
        ]);

        $partner = Partner::create($data);
        return $this->success($partner, 'Partner created', 201);
    }

    public function update($id)
    {
        $partner = Partner::find($id);
        if (!$partner) {
            return $this->error('Partner not found', 404);
        }

        $partner->save(request()->post());
        return $this->success($partner, 'Partner updated');
    }

    public function delete($id)
    {
        $partner = Partner::find($id);
        if (!$partner) {
            return $this->error('Partner not found', 404);
        }

        $partner->delete();
        return $this->success(null, 'Partner deleted');
    }
}
```

- [ ] **Step 9: Add marketing routes**

Add to `backend/route/app.php`:

```php
// Marketing module routes
Route::group('cases', function () {
    Route::get('/', 'CaseController/index');
    Route::post('/', 'CaseController/save');
    Route::put('/:id', 'CaseController/update');
    Route::delete('/:id', 'CaseController/delete');
});

Route::group('customer-service', function () {
    Route::get('/', 'CustomerServiceController/index');
    Route::put('/', 'CustomerServiceController/update');
});

Route::group('douyin', function () {
    Route::get('/', 'DouyinController/index');
    Route::post('/', 'DouyinController/save');
    Route::put('/:id', 'DouyinController/update');
    Route::delete('/:id', 'DouyinController/delete');
    Route::get('statistics', 'DouyinController/statistics');
});

Route::group('partners', function () {
    Route::get('/', 'PartnerController/index');
    Route::post('/', 'PartnerController/save');
    Route::put('/:id', 'PartnerController/update');
    Route::delete('/:id', 'PartnerController/delete');
});
```

- [ ] **Step 10: Commit**

```bash
git add backend/app/model/Case.php backend/app/model/CustomerService.php backend/app/model/DouyinContent.php backend/app/model/Partner.php backend/app/controller/CaseController.php backend/app/controller/CustomerServiceController.php backend/app/controller/DouyinController.php backend/app/controller/PartnerController.php backend/route/app.php
git commit -m "feat: implement marketing module APIs"
```

---

## Task 14: Complete API Routes and Permission Integration

**Files:**
- Create: `backend/app/model/Case.php`
- Create: `backend/app/model/CustomerService.php`
- Create: `backend/app/model/DouyinContent.php`
- Create: `backend/app/model/Partner.php`
- Create corresponding controllers

- [ ] **Step 1: Create marketing models**

- [ ] **Step 2: Create marketing controllers**

- [ ] **Step 3: Commit**

```bash
git add backend/app/model/ backend/app/controller/v1/
git commit -m "feat: implement marketing module APIs"
```

---

## Task 14: Complete All Remaining Routes

**Files:**
- Modify: `backend/route/app.php`

- [ ] **Step 1: Add all remaining routes**

Complete the route configuration with all module endpoints.

- [ ] **Step 2: Commit**

```bash
git add backend/route/app.php
git commit -m "feat: complete all API routes"
```

---

## Task 15: Comprehensive API Testing with Pest

**Testing Framework:** Pest PHP (modern PHP testing framework)

**Files:**
- Create: `backend/tests/` directory structure
- Create: `backend/phpunit.xml` (Pest configuration)
- Create: Test files for each module

- [ ] **Step 1: Install Pest testing framework**

```bash
cd backend
composer require pestphp/pest --dev
composer require pestphp/pest-plugin-mock --dev
./vendor/bin/pest --init
```

Expected: Pest installed and configuration files created

- [ ] **Step 2: Create Pest configuration**

Create `backend/phpunit.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <include>
            <directory suffix=".php">app</directory>
        </include>
    </coverage>
</phpunit>
```

- [ ] **Step 3: Create authentication test**

Create `backend/tests/Feature/AuthTest.php`:

```php
<?php

use PHPUnit\Framework\TestCase;

class AuthTest extends TestCase
{
    public function test_login_with_valid_credentials()
    {
        $response = $this->post('/api/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('token', $data['data']);
        $this->assertArrayHasKey('refresh_token', $data['data']);
    }

    public function test_login_with_invalid_credentials()
    {
        $response = $this->post('/api/auth/login', [
            'username' => 'admin',
            'password' => 'wrongpassword',
        ]);

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_refresh_token()
    {
        // First login
        $loginResponse = $this->post('/api/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $loginData = json_decode($loginResponse->getContent(), true);
        $refreshToken = $loginData['data']['refresh_token'];

        // Refresh token
        $response = $this->post('/api/auth/refresh', [
            'refresh_token' => $refreshToken,
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('token', $data['data']);
    }
}
```

- [ ] **Step 4: Create user management test**

Create `backend/tests/Feature/UserTest.php`:

```php
<?php

use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    private $token;

    protected function setUp(): void
    {
        $response = $this->post('/api/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);
        $data = json_decode($response->getContent(), true);
        $this->token = $data['data']['token'];
    }

    public function test_get_users_list()
    {
        $response = $this->withToken($this->token)
            ->get('/api/users?page=1&per_page=20');

        $this->assertEquals(200, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('items', $data['data']);
        $this->assertArrayHasKey('pagination', $data['data']);
    }

    public function test_create_user()
    {
        $response = $this->withToken($this->token)
            ->post('/api/users', [
                'username' => 'testuser_' . time(),
                'password' => 'password123',
                'real_name' => 'Test User',
            ]);

        $this->assertEquals(201, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('id', $data['data']);
    }

    public function test_unauthorized_access()
    {
        $response = $this->get('/api/users');
        $this->assertEquals(401, $response->getStatusCode());
    }
}
```

- [ ] **Step 5: Create order workflow test**

Create `backend/tests/Feature/OrderWorkflowTest.php`:

```php
<?php

use PHPUnit\Framework\TestCase;
use app\model\Order;

class OrderWorkflowTest extends TestCase
{
    private $token;

    protected function setUp(): void
    {
        $response = $this->post('/api/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);
        $data = json_decode($response->getContent(), true);
        $this->token = $data['data']['token'];
    }

    public function test_complete_order_workflow()
    {
        // 1. Create order
        $response = $this->withToken($this->token)
            ->post('/api/orders', [
                'customer_name' => 'Test Customer',
                'customer_phone' => '13800138000',
                'fault_desc' => 'Test fault',
            ]);

        $this->assertEquals(201, $response->getStatusCode());
        $order = json_decode($response->getContent(), true)['data'];
        $orderId = $order['id'];

        // 2. Read order
        $response = $this->withToken($this->token)
            ->get("/api/orders/{$orderId}");
        $this->assertEquals(200, $response->getStatusCode());

        // 3. Update order
        $response = $this->withToken($this->token)
            ->put("/api/orders/{$orderId}", [
                'status' => 'processing',
            ]);
        $this->assertEquals(200, $response->getStatusCode());

        // 4. Delete order (cleanup)
        $response = $this->withToken($this->token)
            ->delete("/api/orders/{$orderId}");
        $this->assertEquals(200, $response->getStatusCode());
    }
}
```

- [ ] **Step 6: Create payment module test**

Create `backend/tests/Feature/PaymentTest.php`:

```php
<?php

use PHPUnit\Framework\TestCase;

class PaymentTest extends TestCase
{
    private $token;

    protected function setUp(): void
    {
        $response = $this->post('/api/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);
        $data = json_decode($response->getContent(), true);
        $this->token = $data['data']['token'];
    }

    public function test_create_invoice_with_tax_calculation()
    {
        $response = $this->withToken($this->token)
            ->post('/api/invoices', [
                'invoice_no' => 'TEST' . time(),
                'type' => 'normal',
                'company_name' => 'Test Company',
                'tax_no' => '123456789',
                'amount' => 1000.00,
                'tax_rate' => 0.13,
            ]);

        $this->assertEquals(201, $response->getStatusCode());
        $invoice = json_decode($response->getContent(), true)['data'];

        // Verify tax calculation
        $this->assertEquals(130.00, $invoice['tax_amount']);
        $this->assertEquals(1130.00, $invoice['total_amount']);
    }

    public function test_create_transfer()
    {
        $response = $this->withToken($this->token)
            ->post('/api/transfers', [
                'order_no' => 'TRF' . time(),
                'payee_name' => 'Test Payee',
                'payee_account' => '6222021234567890',
                'amount' => 500.00,
            ]);

        $this->assertEquals(201, $response->getStatusCode());
    }
}
```

- [ ] **Step 7: Run all tests**

```bash
cd backend
./vendor/bin/pest --coverage
```

Expected: All tests pass with coverage report

- [ ] **Step 8: Achieve 80% code coverage**

Run tests with coverage and ensure at least 80% coverage:

```bash
./vendor/bin/pest --coverage --min=80
```

- [ ] **Step 9: Fix any failing tests**

Address any test failures or coverage gaps.

- [ ] **Step 10: Commit**

```bash
git add backend/tests/ backend/phpunit.xml
git commit -m "test: add comprehensive API tests with Pest"
```

---

## Task 16: API Documentation and Postman Collection

---

## Task 16: API Documentation and Postman Collection

**Files:**
- Create: `backend/docs/API-REFERENCE.md`
- Create: `backend/docs/postman-collection.json`

- [ ] **Step 1: Create API reference documentation**

Create `backend/docs/API-REFERENCE.md` with all endpoints:

```markdown
# CMMS Backend API Reference

## Base URL
- Development: `http://localhost:8000/api`
- Production: `https://api.yourdomain.com/api`

## Authentication

### Login
\`\`\`bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
\`\`\`

### Refresh Token
\`\`\`bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\`

## Users

### Get Users
\`\`\`bash
GET /api/users?page=1&per_page=20&keyword=test&status=1
Authorization: Bearer {token}
\`\`\`

### Create User
\`\`\`bash
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "real_name": "New User",
  "email": "user@example.com"
}
\`\`\`

... (document all endpoints)
```

- [ ] **Step 2: Create Postman collection**

Create `backend/docs/postman-collection.json`:

```json
{
  "info": {
    "name": "CMMS API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.collectionVariables.set(\"auth_token\", jsonData.data.token);"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Create environment variables file**

Create `backend/docs/postman-environment.json`:

```json
{
  "name": "CMMS Development",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:8000",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "enabled": true
    }
  ]
}
```

- [ ] **Step 4: Add README for testing**

Create `backend/docs/TESTING-GUIDE.md`:

```markdown
# API Testing Guide

## Using Postman

1. Import `postman-collection.json` into Postman
2. Import `postman-environment.json` as environment
3. Select "CMMS Development" environment
4. Run "Login" request first to get token
5. Token is automatically stored in environment variable
6. Run other requests - token is auto-included

## Using cURL

### Get Token
\`\`\`bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}' \\
  | jq -r '.data.token')
\`\`\`

### Make Authenticated Request
\`\`\`bash
curl -X GET http://localhost:8000/api/users \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

## Running Tests

\`\`\`bash
cd backend
./vendor/bin/pest
\`\`\`
```

- [ ] **Step 5: Commit**

```bash
git add backend/docs/
git commit -m "docs: add comprehensive API documentation and Postman collection"
```

---

## Task 17: Final Integration and Verification

- [ ] **Step 1: Verify all new controllers exist**

```bash
ls backend/app/controller/*.php
```

Expected: List includes RoleController, PermissionController, CaseController, etc.

- [ ] **Step 2: Verify all new models exist**

```bash
ls backend/app/model/*.php
```

Expected: List includes Role, Permission, Case, CustomerService, etc.

- [ ] **Step 3: Verify database tables**

```bash
mysql -u root -p cmms_db -e "SHOW TABLES;"
```

Expected: All new tables created (roles, permissions, cases, etc.)

- [ ] **Step 4: Run full test suite**

```bash
cd backend
./vendor/bin/pest --coverage
```

Expected: All tests pass, 80%+ coverage

- [ ] **Step 5: Test authentication flow manually**

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token to access protected endpoint
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Successful responses

- [ ] **Step 6: Test key endpoints from each module**

Create test script `backend/test-api-endpoints.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api"

# Login
echo "Testing login..."
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"

# Test users endpoint
echo "Testing users endpoint..."
curl -s -X GET "$BASE_URL/users?page=1&per_page=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.code' | grep -q 200 && echo "✅ Users endpoint working" || echo "❌ Users endpoint failed"

# Test roles endpoint
echo "Testing roles endpoint..."
curl -s -X GET "$BASE_URL/roles" \
  -H "Authorization: Bearer $TOKEN" | jq '.code' | grep -q 200 && echo "✅ Roles endpoint working" || echo "❌ Roles endpoint failed"

# Test cases endpoint
echo "Testing cases endpoint..."
curl -s -X GET "$BASE_URL/cases" \
  -H "Authorization: Bearer $TOKEN" | jq '.code' | grep -q 200 && echo "✅ Cases endpoint working" || echo "❌ Cases endpoint failed"

# Test invoices endpoint
echo "Testing invoices endpoint..."
curl -s -X GET "$BASE_URL/invoices" \
  -H "Authorization: Bearer $TOKEN" | jq '.code' | grep -q 200 && echo "✅ Invoices endpoint working" || echo "❌ Invoices endpoint failed"

echo "API testing complete!"
```

Run tests:
```bash
chmod +x backend/test-api-endpoints.sh
./backend/test-api-endpoints.sh
```

Expected: All endpoints return ✅

- [ ] **Step 7: Check for TODO comments in code**

```bash
grep -r "TODO" backend/app/controller/ backend/app/model/ backend/app/service/
```

Expected: No critical TODOs remaining

- [ ] **Step 8: Verify frontend can connect**

Update frontend API configuration to point to new backend:

In `frontend-web/src/api/request.js`:
```javascript
const baseURL = 'http://localhost:8000/api'
```

Test frontend login and page loads.

- [ ] **Step 9: Performance check**

```bash
# Start development server
cd backend
php think run

# In another terminal, run load test
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users
```

Expected: Acceptable response times (<500ms average)

- [ ] **Step 10: Security checklist**

- [ ] All endpoints require authentication (except login)
- [ ] SQL injection protection (ORM used)
- [ ] XSS protection (input validation)
- [ ] CORS configured properly
- [ ] Passwords hashed (PASSWORD_BCRYPT)
- [ ] JWT tokens expire properly
- [ ] Rate limiting configured (if needed)

- [ ] **Step 11: Create deployment checklist**

Create `backend/DEPLOYMENT-CHECKLIST.md`:

```markdown
# Deployment Checklist

## Pre-deployment
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete

## Environment Setup
- [ ] Production database configured
- [ ] JWT_SECRET changed in .env
- [ ] APP_DEBUG=false
- [ ] CORS configured for production domain
- [ ] File permissions set correctly

## Post-deployment
- [ ] Smoke tests pass
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Log rotation configured
```

- [ ] **Step 12: Final commit**

```bash
git add backend/test-api-endpoints.sh backend/DEPLOYMENT-CHECKLIST.md
git commit -m "test: add API testing script and deployment checklist"
```

- [ ] **Step 13: Tag release**

```bash
git tag -a v1.0.0 -m "Backend API v1.0.0 - Complete implementation"
git push origin v1.0.0
```

---

## Testing Guidelines

### Automated Testing with Pest

**After each task**, run the relevant tests:

```bash
cd backend

# Run all tests
./vendor/bin/pest

# Run specific test file
./vendor/bin/pest tests/Feature/AuthTest

# Run with coverage
./vendor/bin/pest --coverage

# Run with coverage minimum
./vendor/bin/pest --coverage --min=80
```

### Manual Testing

For each new endpoint:

1. **Start server**: `php think run`
2. **Get token**: Login via Postman or curl
3. **Test endpoint**: Use Postman collection or curl
4. **Verify response**:
   - Status code correct
   - Response format matches API design
   - Data validation works
   - Error handling returns proper messages

### Integration Testing

Test complete workflows:

1. **Authentication Flow**: Login → Access protected resource → Refresh token → Logout
2. **User Management**: Create user → Read user → Update user → Delete user
3. **Order Flow**: Create order → Assign → Add test report → Add repair report → Complete
4. **Payment Flow**: Create invoice → Verify tax calculation → Update status → Issue

### Load Testing

Use Apache Bench (ab) or similar:

```bash
# Install ab if needed
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd

# Test endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users
```

Target: <500ms average response time

---

## Notes

### Architecture Decisions

1. **Extending Existing Structure**: This plan enhances the existing backend rather than creating a new v1 API from scratch
2. **Backward Compatibility**: Existing routes and controllers remain functional
3. **Gradual Migration**: New features can be adopted incrementally

### Security Considerations

1. **Authentication**: JWT tokens with 2-hour expiration, 30-day refresh tokens
2. **Password Hashing**: PASSWORD_BCRYPT algorithm
3. **SQL Injection**: Prevented via ThinkPHP ORM
4. **XSS Prevention**: Input validation on all endpoints
5. **CORS**: Configured for frontend domain
6. **Rate Limiting**: Consider implementing for public endpoints

### API Design Patterns

1. **RESTful**: Standard HTTP methods and status codes
2. **Pagination**: Default 20, max 100 items per page
3. **Filtering**: Query parameters for filtering (status, keyword, etc.)
4. **Sorting**: Default by id DESC, customizable
5. **Eager Loading**: Use `with()` for relationships to prevent N+1 queries

### Performance Optimization

1. **Database Indexes**: Added on foreign keys and frequently queried fields
2. **Query Optimization**: Use select() to limit columns, paginate large results
3. **Caching**: Consider Redis for frequently accessed data (roles, permissions)
4. **Connection Pooling**: Configure in database settings

### Error Handling

Standard error response format:
```json
{
  "code": 400,
  "message": "Error message",
  "errors": {
    "field": ["Validation error"]
  }
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Server Error

### File Uploads (Future Enhancement)

When implementing file upload:
1. Use ThinkPHP file upload class
2. Validate file type (images, pdf)
3. Limit file size (5MB max)
4. Generate unique filenames
5. Store in public/uploads directory
6. Return full URL in response

---

## Completion Criteria

### Phase 1: Foundation (Tasks 0-4)
- [ ] Architecture decision documented
- [ ] Existing controllers audited
- [ ] New database tables created (no data loss)
- [ ] JWT authentication enhanced with refresh tokens
- [ ] API routes configured for new controllers

### Phase 2: Core Modules (Tasks 5-9)
- [ ] User management API implemented
- [ ] Role and permission management implemented
- [ ] Machine category and machine management implemented
- [ ] Order management implemented
- [ ] Test and repair reports implemented

### Phase 3: Business Modules (Tasks 10-13)
- [ ] Payment module APIs implemented (Transfer, OnlinePayment, Invoice)
- [ ] Inventory APIs verified (SparePart, Supplier already exist)
- [ ] Statistics API implemented
- [ ] Marketing module APIs implemented (Cases, Service, Douyin, Partners)

### Phase 4: Quality & Documentation (Tasks 14-17)
- [ ] All routes configured and tested
- [ ] PermissionCheck middleware integrated
- [ ] Pest test suite created (80%+ coverage)
- [ ] API documentation complete
- [ ] Postman collection created
- [ ] Integration tests passing
- [ ] Security checklist completed
- [ ] Deployment checklist created

### Final Verification
- [ ] All 7 modules functional
- [ ] Frontend can connect and authenticate
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Ready for production deployment

---

## Success Metrics

### Functional Requirements
- ✅ All endpoints in API design spec implemented
- ✅ Authentication and authorization working
- ✅ CRUD operations for all resources
- ✅ Pagination, filtering, sorting working
- ✅ Error handling implemented
- ✅ Data validation enforced

### Quality Requirements
- ✅ 80%+ code coverage
- ✅ All tests passing
- ✅ No critical security vulnerabilities
- ✅ Response time <500ms (average)
- ✅ Code follows ThinkPHP conventions

### Documentation Requirements
- ✅ API reference complete
- ✅ Postman collection provided
- ✅ Testing guide written
- ✅ Deployment checklist created
- ✅ Architecture decisions documented

---

## Troubleshooting

### Common Issues

**Issue**: JWT token not working
- **Solution**: Check JWT_SECRET in .env, verify token format

**Issue**: Database connection fails
- **Solution**: Verify database credentials in .env, check MySQL is running

**Issue**: Tests failing
- **Solution**: Run `composer dump-autoload`, check database migrations

**Issue**: CORS errors in frontend
- **Solution**: Check CORS middleware configuration, verify frontend URL allowed

**Issue**: Permission denied errors
- **Solution**: Check file permissions, verify user has database access

---

## Resources

### Documentation
- ThinkPHP 8.1 Docs: https://www.kancloud.cn/manual/thinkphp8_0
- Pest PHP: https://pestphp.com/docs
- JWT: https://firebase.google.com/docs/auth/admin/verify-id-tokens

### Tools
- Postman: API testing
- TablePlus: Database management
- PhpStorm: IDE (recommended)
- Git: Version control

### Support
- ThinkPHP Community: https://www.thinkphp.cn/
- PHP Documentation: https://www.php.net/docs.php

---

**Estimated Total Time**: 40-60 hours
**Recommended Approach**: Execute tasks sequentially, test after each task, commit frequently
**Next Step**: Begin with Task 0 - Architecture Assessment

