Add-Type -AssemblyName System.Drawing

$size = 81
$gray = [System.Drawing.Color]::FromArgb(153, 153, 153)
$purple = [System.Drawing.Color]::FromArgb(102, 126, 234)

# 创建 home.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($gray)
$bmp.Save('home.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 home-active.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($purple)
$bmp.Save('home-active.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 repair.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($gray)
$bmp.Save('repair.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 repair-active.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($purple)
$bmp.Save('repair-active.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 service.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($gray)
$bmp.Save('service.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 service-active.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($purple)
$bmp.Save('service-active.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 mine.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($gray)
$bmp.Save('mine.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 创建 mine-active.png
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($purple)
$bmp.Save('mine-active.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "图标文件创建完成！" -ForegroundColor Green
