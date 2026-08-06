# 合同管理功能部署说明

## 功能概述

为维修业务下的维修合同模块添加了以下新功能：

1. **合同管理** - 将原来的"维修合同"重命名为"合同管理"，并改为主菜单
2. **合同列表** - 原有的合同管理功能，现在作为子菜单
3. **合同模板** - 管理维修合同模板，支持自定义变量
4. **合同创建** - 基于模板创建合同，支持在线编辑和PDF导出

## 文件结构

### 前端文件

```
frontend-web/src/
├── api/
│   └── contractTemplate.js         # 合同模板API接口
├── router/
│   └── index.js                   # 路由配置（已更新）
└── views/repair/
    ├── ContractList.vue            # 合同列表（原Contract.vue）
    ├── ContractTemplates.vue       # 合同模板管理
    └── ContractCreate.vue          # 合同创建（支持PDF导出）
```

### 后端文件

```
backend/app/
├── controller/
│   └── ContractTemplateControllerContractTemplateController.php    # 合同模板控制器
├── model/
│   └── ContractTemplate.php       # 合同模板模型
└── service/
    └── PdfExportService.php        # PDF导出服务

backend/database/migrations/
└── 023_create_contract_templates_table.sql  # 数据库迁移

backend/route/
└── app.php                       # 路由配置（已更新）
```

## 安装步骤

### 1. 执行数据库迁移

需要执行以下SQL文件创建合同模板表：

```bash
# 连接到MySQL数据库
mysql -h localhost -u root -p cmms_db < backend/database/migrations/023_create_contract_templates_table.sql
```

或者通过数据库管理工具（如Navicat、phpMyAdmin）手动执行SQL文件。

**SQL文件路径**: `backend/database/migrations/023_create_contract_templates_table.sql`

### 2. 安装PDF生成依赖

#### 方案一：使用TCPDF库（推荐）

```bash
cd backend
composer require tecnickcom/tcpdf
```

#### 方案二：使用wkhtmltopdf

```bash
# Ubuntu/Debian
sudo apt-get install wkhtmltopdf

# CentOS/RHEL
sudo yum install wkhtmltopdf

# macOS
brew install wkhtmltopdf

# Windows
# 下载安装包：https://wkhtmltopdf.org/downloads.html
```

### 3. 配置字体目录（可选）

如果需要支持中文字体，请创建字体目录并添加中文字体文件：

```bash
mkdir -p backend/fonts
# 将中文字体文件（如 simhei.ttf, simsun.ttc）复制到该目录
```

## 功能说明

### 1. 合同模板管理

**路由**: `/repair/contract/templates`

**功能特性**:
- 创建和编辑合同模板
- 支持模板分类（维修合同、服务协议、保密协议）
- 内置常用变量（合同编号、客户信息、服务内容等）
- 支持自定义变量
- 模板预览

**可用变量**:
- `{{contract_number}}` - 合同编号
- `{{customer_name}}` - 客户名称
- `{{customer_phone}}` - 客户电话
- `{{machine_type}}` - 机械类型
- `{{service_content}}` - 服务内容
- `{{annual_fee}}` - 合同金额
- `{{start_date}}` - 开始日期
- `{{end_date}}` - 结束日期
- `{{sign_date}}` - 签订日期
- `{{company_name}}` - 公司名称
- `{{company_address}}` - 公司地址
- `{{company_phone}}` - 公司电话

### 2. 合同创建

**路由**: `/repair/contract/create`

**功能特性**:
- 三步向导式创建流程
  1. 选择模板
  2. 填写合同信息
  3. 预览和导出
- 自动生成合同编号
- 实时预览合同内容
- 一键导出PDF文件

**PDF导出**:
- 支持中文字体
- A4纸张格式
- 专业合同格式
- 自动添加签名区域

### 3. 合同列表

**路由**: `/repair/contract/list`

**功能特性**:
- 原有的合同管理功能
- 查看、编辑、删除合同
- 合同文件下载

## API接口

### 合同模板接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/contract-templates` | 获取模板列表 |
| GET | `/api/contract-templates/{id}` | 获取模板详情 |
| POST | `/api/contract-templates` | 创建模板 |
| PUT | `/api/contract-templates/{id}` | 更新模板 |
| DELETE | `/api/contract-templates/{id}` | 删除模板 |
| POST | `/api/contract-templates/{id}/preview` | 预览模板 |
| POST | `/api/contract-templates/export-pdf` | 导出PDF |

## 权限配置

需要为以下路由配置权限：

- `/repair/contract/templates` - 合同模板管理
- `/repair/contract/create` - 合同创建
- `/repair/contract/list` - 合同列表

在权限管理中添加相应的权限节点，并分配给合适的角色。

## 故障排除

### PDF导出失败

**问题**: 点击导出PDF按钮后报错

**解决方案**:

1. 检查TCPDF或wkhtmltopdf是否安装
2. 检查字体文件是否正确配置
3. 检查临时目录是否有写权限
4. 查看后端日志获取详细错误信息

### 模板变量不生效

**问题**: 导出的PDF中变量没有被替换

**解决方案**:

1. 检查变量格式是否正确（应为 `{{variable_name}}`）
2. 检查前端提交的数据是否包含对应的变量值
3. 确认变量名拼写一致

### 数据库连接失败

**问题**: 执行SQL迁移时出现连接错误

**解决方案**:

1. 检查 `.env` 文件中的数据库配置
2. 确认MySQL服务正在可用
3. 检查数据库用户权限

## 扩展开发

### 添加自定义变量

在合同模板管理页面可以添加自定义变量。模板内容中使用 `{{变量名}}` 格式引用。

### 集成电子签名

可以集成电子签名服务，在PDF导出前将电子签名图片添加到签名区域。

### 批量导出

可以开发批量导出功能，一次性导出多个合同的PDF文件。

## 技术栈

- 前端：Vue 3 + Element Plus
- 后端：ThinkPHP 8
- PDF生成：TCPDF / wkhtmltopdf
- 数据库：MySQL

## 联系支持

如遇到问题或需要技术支持，请联系开发团队。
