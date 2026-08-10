#!/usr/bin/env bash
# 一键启动维修小程序后端（Docker）
set -e
cd "$(dirname "$0")"

echo "正在构建并启动服务（MySQL + 后端）..."
docker compose up -d --build

echo ""
echo "等待后端就绪..."
sleep 10

echo ""
echo "后端健康检查:"
curl -s http://localhost:3001/health || echo "(无法访问，请查看日志)"
echo ""

echo "实时日志（Ctrl+C 退出日志，服务仍在后台运行）:"
docker compose logs -f backend
