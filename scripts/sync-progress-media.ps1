$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $workspace '电子维修2.0\backend\uploads\progress'
$targetRoot = Join-Path $workspace 'backend\public\uploads\progress'

if (-not (Test-Path -LiteralPath $sourceRoot)) {
  throw "Source progress media directory not found: $sourceRoot"
}

if (-not (Test-Path -LiteralPath $targetRoot)) {
  New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
}

$copied = 0
$skipped = 0

Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
  $relativePath = $_.FullName.Substring($sourceRoot.Length).TrimStart('\', '/')
  $destination = Join-Path $targetRoot $relativePath
  $destinationDir = Split-Path -Parent $destination

  if (-not (Test-Path -LiteralPath $destinationDir)) {
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
  }

  if ((Test-Path -LiteralPath $destination) -and ((Get-Item -LiteralPath $destination).Length -eq $_.Length)) {
    $skipped++
    return
  }

  Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
  $copied++
}

Write-Output "Synced progress media. Copied: $copied, Skipped: $skipped, Target: $targetRoot"
