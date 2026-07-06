# AdMe Stage 0 live validation runner
# Prerequisites: Docker Desktop installed and running
# Usage: powershell -File scripts/run_live_validation.ps1
#
# Docker-free fallback (incomplete PG17 install may fail):
#   powershell -File scripts/run_live_validation_pg17.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== AdMe Stage 0-F Live Validation ===" -ForegroundColor Cyan

Write-Host "`n[1] Checking Docker..." -ForegroundColor Yellow
docker --version
docker info | Select-Object -First 5

Write-Host "`n[2] Starting Supabase..." -ForegroundColor Yellow
npx --yes supabase@latest start

Write-Host "`n[3] Resetting database (apply all migrations)..." -ForegroundColor Yellow
npx --yes supabase@latest db reset

Write-Host "`n[4] Running validate_stage0.sql..." -ForegroundColor Yellow
$dbUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

$sqlFile = Join-Path $root "scripts\validate_stage0.sql"
$sqlContent = Get-Content $sqlFile -Raw

# Try supabase db query first, fallback to psql
$supabaseQuery = npx --yes supabase@latest db query --help 2>&1
if ($LASTEXITCODE -eq 0) {
  npx --yes supabase@latest db query -f $sqlFile
} elseif (Get-Command psql -ErrorAction SilentlyContinue) {
  psql $dbUrl -f $sqlFile
} else {
  # Pipe SQL via supabase db query without -f
  $sqlContent | npx --yes supabase@latest db query
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "`nFAIL: validate_stage0.sql returned errors" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== All live validations PASSED ===" -ForegroundColor Green
exit 0
