# 环境准备指南

本文档详细介绍CMMS系统部署所需的服务器环境准备。

## 📋 系统要求

### 最低配置（开发环境）

| 资源 | 要求 | 说明 |
|------|------|------|
| CPU | 2核 | 单机部署 |
| 内存 | 4GB | 含数据库和缓存 |
| 磁盘 | 40GB SSD | 系统盘 |
| 带宽 | 5Mbps | 公网带宽 |
| 操作系统 | Ubuntu 20.04+ / CentOS 8+ | Linux系统 |

### 推荐配置（生产环境）

| 资源 | 要求 | 说明 |
|------|------|------|
| CPU | 4核+ | 高并发场景建议8核+ |
| 内存 | 8GB+ | 建议16GB |
| 磁盘 | 100GB+ SSD | 数据盘单独挂载 |
| 带宽 | 10Mbps+ | 根据访问量调整 |
| 操作系统 | Ubuntu 22.04 LTS | 长期支持版本 |

### 高可用配置（大型部署）

- **负载均衡**: 2台服务器
- **应用服务器**: 2-4台
- **数据库主从**: 主库1台 + 从库1-2台
- **Redis集群**: 3台（主从+哨兵）
- **文件存储**: OSS/NFS

## 🔧 软件依赖

### 后端环境

```bash
# 必需软件
PHP >= 8.1
MySQL >= 8.0
Redis >= 7.0
Nginx >= 1.20
Composer >= 2.0

# PHP扩展（必需）
php-fpm
php-mysql
php-redis
php-json
php-mbstring
php-curl
php-gd
php-zip
php-xml
php-bcmath
```

### 前端环境

```bash
# 本地构建环境
Node.js >= 18.0
npm >= 9.0

# 生产环境（可选）
# 如果在服务器上构建，需要安装Node.js
# 如果使用预构建文件，则不需要
```

### 小程序环境

```bash
# 开发环境
微信开发者工具（最新版）

# 生产环境
小程序AppID
服务器域名（已备案）
HTTPS证书
```

## 🖥️ 服务器初始化（Ubuntu）

### 1. 系统更新

```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim unzip htop tree
```

### 2. 时区设置

```bash
# 设置时区为上海
sudo timedatectl set-timezone Asia/Shanghai

# 验证时区
date
```

### 3. 防火墙配置

```bash
# 安装ufw防火墙
sudo apt install -y ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 4. 创建部署用户

```bash
# 创建部署用户
sudo adduser cmms

# 添加到sudo组（可选）
sudo usermod -aG sudo cmms

# 切换到部署用户
su - cmms
```

## 📦 安装PHP 8.1

### Ubuntu/Debian

```bash
# 添加PHP PPA仓库
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php
sudo apt update

# 安装PHP和扩展
sudo apt install -y php8.1 \
    php8.1-fpm \
    php8.1-mysql \
    php8.1-redis \
    php8.1-mbstring \
    php8.1-curl \
    php8.1-gd \
    php8.1-zip \
    php8.1-xml \
    php8.1-bcmath \
    php8.1-intl

# 验证安装
php -v
php -m
```

### CentOS/RHEL

```bash
# 添加EPEL和Remi仓库
sudo yum install -y epel-release
sudo yum install -y https://rpms.remirepo.net/enterprise/remi-release-8.rpm

# 启用PHP 8.1
sudo yum module enable php:remi-8.1 -y

# 安装PHP和扩展
sudo yum install -y php php-fpm \
    php-mysqlnd \
    php-redis \
    php-mbstring \
    php-curl \
    php-gd \
    php-zip \
    php-xml \
    php-bcmath

# 验证安装
php -v
php -m
```

### PHP配置优化

```bash
# 编辑php.ini
sudo vim /etc/php/8.1/fpm/php.ini

# 推荐配置
memory_limit = 256M
post_max_size = 50M
upload_max_filesize = 50M
max_execution_time = 300
max_input_time = 300
date.timezone = Asia/Shanghai

# 重启PHP-FPM
sudo systemctl restart php8.1-fpm
sudo systemctl enable php8.1-fpm
```

## 🗄️ 安装MySQL 8.0

### Ubuntu/Debian

```bash
# 安装MySQL
sudo apt install -y mysql-server

# 安全配置
sudo mysql_secure_installation

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

### CentOS/RHEL

