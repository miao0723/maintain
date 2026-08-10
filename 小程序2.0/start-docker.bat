@echo off
REM 一键启动维修小程序后端（Docker）
REM 请确保已安装 Docker Desktop 并处于运行中

cd /d %~dp0

echo 正在构建并启动服务（MySQL + 后端）...
docker compose up -d --build

echo.
echo 等待后端就绪...
timeout /t 10 > nul

echo.
echo 查看后端日志（按 Ctrl+C 退出日志，不影响服务）:
docker compose logs -f backend
pause
