# AdMe Stage 0 static validation (no Docker required)
# Usage: powershell -File scripts/validate_stage0_static.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$passed = 0
$failed = 0

function Assert-Check($name, $condition) {
  if ($condition) {
    Write-Host "PASS: $name" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host "FAIL: $name" -ForegroundColor Red
    $script:failed++
  }
}

$migDir = Join-Path $root "supabase\migrations"
$migrations = Get-ChildItem $migDir -Filter "*.sql" -ErrorAction SilentlyContinue

Assert-Check "migration files exist (>=7)" ($migrations.Count -ge 7)

$tablesSql = Get-Content (Join-Path $migDir "20260706100100_stage0_tables.sql") -Raw
Assert-Check "15 CREATE TABLE statements" (([regex]::Matches($tablesSql, "CREATE TABLE public\.")).Count -eq 15)

$rlsSql = Get-Content (Join-Path $migDir "20260706100200_stage0_rls.sql") -Raw
Assert-Check "quizzes_public VIEW defined" ($rlsSql -match "CREATE OR REPLACE VIEW public\.quizzes_public")
$viewMatch = [regex]::Match($rlsSql, 'CREATE OR REPLACE VIEW public\.quizzes_public[\s\S]*?FROM public\.quizzes')
Assert-Check "quiz_answer not in quizzes_public SELECT" (-not ($viewMatch.Value -match 'quiz_answer'))
Assert-Check "REVOKE quizzes FROM anon" ($rlsSql -match "REVOKE ALL ON TABLE public\.quizzes FROM anon")
Assert-Check "RLS ENABLE count >= 15" (([regex]::Matches($rlsSql, "ENABLE ROW LEVEL SECURITY")).Count -ge 15)

$auditSql = Get-Content (Join-Path $migDir "20260706100600_stage0_r_audit_fixes.sql") -Raw -ErrorAction SilentlyContinue
Assert-Check "append-only trigger exists" ($auditSql -match "point_ledger_no_update")
Assert-Check "validate insert trigger exists" ($auditSql -match "point_ledger_validate_insert")
Assert-Check "advertiser quiz policies" ($auditSql -match "quizzes_advertiser_select")

$funcSql = Get-Content (Join-Path $migDir "20260706100300_stage0_functions_triggers.sql") -Raw
Assert-Check "grade_quiz_answer returns boolean" ($funcSql -match "RETURNS BOOLEAN[\s\S]*grade_quiz_answer" -or $funcSql -match "grade_quiz_answer[\s\S]*RETURNS BOOLEAN")

$validateSql = Get-Content (Join-Path $root "scripts\validate_stage0.sql") -Raw
Assert-Check "validate_stage0 has 14 check blocks" (([regex]::Matches($validateSql, "PASS \[\d+\]")).Count -ge 14)

$gitignore = Get-Content (Join-Path $root ".gitignore") -Raw
Assert-Check ".gitignore includes .env" ($gitignore -match "\.env")
Assert-Check ".gitignore includes .supabase/" ($gitignore -match "\.supabase/")

Assert-Check "no .env file in repo" (-not (Test-Path (Join-Path $root ".env")))

$seedSql = Get-Content (Join-Path $migDir "20260706100500_stage0_seed.sql") -Raw
Assert-Check "seed uses ON CONFLICT" ($seedSql -match "ON CONFLICT")

Write-Host ""
Write-Host "Static validation: $passed passed, $failed failed"
if ($failed -gt 0) { exit 1 }
exit 0
