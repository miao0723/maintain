# Docker 全栈部署说明

本目录将 **后台管理系统（前端 + 后端）** 与 **小程序（前端 + 后端）** 四端统一编排部署。

## 一、服务构成

| 服务 | 说明 | 技术栈 | 容器端口 | 宿主端口 |
|------|------|--------|----------|----------|
| `nginx` | 统一入口网关 | Nginx 1.24 | 80 | **80** |
| `frontend-web` | 后台管理系统前端 | Vue3 + Vite + Nginx | 80 | 8081 |
| `php` | 后台管理系统后端 | ThinkPHP + PHP-FPM | 9000 | — |
| `miniprogram-backend` | 小程序后端 | Node.js 20 + Express + WS | 3001 | **3001** |
| `mysql` | 数据库 | MySQL 8.0 | 3306 | 3306 |
| `redis` | 缓存 | Redis 7 | 6379 | 6379 |
| `agent-service` | AI Agent 服务 | Python | 8001 | 8001 |
| `milvus` / `etcd` / `minio` | 向量检索 | Milvus 2.4 | 19530 | 19530 |
| `embedding-service` | 文本向量化 | Python | 8080 | 8088 |
| `milvus-rest` | Milvus REST 封装 | Python | 8080 | 8089 |

> 小程序前端是微信小程序（`电子维修2.0/`），需通过微信开发者工具上传发布，**不适合容器化**，
> 容器化的是它所依赖的后端服务。

## 二、访问入口

统一从网关 `http://<服务器IP>/` 进入：

| 路径 | 转发目标 | 用途 |
|------|----------|------|
| `/` | `frontend-web` | 后台管理系统页面（SPA） |
| `/api/*` | `php` | 后台管理系统接口 |
| `/mp-api/*` | `miniprogram-backend` 的 `/api/*` | 小程序接口（网关方式） |
| `/ws/chat` | `miniprogram-backend` | 小程序 WebSocket 聊天 |
| `/mp-health` | `miniprogram-backend` 的 `/health` | 小程序后端健康检查 |
| `/uploads/*` | 共享上传目录 | 小程序与后台共用的图片/附件 |

小程序也可继续直连 `http://<服务器IP>:3001/api`（`电子维修2.0/utils/config.js` 中配置）。

## 三、首次部署

### 1. 准备环境变量

```powershell
# 后台管理系统后端（已存在则跳过）
# docker/.env.docker

# 小程序后端
Copy-Item docker/.env.miniprogram.example docker/.env.miniprogram
# 然后编辑 docker/.env.miniprogram 填入真实密钥
```

`.env.miniprogram` 关键项：

- `DB_HOST` / `CMMS_DB_HOST` 必须填 **`mysql`**（容器服务名），不能填 `localhost`
- `HOST` 填对外可访问地址，用于生成图片绝对 URL，如 `http://192.168.8.72:3001`
- `DEEPSEEK_API_KEY` 与 `Deepseek_api_key` 两个键都要填（代码中两种写法都有使用）

### 2. 构建并启动

```powershell
cd docker
docker compose build
docker compose up -d
```

### 3. 查看状态

```powershell
docker compose ps
docker compose logs -f miniprogram-backend
docker compose logs -f frontend-web
```

## 四、常用操作

```powershell
# 仅重建后台前端（改了 Vue 代码后）
docker compose build frontend-web; docker compose up -d frontend-web

# 仅重建小程序后端（改了 Node 代码后）
docker compose build miniprogram-backend; docker compose up -d miniprogram-backend

# 后台 PHP 代码通过目录挂载，改完即时生效，无需重建

# 重载网关（改了 nginx/default.conf 后）
docker compose restart nginx

# 停止全部
docker compose down
```

## 五、重要设计说明

### 1. 前端无需配置 API 地址

`frontend-web` 的请求使用相对路径 `/api`，由网关同源转发到 PHP，
因此**不存在跨域问题**，也不需要在构建时注入后端地址。

### 2. 上传目录三方共享

`电子维修2.0/uploads` 同时挂载到：

- `miniprogram-backend` 容器的 `/uploads`（小程序写入）
- `php` 容器的 `/var/www/html/miniprogram-uploads`（后台读取）
- `nginx` 容器（对外提供 `/uploads/*` 静态访问）

### 3. `.env` 不打进镜像

小程序后端 `server.js` 使用 `dotenv` 的 `override: true` 加载 `.env`，
若把 `.env` 打进镜像会**覆盖 compose 注入的容器变量**，导致连接 `localhost` 数据库失败。
因此根目录 `.dockerignore` 已排除 `**/.env`，配置一律通过 `env_file` 注入。

### 4. 数据库自动初始化

`docker/mysql/init/01-create-databases.sql` 在 MySQL 数据卷为空时自动执行，
创建 `cmms_db`（后台）与 `repair`（小程序）两个库。
若使用已有数据卷，需手动导入业务数据。

## 六、故障排查

| 现象 | 原因与处理 |
|------|-----------|
| `/mp-api/*` 返回 502 | 小程序后端启动晚于网关，执行 `docker compose restart nginx` |
| 小程序后端连不上数据库 | 检查 `.env.miniprogram` 中 `DB_HOST` 是否为 `mysql` |
| 日志出现 `ER_DUP_FIELDNAME` | 建表迁移幂等提示，属正常现象，不影响运行 |
| 前端构建时上下文传输失败 | 项目根目录较大，重试即可；确认根目录 `.dockerignore` 生效 |
