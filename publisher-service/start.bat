@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [错误] 还没安装依赖，请先运行 install.bat
    pause
    exit /b 1
)

if not exist ".env" (
    echo [错误] 缺少 .env 配置文件，请先复制 .env.example 为 .env
    pause
    exit /b 1
)

echo ============================================================
echo   爱维修 · 自动发布服务 启动中
echo   浏览器会在发布/登录时自动弹出，请不要手动关闭窗口
echo   停止服务：在本窗口按 Ctrl+C
echo ============================================================
echo.

".venv\Scripts\python.exe" main.py

echo.
echo 服务已退出。
pause
