# 维修业务管理系统启动指南

## 📋 目录

1. [Docker 启动（推荐）](#docker-启动推荐)
2. [手动启动](#手动启动)
3. [访问地址](#访问地址)
4. [常见问题](#常见问题)

---

## 🐳 Docker 启动（推荐）

### 方式一：一键启动

```bash
# 进入项目根目录
cd d:\github-langchain-project\maintain

# Windows: 运行启动脚本
.\start-all.bat

# Linux/Mac:
./start-system.sh
```

### 方式二：分步启动

#### 1. 启动后端服务（Docker）

```bash
# 进入 docker 目录
cd d:\github-langchain-project\maintain\docker

# 启动所有容器
docker-compose up -d

# 查看启动日志
docker-compose logs -f
```

启动的服务包括：
- **Nginx** - Web服务器（端口 80）
- **PHP-FPM** - PHP应用服务
- **MySQL 8.0** - 数据库（端口 3306）
- **Redis 7.0** - 缓存（端口 6379）

#### 2. 启动前端服务

```bash
# 进入前端目录
cd d:\github-langchain-project\maintain\frontend-web

# 本机访问
npm run dev

# 局域网访问
npm run dev -- --host
```

#### 3. 启动微信小程序

```bash
# 打开微信开发者工具
# 导入项目目录：d:\github-langchain-project\maintain\miniprogram
# 选择 AppID（开发阶段可使用测试号）
```

---

## 💻 手动启动

### 前置要求

- **PHP**: >= 8.1
- **MySQL**: >= 8.0
- **Redis**: >= 7.0
- **Node.js**: >= 18.0
- **Composer**: 最新版

### 1. 启动后端服务

```bash
# 进入后端目录
cd d:\github-langchain-project\maintain\backend

# 安装依赖（首次运行）
composer install

# 配置环境变量（重要：使用扁平格式）
# 确保 .env 文件使用 KEY=VALUE 格式，而非 [SECTION] 格式
```

.env 正确格式示例：
```env
APP_DEBUG=true
DATABASE_TYPE=mysql
DATABASE_HOSTNAME=mysql
DATABASE_DATABASE=cmms_db
DATABASE_USERNAME=cmms_user
DATABASE_PASSWORD=cmms_pass
JWT_SECRET=your-secret-key-here
```

```bash
# 启动 PHP 内置服务器（开发用）
php think run

# 或使用 Nginx + PHP-FPM（生产环境）
```

### 2. 启动前端服务

```bash
# 进入前端目录
cd d:\github-langchain-project\maintain\frontend-web

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev

# 本机访问：http://localhost:5173
# 局域网访问：npm run dev -- --host
```

### 3. 启动微信小程序

```bash
# 1. 下载并安装微信开发者工具
# https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

# 2. 打开微信开发者工具，扫码登录

# 3. 导入项目
# 项目目录：d:\github-langchain-project\maintain\miniprogram
# AppID：使用测试号或填写自己的 AppID

# 4. 在详情中关闭域名校验（开发阶段）
# 设置 → 项目设置 → 不校验合法域名

# 5. 点击编译按钮
```

---

## 🌐 访问地址

### Docker 启动后的访问地址

| 服务 | 本机访问 | 局域网访问 |
|------|----------|------------|
| **Web 前端** | http://localhost | http://192.168.x.x |
| **后端 API** | http://localhost/api | http://192.168.x.x/api |
| **MySQL** | localhost:3306 | 192.168.x.x:3306 |
| **Redis** | localhost:6379 | 192.168.x.x:6379 |

### 开发环境（前端独立运行）

| 服务 | 地址 |
|------|------|
| **Web 前端** | http://localhost:5173 |
| **后端 API** | http://localhost/api |

### 默认登录账号

```
管理员账号:
用户名: admin
密码: admin123
```

---

## 🔧 Docker 常用命令

### 查看容器状态

```bash
cd docker
docker-compose ps
```

### 查看容器日志

```bash
# 查看所有日志
docker-compose logs

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看 PHP 日志
docker-compose logs -f php

# 查看 MySQL 日志
docker-compose logs -f mysql
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart nginx
docker-compose restart php
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 进入容器

```bash
# 进入 PHP 容器
docker exec -it docker-php-1 bash

# 进入 MySQL 容器
docker exec -it docker-mysql-1 bash

# 在 PHP 容器中执行命令
docker exec docker-php-1 php think
```

---

## 📱 前端常用命令

### 开发环境

```bash
cd frontend-web

# 启动开发服务器
npm run dev

# 启动并支持局域网访问
npm run dev -- --host

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 依赖管理

```bash
# 安装依赖
npm install

# 添加依赖
npm install package-name

# 移除依赖
npm uninstall package-name

# 更新依赖
npm update
```

---

## 🔍 验证服务状态

### 检查后端 API

```bash
# 测试 API 是否正常
curl http://localhost/api/diagnose-api

# 或在浏览器访问
# http://localhost/diagnose-api
```

### 检查前端

```bash
# 在浏览器访问
http://localhost:5173
```

### 检查 Docker 容器

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a
```

---

## ❓ 常见问题

### Q1: 登录后点击菜单显示"登录已过期"？

**A**: 这是 `.env` 文件格式问题。ThinkPHP 的 `env()` 函数不支持 INI 分区格式。

**解决方案**：确保 `.env` 文件使用扁平 `KEY=VALUE` 格式

正确格式：
```env
JWT_SECRET=your-secret-key
DATABASE_HOSTNAME=mysql
```

错误格式：
```env
[JWT]
SECRET = your-secret-key

[DATABASE]
HOSTNAME = mysql
```

### Q2: Docker 容器启动失败？

**A**: 检查端口是否被占用

```bash
# Windows 查看端口占用
netstat -ano | findstr :80
netstat -ano | findstr :3306

# 如果端口被占用，关闭占用进程或修改 docker-compose.yml 中的端口映射
```

### Q3: 前端无法连接后端 API？

**A**: 检查以下几点：

1. 确认 Docker 后端服务已启动
2. 检查前端 API 配置（`src/api/request.js`）
3. 检查浏览器控制台是否有 CORS 错误

```bash
# 测试后端 API
curl http://localhost/api/diagnose-api
```

### Q4: 局域网无法访问？

**A**: 检查防火墙设置

```bash
# Windows PowerShell（管理员）
# 允许 HTTP 端口
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=TCP localport=80

# 允许前端端口
netsh advfirewall firewall add rule name="Allow Frontend" dir=in action=allow protocol=TCP localport=5173
```

### Q5: 数据库连接失败？

**A**: 检查 MySQL 容器状态

```bash
# 查看日志
docker logs docker-mysql-1

# 进入容器
docker exec -it docker-mysql-1 bash

# 连接数据库
mysql -u cmms_user -p
# 密码：cmms_pass
```

### Q6: PHP 容器中 .env 文件没有更新？

**A**: 需要重启 PHP 容器以加载新的环境变量

```bash
# 重启 PHP 容器
docker restart docker-php-1
```

---

## 🚀 快速启动脚本

### Windows 批处理脚本

项目已包含 `start-all.bat` 脚本：

```batch
@echo off
echo ========================================
echo   维修业务管理系统启动脚本
echo ========================================

echo.
echo [1/3] 启动 Docker 后端服务...
cd docker
docker-compose up -d

echo.
echo [2/3] 等待服务启动...
timeout /t 10 /nobreak

echo.
echo [3/3] 启动前端服务...
cd ..\frontend-web
start npm run dev -- --host

echo.
echo ========================================
echo   系统启动完成！
echo ========================================
echo.
echo 后端 API: http://localhost/api
echo Web 前端: http://localhost:5173
echo.
pause
```

### 停止服务脚本

项目已包含 `stop-all.bat` 脚本：

```batch
@echo off
echo 正在停止所有服务...
cd docker
docker-compose down
echo 所有服务已停止。
pause
```

---

## 📞 技术支持

如遇到问题，请检查：

1. ✅ Docker 是否正常运行
2. ✅ 端口是否被占用
3. ✅ 防火墙是否允许访问
4. ✅ 浏览器控制台是否有错误
5. ✅ Docker 容器日志是否有异常
6. ✅ `.env` 文件格式是否正确

---

**祝您使用愉快！**
