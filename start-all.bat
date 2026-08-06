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
echo [步骤 1/3] 启动Docker容器 (MySQL + Redis + Backend + Agent)...
cd /d "%~dp0docker"
docker-compose up -d mysql redis agent-service php nginx

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

REM 步骤2: 检查Node.js
echo.
echo [步骤 2/3] 检查前端环境...
cd /d "%~dp0frontend-web"

where npm >nul 2>&1
if errorlevel 1 (
    echo [警告] Node.js未安装，跳过前端启动
    echo 请手动安装Node.js: https://nodejs.org/
    goto :show_info
)

REM 检查node_modules
if not exist "node_modules" (
    echo [!] 首次运行，正在安装依赖...
    call npm install
)

echo [✓] 前端环境就绪

REM 步骤3: 显示启动信息
:show_info
echo.
echo ========================================
echo           系统启动完成！
echo ========================================
echo.
echo 🌐 访问地址：
echo.
echo    前端管理后台: http://localhost:3000
echo    后端API: http://localhost/api
echo    Agent服务: http://localhost:8001/health
echo.
echo 🔐 默认账号：
echo.
echo    管理员: admin  /  admin123
echo    测试用户: user  /  user123
echo.
echo 📊 服务状态：
echo.
echo    MySQL:  ✅ localhost:3306
echo    Redis:  ✅ localhost:6379
echo    Agent:  ✅ localhost:8001
echo    前端:   需要手动启动
echo.
echo ========================================
echo.

REM 询问是否启动前端
set /p start_frontend="是否立即启动前端? (Y/N): "
if /i "%start_frontend%"=="Y" (
    echo.
    echo [!] 前端将在新窗口启动
    echo [!] 关闭前端窗口即可停止服务
    echo.
    start "CMMS Frontend" cmd /k "cd /d "%~dp0frontend-web" && npm run dev"
    echo.
    echo [✓] 前端正在启动...
    echo     请稍等片刻后访问: http://localhost:3000
    echo.
)

echo.
echo 💡 常用命令：
echo.
echo    查看Docker日志:
echo      docker logs docker-php-1
echo.
echo    停止所有服务:
echo      cd docker ^&^& docker-compose down
echo.
echo    前端管理:
echo      cd frontend-web
echo      npm run dev    (启动)
echo      Ctrl+C        (停止)
echo.
echo ========================================

pause
