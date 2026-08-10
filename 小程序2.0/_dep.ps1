# Find image/asset files under pages, images, custom-tab-bar, utils that are NOT referenced anywhere in code
$codeDirs = @('.', 'pages', 'images', 'custom-tab-bar', 'utils', 'theme')
$exts = @('*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg', '*.woff', '*.ttf')

# Gather all code text to search for references
$codeText = ''
Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(js|json|wxml|wxss)$' } |
  ForEach-Object { try { $codeText += [System.IO.File]::ReadAllText($_.FullName) + "`n" } catch {} }

$all = @()
foreach ($ext in $exts) {
  $all += Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue -Filter $ext
}

foreach ($f in $all) {
  $name = $f.Name
  $rel = $f.FullName.Replace((Resolve-Path .).Path + '\', '').Replace('\', '/')
  # referenced by basename (without ext) or by path
  $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
  $refByPath = $codeText -like "*$rel*"
  $refByName = $codeText -like "*$name*"
  if (-not $refByPath -and -not $refByName) {
    '{0}  ({1} KB)' -f $rel, [math]::Round($f.Length/1KB,1)
  }
}
