# 维修业务管理系统

<div align="center">

**Repair Service Business Management System**

一个企业级维修业务全流程管理系统，支持Web管理后台和微信小程序双端操作。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.1+-purple.svg)](https://php.net)
[![Vue](https://img.shields.io/badge/Vue-3.4+-brightgreen.svg)](https://vuejs.org)
[![ThinkPHP](https://img.shields.io/badge/ThinkPHP-8.1-red.svg)](https://www.thinkphp.cn)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [系统架构](#-系统架构) • [部署文档](#-部署文档)

</div>

---

## 📋 项目简介

维修业务管理系统是一个面向维修服务企业的全流程业务管理系统，涵盖从客户引流、订单管理、维修进度跟踪、支付结算到库存管理和数据分析的完整业务链条。

### 适用场景

- 家电维修服务企业
- 手机/电脑维修店
- 汽车维修服务中心
- 其他提供维修服务的企业

### 核心价值

- **获客引流**: 抖音获客、成功案例展示、合作企业管理
- **业务管理**: 免责协议、维修内容、客户绑定/解绑
- **订单管理**: 小程序订单、手动创建订单、全流程跟踪
- **维修管理**: 机械分类、报价单、检测费、进度照片/视频
- **支付结算**: 转账支付、在线支付、发票管理
- **库存管理**: 配件管理、供应商管理、出入库、盘点
- **数据分析**: 收入统计、开支统计、订单统计、超时统计

---

## ✨ 功能特性

### 系统模块概览

| 模块 | 子功能 | 状态 |
|------|--------|------|
| 🏠 **首页** | 数据概览、快捷入口 | ✅ |
| ⚙️ **基础管理** | 用户、角色、权限、人员、单位、日志、参数 | ✅ |
| 📄 **业务管理** | 免责协议、维修内容、绑定/解绑 | ✅ |
| 📢 **引流模块** | 成功案例、人工客服、抖音获客、合作企业 | ✅ |
| 🔧 **维修业务** | 17个子功能（详见下方） | ✅ |
| 💰 **支付模块** | 转账支付、在线支付、发票管理 | ✅ |
| 📦 **进销存** | 配件管理、供应商管理 | ✅ |
| 📊 **查询统计** | 收入/开支/订单/超时统计 | ✅ |

### 维修业务模块详情

| 子模块 | 功能描述 |
|--------|----------|
| 机械种类管理 | 设备分类管理 |
| 机械名称管理 | 设备品牌型号管理 |
| 小程序订单 | 客户端小程序订单管理 |
| 手动创建订单 | 内部手动创建订单 |
| 维修报价单 | 报价单管理 |
| 检测费用 | 检测收费标准 |
| 测试报告 | 设备检测报告 |
| 维修报告 | 维修完成报告 |
| 维修合同 | 合同管理 |
| 维修提醒 | 提醒设置 |
| 联动维修 | 外部维修协作 |
| 进度申请 | 维修进度申请 |
| 进度照片 | 维修照片记录 |
| 进度视频 | 维修视频记录 |

### Web管理后台

- 🎨 **现代化界面**: Element Plus UI组件库
- 📊 **数据可视化**: ECharts图表展示
- 🔐 **权限控制**: 基于RBAC的权限管理
- 📱 **响应式布局**: 适配各种屏幕尺寸
- 🚀 **高性能**: Vite构建，快速热更新

### 微信小程序

- 👤 **用户端**: 扫码报修、查看进度、验收评价
- 👷 **工程师端**: 接单拒单、维修记录、拍照上传
- 🔄 **实时同步**: 与Web后台数据同步

---

## 🏗️ 系统架构

### 技术栈

#### 后端技术
```
ThinkPHP 8.1      # PHP框架
MySQL 8.0         # 关系型数据库
Redis 7.0         # 缓存/队列
JWT               # 无状态认证
Composer          # 依赖管理
```

#### Web前端技术
```
Vue 3.4+          # 渐进式框架
Vite 5.0          # 构建工具
Element Plus      # UI组件库
Pinia             # 状态管理
Vue Router 4      # 路由管理
ECharts 5         # 数据可视化
Axios             # HTTP客户端
```

#### 小程序技术
```
微信小程序原生框架  # 用户端+工程师端
Promise/async-await # 异步处理
wx.request         # HTTP请求
```

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      前端层                              │
├──────────────────┬──────────────────────────────────────┤
│  Web管理后台       │  小程序端                           │
│  Vue 3 +          │  微信小程序                         │
│  Element Plus     │  - 用户端小程序                      │
│  管理后台          │  - 工程师端小程序                    │
└──────────────────┴──────────────────────────────────────┘
                        ↓ HTTPS + JWT
┌─────────────────────────────────────────────────────────┐
│                    API网关层                            │
│              Nginx (反向代理)                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    应用层                              │
│              ThinkPHP 8.1 应用服务                     │
├─────────────────────────────────────────────────────────┤
│ 业务管理 | 维修业务 | 支付模块 | 进销存 | 统计分析  │
│ 基础管理 | 引流模块 | 通知系统                        │
└─────────────────────────────────────────────────────────┘
                        ↓

┌─────────────────────────────────────────────────────────┐
│                    数据层                              │
├──────────────────┬──────────────────────────────────────┤
│  MySQL 8.0       │  Redis 7                            │
│  业务数据存储    │  缓存 + 会话 + 队列                 │
└──────────────────┴──────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- **PHP**: >= 8.1
- **MySQL**: >= 8.0
- **Redis**: >= 7.0
- **Nginx/Apache**: Web服务器
- **Composer**: PHP依赖管理
- **Node.js**: >= 18.0（前端开发）
- **Docker**: 可选，用于容器化部署

### Docker 快速启动（推荐）

```bash
# 启动所有服务
./start-all.bat

# 或分别启动
./start-backend.bat    # 启动后端
cd frontend-web && npm run dev  # 启动前端
```

服务地址：
- Web管理后台: http://localhost
- 后端API: http://localhost/api
- 数据库: localhost:3306
- Redis: localhost:6379

### 手动安装

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/repair-business-system.git
cd repair-business-system
```

#### 2. 后端安装

```bash
cd backend

# 安装依赖
composer install

# 配置环境变量
cp .env.example .env
vi .env
```

#### 3. Web前端安装

```bash
cd frontend-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 默认账号

```
管理员账号:
用户名: admin
密码: admin123
```

---

## 📦 项目结构

```
maintain/
├── backend/                    # 后端项目 (ThinkPHP 8.1)
│   ├── app/                   # 应用目录
│   │   ├── controller/        # 控制器
│   │   ├── model/             # 模型
│   │   ├── service/           # 服务层
│   │   ├── middleware/        # 中间件
│   │   └── common/            # 公共类
│   ├── config/                # 配置文件
│   ├── database/              # 数据库迁移
│   ├── public/                # 入口文件
│   ├── route/                 # 路由配置
│   ├── runtime/               # 运行时目录
│   └── .env                   # 环境配置
│
├── frontend-web/              # Web管理后台 (Vue 3)
│   ├── src/
│   │   ├── api/               # API接口
│   │   ├── modules/           # 模块组件
│   │   ├── layout/            # 布局组件
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # 状态管理
│   │   └── views/             # 页面组件
│   │       ├── business/      # 业务管理
│   │       ├── inventory/     # 进销存
│   │       ├── marketing/     # 引流模块
│   │       ├── payment/       # 支付模块
│   │       ├── repair/        # 维修业务
│   │       ├── statistics/    # 查询统计
│   │       └── system/        # 基础管理
│   ├── package.json
│   └── vite.config.js
│
├── miniprogram/               # 微信小程序
│   ├── pages/                 # 页面
│   ├── utils/                 # 工具类
│   ├── app.js                 # 入口文件
│   └── project.config.json    # 小程序配置
│
├── docker/                    # Docker配置
│   ├── docker-compose.yml
│   ├── php/Dockerfile
│   └── nginx/default.conf
│
└── README.md                  # 本文件
```

---

## 📖 菜单结构

### 1. 首页 (Dashboard)
数据概览、快捷入口

### 2. 基础管理
- 用户管理
- 角色管理
- 权限管理
- 人员管理
- 单位管理
- 日志管理
- 参数管理

### 3. 业务管理
- 免责协议管理
- 维修内容管理
- 绑定/解绑

### 4. 引流模块
- 成功案例
- 人工客服
- 抖音获客
- 合作企业

### 5. 维修业务
- 机械种类管理
- 机械名称管理
- 订单管理
  - 小程序订单
  - 手动创建订单
- 检测报告
  - 维修报价单
  - 检测费用
- 测试报告
- 维修报告
- 维修合同
- 维修提醒
- 联动维修
- 维修进度
  - 进度申请
  - 进度照片
  - 进度视频

### 6. 支付模块
- 转账支付
- 在线支付
- 发票管理

### 7. 进销存
- 配件管理
- 供应商管理

### 8. 查询统计
- 收入统计
- 开支统计
- 订单统计
- 超时统计

---

## 🔧 配置说明

### 后端配置 (.env)

```env
APP_DEBUG=true

DATABASE_TYPE=mysql
DATABASE_HOSTNAME=mysql
DATABASE_DATABASE=cmms_db
DATABASE_USERNAME=cmms_user
DATABASE_PASSWORD=cmms_pass
DATABASE_HOSTPORT=3306

REDIS_HOSTNAME=redis
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TTL=7200
JWT_REFRESH_TTL=604800
```

### 前端配置 (vite.config.js)

```javascript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true
      }
    }
  }
})
```

---

## 📊 数据库设计

主要数据表：

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| roles | 角色表 |
| permissions | 权限表 |
| machine_categories | 机械分类 |
| machines | 机械名称 |
| orders | 订单表 |
| repair_progress | 维修进度 |
| payments | 支付记录 |
| parts | 配件表 |
| suppliers | 供应商表 |
| statistics | 统计数据 |

---

## 🛠️ 常见问题

### Q1: 登录后点击菜单显示"登录已过期"？

**A**: 这是 `.env` 文件格式问题。确保使用扁平格式而非INI分区格式：

正确格式：
```
JWT_SECRET=your-key
```

错误格式：
```
[JWT]
SECRET = your-key
```

### Q2: Docker启动失败？

**A**: 检查端口是否被占用：
- 80端口 (Nginx)
- 3306端口 (MySQL)
- 6379端口 (Redis)

### Q3: 前端无法调用API？

**A**: 检查：
1. 后端服务是否正常运行
2. vite.config.js代理配置是否正确
3. 浏览器控制台是否有CORS错误

---

## 📝 更新日志

### v1.0.0 (2026-03-28)
- ✨ 完成8大核心功能模块
- ✨ 实现Web管理后台
- ✨ 实现微信小程序
- ✨ 修复JWT认证问题
- ✨ 完善Docker部署

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 🌟 Star History

如果这个项目对你有帮助，请给个 Star ⭐️

<div align="center">

**Made with ❤️**

</div>
"# maintain" 
