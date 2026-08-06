# CMMS Phase 1: Authentication & User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational authentication system with user management, role-based access control, and JWT-based API security for the CMMS platform.

**Architecture:** Three-tier architecture with ThinkPHP 8.1 backend providing RESTful APIs, MySQL 8.0 for persistent storage, Redis 7.0 for session caching and token management, and comprehensive middleware-based permission control.

**Tech Stack:**
- Backend: PHP 8.2, ThinkPHP 8.1, Composer, Firebase JWT
- Database: MySQL 8.0, Redis 7.0
- Development: Docker, Docker Compose, Nginx
- Testing: PHPUnit

---

## Phase Overview

This phase implements:
- ✅ Complete database schema for users, departments, and permissions
- ✅ JWT-based authentication system with token refresh mechanism
- ✅ Role-based access control (RBAC) with 4 user roles
- ✅ User management APIs (CRUD, password reset, status management)
- ✅ Department management APIs
- ✅ Permission middleware for route protection
- ✅ API documentation and testing framework

**Estimated Duration:** 1-2 weeks
**Dependencies:** None (foundational phase)

---

## File Structure

```
project/
├─ backend/
│  ├─ app/
│  │  ├─ controller/
│  │  │  ├─ AuthController.php          # 登录、登出、Token刷新
│  │  │  ├─ UserController.php          # 用户CRUD、密码重置
│  │  │  └─ DepartmentController.php    # 部门管理
│  │  ├─ middleware/
│  │  │  ├─ JwtAuth.php                # JWT认证中间件
│  │  │  └─ PermissionCheck.php         # 权限验证中间件
│  │  ├─ service/
│  │  │  ├─ JwtService.php             # JWT Token生成和验证
│  │  │  └─ UserService.php            # 用户业务逻辑
│  │  ├─ validate/
│  │  │  ├─ LoginValidate.php          # 登录验证
│  │  │  └─ UserValidate.php           # 用户验证
│  │  ├─ model/
│  │  │  ├─ User.php
│  │  │  ├─ Department.php
│  │  │  └─ Permission.php
│  │  └─ common/
│  │     └─ Result.php                 # 统一响应格式
│  ├─ database/
│  │  ├─ migrations/
│  │  │  ├─ 2024_03_19_000001_create_departments_table.php
│  │  │  ├─ 2024_03_19_000002_create_users_table.php
│  │  │  └─ 2024_03_19_000003_create_permissions_table.php
│  │  └─ seeders/
│  │     └─ AdminSeeder.php            # 初始化管理员账号
│  ├─ config/
│  │  ├─ jwt.php                       # JWT配置
│  │  └── app.php                      # 应用配置
│  ├─ route/
│  │  └─ api.php                       # API路由定义
│  └─ composer.json
├─ frontend/                           # 暂不实现，预留
├─ docker/
│  ├─ php/
│  │  ├─ Dockerfile
│  │  └─ php.ini
│  ├─ nginx/
│  │  └─ default.conf
│  └─ docker-compose.yml
├─ tests/
│  ├─ unit/
│  │  ├─ AuthTest.php
│  │  └─ UserTest.php
│  └─ api/
│     └─ AuthApiTest.php
└─ docs/
   └─ api/
      └─ phase1-auth-api.md            # API文档
```

---

## Task 1: Project Initialization

**Files:**
- Create: `backend/composer.json`
- Create: `backend/.env.example`
- Create: `docker/docker-compose.yml`
- Create: `docker/php/Dockerfile`
- Create: `docker/nginx/default.conf`

- [ ] **Step 1: Create composer.json**

```json
{
    "name": "cmms/backend",
    "description": "CMMS Backend Application",
    "type": "project",
    "require": {
        "php": ">=8.2",
        "topthink/framework": "^8.1",
        "firebase/php-jwt": "^6.10",
        "predis/predis": "^2.2"
    },
    "autoload": {
        "psr-4": {
            "app\\": "app/"
        }
    },
    "scripts": {
        "post-autoload-dump": [
            "@php think service:discover",
            "@php think vendor:publish"
        ]
    },
    "config": {
        "preferred-install": "dist",
        "optimize-autoloader": true
    }
}
```

- [ ] **Step 2: Create .env.example**

```bash
APP_DEBUG = true

[DATABASE]
TYPE = mysql
HOSTNAME = 127.0.0.1
DATABASE = cmms_db
USERNAME = root
PASSWORD = root123
HOSTPORT = 3306
CHARSET = utf8mb4

[REDIS]
REDIS_HOSTNAME = 127.0.0.1
PORT = 6379
PASSWORD = ""
SELECT = 0

[JWT]
SECRET = your-super-secret-jwt-key-change-this-in-production
ALGORITHM = HS256
ACCESS_TTL = 7200
REFRESH_TTL = 604800
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: cmms-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: cmms_db
      MYSQL_USER: cmms_user
      MYSQL_PASSWORD: cmms_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cmms-network

  redis:
    image: redis:7.0-alpine
    container_name: cmms-redis
    ports:
      - "6379:6379"
    networks:
      - cmms-network

  php:
    build:
      context: ./docker/php
      dockerfile: Dockerfile
    container_name: cmms-php
    volumes:
      - ./backend:/var/www/html
      - ./docker/php/php.ini:/usr/local/etc/php/conf.d/custom.ini
    depends_on:
      - mysql
      - redis
    networks:
      - cmms-network

  nginx:
    image: nginx:1.24-alpine
    container_name: cmms-nginx
    ports:
      - "80:80"
    volumes:
      - ./backend:/var/www/html
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - php
    networks:
      - cmms-network

volumes:
  mysql-data:

networks:
  cmms-network:
    driver: bridge
```

