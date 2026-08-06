@echo off
chcp 65001 >nul
echo 正在创建图标文件...
cd /d "%~dp0"

:: 创建灰色的圆形图标（未选中状态）
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(153,153,153)); $bmp.Save('home.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(153,153,153)); $bmp.Save('repair.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(153,153,153)); $bmp.Save('service.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(153,153,153)); $bmp.Save('mine.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"

:: 创建紫色的圆形图标（选中状态）
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(102,126,234)); $bmp.Save('home-active.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(102,126,234)); $bmp.Save('repair-active.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(102,126,234)); $bmp.Save('service-active.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"
powershell -Command "Add-Type -AssemblyName System.Drawing; $b=81; $bmp=New-Object System.Drawing.Bitmap($b,$b); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(102,126,234)); $bmp.Save('mine-active.png',[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()"

echo ✓ 图标文件创建完成！
echo.
echo 文件列表：
echo   - home.png (灰色)
echo   - home-active.png (紫色)
echo   - repair.png (灰色)
echo   - repair-active.png (紫色)
echo   - service.png (灰色)
echo   - service-active.png (紫色)
echo   - mine.png (灰色)
echo   - mine-active.png (紫色)
echo.
pause
