# 创建带图案的图标文件
Add-Type -AssemblyName System.Drawing

$size = 81
$grayColor = [System.Drawing.Color]::FromArgb(153, 153, 153)
$purpleColor = [System.Drawing.Color]::FromArgb(102, 126, 234)
$whiteColor = [System.Drawing.Color]::FromArgb(255, 255, 255)

function Create-HomeIcon($outputPath, $bgColor) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bgColor)

    # 画房子轮廓
    $pen = New-Object System.Drawing.Pen($whiteColor, 3)
    $roofPoints = @(
        [System.Drawing.Point]::new(20, 45),
        [System.Drawing.Point]::new(40, 25),
        [System.Drawing.Point]::new(60, 45)
    )
    $g.DrawLines($pen, $roofPoints)

    # 画房子主体
    $g.DrawRectangle($pen, 25, 45, 30, 25)

    # 画门
    $g.DrawRectangle($pen, 35, 55, 10, 15)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Create-RepairIcon($outputPath, $bgColor) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bgColor)

    # 画扳手
    $pen = New-Object System.Drawing.Pen($whiteColor, 3)

    # 扳手头
    $g.DrawEllipse($pen, 30, 20, 20, 20)

    # 扳手柄
    $g.DrawLine($pen, 50, 40, 55, 60)
    $g.DrawLine($pen, 48, 42, 53, 62)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Create-ServiceIcon($outputPath, $bgColor) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bgColor)

    # 画聊天气泡
    $pen = New-Object System.Drawing.Pen($whiteColor, 3)

    # 主气泡
    $g.DrawRectangle($pen, 20, 25, 35, 30)
    $g.FillRectangle([System.Drawing.SolidBrush]::new($whiteColor), 21, 26, 34, 29)

    # 小气泡尾巴
    $points = @(
        [System.Drawing.Point]::new(20, 50),
        [System.Drawing.Point]::new(15, 58),
        [System.Drawing.Point]::new(25, 55)
    )
    $g.DrawLines($pen, $points)
    $g.FillPolygon([System.Drawing.SolidBrush]::new($whiteColor), $points)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Create-MineIcon($outputPath, $bgColor) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bgColor)

    # 画人物图标
    $pen = New-Object System.Drawing.Pen($whiteColor, 3)
    $brush = [System.Drawing.SolidBrush]::new($whiteColor)

    # 头部
    $g.DrawEllipse($pen, 30, 20, 20, 20)
    $g.FillEllipse($brush, 31, 21, 18, 18)

    # 身体（半圆）
    $g.DrawArc($pen, 25, 45, 30, 25, 0, 180)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Write-Host "开始创建带图案的图标..." -ForegroundColor Green

# 创建灰色图标（未选中状态）
Create-HomeIcon "home.png" $grayColor
Write-Host "✓ home.png"

Create-RepairIcon "repair.png" $grayColor
Write-Host "✓ repair.png"

Create-ServiceIcon "service.png" $grayColor
Write-Host "✓ service.png"

Create-MineIcon "mine.png" $grayColor
Write-Host "✓ mine.png"

# 创建紫色图标（选中状态）
Create-HomeIcon "home-active.png" $purpleColor
Write-Host "✓ home-active.png"

Create-RepairIcon "repair-active.png" $purpleColor
Write-Host "✓ repair-active.png"

Create-ServiceIcon "service-active.png" $purpleColor
Write-Host "✓ service-active.png"

Create-MineIcon "mine-active.png" $purpleColor
Write-Host "✓ mine-active.png"

Write-Host "`n✅ 所有图标创建完成！" -ForegroundColor Green

# 显示文件信息
Write-Host "`n文件信息：" -ForegroundColor Cyan
Get-ChildItem -Filter *.png | Where-Object { $_.Name -match "^(home|repair|service|mine)" } | ForEach-Object {
    Write-Host "  $($_.Name) - $($_.Length) bytes"
}