- [ ] **Step 4: Create PHP Dockerfile**

```dockerfile
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install zip pdo pdo_mysql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application
COPY . /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 9000

CMD ["php-fpm"]
```

- [ ] **Step 5: Create Nginx configuration**

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass php:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

- [ ] **Step 6: Commit project initialization**

```bash
git add .
git commit -m "feat: initialize project structure with Docker setup"
```

---

## Task 2: Database Schema Creation

**Files:**
- Create: `backend/database/migrations/2024_03_19_000001_create_departments_table.php`
- Create: `backend/database/migrations/2024_03_19_000002_create_users_table.php`
- Create: `backend/database/migrations/2024_03_19_000003_create_permissions_table.php`
- Create: `backend/database/seeders/AdminSeeder.php`

- [ ] **Step 1: Create departments migration**

```php
<?php

use think\migration\Migrator;
use Phinx\Db\Adapter\AdapterInterface;

class CreateDepartmentsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('departments', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '部门表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '部门ID',
            ])
            ->addColumn('name', 'string', [
                'limit' => 100,
                'null' => false,
                'comment' => '部门名称',
            ])
            ->addColumn('parent_id', 'integer', [
                'signed' => false,
                'null' => true,
                'default' => null,
                'comment' => '父部门ID',
                'after' => 'name',
            ])
            ->addColumn('manager_id', 'integer', [
                'signed' => false,
                'null' => true,
                'default' => null,
                'comment' => '负责人ID',
                'after' => 'parent_id',
            ])
            ->addColumn('sort_order', 'integer', [
                'null' => false,
                'default' => 0,
                'comment' => '排序',
                'after' => 'manager_id',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'null' => false,
                'default' => 1,
                'signed' => false,
                'comment' => '状态:1正常 0禁用',
                'after' => 'sort_order',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
                'after' => 'status',
            ])
            ->addIndex(['parent_id'], ['name' => 'idx_parent'])
            ->create();
    }
}
```

- [ ] **Step 2: Create users migration**

```php
<?php

use think\migration\Migrator;

class CreateUsersTable extends Migrator
{
    public function change()
    {
        $table = $this->table('users', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '用户表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '用户ID',
            ])
            ->addColumn('username', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '用户名',
            ])
            ->addColumn('password', 'string', [
                'limit' => 255,
                'null' => false,
                'comment' => '密码hash',
            ])
            ->addColumn('real_name', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '真实姓名',
            ])
            ->addColumn('phone', 'string', [
                'limit' => 20,
                'null' => false,
                'comment' => '手机号',
            ])
            ->addColumn('email', 'string', [
                'limit' => 100,
                'null' => true,
                'default' => null,
                'comment' => '邮箱',
            ])
            ->addColumn('role_type', 'integer', [
                'limit' => 1,
                'null' => false,
                'default' => 4,
                'signed' => false,
                'comment' => '角色:1管理员 2部门管理 3工程师 4普通用户',
            ])
            ->addColumn('department_id', 'integer', [
                'signed' => false,
                'null' => true,
                'default' => null,
                'comment' => '部门ID',
            ])
            ->addColumn('status', 'integer', [
                'limit' => 1,
                'null' => false,
                'default' => 1,
                'signed' => false,
                'comment' => '状态:1正常 0禁用',
            ])
            ->addColumn('last_login_at', 'timestamp', [
                'null' => true,
                'default' => null,
                'comment' => '最后登录时间',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addColumn('updated_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP',
                'comment' => '更新时间',
            ])
            ->addIndex(['department_id'], ['name' => 'idx_department'])
            ->addIndex(['role_type'], ['name' => 'idx_role'])
            ->addIndex(['phone'], ['name' => 'idx_phone'])
            ->addIndex(['username'], ['name' => 'uk_username', 'unique' => true])
            ->create();
    }
}
```

- [ ] **Step 3: Create permissions migration**

```php
<?php

use think\migration\Migrator;

class CreatePermissionsTable extends Migrator
{
    public function change()
    {
        $table = $this->table('permissions', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci',
            'comment' => '权限表',
        ]);

        $table
            ->addColumn('id', 'integer', [
                'limit' => 11,
                'signed' => false,
                'identity' => true,
                'comment' => '权限ID',
            ])
            ->addColumn('user_id', 'integer', [
                'signed' => false,
                'null' => false,
                'comment' => '用户ID',
            ])
            ->addColumn('module', 'string', [
                'limit' => 50,
                'null' => false,
                'comment' => '模块名',
            ])
            ->addColumn('actions', 'json', [
                'null' => false,
                'comment' => '操作权限["create","read","update","delete"]',
            ])
            ->addColumn('created_at', 'timestamp', [
                'null' => false,
                'default' => 'CURRENT_TIMESTAMP',
                'comment' => '创建时间',
            ])
            ->addIndex(['user_id'], ['name' => 'idx_user'])
            ->addIndex(['user_id', 'module'], ['name' => 'uk_user_module', 'unique' => true])
            ->create();
    }
}
```

- [ ] **Step 4: Create admin seeder**

