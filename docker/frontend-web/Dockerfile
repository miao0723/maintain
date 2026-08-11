# ---------- 构建阶段：编译 Vue3 + Vite 后台管理前端 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY frontend-web/package.json frontend-web/package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm install

# 复制源码并构建
COPY frontend-web/ ./
RUN npm run build

# ---------- 运行阶段：Nginx 提供静态资源 ----------
FROM nginx:1.24-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/frontend-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
