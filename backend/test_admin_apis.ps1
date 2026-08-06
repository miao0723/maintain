$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$base = 'http://localhost/api'

# 登录获取 token
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body '{"username":"admin","password":"admin123"}' -ContentType 'application/json'
$token = $login.data.access_token
if (-not $token) { Write-Host "登录失败"; exit 1 }
Write-Host "[PASS] 后台登录 token 获取成功"

$headers = @{ Authorization = "Bearer $token" }
$results = @()

function Test-Api($name, $url, $method = 'GET', $body = $null) {
    try {
        $p = @{ Uri = $url; Method = $method; Headers = $headers; TimeoutSec = 30 }
        if ($body) { $p.Body = $body; $p.ContentType = 'application/json' }
        $r = Invoke-RestMethod @p
        $code = if ($r.code -eq 200 -or $r.code -eq 0) { 200 } else { $r.code }
        $script:results += [pscustomobject]@{ name=$name; ok=($code -eq 200); status=$code; info=$r.message }
        $tag = if ($code -eq 200) { 'PASS' } else { 'FAIL' }
        Write-Host "[$tag] $name | code=$code | $($r.message)"
    } catch {
        $script:results += [pscustomobject]@{ name=$name; ok=$false; status='ERR'; info=$_.Exception.Message }
        Write-Host "[FAIL] $name | ERR $($_.Exception.Message)"
    }
}

Write-Host "`n===== 认证与用户 ====="
Test-Api 'auth/profile' "$base/auth/profile"
Test-Api 'users列表' "$base/users"
Test-Api 'roles列表' "$base/roles"
Test-Api 'permissions列表' "$base/permissions"

Write-Host "`n===== 组织架构 ====="
Test-Api 'organizations列表' "$base/organizations"
Test-Api 'departments列表' "$base/departments"
Test-Api 'personnel列表' "$base/personnel"

Write-Host "`n===== 设备管理 ====="
Test-Api 'devices分类' "$base/devices/categories"
Test-Api 'devices列表' "$base/devices"

Write-Host "`n===== 维修订单 ====="
Test-Api 'repair-orders列表' "$base/repair-orders"
Test-Api 'repair-orders待处理' "$base/repair-orders/pending"
Test-Api 'repair-orders处理中' "$base/repair-orders/processing"

Write-Host "`n===== 业务管理 ====="
Test-Api 'workorders列表' "$base/workorders"
Test-Api 'engineers列表' "$base/engineers"
Test-Api 'suppliers列表' "$base/suppliers"
Test-Api 'spare-parts列表' "$base/parts"
Test-Api 'knowledge列表' "$base/knowledge"
Test-Api 'repair-categories' "$base/repair-categories"
Test-Api 'marketing-cases' "$base/marketing/cases"
Test-Api 'notifications列表' "$base/notifications"

Write-Host "`n===== 统计 ====="
Test-Api 'statistics/dashboard' "$base/statistics/dashboard"
Test-Api 'statistics/orders' "$base/statistics/orders"

Write-Host "`n===== 汇总 ====="
$pass = @($results | Where-Object ok).Count
$fail = @($results | Where-Object { -not $_.ok })
Write-Host "通过: $pass/$($results.Count)"
if ($fail) { Write-Host "失败:"; $fail | ForEach-Object { Write-Host "  - $($_.name) | $($_.info)" } }
