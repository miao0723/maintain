@echo off
echo 正在创建占位图标文件...
echo.

cd /d "%~dp0"

REM 创建简单的占位图片
REM 注意：这些是空文件，仅用于占位，您需要替换为真实的图标文件

echo 创建 icons 文件夹...
if not exist "images" mkdir images

echo.
echo 创建占位文件...
echo. > images\home.png
echo. > images\home-active.png
echo. > images\repair.png
echo. > images\repair-active.png
echo. > images\service.png
echo. > images\service-active.png
echo. > images\mine.png
echo. > images\mine-active.png

echo.
echo ⚠️  占位文件已创建，但这些是空文件，不能正常显示！
echo.
echo 请使用以下方式之一获取真实图标：
echo.
echo 方式1: 访问 https://www.iconfont.cn/ 下载图标
echo 方式2: 运行 generate_icons.py（需要安装 Python 和 Pillow）
echo 方式3: 暂时注释掉 app.json 中的 tabBar 配置
echo.
pause
