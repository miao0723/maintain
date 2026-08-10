$codeText = ''
Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(js|json|wxml|wxss)$' } |
  ForEach-Object { try { $codeText += [System.IO.File]::ReadAllText($_.FullName) + "`n" } catch {} }

# Check all svg/png under images and miniprogram-free areas
$assets = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(svg|png|jpg|jpeg|gif)$' -and $_.FullName -notlike "*\miniprogram\*" -and $_.FullName -notlike "*\uploads\*" -and $_.FullName -notlike "*\backend\*" }

Write-Host "=== Asset reference check ==="
foreach ($f in $assets) {
  $name = $f.Name
  $rel = $f.FullName.Replace((Resolve-Path .).Path + '\', '').Replace('\', '/')
  $refByPath = $codeText.Contains($rel) -or $codeText.Contains('/' + $rel)
  $refByName = $codeText.Contains($name)
  if (-not $refByPath -and -not $refByName) {
    '{0}  ({1} KB)' -f $rel, [math]::Round($f.Length/1KB,1)
  }
}

# Check require() targets: list all required module paths and see if those files exist & are referenced
Write-Host "=== JS files never required ==="
$jsFiles = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue -Filter *.js |
  Where-Object { $_.FullName -notlike "*\miniprogram\*" -and $_.FullName -notlike "*\backend\*" -and $_.FullName -notlike "*\node_modules\*" }
foreach ($f in $jsFiles) {
  $rel = './' + $f.FullName.Replace((Resolve-Path .).Path + '\', '').Replace('\', '/')
  $relNoExt = $rel.Substring(0, $rel.Length-3)
  # search for require of this module (with or without .js, with or without ./)
  $patterns = @("'$rel'", """$rel""", "'$relNoExt'", """$relNoExt""", "'./" + $rel.Substring(2), """/pages/", "'/pages/")
  $found = $false
  if ($codeText.Contains($rel) -or $codeText.Contains($relNoExt)) { $found = $true }
  # also check by relative path from any other file - skip for brevity, mark candidates
  if (-not $found) {
    '{0}' -f $rel
  }
}
