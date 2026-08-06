@echo off
REM 启动后端 API 服务（使用 Docker Compose）

echo ========================================
echo 启动CMMS后端API服务
echo ========================================
echo.

set ROOT_DIR=%~dp0
set DOCKER_DIR=%ROOT_DIR%docker
set BACKEND_DIR=%ROOT_DIR%backend

REM 检查.env文件
if not exist "%BACKEND_DIR%\.env" (
    echo [错误] .env文件不存在
    echo 请先配置环境变量
    pause
    exit /b 1
)

if not exist "%DOCKER_DIR%\docker-compose.yml" (
    echo [错误] docker-compose.yml 不存在
    pause
    exit /b 1
)

echo [信息] 启动 Docker 后端服务...
echo.
echo 后端 API: http://localhost/api
echo Agent 服务: http://localhost:8001/health
echo 静态上传: http://localhost/uploads/
echo.
echo 将启动服务: mysql, redis, agent-service, php, nginx
echo.
echo 按 Ctrl+C 停止服务
echo.

cd /d "%DOCKER_DIR%"

docker compose up -d mysql redis agent-service php nginx
if errorlevel 1 (
    echo.
    echo [错误] Docker 服务启动失败
    echo 请确认 Docker Desktop 已启动，并执行:
    echo   cd /d "%DOCKER_DIR%"
    echo   docker compose logs --tail=100 agent-service nginx php mysql
    pause
    exit /b 1
)

echo.
echo [信息] 等待容器就绪...
timeout /t 5 /nobreak >nul

echo.
echo [✓] 后端服务已启动
echo.
echo 测试命令:
echo   curl http://localhost/api/health
echo   curl http://localhost:8001/health
echo.
echo 查看日志:
echo   cd /d "%DOCKER_DIR%"
echo   docker compose logs -f agent-service nginx php
echo.

pause
