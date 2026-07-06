# AdMe Stage 0-LV: live validation via local PostgreSQL 17 (Docker-free fallback)
# Usage: powershell -File scripts/run_live_validation_pg17.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$pgData = Join-Path $root ".pgdata"
$pgPort = 54329
$pgLog = Join-Path $pgData "server.log"
$psql = Join-Path $pgBin "psql.exe"
$initdb = Join-Path $pgBin "initdb.exe"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
$conn = "postgresql://postgres@127.0.0.1:$pgPort/postgres"

if (-not (Test-Path $initdb)) {
  Write-Host "FAIL: PostgreSQL 17 not found at $pgBin" -ForegroundColor Red
  exit 1
}

function Stop-LocalPg {
  if (Test-Path $pgData) {
    & $pgCtl -D $pgData stop -m fast 2>$null
  }
}

function Run-PsqlFile($file) {
  Write-Host "  -> $([System.IO.Path]::GetFileName($file))" -ForegroundColor DarkGray
  & $psql $conn -v ON_ERROR_STOP=1 -f $file
  if ($LASTEXITCODE -ne 0) { throw "psql failed: $file" }
}

Write-Host "=== AdMe Stage 0-LV Live Validation (PostgreSQL 17) ===" -ForegroundColor Cyan

try {
  Stop-LocalPg

  if (-not (Test-Path $pgData)) {
    Write-Host "[1] initdb..." -ForegroundColor Yellow
    & $initdb -D $pgData -U postgres -A trust -E UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) { throw "initdb failed" }
  }

  Write-Host "[2] Starting PostgreSQL on port $pgPort..." -ForegroundColor Yellow
  & $pgCtl -D $pgData -l $pgLog start -o "-p $pgPort"
  if ($LASTEXITCODE -ne 0) { throw "pg_ctl start failed" }

  Start-Sleep -Seconds 2

  Write-Host "[3] Bootstrap minimal auth..." -ForegroundColor Yellow
  Run-PsqlFile (Join-Path $root "scripts\bootstrap_supabase_minimal_auth.sql")

  Write-Host "[4] Applying migrations..." -ForegroundColor Yellow
  $migs = Get-ChildItem (Join-Path $root "supabase\migrations") -Filter "*.sql" | Sort-Object Name
  foreach ($m in $migs) { Run-PsqlFile $m.FullName }

  Write-Host "[5] Running validate_stage0.sql..." -ForegroundColor Yellow
  Run-PsqlFile (Join-Path $root "scripts\validate_stage0.sql")

  Write-Host "`n=== All live validations PASSED ===" -ForegroundColor Green
  exit 0
}
catch {
  Write-Host "`nFAIL: $($_.Exception.Message)" -ForegroundColor Red
  if (Test-Path $pgLog) {
    Write-Host "--- server.log (last 30 lines) ---" -ForegroundColor DarkYellow
    Get-Content $pgLog -Tail 30
  }
  exit 1
}
finally {
  Stop-LocalPg
}
