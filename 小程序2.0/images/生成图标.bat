@echo off
chcp 65001 >nul
echo ========================================
echo   底部导航栏图标生成工具
echo ========================================
echo.

echo 正在创建图标文件...
echo.

cd /d "%~dp0"

:: 使用 PowerShell 创建图标
powershell -ExecutionPolicy Bypass -File "create_icons.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ 图标创建成功！
    echo ========================================
    echo.
    echo 图标文件已保存在 images 文件夹中：
    echo   - home.png, home-active.png
    echo   - repair.png, repair-active.png
    echo   - service.png, service-active.png
    echo   - mine.png, mine-active.png
    echo.
    echo 现在可以在微信开发者工具中使用底部导航栏了！
) else (
    echo.
    echo ========================================
    echo   ✗ 图标创建失败
    echo ========================================
    echo.
    echo 请手动创建以下文件：
    echo   1. 在 images 文件夹中创建 8 个 PNG 文件
    echo   2. 尺寸：81x81 像素
    echo   3. 格式：PNG
    echo   4. 文件名：
    echo      - home.png (灰色 #999999)
    echo      - home-active.png (紫色 #667eea)
    echo      - repair.png (灰色)
    echo      - repair-active.png (紫色)
    echo      - service.png (灰色)
    echo      - service-active.png (紫色)
    echo      - mine.png (灰色)
    echo      - mine-active.png (紫色)
)

echo.
echo 按任意键退出...
pause >nul
