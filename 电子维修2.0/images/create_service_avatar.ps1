# 创建客服头像
Add-Type -AssemblyName System.Drawing

$size = 100
$bgColor = [System.Drawing.Color]::FromArgb(102, 126, 234)
$whiteColor = [System.Drawing.Color]::FromArgb(255, 255, 255)

$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# 填充背景
$g.Clear($bgColor)

# 画客服图标（人头形状）
$pen = New-Object System.Drawing.Pen($whiteColor, 3)
$brush = [System.Drawing.SolidBrush]::new($whiteColor)

# 头部（圆形）
$g.DrawEllipse($pen, 30, 20, 40, 40)
$g.FillEllipse($brush, 31, 21, 38, 38)

# 身体（半圆）
$g.DrawArc($pen, 25, 50, 50, 30, 0, 180)

# 保存文件
$bmp.Save('service-avatar.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()

Write-Host "✓ service-avatar.png 创建成功"