```bash
# 安装MySQL
sudo yum install -y mysql-server

# 安全配置
sudo mysql_secure_installation

# 启动服务
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 创建数据库

```bash
# 登录MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE cmms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cmms_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON cmms_db.* TO 'cmms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 验证连接
mysql -u cmms_user -p cmms_db
```

### MySQL优化配置

```bash
# 编辑配置文件
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf

# 推荐配置
[mysqld]
# 连接配置
max_connections = 500
max_connect_errors = 1000

# InnoDB配置
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 查询缓存（可选）
query_cache_size = 0
query_cache_type = 0

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 重启MySQL
sudo systemctl restart mysql
```

## 🔴 安装Redis

```bash
# 安装Redis
sudo apt install -y redis-server

# 配置Redis
sudo vim /etc/redis/redis.conf

# 设置密码（重要）
requirepass your_redis_password

# 绑定地址
bind 127.0.0.1

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 启动服务
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试连接
redis-cli
AUTH your_redis_password
PING
```

## 🌐 安装Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
curl http://localhost
```

### Nginx基础配置

```bash
# 创建站点配置目录
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# 编辑nginx.conf
sudo vim /etc/nginx/nginx.conf

# 添加以下配置
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 🔐 SSL证书配置

### 使用Let's Encrypt（免费）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 手动配置证书

```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 复制证书文件
sudo cp your-cert.crt /etc/nginx/ssl/
sudo cp your-cert.key /etc/nginx/ssl/

# 设置权限
sudo chmod 644 /etc/nginx/ssl/your-cert.crt
sudo chmod 600 /etc/nginx/ssl/your-cert.key
```

## 📦 安装Composer

```bash
# 下载Composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

# 安装
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer

# 验证
composer --version

# 清理
php -r "unlink('composer-setup.php');"

# 配置国内镜像（可选）
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/
```

## 🟢 安装Node.js（前端构建）

### 使用NVM（推荐）

```bash
# 安装NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.bashrc

# 安装Node.js
nvm install 18
nvm use 18

# 验证
node -v
npm -v

# 配置国内镜像
npm config set registry https://registry.npmmirror.com
```

### 使用包管理器

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node -v
npm -v
```

## 🐳 安装Docker（可选）

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 添加用户到docker组
sudo usermod -aG docker $USER

# 验证
docker --version
docker-compose --version
```

## ✅ 环境验证

### 检查脚本

```bash
#!/bin/bash
# check-env.sh

echo "====== 环境检查 ======"

# PHP
echo -n "PHP版本: "
php -v | head -n 1

# MySQL
echo -n "MySQL版本: "
mysql -V

# Redis
echo -n "Redis版本: "
redis-cli --version

# Nginx
echo -n "Nginx版本: "
nginx -v 2>&1 | head -n 1

# Composer
echo -n "Composer版本: "
composer --version 2>&1 | head -n 1

# Node.js
echo -n "Node.js版本: "
node -v

# npm
echo -n "npm版本: "
npm -v

echo "====== 服务状态 ======"
systemctl is-active php8.1-fpm && echo "✓ PHP-FPM 运行中" || echo "✗ PHP-FPM 未运行"
systemctl is-active mysql && echo "✓ MySQL 运行中" || echo "✗ MySQL 未运行"
systemctl is-active redis-server && echo "✓ Redis 运行中" || echo "✗ Redis 未运行"
systemctl is-active nginx && echo "✓ Nginx 运行中" || echo "✗ Nginx 未运行"

echo "====== 端口监听 ======"
netstat -tlnp | grep -E ':(80|443|3306|6379|9000)'
```

### 运行检查

```bash
chmod +x check-env.sh
./check-env.sh
```

## 🎯 下一步

环境准备完成后，请继续：

- **[后端部署](02-backend-deployment.md)** - 部署ThinkPHP后端
- **[前端部署](03-frontend-deployment.md)** - 部署Vue 3前端
- **[小程序部署](04-miniprogram-deployment.md)** - 发布微信小程序

## 📞 故障排除

### PHP-FPM无法启动

```bash
# 查看错误日志
sudo tail -f /var/log/php8.1-fpm.log

# 检查配置
sudo php-fpm8.1 -t

# 重启服务
sudo systemctl restart php8.1-fpm
```

### MySQL无法启动

```bash
# 查看错误日志
sudo tail -f /var/log/mysql/error.log

# 检查配置
sudo mysqld --validate-config

# 重启服务
sudo systemctl restart mysql
```

### Nginx配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重启服务
sudo systemctl restart nginx
```

---

**下一步**: [后端部署](02-backend-deployment.md) →
