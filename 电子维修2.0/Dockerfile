# 维修小程序后端镜像（构建上下文为项目根目录 电子维修2.0）
FROM node:18-alpine

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# 后端依赖
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --production && cd ..

# 拷贝后端源码（server.js 运行目录为 /app/backend）
COPY backend/ ./backend/

# 后端运行时需要项目根级的 utils（scanRoutes 通过 ../../utils 引用，解析为 /app/utils）
COPY utils/ ./utils/

EXPOSE 3001

WORKDIR /app/backend
CMD ["npm", "start"]
