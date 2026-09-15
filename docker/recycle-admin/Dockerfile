# 回收综合服务平台（独立后台）
# 多阶段构建：先编译 Vue3 前端 -> Node.js 后端 + 托管 web/dist 单端口(3005)对外
#
# 构建参数（由 docker-compose.yml 传入）：
#   VITE_BASE      前端资源 base 路径，网关子路径部署时为 /recycle-admin/
#   VITE_API_BASE  前端 API 前缀，网关子路径部署时为 /recycle-admin/api

# ---------- 阶段1：构建前端 ----------
FROM node:20-bookworm-slim AS web-builder

WORKDIR /web

# 先装依赖，充分利用镜像层缓存（vite 在 devDependencies，不能 --omit=dev）
COPY recycle-admin/web/package.json recycle-admin/web/package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm install

COPY recycle-admin/web/ ./
ARG VITE_BASE=/
ARG VITE_API_BASE=/api
RUN npm run build

# ---------- 阶段2：后端运行镜像 ----------
FROM node:20-bookworm-slim

RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 后端依赖
COPY recycle-admin/server/package.json recycle-admin/server/package-lock.json* ./server/
RUN npm config set registry https://registry.npmmirror.com \
    && cd server && npm install --omit=dev

# 业务代码（server.js 按 ../web/dist 相对路径托管前端产物，
# 目录结构必须与仓库一致：server/ 与 web/dist/ 平级）
COPY recycle-admin/server/ ./server/
COPY --from=web-builder /web/dist/ ./web/dist/

WORKDIR /app/server

# .env 已在根目录 .dockerignore 排除，配置一律由 compose env_file 注入

ENV NODE_ENV=production \
    PORT=3005

EXPOSE 3005

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
    CMD curl -fsS http://127.0.0.1:3005/health || exit 1

CMD ["node", "server.js"]
