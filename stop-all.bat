@echo off
REM ========================================
REM CMMS 系统一键停止脚本
REM ========================================

chcp 65001 >nul
cls

echo ========================================
echo       CMMS 系统一键停止
echo ========================================
echo.

echo [步骤 1/2] 停止Docker容器...
cd /d "%~dp0docker"
docker-compose down

echo.
echo [✓] Docker容器已停止

echo.
echo [步骤 2/2] 提示停止前端...
echo.
echo 如果前端正在运行，请:
echo 1. 找到前端窗口
echo 2. 按 Ctrl+C 停止服务
echo.
echo 或者在任务管理器中结束 node.exe 进程
echo.

echo ========================================
echo           所有服务已停止
echo ========================================
echo.

pause
