# AdMe Stage 0-LV 검증 결과

작성일: 2026-07-06  
환경: Windows 10, `c:\Adme`, PostgreSQL 17.10 (standalone, port 54329)

---

## 1. live 검증 방식

| 항목 | 값 |
|------|-----|
| 방식 | **A'안** — PostgreSQL 17 standalone (Docker-free) |
| 스크립트 | `scripts/run_live_validation_pg17.ps1` |
| 운영 DB 분리 | ✅ 로컬 ephemeral `.pgdata` only |
| Supabase CLI | 2.109.0 (Docker 미사용) |

---

## 2. 실행 일시 및 결과

**2026-07-06 15:26 KST — `validate_stage0.sql` 전 항목 PASS**

| 단계 | 결과 |
|------|------|
| PostgreSQL 17 winget 설치 | ✅ Successfully installed |
| initdb + migration 8개 | ✅ |
| seed 적용 | ✅ |
| validate_stage0.sql [1]–[16] | ✅ **ALL PASS** |

---

## 3. 수정 내역 (live 검증 중 발견)

| 파일 | 수정 |
|------|------|
| `20260706100400_stage0_indexes.sql` | `viewed_at::date` → `(viewed_at AT TIME ZONE 'UTC')::date` (IMMUTABLE) |
| `validate_stage0.sql` | BIGINT 검사 오탐 수정, smoke test auth.users 단순화 |

---

## 4. validate_stage0.sql 결과

| # | 항목 | Live |
|---|------|------|
| 1 | 15개 테이블 | ✅ PASS |
| 2 | BIGINT 금액 | ✅ PASS |
| 3 | RLS 15개 | ✅ PASS |
| 4 | quizzes_public VIEW | ✅ PASS |
| 5 | anon quizzes 차단 | ✅ PASS |
| 6 | grade_quiz_answer BOOLEAN | ✅ PASS |
| 7 | point_ledger append-only | ✅ PASS |
| 8 | point_ledger INSERT 제한 | ✅ PASS |
| 9 | admin_adjustment reason | ✅ PASS |
| 10 | 100/101원 배분 | ✅ PASS |
| 11 | SECURITY DEFINER search_path | ✅ PASS |
| 12 | seed idempotency | ✅ PASS |
| 13 | 핵심 인덱스 | ✅ PASS |
| 14 | 비즈니스 상수 | ✅ PASS |
| 15 | point_packages VIEW | ✅ PASS |
| 16 | point_packages 100/101 smoke | ✅ PASS |

---

## 5. Stage 0 최종 결론

| 항목 | 판정 |
|------|------|
| **Stage 0 live 검증** | ✅ **PASS** |
| **Stage 0 완료 가능** | ✅ **가능** |
| Stage 0.5 / Stage 1-A 진입 | live PASS 확인 후 진행 가능 |

---

## 6. 재실행 방법

```powershell
cd c:\Adme
powershell -File scripts/run_live_validation_pg17.ps1
# Stage 0.6 포함:
powershell -File scripts/run_live_validation_stage0_6_pg17.ps1
# Docker 사용 시:
powershell -File scripts/run_live_validation.ps1
```

---

## 7. Stage 0.6 (consumer_regions)

Stage 0.6 migration 및 검증은 [stage-0-6-consumer-regions.md](./stage-0-6-consumer-regions.md) 참조.
