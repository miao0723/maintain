# PowerShell 脚本 - 创建底部导航栏图标
# 需要以管理员身份运行 PowerShell 执行此脚本

Write-Host "正在创建底部导航栏图标..." -ForegroundColor Green

Add-Type -AssemblyName System.Drawing

$icons = @(
    @{Name="home"; Color="Gray99,99,99"},
    @{Name="home-active"; Color="Purple102,126,234"},
    @{Name="repair"; Color="Gray99,99,99"},
    @{Name="repair-active"; Color="Purple102,126,234"},
    @{Name="service"; Color="Gray99,99,99"},
    @{Name="service-active"; Color="Purple102,126,234"},
    @{Name="mine"; Color="Gray99,99,99"},
    @{Name="mine-active"; Color="Purple102,126,234"}
)

$size = 81

foreach ($icon in $icons) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)

    # 解析颜色
    $colorParts = $icon.Color -replace '^[A-Za-z]+', '' -split ','
    if ($icon.Color -like "Gray*") {
        $r = [int]$colorParts[0]
        $g = [int]$colorParts[1]
        $b = [int]$colorParts[2]
    } else {
        $r = [int]$colorParts[0]
        $g = [int]$colorParts[1]
        $b = [int]$colorParts[2]
    }

    # 创建纯色背景
    for ($x = 0; $x -lt $size; $x++) {
        for ($y = 0; $y -lt $size; $y++) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($r, $g, $b))
        }
    }

    # 保存文件
    $outputPath = "images\$($icon.Name).png"
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "✓ 创建: $outputPath" -ForegroundColor Cyan
}

Write-Host "`n✅ 所有图标创建完成！" -ForegroundColor Green
Write-Host "现在可以使用底部导航栏了。" -ForegroundColor Yellow
