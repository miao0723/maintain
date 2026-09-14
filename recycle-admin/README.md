# 电子产品回收综合服务平台（独立回收后台系统）

<div align="center">

**Electronic Device Recycling Comprehensive Service Platform**

独立于维修后台管理系统部署的回收业务综合管理平台（同域名、不同端口），与微信小程序「回收估价/下单」业务共用同一个 MySQL 数据库。

</div>

---

## 📋 系统定位

本系统是「回收系统综合平台」的管理后台，**独立进程、独立端口、独立账号体系**，不依赖维修后台管理系统（ThinkPHP + frontend-web）运行：

- 回收订单直接读取业务库 `orders` 表（`order_type='recycle'`），小程序提交的回收单实时可见、可报价、可流转
- 设备配价库（分类→品牌→型号→基准回收价）由本系统维护，小程序端自动同步最新配价
- 回收平台信息、采购网站链接统一管理，支持一键跳转与点击统计

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────┐
│  recycle-admin  (本系统, 端口 3005)                   │
│  server/  Node.js + Express  管理API + 托管web/dist  │
│  web/     Vue 3 + Element Plus + ECharts (开发5175)  │
└───────────────────────┬─────────────────────────────┘
                        │ 共享同一个 MySQL 库
┌───────────────────────┴─────────────────────────────┐
│  小程序后端 (端口 3001)                               │
│  /api/recycle/catalog   公开读配价目录（含缓存10min）  │
│  /api/recycle/platforms 公开读回收平台（平台比价区）   │
│  /api/recycle/config    公开读估价系数配置            │
│  /api/recycle/click     上报小程序端跳转点击          │
└───────────────────────┬─────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              │ 微信小程序（回收页） │
              │ 云端配价优先+本地兜底 │
              └───────────────────┘
```

## ✨ 功能模块

| 模块 | 说明 |
|------|------|
| 📊 数据看板 | 订单量/成交额/待处理统计、30天趋势、设备类型分布、热门机型TOP10 |
| 📋 回收订单 | 列表筛选（状态/成色/时间/关键词）、详情、**提交报价**（写入 orders，小程序端可见）、状态流转、手动创建线下回收单、CSV导出 |
| 💰 设备配价库 | 分类/品牌/型号三级管理，**基准回收价调整**（幅度超限二次确认）、批量按比例/固定值调价、调价记录审计、上下架/热门标记 |
| 🛒 回收平台管理 | 回收平台/采购渠道/比价参考档案（服务方式/结算/佣金），一键跳转并统计点击 |
| 🔗 采购链接管理 | 按设备分类/型号存储采购网站链接，跳转统计（近30天趋势 + TOP10） |
| ⚙️ 估价配置 | 成色/屏幕/功能/版本/配件/维修史六因子系数管理（直接决定小程序估价结果）、估价示例演算 |
| 📈 数据统计 | 自定义区间订单趋势、状态/价格段/成色分布、机型排行 |
| 🛠️ 系统设置 | 回收参数（基准系数/AI开关/回收须知等）、管理员管理（super/admin/viewer三角色）、操作日志 |

## 🚀 快速开始

### 本地开发

```bash
# 1. 后端（端口 3005，自动建表+灌入配价种子）
cd recycle-admin/server
npm install
cp .env.example .env       # 按需修改数据库配置
npm start

# 2. 前端（端口 5175，代理到3005）
cd recycle-admin/web
npm install
npm run dev
```

访问 http://localhost:5175 ，默认账号 `admin / admin123`（首次登录后请修改）。

### 生产部署（单端口）

```bash
cd recycle-admin/web && npm run build   # 构建到 web/dist
cd ../server && npm start               # 3005 端口同时提供页面与API
```

服务器部署时将 `server/.env` 的数据库指向与小程序后端相同的 MySQL（参见 `小程序2.0/backend/.env` 的 DB_HOST）：

```env
PORT=3005
DB_HOST=sqfe2-mysql-1
DB_PORT=3306
DB_USER=sqfe2_user
DB_PASSWORD=******
DB_NAME=repair
JWT_SECRET=<请修改为强随机串>
```

## 🗄️ 数据表

| 表 | 说明 |
|----|------|
| `recycle_admins` | 本系统独立管理员账号（bcrypt） |
| `recycle_categories / recycle_brands / recycle_models` | 配价库三级结构（models.base_price 即基准回收价） |
| `recycle_price_logs` | 每次调价记录（改前/改后/原因/操作人） |
| `recycle_platforms` | 回收平台/采购渠道/比价参考档案 |
| `recycle_procurement_links` | 采购网站平台链接（按分类/型号关联） |
| `recycle_click_logs` | 平台/链接跳转日志（区分 admin/mini 来源） |
| `recycle_condition_rates` | 估价因子系数（成色/屏幕/功能等） |
| `recycle_settings` | 系统参数（base_factor / ai_evaluate_enabled / recycle_notice 等） |
| `recycle_operation_logs` | 后台操作审计日志 |

> 回收订单不建新表，直接使用业务库 `orders`（`order_type='recycle'`），与小程序数据天然一致。

## 🔌 对外 API（小程序后端已内置公开读接口）

| 接口 | 说明 |
|------|------|
| `GET /api/recycle/catalog` | 配价目录（仅上架），未初始化时 `managed=false`，小程序回退本地数据 |
| `GET /api/recycle/platforms` | 启用中的回收平台 |
| `GET /api/recycle/config` | 估价系数与参数 |
| `POST /api/recycle/click` | 上报小程序端跳转点击 |

## 📁 目录结构

```
recycle-admin/
├── server/                 # Node.js 后端服务（端口3005）
│   ├── server.js           # 入口：API + 托管 web/dist
│   ├── database.js         # 连接池 + 自动建表 + 种子数据
│   ├── middleware/auth.js  # JWT认证 + 角色控制
│   ├── routes/             # auth/order/catalog/platform/link/stats/setting
│   ├── scripts/gen-catalog.js  # 从小程序 recycleData.js 生成配价种子
│   └── data/catalog.json   # 种子数据（12分类/72品牌/323型号）
└── web/                    # Vue3 管理前端（开发端口5175）
    └── src/views/          # Login/Dashboard/Orders/Catalog/Platforms/Links/Pricing/Stats/Settings
```

## 🔄 配价更新链路

```
后台调价（recycle_models.base_price）
  → 小程序回收页 10 分钟缓存自动过期
  → /api/recycle/catalog 拉取最新配价覆盖本地
  → 用户估价/下单使用最新基准价
```
