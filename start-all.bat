@echo off
REM ========================================
REM CMMS 系统一键启动脚本
REM ========================================

chcp 65001 >nul
cls

echo ========================================
echo       CMMS 系统一键启动
echo ========================================
echo.

REM 步骤1: 启动Docker容器
echo [步骤 1/3] 启动Docker容器 (Redis + Backend + Agent + Nginx)...
cd /d "%~dp0docker"
docker compose up -d redis agent-service php nginx frontend-web miniprogram-backend recycle-admin publisher-service

if errorlevel 1 (
    echo [错误] Docker容器启动失败
    pause
    exit /b 1
)

echo.
echo [✓] Docker容器已启动
docker ps --filter "name=docker" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
timeout /t 3 /nobreak >nul

REM 步骤2: 前端已容器化，随 docker compose 一起启动，无需本地 npm

REM 步骤3: 显示启动信息
:show_info
echo.
echo ========================================
echo           系统启动完成！
echo ========================================
echo.
echo 🌐 访问地址：
echo.
echo    前端管理后台: http://localhost:8081
echo    后端API: http://localhost:8080/api
echo    Agent服务: http://localhost:8002/health
echo    回收平台后台: http://localhost:3005
echo    小程序后端: http://localhost:3001
echo.
echo 🔐 默认账号：
echo.
echo    管理员: admin  /  admin123
echo    维修工人: wanggang  /  123456
echo    普通员工: staff01  /  staff123
echo.
echo 📊 服务状态：
echo.
echo    MySQL:  远程 8.155.24.202:3306 (cmms_db)
echo    Redis:  ✅ localhost:6379
echo    Agent:  ✅ localhost:8002
echo    前端:   ✅ 容器化 8081
echo.
echo ========================================
echo.
echo 💡 常用命令：
echo.
echo    查看服务状态: cd docker ^&^& docker compose ps
echo    查看Docker日志: docker logs docker-php-1
echo    停止所有服务: cd docker ^&^& docker compose down
echo.
echo ========================================

pause