```php
<?php

use think\migration\Seeder;

class AdminSeeder extends Seeder
{
    public function run()
    {
        $password = password_hash('admin123', PASSWORD_BCRYPT);

        $this->table('users')->insert([
            [
                'id' => 1,
                'username' => 'admin',
                'password' => $password,
                'real_name' => '系统管理员',
                'phone' => '13800138000',
                'email' => 'admin@cmms.com',
                'role_type' => 1,
                'department_id' => null,
                'status' => 1,
                'last_login_at' => null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]
        ])->saveData();
    }
}
```

- [ ] **Step 5: Run migrations**

```bash
# 启动 Docker 容器
docker-compose up -d

# 进入 PHP 容器
docker-compose exec php bash

# 运行迁移
php think migrate:run

# 运行种子
php think seed:run
```

- [ ] **Step 6: Verify database creation**

```bash
# 连接 MySQL 验证表已创建
docker-compose exec mysql mysql -uroot -proot123 cmms_db -e "SHOW TABLES;"

# Expected output:
# +-------------------------+
# | Tables_in_cmms_db       |
# +-------------------------+
# | departments             |
# | permissions             |
# | users                   |
# +-------------------------+
```

- [ ] **Step 7: Commit database schema**

```bash
git add .
git commit -m "feat: create database schema for users, departments, and permissions"
```

---

## Task 3: JWT Service Implementation

**Files:**
- Create: `backend/config/jwt.php`
- Create: `backend/app/common/Result.php`
- Create: `backend/app/service/JwtService.php`

- [ ] **Step 1: Create JWT configuration**

```php
<?php

return [
    // JWT 密钥
    'secret' => env('JWT.SECRET', 'your-super-secret-jwt-key-change-this-in-production'),

    // 签名算法
    'algorithm' => env('JWT.ALGORITHM', 'HS256'),

    // Access Token 有效期（秒）默认 2 小时
    'access_ttl' => env('JWT.ACCESS_TTL', 7200),

    // Refresh Token 有效期（秒）默认 7 天
    'refresh_ttl' => env('JWT.REFRESH_TTL', 604800),
];
```

- [ ] **Step 2: Create unified Result class**

```php
<?php

namespace app\common;

class Result
{
    public static function success($data = null, $message = 'success', $code = 200)
    {
        return json([
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ]);
    }

    public static function error($message = 'error', $code = 400, $data = null)
    {
        return json([
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ]);
    }

    public static function paginated($items, $total, $page = 1, $pageSize = 20, $message = 'success')
    {
        return json([
            'code' => 200,
            'message' => $message,
            'data' => [
                'items' => $items,
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
            ],
        ]);
    }
}
```

- [ ] **Step 3: Create JWT service**

```php
<?php

namespace app\service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use think\facade\Cache;

class JwtService
{
    private static $secret;
    private static $algorithm;
    private static $accessTTL;
    private static $refreshTTL;

    public static function init()
    {
        $config = config('jwt');
        self::$secret = $config['secret'];
        self::$algorithm = $config['algorithm'];
        self::$accessTTL = $config['access_ttl'];
        self::$refreshTTL = $config['refresh_ttl'];
    }

    /**
     * 生成 Access Token
     */
    public static function createAccessToken($userId, $roleType)
    {
        self::init();

        $payload = [
            'iss' => 'cmms-api',          // 签发者
            'iat' => time(),              // 签发时间
            'exp' => time() + self::$accessTTL,  // 过期时间
            'type' => 'access',           // Token 类型
            'user_id' => $userId,
            'role_type' => $roleType,
        ];

        return JWT::encode($payload, self::$secret, self::$algorithm);
    }

    /**
     * 生成 Refresh Token
     */
    public static function createRefreshToken($userId)
    {
        self::init();

        $payload = [
            'iss' => 'cmms-api',
            'iat' => time(),
            'exp' => time() + self::$refreshTTL,
            'type' => 'refresh',
            'user_id' => $userId,
        ];

        $token = JWT::encode($payload, self::$secret, self::$algorithm);

        // 存储 Refresh Token 到 Redis
        Cache::set('refresh_token:' . $userId, $token, self::$refreshTTL);

        return $token;
    }

    /**
     * 验证并解码 Token
     */
    public static function verifyToken($token)
    {
        self::init();

        try {
            $decoded = JWT::decode($token, new Key(self::$secret, self::$algorithm));
            return (array) $decoded;
        } catch (\Firebase\JWT\ExpiredException $e) {
            throw new \Exception('Token 已过期');
        } catch (\Exception $e) {
            throw new \Exception('Token 验证失败');
        }
    }

    /**
     * 刷新 Access Token
     */
    public static function refreshAccessToken($refreshToken)
    {
        self::init();

        try {
            $payload = self::verifyToken($refreshToken);

            if ($payload['type'] !== 'refresh') {
                throw new \Exception('Token 类型错误');
            }

            $userId = $payload['user_id'];

            // 验证 Refresh Token 是否在 Redis 中
            $storedToken = Cache::get('refresh_token:' . $userId);
            if ($storedToken !== $refreshToken) {
                throw new \Exception('Refresh Token 无效');
            }

            // 获取用户信息
            $user = \app\model\User::find($userId);
            if (!$user) {
                throw new \Exception('用户不存在');
            }

            // 生成新的 Access Token
            return self::createAccessToken($userId, $user->role_type);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * 撤销 Refresh Token（登出时使用）
     */
    public static function revokeRefreshToken($userId)
    {
        Cache::delete('refresh_token:' . $userId);
    }
}
```

