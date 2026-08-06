# 后端部署指南

本文档介绍如何将CMMS后端系统部署到生产环境。

---

## 📋 目录

- [环境要求](#环境要求)
- [服务器准备](#服务器准备)
- [部署步骤](#部署步骤)
- [配置优化](#配置优化)
- [安全加固](#安全加固)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

---

## 💻 环境要求

### 软件要求

| 软件 | 版本 | 说明 |
|------|------|------|
| PHP | >= 8.1 | 推荐8.1.x |
| MySQL | >= 8.0 | 推荐8.0.x |
| Nginx | >= 1.20 | Web服务器 |
| Redis | >= 7.0 | 缓存和队列 |
| Composer | >= 2.0 | PHP依赖管理 |

### 硬件要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 硬盘 | 40GB SSD | 80GB SSD |
| 带宽 | 5Mbps | 10Mbps |

---

## 🖥️ 服务器准备

### 1. 安装PHP 8.1

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install php8.1 php8.1-fpm php8.1-mysql php8.1-redis php8.1-mbstring php8.1-xml php8.1-curl

# CentOS/RHEL
sudo yum install php81-php-cli php81-php-fpm php81-php-mysqlnd php81-php-pecl-redis
```

### 2. 安装MySQL 8.0

```bash
# Ubuntu/Debian
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

### 3. 安装Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# 启动Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. 安装Composer

```bash
# 下载Composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"

# 安装Composer
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer

# 验证安装
composer --version
```

### 5. 安装Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🚀 部署步骤

### 1. 上传代码

```bash
# 使用Git克隆
cd /var/www
sudo git clone https://github.com/yourusername/cmms.git
cd cmms/backend

# 或使用SCP上传
# scp -r /path/to/local/backend user@server:/var/www/cmms/
```

### 2. 安装依赖

```bash
cd /var/www/cmms/backend

# 安装Composer依赖
sudo composer install --no-dev --optimize-autoloader

# 设置权限
sudo chown -R www-data:www-data /var/www/cmms/backend
sudo chmod -R 755 /var/www/cmms/backend
sudo chmod -R 777 runtime
```

### 3. 配置环境

```bash
# 复制配置文件
cp .env.example .env

# 编辑配置文件
sudo vi .env
```

配置内容：

```env
[APP]
DEBUG = false

[DATABASE]
TYPE = mysql
HOSTNAME = 127.0.0.1
DATABASE = cmms_prod
USERNAME = cmms_user
PASSWORD = your_secure_password
HOSTPORT = 3306
PREFIX =

[JWT]
SECRET = your_jwt_secret_key_min_32_characters_long
EXPIRE = 7200

[CACHE]
DRIVER = redis
HOSTNAME = 127.0.0.1
PORT = 6379
```

### 4. 初始化数据库

```bash
# 创建数据库
sudo mysql -u root -p
```

```sql
CREATE DATABASE cmms_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cmms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cmms_prod.* TO 'cmms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 执行迁移
php migrate.php

# 初始化数据（可选）
php seed.php
```

### 5. 配置Nginx

```bash
sudo vi /etc/nginx/sites-available/cmms
```

配置内容：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/cmms/backend/public;

    index index.php;

    # 日志
    access_log /var/log/nginx/cmms-access.log;
    error_log /var/log/nginx/cmms-error.log;

    # URL重写
    location / {
        if (!-e $request_filename) {
            rewrite ^(.*)$ /index.php?s=$1 last;
        }
    }

    # PHP处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 禁止访问敏感文件
    location ~ /\.(htaccess|htpasswd|git|env) {
        deny all;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. 配置SSL证书（推荐）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## ⚙️ 配置优化

### 1. PHP配置

编辑 `php.ini`：

```ini
# 上传文件大小
upload_max_filesize = 10M
post_max_size = 10M

# 内存限制
memory_limit = 256M

# 执行时间
max_execution_time = 300

# 时区
date.timezone = Asia/Shanghai
```

### 2. MySQL优化

编辑 `my.cnf`：

```ini
[mysqld]
# 缓冲区大小
innodb_buffer_pool_size = 1G

# 日志文件大小
innodb_log_file_size = 256M

# 连接数
max_connections = 200

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

### 3. Redis优化

编辑 `redis.conf`：

```conf
# 最大内存
maxmemory 512mb

# 内存策略
maxmemory-policy allkeys-lru

# 持久化
save 900 1
save 300 10
save 60 10000
```

### 4. Nginx优化

```nginx
# Gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

# 缓存
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

### 2. 修改默认SSH端口

```bash
sudo vi /etc/ssh/sshd_config

# 修改端口
Port 22222

# 重启SSH
sudo systemctl restart sshd
```

### 3. 禁用root远程登录

```bash
sudo vi /etc/ssh/sshd_config

PermitRootLogin no

sudo systemctl restart sshd
```

### 4. 安装Fail2ban

```bash
sudo apt install fail2ban

# 配置Fail2ban
sudo vi /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22222
logpath = /var/log/auth.log
```

---

## 🔧 性能优化

### 1. 启用OPcache

编辑 `php.ini`：

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

### 2. 配置数据库连接池

在 `.env` 中配置：

```env
[DATABASE]
// ...
POOL_SIZE = 20
```

### 3. 使用CDN

对于静态资源，建议使用CDN加速。

### 4. 开启Gzip压缩

在Nginx配置中已包含。

---

## 📊 监控和日志

### 1. 日志管理

```bash
# 应用日志
tail -f /var/www/cmms/backend/runtime/log/error.log

# Nginx日志
tail -f /var/log/nginx/cmms-error.log

# MySQL慢查询
tail -f /var/log/mysql/slow-query.log
```

### 2. 性能监控

推荐工具：
- **Nginx**: ngx_http_stub_status_module
- **MySQL**: SHOW STATUS
- **PHP**: XHProf / Tideways
- **系统**: htop / iotop

### 3. 告警配置

使用Uptime监控或类似工具监控服务可用性。

---

## 🔄 更新部署

### 1. 备份数据

```bash
# 数据库备份
mysqldump -u cmms_user -p cmms_prod > backup_$(date +%Y%m%d).sql

# 文件备份
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/cmms/backend
```

### 2. 更新代码

```bash
cd /var/www/cmms/backend
git pull origin main

# 或使用新的发布分支
git checkout release/v1.0.1
```

### 3. 更新依赖

```bash
composer install --no-dev --optimize-autoloader
```

### 4. 数据库迁移

```bash
php migrate.php
```

### 5. 清理缓存

```bash
# 清理PHP缓存
sudo systemctl restart php8.1-fpm

# 清理应用缓存
rm -rf runtime/cache/*
```

---

## 🐛 故障排查

### 问题1: 500错误

**可能原因**：
- PHP语法错误
- 权限问题
- 配置错误

**解决方法**：
```bash
# 查看PHP错误日志
tail -f /var/log/php8.1-fpm.log

# 查看Nginx错误日志
tail -f /var/log/nginx/cmms-error.log

# 检查权限
ls -la runtime/
```

### 问题2: 数据库连接失败

**可能原因**：
- 数据库未启动
- 用户名密码错误
- 数据库不存在

**解决方法**：
```bash
# 检查MySQL状态
sudo systemctl status mysql

# 测试连接
mysql -u cmms_user -p cmms_prod

# 检查.env配置
cat .env | grep DATABASE
```

### 问题3: 502 Bad Gateway

**可能原因**：
- PHP-FPM未启动
- 套接字字文件路径错误

**解决方法**：
```bash
# 检查PHP-FPM状态
sudo systemctl status php8.1-fpm

# 检查Nginx配置
grep fastcgi_pass /etc/nginx/sites-available/cmms
```

### 问题4: 静态资源404

**可能原因**：
- 路径配置错误
- 权限问题

**解决方法**：
```bash
# 检查文件是否存在
ls -la public/

# 检查Nginx root配置
grep root /etc/nginx/sites-available/cmms
```

---

## 📚 参考资源

- [ThinkPHP 8.1文档](https://www.thinkphp.cn/)
- [Nginx文档](https://nginx.org/en/docs/)
- [MySQL 8.0文档](https://dev.mysql.com/doc/)
- [Redis文档](https://redis.io/documentation)
- [PHP 8.1文档](https://www.php.net/docs/)
