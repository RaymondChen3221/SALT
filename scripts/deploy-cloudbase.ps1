param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$EnvId
)

$ErrorActionPreference = "Stop"

function Resolve-ProjectRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Find-CloudBaseCli {
  $tcb = Get-Command "tcb" -ErrorAction SilentlyContinue
  if ($tcb) { return $tcb.Source }

  $cloudbase = Get-Command "cloudbase" -ErrorAction SilentlyContinue
  if ($cloudbase) { return $cloudbase.Source }

  return ""
}

$projectRoot = Resolve-ProjectRoot
$staticDir = Join-Path $projectRoot "release\salt-static"
$indexFile = Join-Path $staticDir "index.html"

if (-not (Test-Path $indexFile)) {
  Write-Error "Static output not found: $staticDir. Create release/salt-static before deploying."
}

$cli = Find-CloudBaseCli
if (-not $cli) {
  Write-Host "CloudBase CLI was not found." -ForegroundColor Yellow
  Write-Host "Install it first:" -ForegroundColor Yellow
  Write-Host "  npm i -g @cloudbase/cli" -ForegroundColor Cyan
  exit 1
}

Write-Host "Using CloudBase CLI: $cli" -ForegroundColor Cyan

try {
  & $cli "--version" | Out-Host
} catch {
  Write-Host "CloudBase CLI exists but could not run. Reinstall with:" -ForegroundColor Yellow
  Write-Host "  npm i -g @cloudbase/cli" -ForegroundColor Cyan
  exit 1
}

Write-Host "Checking CloudBase login..." -ForegroundColor Cyan
$loginCheckOutput = ""
try {
  $loginCheckOutput = (& $cli "env" "list" 2>&1 | Out-String)
} catch {
  $loginCheckOutput = $_ | Out-String
}

if ($LASTEXITCODE -ne 0 -or $loginCheckOutput -match "login|登录|unauthorized|authorization|not authorized|not login|请先") {
  Write-Host "CloudBase CLI does not appear to be logged in." -ForegroundColor Yellow
  Write-Host "Run this first, then re-run this script:" -ForegroundColor Yellow
  Write-Host "  tcb login" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "If tcb is not available but cloudbase is, run:" -ForegroundColor Yellow
  Write-Host "  cloudbase login" -ForegroundColor Cyan
  exit 1
}

Write-Host "Login check passed." -ForegroundColor Green
Write-Host "Deploying static site from: $staticDir" -ForegroundColor Cyan
Write-Host "Target CloudBase environment: $EnvId" -ForegroundColor Cyan

Push-Location $staticDir
try {
  & $cli "hosting" "deploy" "." "-e" $EnvId
  if ($LASTEXITCODE -ne 0) {
    throw "CloudBase hosting deploy failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

Write-Host "CloudBase static hosting deploy command completed." -ForegroundColor Green
Write-Host "Open the CloudBase Console to confirm the default domain and test /, /app.js, /data/role_images.js, and /img/W.png." -ForegroundColor Cyan
