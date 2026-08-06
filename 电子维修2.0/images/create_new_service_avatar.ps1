# PowerShell 脚本：创建现代化的客服头像
# 用于生成 service-avatar-new.png

Add-Type -AssemblyName System.Drawing

# 创建SVG内容的简化版本作为位图绘制
$width = 200
$height = 200
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# 背景渐变
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($width, $height),
    [System.Drawing.Color]::FromArgb(102, 126, 234),
    [System.Drawing.Color]::FromArgb(118, 75, 162)
)
$graphics.FillEllipse($bgBrush, 10, 10, 180, 180)

# 机器人头部
$headBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.FillEllipse($headBrush, 45, 45, 110, 110)

# 眼睛
$eyeColor = [System.Drawing.Color]::FromArgb(102, 126, 234)
$eyeBrush = New-Object System.Drawing.SolidBrush($eyeColor)
$graphics.FillEllipse($eyeBrush, 60, 75, 25, 25)
$graphics.FillEllipse($eyeBrush, 115, 75, 25, 25)

# 眼睛高光
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.FillEllipse($whiteBrush, 68, 80, 8, 8)
$graphics.FillEllipse($whiteBrush, 123, 80, 8, 8)

# 微笑
$smilePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(118, 75, 162), 4)
$graphics.DrawArc($smilePen, 70, 95, 60, 30, 0, 180)

# 天线
$antennaPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(118, 75, 162), 4)
$graphics.DrawLine($antennaPen, 100, 45, 100, 20)
$graphics.FillEllipse($eyeBrush, 94, 10, 12, 12)

# 身体
$bodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.FillRectangle($bodyBrush, 75, 155, 50, 35)

# 身体装饰
$graphics.FillEllipse($bgBrush, 92, 165, 16, 16)

# 保存文件
$outputPath = Join-Path $PSScriptRoot "service-avatar-new.png"
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# 清理资源
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "✅ 新客服头像已创建: $outputPath"
Write-Host "🤖 这是一个现代化的客服机器人头像设计"