- [ ] **Step 4: Commit JWT service**

```bash
git add backend/config/jwt.php backend/app/common/Result.php backend/app/service/JwtService.php
git commit -m "feat: implement JWT service for token generation and validation"
```

---

## Task 4: Authentication Middleware

**Files:**
- Create: `backend/app/middleware/JwtAuth.php`
- Create: `backend/app/middleware/PermissionCheck.php`

- [ ] **Step 1: Create JWT authentication middleware**

```php
<?php

namespace app\middleware;

use app\service\JwtService;
use app\common\Result;

class JwtAuth
{
    public function handle($request, \Closure $next)
    {
        // 获取 Token
        $token = $request->header('Authorization');

        if (empty($token)) {
            return Result::error('未提供认证 Token', 401);
        }

        // 去掉 "Bearer " 前缀
        $token = str_replace('Bearer ', '', $token);

        try {
            // 验证 Token
            $payload = JwtService::verifyToken($token);

            // 检查 Token 类型
            if ($payload['type'] !== 'access') {
                return Result::error('Token 类型错误', 401);
            }

            // 将用户信息注入到请求中
            $request->userId = $payload['user_id'];
            $request->roleType = $payload['role_type'];

            return $next($request);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 401);
        }
    }
}
```

- [ ] **Step 2: Create permission check middleware**

```php
<?php

namespace app\middleware;

use app\service\JwtService;
use app\common\Result;

class PermissionCheck
{
    public function handle($request, \Closure $next)
    {
        $userId = $request->userId;
        $module = $request->module();
        $action = $request->action();
        $method = $request->method();

        // 系统管理员拥有所有权限
        if ($request->roleType == 1) {
            return $next($request);
        }

        // 获取用户权限
        $permission = \app\model\Permission::where('user_id', $userId)
            ->where('module', $module)
            ->find();

        if (!$permission) {
            return Result::error('无权限访问', 403);
        }

        $actions = $permission->actions; // JSON array

        // 检查权限映射
        $actionMap = [
            'GET' => 'read',
            'POST' => 'create',
            'PUT' => 'update',
            'DELETE' => 'delete',
        ];

        $requiredAction = $actionMap[$method] ?? 'read';

        if (!in_array($requiredAction, $actions)) {
            return Result::error('无操作权限', 403);
        }

        return $next($request);
    }
}
```

- [ ] **Step 3: Register middleware in config**

```php
<?php

// backend/config/middleware.php (创建或修改)

return [
    // 别名或分组
    '__alias__' => [
        'JwtAuth' => app\middleware\JwtAuth::class,
        'PermissionCheck' => app\middleware\PermissionCheck::class,
    ],
];
```

- [ ] **Step 4: Commit middleware**

```bash
git add backend/app/middleware/ backend/config/middleware.php
git commit -m "feat: add JWT authentication and permission check middleware"
```

---

## Task 5: Authentication Controller

**Files:**
- Create: `backend/app/validate/LoginValidate.php`
- Create: `backend/app/controller/AuthController.php`

- [ ] **Step 1: Create login validator**

```php
<?php

namespace app\validate;

use think\Validate;

class LoginValidate extends Validate
{
    protected $rule = [
        'username' => 'require|max:50',
        'password' => 'require|min:6|max:20',
    ];

    protected $message = [
        'username.require' => '用户名不能为空',
        'username.max' => '用户名最多50个字符',
        'password.require' => '密码不能为空',
        'password.min' => '密码至少6个字符',
        'password.max' => '密码最多20个字符',
    ];
}
```

- [ ] **Step 2: Create authentication controller**

```php
<?php

namespace app\controller;

use app\service\JwtService;
use app\validate\LoginValidate;
use app\model\User;
use app\common\Result;

class AuthController
{
    /**
     * 用户登录
     * POST /auth/login
     */
    public function login()
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(LoginValidate::class)
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        // 查找用户
        $user = User::where('username', $data['username'])->find();

        if (!$user) {
            return Result::error('用户名或密码错误', 401);
        }

        // 验证密码
        if (!password_verify($data['password'], $user->password)) {
            return Result::error('用户名或密码错误', 401);
        }

        // 检查用户状态
        if ($user->status != 1) {
            return Result::error('账号已被禁用', 403);
        }

        // 生成 Token
        $accessToken = JwtService::createAccessToken($user->id, $user->role_type);
        $refreshToken = JwtService::createRefreshToken($user->id);

        // 更新最后登录时间
        $user->last_login_at = date('Y-m-d H:i:s');
        $user->save();

        // 返回 Token 和用户信息
        return Result::success([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.access_ttl'),
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'real_name' => $user->real_name,
                'role_type' => $user->role_type,
                'department_id' => $user->department_id,
            ],
        ], '登录成功');
    }

    /**
     * 刷新 Token
     * POST /auth/refresh
     */
    public function refresh()
    {
        $refreshToken = request()->post('refresh_token');

        if (empty($refreshToken)) {
            return Result::error('Refresh Token 不能为空', 400);
        }

        try {
            $newAccessToken = JwtService::refreshAccessToken($refreshToken);

            return Result::success([
                'access_token' => $newAccessToken,
                'token_type' => 'Bearer',
                'expires_in' => config('jwt.access_ttl'),
            ], 'Token 刷新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 401);
        }
    }

    /**
     * 用户登出
     * POST /auth/logout
     */
    public function logout()
    {
        $userId = request()->userId;

        // 撤销 Refresh Token
        JwtService::revokeRefreshToken($userId);

        return Result::success(null, '登出成功');
    }

    /**
     * 获取当前用户信息
     * GET /auth/profile
     */
    public function profile()
    {
        $userId = request()->userId;

        $user = User::with(['department'])->find($userId);

        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        return Result::success([
            'id' => $user->id,
            'username' => $user->username,
            'real_name' => $user->real_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role_type' => $user->role_type,
            'department_id' => $user->department_id,
            'department_name' => $user->department ? $user->department->name : null,
            'last_login_at' => $user->last_login_at,
        ]);
    }
}
```

