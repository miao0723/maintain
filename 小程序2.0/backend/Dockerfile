# 电子维修小程序后端镜像
FROM node:18-alpine

# 安装编译依赖（sharp 需要）
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# 先拷贝依赖清单，利用层缓存
COPY package.json package-lock.json* ./

RUN npm install --production

# 拷贝源码
COPY . .

# 后端监听端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
