# 前端部署指南

本文档介绍如何将CMMS Web前端部署到生产环境。

---

## 📋 目录

- [环境要求](#环境要求)
- [构建项目](#构建项目)
- [部署到Nginx](#部署到nginx)
- [部署到CDN](#部署到cdn)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

---

## 💻 环境要求

### 软件要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.0 | 构建工具 |
| npm | >= 9.0 | 包管理器 |

### 服务器要求

- Nginx >= 1.20
- 或其他Web服务器
- 或CDN服务

---

## 🔨 构建项目

### 1. 安装依赖

```bash
cd frontend-web
npm install
```

### 2. 修改配置

#### API地址配置

编辑 `src/api/request.js`：

```javascript
// 生产环境API地址
const baseURL = 'https://api.yourdomain.com/api'
```

或使用环境变量：

```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
```

#### 其他配置

修改 `vite.config.js` 中的生产配置：

```javascript
export default defineConfig({
  base: '/', // 部署路径，如子目录改为 '/cmms/'
  // ...
})
```

### 3. 构建生产版本

```bash
# 构建项目
npm run build

# 输出目录: dist/
```

构建完成后，`dist/` 目录包含所有静态资源。

---

## 🚀 部署到Nginx

### 1. 上传文件

```bash
# 使用SCP上传
scp -r dist/* user@server:/var/www/cmms-web/

# 或使用rsync
rsync -avz dist/ user@server:/var/www/cmms-web/
```

### 2. 配置Nginx

```bash
sudo vi /etc/nginx/sites-available/cmms-web
```

配置内容：

```nginx
server {
    listen 80;
    server_name web.yourdomain.com;
    root /var/www/cmms-web;
    index index.html;

    # 开启gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/cmms-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置HTTPS（推荐）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d web.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 配置反向代理（可选）

如果前后端在同一服务器，需要配置代理：

```nginx
server {
    listen 443 ssl http2;
    server_name web.yourdomain.com;
    root /var/www/cmms-web;
    index index.html;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/web.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/web.yourdomain.com/privkey.pem;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🌐 部署到CDN

### 1. 选择CDN服务商

推荐服务商：
- 阿里云CDN
- 腾讯云CDN
- Cloudflare
- AWS CloudFront

### 2. 上传到CDN

#### 阿里云OSS

```bash
# 安装ossutil
sudo apt install ossutil

# 配置ossutil
ossutil config

# 上传
ossutil cp -rf dist/ oss://your-bucket/cmms-web/
```

#### 腾讯云COS

```bash
# 安装COSCLI
pip install coscli

# 配置
coscli config

# 上传
coscli upload -r dist/ cos://your-bucket/cmms-web/ --recursive
```

### 3. 配置CDN域名

1. 在CDN控制台添加域名
2. 源站类型：对象存储
3. 回源HOST：源站域名
4. 缓存配置：
   - 静态资源：30天
   - HTML文件：不缓存或短时间

### 4. 配置HTTPS

CDN通常自动提供HTTPS证书。

---

## ⚡ 性能优化

### 1. 代码分割

已在 `vite.config.js` 中配置：

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vue-vendor': ['vue', 'vue-router', 'pinia'],
        'element-plus': ['element-plus'],
        'echarts': ['echarts']
      }
    }
  }
}
```

### 2. 路由懒加载

已在路由配置中使用：

```javascript
component: () => import('@/views/dashboard/Dashboard.vue')
```

### 3. 资源压缩

Vite生产构建自动压缩：
- JavaScript: Terser
- CSS: esbuild
- 图片: 灰度缩小

### 4. 预加载关键资源

在 `index.html` 中：

```html
<link rel="modulepreload" href="/src/main.js">
```

### 5. 使用现代格式

```javascript
// vite.config.js
build: {
  target: 'es2015' // 或 'esnext'
}
```

---

## 🔍 监控和日志

### 1. 前端监控

推荐工具：
- **Sentry**: 错误监控
- **Google Analytics**: 用户行为分析
- **百度统计**: 国内用户分析

### 2. 性能监控

```javascript
// 性能API
const perfData = performance.getEntriesByType('navigation')
const loadTime = perfData[0].loadEventEnd - perfData[0].fetchStart
console.log('页面加载时间:', loadTime)
```

### 3. 错误上报

```javascript
window.addEventListener('error', (event) => {
  // 上报到监控系统
  reportError({
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})
```

---

## 🔄 CI/CD部署

### 1. GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/cmms-web
            rm -rf old
            mv current old
            mkdir current
            exit
```

### 2. GitLab CI/CD

创建 `.gitlab-ci.yml`：

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
  only:
    - main

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - scp -r dist/* $SERVER_USER@$SERVER_HOST:/var/www/cmms-web/
  only:
    - main
```

---

## 🐛 故障排查

### 问题1: 白屏

**可能原因**：
- 资源路径错误
- JavaScript错误
- API连接失败

**解决方法**：
```bash
# 检查控制台错误
# 打开浏览器开发者工具 → Console

# 检查网络请求
# 开发者工具 → Network

# 检查路径
# 确认base路径配置正确
```

### 问题2: API跨域

**可能原因**：
- 未配置代理
- CORS未配置

**解决方法**：
```nginx
# 在Nginx中添加CORS头
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
add_header Access-Control-Allow-Headers 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
```

### 问题3: 页面刷新404

**可能原因**：
- SPA路由未配置

**解决方法**：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 问题4: 构建失败

**可能原因**：
- Node版本不匹配
- 依赖安装失败

**解决方法**：
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm install

# 或使用nvm切换Node版本
nvm use 18
```

---

## 📊 监控和分析

### 1. 页面性能

使用工具：
- **Lighthouse**: Google页面性能评分
- **PageSpeed Insights**: 页面速度测试
- **WebPageTest**: 详细性能分析

### 2. 用户分析

```javascript
// 百度统计示例
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?your_site_id";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
```

### 3. 错误监控

```javascript
// Sentry配置
import * as Sentry from "@sentry/vue"

Sentry.init({
  dsn: "your-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
})
```

---

## 📚 参考资源

- [Vue 3文档](https://cn.vuejs.org/)
- [Vite文档](https://cn.vitejs.dev/)
- [Element Plus文档](https://element-plus.org/)
- [Nginx文档](https://nginx.org/en/docs/)
- [Web性能优化](https://web.dev/)