- [ ] **Step 3: Create model relationships**

```php
<?php

namespace app\model;

use think\Model;

class User extends Model
{
    protected $table = 'users';

    protected $json = [];

    protected $hidden = ['password'];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
```

```php
<?php

namespace app\model;

use think\Model;

class Department extends Model
{
    protected $table = 'departments';

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id');
    }
}
```

- [ ] **Step 4: Commit authentication controller**

```bash
git add backend/app/controller/AuthController.php backend/app/validate/ backend/app/model/
git commit -m "feat: implement authentication controller with login, logout, and token refresh"
```

---

## Task 6: User Management Controller

**Files:**
- Create: `backend/app/validate/UserValidate.php`
- Create: `backend/app/service/UserService.php`
- Create: `backend/app/controller/UserController.php`

- [ ] **Step 1: Create user validator**

```php
<?php

namespace app\validate;

use think\Validate;

class UserValidate extends Validate
{
    protected $rule = [
        'username' => 'require|max:50|alphaNum',
        'password' => 'require:min:6|max:20',
        'real_name' => 'require|max:50',
        'phone' => 'require|max:20',
        'email' => 'email|max:100',
        'role_type' => 'require|in:1,2,3,4',
        'department_id' => 'integer',
    ];

    protected $message = [
        'username.require' => '用户名不能为空',
        'username.alphaNum' => '用户名只能包含字母和数字',
        'password.require' => '密码不能为空',
        'password.min' => '密码至少6个字符',
        'real_name.require' => '真实姓名不能为空',
        'phone.require' => '手机号不能为空',
        'email' => '邮箱格式不正确',
        'role_type.require' => '角色类型不能为空',
        'role_type.in' => '角色类型无效',
    ];

    protected $scene = [
        'create' => ['username', 'password', 'real_name', 'phone', 'email', 'role_type', 'department_id'],
        'update' => ['real_name', 'phone', 'email', 'role_type', 'department_id'],
    ];
}
```

- [ ] **Step 2: Create user service**

```php
<?php

namespace app\service;

use app\model\User;
use think\facade\Db;

class UserService
{
    /**
     * 获取用户列表
     */
    public static function getList($page = 1, $pageSize = 20, $filters = [])
    {
        $query = User::with(['department']);

        // 筛选条件
        if (!empty($filters['keyword'])) {
            $query->whereLike('username|real_name|phone', '%' . $filters['keyword'] . '%');
        }

        if (!empty($filters['role_type'])) {
            $query->where('role_type', $filters['role_type']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $total = $query->count();
        $users = $query->order('id', 'desc')
            ->page($page, $pageSize)
            ->select();

        return [
            'items' => $users,
            'total' => $total,
        ];
    }

    /**
     * 获取用户详情
     */
    public static function getDetail($id)
    {
        $user = User::with(['department'])->find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        return $user;
    }

    /**
     * 创建用户
     */
    public static function create($data)
    {
        Db::startTrans();
        try {
            // 检查用户名是否存在
            $exists = User::where('username', $data['username'])->find();
            if ($exists) {
                throw new \Exception('用户名已存在');
            }

            // 密码加密
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);

            $user = User::create($data);

            // 分配默认权限
            if ($data['role_type'] != 1) {
                // 非管理员需要分配权限
                // 这里可以根据角色分配默认权限
            }

            Db::commit();
            return $user;
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 更新用户
     */
    public static function update($id, $data)
    {
        $user = User::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        // 不能修改用户名
        unset($data['username']);

        // 如果修改密码
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        $user->save($data);

        return $user;
    }

    /**
     * 删除用户
     */
    public static function delete($id)
    {
        $user = User::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        // 不能删除管理员
        if ($user->role_type == 1) {
            throw new \Exception('不能删除系统管理员');
        }

        $user->delete();

        return true;
    }

    /**
     * 重置密码
     */
    public static function resetPassword($id, $newPassword)
    {
        $user = User::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        $user->password = password_hash($newPassword, PASSWORD_BCRYPT);
        $user->save();

        return true;
    }
}
```

- [ ] **Step 3: Create user controller**

