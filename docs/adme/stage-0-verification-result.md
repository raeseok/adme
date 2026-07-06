# AdMe Stage 0-LV 검증 결과

작성일: 2026-07-06  
환경: Windows 10, `c:\Adme`  
최종 커밋 기준: `8fcf098`

---

## 1. live 검증 방식 시도 요약

| 방식 | 시도 | 결과 |
|------|------|------|
| **A안** local Docker + Supabase | `docker --version` | ❌ Docker 미설치 |
| **B안** 원격 Supabase dev | `supabase projects list` | ❌ access token 없음, project-ref 미제공 |
| **A'안** PostgreSQL 17 standalone (Docker-free fallback) | `run_live_validation_pg17.ps1` | ❌ initdb 실패 (불완전 설치) |

**운영 DB와 분리**: 모든 시도는 로컬 전용. 운영 Supabase 미사용.

---

## 2. 실행 일시 및 명령

### 2026-07-06 실행

| 명령 | 결과 |
|------|------|
| `docker --version` | not found |
| `docker info` | not found |
| `npx supabase@latest --version` | **2.109.0** |
| `npx supabase@latest start` | ❌ Docker prerequisite |
| `npx supabase@latest db push --local --dry-run` | ❌ 127.0.0.1:54322 연결 거부 |
| `npx supabase@latest projects list` | ❌ `Access token not provided` |
| `powershell -File scripts/run_live_validation_pg17.ps1` | ❌ initdb 실패 |

### PostgreSQL 17 fallback 상세

```
initdb -D c:\Adme\.pgdata -U postgres -A trust
→ FATAL: could not access file "$libdir/dict_snowball": No such file or directory
```

- `C:\Program Files\PostgreSQL\17\bin\psql.exe` 존재 (17.10)
- `C:\Program Files\PostgreSQL\17\lib\dict_snowball.dll` **없음** — winget 설치 불완전
- `winget repair PostgreSQL.PostgreSQL.17` → 패키지 미등록
- `winget install PostgreSQL.PostgreSQL.17` 재시도 → **UAC/installer 대기 중** (완료 미확인)

---

## 3. migration 적용 결과

| 항목 | 결과 |
|------|------|
| db reset / db push | **미실행** |
| migration 8개 적용 | **미검증** |
| seed 적용 | **미검증** |
| 추가 보정 migration | 없음 (이번 작업) |

---

## 4. validate_stage0.sql 결과

| # | 검증 항목 | Live | 비고 |
|---|-----------|------|------|
| 1 | 15개 테이블 존재 | **미실행** | |
| 2 | BIGINT 금액 | **미실행** | 정적 PASS |
| 3 | RLS 15개 | **미실행** | 정적 PASS |
| 4 | quizzes_public VIEW | **미실행** | |
| 5 | anon quizzes 차단 | **미실행** | |
| 6 | grade_quiz_answer BOOLEAN | **미실행** | |
| 7 | point_ledger append-only | **미실행** | |
| 8 | point_ledger INSERT 제한 | **미실행** | |
| 9 | admin_adjustment reason | **미실행** | |
| 10 | 100/101원 배분 | **미실행** | |
| 11 | SECURITY DEFINER search_path | **미실행** | |
| 12 | seed idempotency | **미실행** | |
| 13 | 핵심 인덱스 | **미실행** | |
| 14 | 비즈니스 상수 | **미실행** | |
| 15 | point_packages VIEW | **미실행** | |
| 16 | point_packages 100/101 smoke | **미실행** | |

**validate_stage0.sql live PASS**: ❌ **미달성**

---

## 5. 정적 검증 (참고)

`validate_stage0_static.ps1`: **17/17 PASS** (코드·migration 파일 기준, DB 미연결)

---

## 6. 실패 및 수정 내역

| 실패 | 원인 | 조치 |
|------|------|------|
| Docker live | Docker Desktop 미설치 | 기술 담당자 설치 필요 |
| Remote Supabase | login/token/project-ref 없음 | dev project-ref + `supabase login` 필요 |
| PG17 fallback | 불완전 설치 (dict_snowball) | PostgreSQL installer UAC 완료 또는 Docker 사용 |

### 이번 작업에서 추가한 검증 인프라 (코드만, live 미실행)

| 파일 | 용도 |
|------|------|
| `scripts/bootstrap_supabase_minimal_auth.sql` | standalone PG용 auth 부트스트랩 |
| `scripts/run_live_validation_pg17.ps1` | Docker-free live 검증 시도 스크립트 |

---

## 7. Stage 0 최종 결론

| 항목 | 판정 |
|------|------|
| **Stage 0 완료 가능** | ❌ **불가** (live DB 검증 미실행) |
| **남은 보류 사유** | Docker **또는** 완전한 PG17 **또는** 원격 dev Supabase + credentials |
| **Stage 0.5 / Stage 1-A 진입** | Stage 0 live PASS 후 |

---

## 8. 기술 담당자 액션 (우선순위)

### 권장 A안 — Docker Desktop

```powershell
# Docker Desktop 설치·실행 후
cd c:\Adme
powershell -File scripts\run_live_validation.ps1
```

### 대안 B안 — Supabase 원격 개발 프로젝트

```powershell
cd c:\Adme
npx supabase@latest login
npx supabase@latest link --project-ref <DEV_PROJECT_REF>
npx supabase@latest db push
# Dashboard SQL Editor 또는 db query로 validate_stage0.sql 실행
```

### 대안 A' — PostgreSQL 17 installer 완료

- winget/UAC 설치 완료 후 `dict_snowball.dll` 존재 확인
- `powershell -File scripts/run_live_validation_pg17.ps1`

---

## 9. 민감정보

- `.env` / service role key / DB password: **커밋 없음** ✅
- 검증 로그에 credentials **미포함** ✅
