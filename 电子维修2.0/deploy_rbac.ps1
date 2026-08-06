# RBAC权限系统部署脚本
# 用于Windows环境下的快速部署

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "电子维修系统 - RBAC权限控制部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否为管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "提示: 建议以管理员权限运行此脚本" -ForegroundColor Yellow
    Write-Host ""
}

# 设置路径
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$backendDir = Join-Path $projectRoot "backend"
$sqlFile = Join-Path $backendDir "database\add_role_field.sql"

Write-Host "项目根目录: $projectRoot" -ForegroundColor Gray
Write-Host "SQL文件路径: $sqlFile" -ForegroundColor Gray
Write-Host ""

# 检查SQL文件是否存在
if (-not (Test-Path $sqlFile)) {
    Write-Host "错误: SQL文件不存在 - $sqlFile" -ForegroundColor Red
    Write-Host "请确保项目结构完整" -ForegroundColor Red
    exit 1
}

Write-Host "步骤 1/5: 读取SQL脚本" -ForegroundColor Green
$sqlContent = Get-Content $sqlFile -Raw -Encoding UTF8
Write-Host "✓ SQL脚本读取成功" -ForegroundColor Green
Write-Host ""

# 询问数据库连接信息
Write-Host "步骤 2/5: 配置数据库连接" -ForegroundColor Green
Write-Host ""

$envFile = Join-Path $backendDir ".env"
$dbHost = $null
$dbPort = 3306
$dbName = "repair"
$dbUser = $null
$dbPass = $null

# 尝试从.env文件读取
if (Test-Path $envFile) {
    Write-Host "从 .env 文件读取数据库配置..." -ForegroundColor Gray
    $envContent = Get-Content $envFile -Encoding UTF8
    foreach ($line in $envContent) {
        if ($line -match '^DB_HOST=(.+)$') { $dbHost = $matches[1].Trim() }
        if ($line -match '^DB_PORT=(.+)$') { $dbPort = $matches[1].Trim() }
        if ($line -match '^DB_NAME=(.+)$') { $dbName = $matches[1].Trim() }
        if ($line -match '^DB_USER=(.+)$') { $dbUser = $matches[1].Trim() }
        if ($line -match '^DB_PASSWORD=(.+)$') { $dbPass = $matches[1].Trim() }
    }
    Write-Host "✓ 找到配置: $dbHost:$dbPort/$dbName" -ForegroundColor Green
}

if (-not $dbHost -or -not $dbUser) {
    Write-Host "未找到完整的数据库配置，请手动输入:" -ForegroundColor Yellow
    $dbHost = Read-Host "数据库主机 (默认: localhost)"
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
    
    $dbPortInput = Read-Host "数据库端口 (默认: 3306)"
    if ([string]::IsNullOrWhiteSpace($dbPortInput)) { $dbPort = 3306 } else { $dbPort = $dbPortInput }
    
    $dbName = Read-Host "数据库名 (默认: repair)"
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "repair" }
    
    $dbUser = Read-Host "数据库用户名"
    $dbPass = Read-Host "数据库密码" -AsSecureString
    $dbPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))
}

Write-Host "数据库配置: $dbUser@$dbHost:$dbPort/$dbName" -ForegroundColor Cyan
Write-Host ""

# 检查MySQL客户端
Write-Host "步骤 3/5: 检查MySQL客户端" -ForegroundColor Green
$mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCommand) {
    Write-Host "✓ 找到MySQL客户端: $($mysqlCommand.Source)" -ForegroundColor Green
} else {
    Write-Host "警告: 未找到MySQL客户端命令" -ForegroundColor Yellow
    Write-Host "请确保MySQL已安装并添加到PATH环境变量" -ForegroundColor Yellow
    Write-Host "或者使用以下方式之一执行SQL:" -ForegroundColor Yellow
    Write-Host "  1. phpMyAdmin" -ForegroundColor Gray
    Write-Host "  2. MySQL Workbench" -ForegroundColor Gray
    Write-Host "  3. Navicat" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "继续尝试连接? (y/n)"
    if ($choice -ne 'y' -and $choice -ne 'Y') {
        Write-Host "已取消部署" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""

# 执行SQL
Write-Host "步骤 4/5: 执行数据库迁移" -ForegroundColor Green

# 创建临时SQL文件(去除注释和空行,更简洁)
$tempSql = Join-Path $env:TEMP "rbac_migration_$([guid]::NewGuid()).sql"

$lines = $sqlContent -split "`r`n"
$cleanLines = @()
foreach ($line in $lines) {
    $trimmed = $line.Trim()
    # 跳过注释和空行
    if (-not $trimmed.StartsWith("--") -and $trimmed -ne "") {
        $cleanLines += $trimmed
    }
}
$cleanLines -join "`r`n" | Out-File -FilePath $tempSql -Encoding UTF8

try {
    # 使用mysql命令执行
    $mysqlPath = if ($mysqlCommand) { $mysqlCommand.Source } else { "mysql" }
    
    $cmd = "$mysqlPath -h $dbHost -P $dbPort -u $dbName -p$dbPass $dbName < `"$tempSql`""
    Write-Host "执行SQL命令..." -ForegroundColor Gray
    Write-Host $cmd -ForegroundColor DarkGray
    
    $result = Invoke-Expression $cmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ SQL执行成功" -ForegroundColor Green
    } else {
        Write-Host "✗ SQL执行失败" -ForegroundColor Red
        Write-Host "错误信息:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "请手动执行SQL文件: $sqlFile" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 执行出错: $_" -ForegroundColor Red
}

# 清理临时文件
Remove-Item $tempSql -ErrorAction SilentlyContinue

Write-Host ""

# 验证
Write-Host "步骤 5/5: 验证部署" -ForegroundColor Green

# 询问是否运行测试
$runTest = Read-Host "是否运行权限系统测试? (y/n)"
if ($runTest -eq 'y' -or $runTest -eq 'Y') {
    Write-Host ""
    Write-Host "运行测试脚本..." -ForegroundColor Cyan
    Set-Location $backendDir
    node test_rbac.js
} else {
    Write-Host "跳过测试" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "后续步骤:" -ForegroundColor Yellow
Write-Host "1. 重启后端服务: cd backend && npm start" -ForegroundColor Gray
Write-Host "2. 使用管理员账号登录管理后台" -ForegroundColor Gray
Write-Host "3. 查看 RBAC_IMPLEMENTATION_GUIDE.md 了解更多" -ForegroundColor Gray
Write-Host ""

# 等待用户确认
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