```php
<?php

namespace app\controller;

use app\service\UserService;
use app\validate\UserValidate;
use app\common\Result;

class UserController
{
    /**
     * 获取用户列表
     * GET /users
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);

        $filters = [
            'keyword' => request()->get('keyword', ''),
            'role_type' => request()->get('role_type', ''),
            'department_id' => request()->get('department_id', ''),
            'status' => request()->get('status', ''),
        ];

        try {
            $result = UserService::getList($page, $pageSize, $filters);

            return Result::paginated(
                $result['items'],
                $result['total'],
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取用户详情
     * GET /users/{id}
     */
    public function read($id)
    {
        try {
            $user = UserService::getDetail($id);

            return Result::success($user);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建用户
     * POST /users
     */
    public function save()
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(UserValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $user = UserService::create($data);

            return Result::success($user, '用户创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新用户
     * PUT /users/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        // 验证输入
        try {
            validate(UserValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $user = UserService::update($id, $data);

            return Result::success($user, '用户更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除用户
     * DELETE /users/{id}
     */
    public function delete($id)
    {
        try {
            UserService::delete($id);

            return Result::success(null, '用户删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 重置密码
     * POST /users/{id}/reset-password
     */
    public function resetPassword($id)
    {
        $data = request()->post();
        $newPassword = $data['password'] ?? '123456';

        try {
            UserService::resetPassword($id, $newPassword);

            return Result::success(null, '密码重置成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
```

- [ ] **Step 4: Commit user management**

```bash
git add backend/app/controller/UserController.php backend/app/service/UserService.php backend/app/validate/UserValidate.php
git commit -m "feat: implement user management with CRUD operations"
```

---

## Task 7: Department Management Controller

**Files:**
- Create: `backend/app/controller/DepartmentController.php`

- [ ] **Step 1: Create department controller**

```php
<?php

namespace app\controller;

use app\model\Department;
use app\common\Result;

class DepartmentController
{
    /**
     * 获取部门列表（树形结构）
     * GET /departments
     */
    public function index()
    {
        try {
            $departments = Department::with(['parent', 'manager'])
                ->order('sort_order', 'asc')
                ->select();

            // 构建树形结构
            $tree = $this->buildTree($departments->toArray());

            return Result::success($tree);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取部门详情
     * GET /departments/{id}
     */
    public function read($id)
    {
        try {
            $department = Department::with(['parent', 'manager', 'users'])->find($id);

            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            return Result::success($department);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建部门
     * POST /departments
     */
    public function save()
    {
        $data = request()->post();

        try {
            $department = Department::create($data);

            return Result::success($department, '部门创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新部门
     * PUT /departments/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $department = Department::find($id);

            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            $department->save($data);

            return Result::success($department, '部门更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除部门
     * DELETE /departments/{id}
     */
    public function delete($id)
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            // 检查是否有子部门
            if ($department->children()->count() > 0) {
                return Result::error('该部门下有子部门，无法删除', 400);
            }

            // 检查是否有用户
            if ($department->users()->count() > 0) {
                return Result::error('该部门下有用户，无法删除', 400);
            }

            $department->delete();

            return Result::success(null, '部门删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 构建树形结构
     */
    private function buildTree($departments, $parentId = null)
    {
        $tree = [];

        foreach ($departments as $department) {
            if ($department['parent_id'] == $parentId) {
                $children = $this->buildTree($departments, $department['id']);

                if (!empty($children)) {
                    $department['children'] = $children;
                }

                $tree[] = $department;
            }
        }

        return $tree;
    }
}
```

- [ ] **Step 2: Commit department management**

```bash
git add backend/app/controller/DepartmentController.php
git commit -m "feat: implement department management with tree structure"
```

---

## Task 8: API Routes Configuration

**Files:**
- Create: `backend/route/api.php`
- Modify: `backend/config/app.php`

- [ ] **Step 1: Create API routes**

```php
<?php

use think\facade\Route;

// 认证路由（无需 Token）
Route::group('auth', function () {
    Route::post('login', 'AuthController/login');
    Route::post('refresh', 'AuthController/refresh');
})->allowCrossDomain();

// 需要认证的路由
Route::group(function () {
    // 认证相关
    Route::group('auth', function () {
        Route::post('logout', 'AuthController/logout');
        Route::get('profile', 'AuthController/profile');
    });

    // 用户管理
    Route::group('users', function () {
        Route::get('/', 'UserController/index');
        Route::get('/:id', 'UserController/read');
        Route::post('/', 'UserController/save');
        Route::put('/:id', 'UserController/update');
        Route::delete('/:id', 'UserController/delete');
        Route::post('/:id/reset-password', 'UserController/resetPassword');
    })->middleware(['PermissionCheck']);

    // 部门管理
    Route::group('departments', function () {
        Route::get('/', 'DepartmentController/index');
        Route::get('/:id', 'DepartmentController/read');
        Route::post('/', 'DepartmentController/save');
        Route::put('/:id', 'DepartmentController/update');
        Route::delete('/:id', 'DepartmentController/delete');
    })->middleware(['PermissionCheck']);

})->middleware(['JwtAuth'])->allowCrossDomain();
```

- [ ] **Step 2: Configure CORS**

在 `backend/config/app.php` 中添加或修改：

```php
// 默认中间件
'default_middleware' => [],

// 跨域设置
'cors' => [
    'Access-Control-Allow-Origin' => '*',
    'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers' => 'Authorization, Content-Type',
    'Access-Control-Max-Age' => 86400,
],
```

- [ ] **Step 3: Create OPTIONS 响应处理**

在 `backend/app/middleware/Cors.php`:

```php
<?php

namespace app\middleware;

class Cors
{
    public function handle($request, \Closure $next)
    {
        // 处理预检请求
        if ($request->method() == 'OPTIONS') {
            return response('', 200, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Authorization, Content-Type',
            ]);
        }

        $response = $next($request);

        // 添加 CORS 头
        $response->header([
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Authorization, Content-Type',
        ]);

        return $response;
    }
}
```

