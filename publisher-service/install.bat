@echo off
setlocal

echo ============================================================
echo   爱维修 · 自动发布服务 - 依赖安装
echo ============================================================
echo.

cd /d "%~dp0"

REM ---------- 定位 Python ----------
set PY_EXE=
where python >nul 2>nul && set PY_EXE=python
if "%PY_EXE%"=="" (
    where py >nul 2>nul && set PY_EXE=py
)
if "%PY_EXE%"=="" (
    echo [错误] 没有找到 Python。请先安装 Python 3.10 或以上版本：
    echo        https://www.python.org/downloads/
    echo        安装时务必勾选 "Add Python to PATH"
    pause
    exit /b 1
)

echo [1/4] 使用的 Python：
%PY_EXE% --version
echo.

REM ---------- 创建虚拟环境 ----------
if not exist ".venv" (
    echo [2/4] 创建虚拟环境 .venv ...
    %PY_EXE% -m venv .venv
    if errorlevel 1 (
        echo [错误] 虚拟环境创建失败
        pause
        exit /b 1
    )
) else (
    echo [2/4] 虚拟环境已存在，跳过创建
)
echo.

REM ---------- 安装依赖 ----------
echo [3/4] 安装 Python 依赖 ...
call ".venv\Scripts\python.exe" -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
call ".venv\Scripts\python.exe" -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络
    pause
    exit /b 1
)
echo.

REM ---------- 安装浏览器内核 ----------
echo [4/4] 安装 Playwright Chromium 内核（约 150MB，首次较慢）...
call ".venv\Scripts\python.exe" -m playwright install chromium
if errorlevel 1 (
    echo [警告] Chromium 下载失败。如果本机已装 Chrome，可在 .env 中保持
    echo        PUBLISHER_BROWSER_CHANNEL=chrome，服务会直接用本机 Chrome。
)
echo.

REM ---------- 生成 .env ----------
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [提示] 已从 .env.example 生成 .env，请打开它修改 PUBLISHER_TOKEN
    echo        并确保和 backend\.env 中的 PUBLISHER_TOKEN 一致。
) else (
    echo [提示] .env 已存在，未覆盖
)

echo.
echo ============================================================
echo   安装完成！接下来：
echo   1. 编辑 .env，设置 PUBLISHER_TOKEN
echo   2. 双击 start.bat 启动服务
echo   3. 到管理后台「引流模块 - 发布账号管理」扫码登录各平台
echo ============================================================
pause
