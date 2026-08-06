# 创建有效的 PNG 图标文件
Add-Type -AssemblyName System.Drawing

$size = 81
$gray = [System.Drawing.Color]::FromArgb(153, 153, 153)
$purple = [System.Drawing.Color]::FromArgb(102, 126, 234)

# 创建纯色背景的图标
function Create-Icon($filename, $color) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)

    # 填充背景色
    $g.Clear($color)

    # 保存为 PNG
    $absolutePath = (Resolve-Path .).Path + "\" + $filename
    $bmp.Save($absolutePath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()

    Write-Host "创建: $filename"
}

# 创建所有图标
Write-Host "开始创建图标文件..." -ForegroundColor Green

Create-Icon "home.png" $gray
Create-Icon "home-active.png" $purple
Create-Icon "repair.png" $gray
Create-Icon "repair-active.png" $purple
Create-Icon "service.png" $gray
Create-Icon "service-active.png" $purple
Create-Icon "mine.png" $gray
Create-Icon "mine-active.png" $purple

Write-Host "`n✓ 所有图标创建完成！" -ForegroundColor Green

# 显示文件信息
Write-Host "`n文件信息：" -ForegroundColor Cyan
Get-ChildItem -Filter *.png | ForEach-Object {
    Write-Host "  $($_.Name) - $($_.Length) bytes"
}