- [ ] **Step 4: Commit routes**

```bash
git add backend/route/ backend/config/app.php backend/app/middleware/Cors.php
git commit -m "feat: configure API routes with CORS support"
```

---

## Task 9: API Testing

**Files:**
- Create: `tests/api/AuthApiTest.php`
- Create: `tests/api/UserApiTest.php`

- [ ] **Step 1: Create authentication API test**

```php
<?php

namespace tests\api;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class AuthApiTest extends TestCase
{
    private $client;
    private $baseUrl = 'http://localhost/api/v1';
    private $accessToken;
    private $refreshToken;

    protected function setUp(): void
    {
        $this->client = new Client(['base_uri' => $this->baseUrl]);
    }

    public function testLoginSuccess()
    {
        $response = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('access_token', $data['data']);
        $this->assertArrayHasKey('refresh_token', $data['data']);

        $this->accessToken = $data['data']['access_token'];
        $this->refreshToken = $data['data']['refresh_token'];
    }

    public function testLoginWithWrongCredentials()
    {
        $response = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'wrong_password',
            ],
            'http_errors' => false,
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(401, $data['code']);
    }

    public function testRefreshToken()
    {
        // 先登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $refreshToken = $loginData['data']['refresh_token'];

        // 刷新 Token
        $response = $this->client->post('/auth/refresh', [
            'json' => [
                'refresh_token' => $refreshToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('access_token', $data['data']);
    }

    public function testGetProfile()
    {
        // 先登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $accessToken = $loginData['data']['access_token'];

        // 获取用户信息
        $response = $this->client->get('/auth/profile', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertEquals('admin', $data['data']['username']);
    }

    public function testLogout()
    {
        // 先登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $accessToken = $loginData['data']['access_token'];

        // 登出
        $response = $this->client->post('/auth/logout', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
    }
}
```

- [ ] **Step 2: Create user API test**

```php
<?php

namespace tests\api;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class UserApiTest extends TestCase
{
    private $client;
    private $baseUrl = 'http://localhost/api/v1';
    private $adminToken;
    private $createdUserId;

    protected function setUp(): void
    {
        $this->client = new Client(['base_uri' => $this->baseUrl]);

        // 管理员登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $this->adminToken = $loginData['data']['access_token'];
    }

    public function testCreateUser()
    {
        $response = $this->client->post('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'username' => 'testuser',
                'password' => 'test123',
                'real_name' => '测试用户',
                'phone' => '13900139000',
                'email' => 'test@example.com',
                'role_type' => 4,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(201, $data['code']);
        $this->assertEquals('testuser', $data['data']['username']);

        $this->createdUserId = $data['data']['id'];
    }

    public function testGetUserList()
    {
        $response = $this->client->get('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('items', $data['data']);
        $this->assertArrayHasKey('total', $data['data']);
    }

    public function testUpdateUser()
    {
        // 先创建用户
        $createResponse = $this->client->post('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'username' => 'updatetest',
                'password' => 'test123',
                'real_name' => '更新测试',
                'phone' => '13900139001',
                'role_type' => 4,
            ],
        ]);

        $createData = json_decode($createResponse->getBody(), true);
        $userId = $createData['data']['id'];

        // 更新用户
        $response = $this->client->put('/users/' . $userId, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'real_name' => '已更新用户',
                'phone' => '13900139999',
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertEquals('已更新用户', $data['data']['real_name']);
    }

    public function testDeleteUser()
    {
        // 先创建用户
        $createResponse = $this->client->post('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'username' => 'deletetest',
                'password' => 'test123',
                'real_name' => '删除测试',
                'phone' => '13900139002',
                'role_type' => 4,
            ],
        ]);

        $createData = json_decode($createResponse->getBody(), true);
        $userId = $createData['data']['id'];

        // 删除用户
        $response = $this->client->delete('/users/' . $userId, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
    }
}
```

- [ ] **Step 3: Run API tests**

```bash
# 启动服务
docker-compose up -d

# 安装测试依赖
cd backend
composer require guzzlehttp/guzzle phpunit/phpunit --dev

# 运行测试
./vendor/bin/phpunit tests/api/
```

- [ ] **Step 4: Commit tests**

```bash
git add tests/
git commit -m "test: add API tests for authentication and user management"
```

---

## Task 10: API Documentation

**Files:**
- Create: `docs/api/phase1-auth-api.md`

- [ ] **Step 1: Create API documentation**

```markdown
# Phase 1 API Documentation - Authentication & User Management

## Base URL
```
http://localhost/api/v1
```

## Authentication

All endpoints except `/auth/login` and `/auth/refresh` require JWT authentication.

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

Login with username and password.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "admin",
      "real_name": "系统管理员",
      "role_type": 1,
      "department_id": null
    }
  }
}
```

**Errors:**
- 401: 用户名或密码错误
- 403: 账号已被禁用

---

### 2. Refresh Token
**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Token 刷新成功",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 7200
  }
}
```

---

### 3. Logout
**POST** `/auth/logout`

Logout current user and revoke refresh token.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

---

### 4. Get Profile
**GET** `/auth/profile`

Get current user profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "phone": "13800138000",
    "email": "admin@cmms.com",
    "role_type": 1,
    "department_id": null,
    "department_name": null,
    "last_login_at": "2026-03-19 10:30:00"
  }
}
```

