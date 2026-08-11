# 小程序后端（Node.js + Express + WebSocket）
FROM node:20-bookworm-slim

RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先安装依赖，充分利用镜像层缓存
COPY 电子维修2.0/backend/package.json 电子维修2.0/backend/package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm install --omit=dev

# 复制业务代码（.env 已在 .dockerignore 中排除，配置一律由 env_file 注入）
COPY 电子维修2.0/backend/ ./

# scanRoutes.js 依赖小程序根目录的共享模块 ../../utils/deviceData.js
COPY 电子维修2.0/utils/ /utils/

# 上传目录（与 PHP 后台共享的 uploads 由 compose 挂载到 /uploads）
RUN mkdir -p /uploads/reviews /uploads/quotes /uploads/repairs

ENV NODE_ENV=production \
    PORT=3001 \
    SERVER_HOST=0.0.0.0

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
    CMD curl -fsS http://127.0.0.1:3001/health || exit 1

CMD ["node", "server.js"]
