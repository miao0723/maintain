@echo off
echo ========================================
echo PHP + Composer 安装指南
echo ========================================
echo.

echo 当前需要安装：
echo [1] PHP 8.1+
echo [2] Composer
echo.

echo ========================================
echo 方法1: 使用XAMPP（推荐，最简单）
echo ========================================
echo.
echo 1. 下载XAMPP: https://www.apachefriends.org/
echo 2. 安装XAMPP（选择PHP 8.1+版本）
echo 3. 启动XAMPP Control Panel
echo 4. 启动Apache服务
echo 5. PHP会自动安装到 C:\xampp\php
echo.

echo ========================================
echo 方法2: 单独安装PHP
echo ========================================
echo.
echo 1. 下载PHP for Windows:
echo    https://windows.php.net/download/
echo 2. 解压到 C:\php
echo 3. 添加到PATH: C:\php
echo 4. 复制 php.ini-development 为 php.ini
echo 5. 启用扩展: extension=mysqli, extension=redis
echo.

echo ========================================
echo 方法3: 使用Chocolatey（命令行安装）
echo ========================================
echo.
echo choco install php -y
echo choco install composer -y
echo.

pause