---

## User Management Endpoints

### 5. Get User List
**GET** `/users`

Get paginated list of users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)
- `keyword`: Search by username, real name, or phone
- `role_type`: Filter by role type (1: Admin, 2: Dept Manager, 3: Engineer, 4: User)
- `department_id`: Filter by department
- `status`: Filter by status (1: Active, 0: Disabled)

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "real_name": "系统管理员",
        "phone": "13800138000",
        "email": "admin@cmms.com",
        "role_type": 1,
        "department_id": null,
        "status": 1,
        "created_at": "2026-03-19 00:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6. Get User Detail
**GET** `/users/{id}`

Get detailed information about a specific user.

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "phone": "13800138000",
    "email": "admin@cmms.com",
    "role_type": 1,
    "department_id": null,
    "department": null,
    "status": 1,
    "created_at": "2026-03-19 00:00:00"
  }
}
```

---

### 7. Create User
**POST** `/users`

Create a new user.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "real_name": "新用户",
  "phone": "13900139000",
  "email": "newuser@example.com",
  "role_type": 4,
  "department_id": 1
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "用户创建成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "real_name": "新用户",
    "phone": "13900139000",
    "email": "newuser@example.com",
    "role_type": 4,
    "department_id": 1,
    "status": 1
  }
}
```

**Errors:**
- 422: Validation error
- 500: Username already exists

---

### 8. Update User
**PUT** `/users/{id}`

Update user information.

**Request Body:**
```json
{
  "real_name": "更新姓名",
  "phone": "13900139999",
  "email": "updated@example.com",
  "role_type": 3,
  "department_id": 2,
  "status": 1
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "用户更新成功",
  "data": {
    "id": 2,
    "real_name": "更新姓名",
    "phone": "13900139999",
    "email": "updated@example.com",
    "role_type": 3,
    "department_id": 2
  }
}
```

---

### 9. Delete User
**DELETE** `/users/{id}`

Delete a user.

**Response (200):**
```json
{
  "code": 200,
  "message": "用户删除成功",
  "data": null
}
```

**Errors:**
- 500: Cannot delete admin user

---

### 10. Reset Password
**POST** `/users/{id}/reset-password`

Reset user password.

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": null
}
```

---

## Department Management Endpoints

### 11. Get Department List
**GET** `/departments`

Get tree structure of all departments.

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "技术部",
      "parent_id": null,
      "manager_id": 1,
      "sort_order": 1,
      "status": 1,
      "children": [
        {
          "id": 2,
          "name": "维修组",
          "parent_id": 1,
          "manager_id": 2,
          "sort_order": 1,
          "status": 1,
          "children": []
        }
      ]
    }
  ]
}
```

---

### 12. Create Department
**POST** `/departments`

Create a new department.

**Request Body:**
```json
{
  "name": "新部门",
  "parent_id": 1,
  "manager_id": 2,
  "sort_order": 1
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "部门创建成功",
  "data": {
    "id": 3,
    "name": "新部门",
    "parent_id": 1,
    "manager_id": 2,
    "sort_order": 1,
    "status": 1
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "code": 400,
  "message": "Error message",
  "data": null
}
```

### Common Error Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized / Token expired
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error
```

- [ ] **Step 2: Commit documentation**

```bash
git add docs/api/
git commit -m "docs: add API documentation for phase 1"
```

---

## Task 11: Final Verification

**Files:**
- Verify: All tests pass
- Verify: API endpoints working
- Create: `backend/README.md`

- [ ] **Step 1: Run all tests**

```bash
# 运行单元测试
cd backend
./vendor/bin/phpunit tests/unit/

# 运行 API 测试
./vendor/bin/phpunit tests/api/

# Expected: All tests pass
```

- [ ] **Step 2: Manual API testing with Postman/curl**

```bash
# Test login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test getting user list (replace TOKEN with actual token)
curl -X GET http://localhost/api/v1/users \
  -H "Authorization: Bearer TOKEN"
```

- [ ] **Step 3: Create README**

```markdown
# CMMS Backend - Phase 1

## Setup Instructions

### Using Docker

1. Clone repository
```bash
git clone <repository-url>
cd maintain
```

2. Start containers
```bash
docker-compose up -d
```

3. Run migrations
```bash
docker-compose exec php bash
php think migrate:run
php think seed:run
```

4. Access API
```
Base URL: http://localhost/api/v1
```

### Default Admin Account
- Username: `admin`
- Password: `admin123`

### Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database connection
- Redis connection
- JWT secret key

## Running Tests

```bash
docker-compose exec php bash
composer test
```

## API Documentation

See `docs/api/phase1-auth-api.md`
```

- [ ] **Step 4: Final commit**

```bash
git add backend/README.md
git commit -m "docs: add README with setup instructions"
```

---

## Completion Criteria

Phase 1 is complete when:
- ✅ Docker environment starts successfully
- ✅ All database migrations run without errors
- ✅ Admin user can login and receive JWT tokens
- ✅ Token refresh mechanism works correctly
- ✅ User CRUD operations work correctly
- ✅ Department management works correctly
- ✅ All API tests pass
- ✅ API documentation is complete

---

## Next Steps

After completing Phase 1, proceed to **Phase 2: Device Management**, which will implement:
- Device asset management
- Device category management
- QR code generation for devices
- Device history tracking

---

**End of Plan**
