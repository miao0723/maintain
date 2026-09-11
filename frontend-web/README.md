# CMMS Web 管理后台

## 项目概述

这是 CMMS（维修全流程管理系统）的 Web 管理后台，基于 Vue 3 + Element Plus 开发。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **UI组件**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **图表**: ECharts
- **HTTP客户端**: Axios
- **构建工具**: Vite

## 项目结构

```
frontend-web/
├── src/
│   ├── api/              # API接口
│   │   ├── request.js    # axios封装
│   │   ├── auth.js       # 认证相关
│   │   ├── workorder.js  # 工单接口
│   │   ├── device.js     # 设备接口
│   │   ├── engineer.js   # 人员接口
│   │   ├── inventory.js  # 库存接口
│   │   ├── report.js     # 报表接口
│   │   └── system.js     # 系统管理接口
│   ├── components/       # 公共组件
│   │   └── ImageUpload.vue
│   ├── layout/           # 布局组件
│   │   └── Index.vue     # 主布局
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── stores/           # Pinia状态管理
│   │   └── auth.js       # 认证状态
│   ├── styles/           # 全局样式
│   │   └── index.scss
│   ├── views/            # 页面组件
│   │   ├── login/        # 登录页
│   │   ├── dashboard/    # 首页仪表盘
│   │   ├── workorder/    # 工单管理
│   │   ├── device/       # 设备管理
│   │   ├── engineer/     # 人员管理
│   │   ├── inventory/    # 库存管理
│   │   ├── report/       # 报表中心
│   │   ├── system/       # 系统管理
│   │   ├── inspection/   # 巡检管理
│   │   ├── maintenance/  # 保养管理
│   │   ├── knowledge/    # 知识库
│   │   ├── supplier/     # 供应商管理
│   │   ├── notification/ # 通知消息
│   │   └── error/        # 错误页面
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 功能模块

### 1. 认证系统
- JWT Token认证
- 自动刷新Token
- 路由守卫
- 权限控制

### 2. 首页仪表盘
- 工单统计卡片
- 工单趋势图
- 故障类型分布
- 设备状态分布
- 工程师绩效排行
- 最新工单列表

### 3. 维修工单管理
- 工单列表（筛选、搜索）
- 创建工单
- 指派维修人
- 查看工单详情
- 工单状态跟踪

### 4. 设备资产管理
- 设备列表
- 设备分类管理
- 设备二维码生成
- 设备维修历史

### 5. 维修人员管理
- 工程师列表
- 排班管理
- 绩效统计
- 智能推荐

### 6. 备件库存管理
- 配件列表
- 库存预警
- 入库/出库
- 出入库记录

### 7. 报表中心
- 工单报表
- 成本报表
- 设备故障分析
- 工程师绩效
- 配件消耗统计
- 报表导出

### 8. 系统管理
- 用户管理
- 部门管理
- 权限管理
- 系统设置

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接上传到服务器使用（见下方「部署到服务器」）。

### 预览生产版本

```bash
npm run preview
```

## 部署到服务器（直接上传可用）

### 1. 构建

```bash
npm install
npm run build
```

### 2. 上传 dist 目录

将 `dist/` 目录的全部内容上传到服务器站点根目录，例如：

```bash
scp -r dist/* root@your-server:/var/www/cmms-web/
```

### 3. 修改后端接口地址（无需重新构建）

`dist/config.js` 是运行时配置，上传后直接编辑即可切换后端地址：

```javascript
window.__APP_CONFIG__ = {
  apiBase: '/api'   // 同源部署保持 /api；跨域部署改为 'https://api.example.com/api'
}
```

- **同源部署（推荐）**：前端与后端 API 在同一域名下，由 Nginx 网关统一转发 `/api`，保持 `/api` 即可（本项目 `docker/nginx/default.conf` 已配置好）。
- **跨域部署**：填写后端完整地址（以 `/api` 结尾、不带末尾斜杠），且后端需要开启 CORS。

### 4. Nginx 站点配置要点

SPA 使用 History 路由，服务器必须做回退配置，否则刷新子页面会 404：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/cmms-web;
    index index.html;

    # 静态资源长缓存（文件名带 hash，可放心缓存）
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 接口转发到后端（同源部署）
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # index.html 不缓存，保证发版立即生效
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
```

> 完整网关配置（含 HTTPS、小程序后端、上传目录）参见项目根目录 `docker/nginx/default.conf`。

## 默认账号

- 用户名: `admin`
- 密码: `123456`

## 开发说明

### API请求

所有API请求都在 `src/api/` 目录下，使用统一的 `request` 实例：

```javascript
import request from './request'

export function getData() {
  return request({
    url: '/endpoint',   // 注意：baseURL 已包含 /api 前缀，这里不要再写 /api
    method: 'get'
  })
}
```

### 路由配置

路由配置在 `src/router/index.js`，支持嵌套路由和路由守卫。

### 状态管理

使用Pinia进行状态管理，stores在 `src/stores/` 目录下。

### 权限控制

```javascript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 检查权限
if (authStore.hasPermission('module', 'action')) {
  // 有权限
}
```

## 样式规范

- 使用 SCSS
- 组件样式 scoped
- 全局样式在 `src/styles/index.scss`
- 遵循 BEM 命名规范

## 注意事项

1. **API代理**: 开发环境通过Vite代理到后端API
2. **Token存储**: Token存储在localStorage
3. **路由守卫**: 自动检查登录状态
4. **错误处理**: 统一的错误提示
5. **响应式**: 适配PC端浏览器

## 待完成功能

- [ ] 设备管理完整页面
- [ ] 维修人员管理完整页面
- [ ] 备件库存管理完整页面
- [ ] 巡检管理页面
- [ ] 保养管理页面
- [ ] 故障知识库页面
- [ ] 供应商管理页面
- [ ] 报表中心完整页面
- [ ] 系统管理完整页面
- [ ] 通知消息页面
