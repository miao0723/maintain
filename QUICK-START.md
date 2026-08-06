# 🚀 CMMS 系统快速启动指南

**最后更新**: 2026-03-20
**当前状态**: ✅ 已部署

---

## 🎯 快速访问

### 前端管理界面

```
http://localhost:3000
```

**默认登录**:
- 用户名: `admin`
- 密码: `admin123`

### 服务状态

| 服务 | 状态 | 端口 |
|------|------|------|
| Docker | ✅ 运行中 | - |
| MySQL | ✅ 运行中 | 3306 |
| Redis | ✅ 运行中 | 6379 |
| 前端Web | ✅ 运行中 | 3000 |

---

## 📋 部署前准备

### 必需软件
- ✅ Docker Desktop 29.0+ （已安装）
- ✅ Node.js 18+ （前端构建）
- ✅ 微信开发者工具 （小程序开发）

### 端口检查
确保以下端口未被占用：
- 80 - Nginx
- 3306 - MySQL
- 6379 - Redis

---

## 🐳 方案一：Docker一键部署（推荐）

### 1. 启动后端服务

```powershell
# 在项目根目录执行
cd d:\github-langchain-project\maintain

# 方式1: 使用部署脚本（推荐）
deploy.bat

# 方式2: 手动执行
docker-compose up -d
```

### 2. 检查服务状态

```powershell
# 查看容器状态
docker-compose ps

# 查看日志（如有问题）
docker-compose logs -f php
```

### 3. 测试后端API

浏览器访问：http://localhost/api

应该返回API响应（或404，说明服务正常运行）

### 4. 访问系统

- **后端API**: http://localhost/api
- **测试账号**: admin / 123456

---

## 🌐 方案二：本地部署（Windows + WAMP）

如果没有Docker，可以使用WAMP/XAMPP：

### 1. 安装依赖

```powershell
# 安装PHP依赖
cd backend
composer install

# 如果没有composer，先下载：
# https://getcomposer.org/Composer-Setup.exe
```

### 2. 配置数据库

```sql
-- 创建数据库
CREATE DATABASE cmms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'cmms_user'@'localhost' IDENTIFIED BY 'cmms_pass';
GRANT ALL PRIVILEGES ON cmms_db.* TO 'cmms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置环境

```powershell
# 复制配置文件
cd backend
copy .env.example .env

# 编辑.env文件，修改数据库配置
# notepad .env
```

### 4. 初始化数据库

```powershell
# 执行数据库迁移
php migrate.php

# 如果migrate.php不存在，手动导入SQL文件
# （需要创建SQL导出文件）
```

### 5. 启动服务

```powershell
# 启动WAMP/XAMPP
# 确保Apache和MySQL都在运行
```

---

## 🎨 前端部署

### 方式1：开发模式（推荐用于测试）

```powershell
# 进入前端目录
cd frontend-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问：http://localhost:3000（或Vite显示的端口）

### 方式2：生产构建

```powershell
# 构建生产版本
npm run build

# 构建完成后，dist目录包含所有静态文件
# 可以部署到Nginx/Apache
```

---

## 📱 小程序部署

### 用户端小程序

```javascript
// 1. 修改API地址
// 打开 miniprogram/user/utils/api.js
const BASE_URL = 'http://localhost/api'  // 开发环境
// const BASE_URL = 'https://your-domain.com/api'  // 生产环境

// 2. 微信开发者工具
// - 打开 miniprogram/user 目录
// - 点击"编译"
// - 在模拟器中预览
```

### 工程师端小程序

```javascript
// 1. 修改API地址（同上）
// 打开 miniprogram/engineer/utils/api.js
const BASE_URL = 'http://localhost/api'

// 2. 微信开发者工具
// - 打开 miniprogram/engineer 目录
// - 点击"编译"
```

---

## ✅ 验证部署

### 1. 后端检查

```powershell
# 测试API
curl http://localhost/api/auth/login

# 或浏览器访问
# http://localhost/api/auth/login
```

### 2. 前端检查

```powershell
# 访问前端页面
http://localhost:3000

# 登录测试
账号: admin
密码: 123456
```

### 3. 小程序检查

- 打开微信开发者工具
- 选择对应的小程序目录
- 检查API调用是否正常

---

## 🐛 常见问题

### 问题1: Docker容器启动失败

```powershell
# 查看错误日志
docker-compose logs mysql
docker-compose logs php
docker-compose logs nginx

# 重启容器
docker-compose down
docker-compose up -d
```

### 问题2: 端口被占用

```powershell
# Windows查看端口占用
netstat -ano | findstr :80
netstat -ano | findstr :3306

# 修改docker-compose.yml中的端口映射
ports:
  - "8080:80"  # 改用8080端口
```

### 问题3: 数据库连接失败

```powershell
# 检查MySQL容器
docker-compose exec mysql mysql -uroot -proot123

# 检查.env配置
# 确保数据库配置与docker-compose.yml一致
```

### 问题4: 前端无法调用API

```javascript
// 检查vite.config.js中的代理配置
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost/api',
      changeOrigin: true
    }
  }
}
```

---

## 🎯 下一步

部署成功后，您可以：

1. **测试功能**
   - 创建设备
   - 创建工单
   - 查看报表

2. **生产部署**
   - 修改.env配置
   - 使用域名和SSL证书
   - 参考完整部署文档

3. **二次开发**
   - 查看API文档
   - 了解代码结构
   - 添加自定义功能

---

## 📞 获取帮助

- **系统文档**: [docs/](docs/)
- **部署指南**: [docs/deployment/](docs/deployment/)
- **API文档**: [docs/api/](docs/api/)
- **问题反馈**: GitHub Issues

---

**祝您部署顺利！🎉**
