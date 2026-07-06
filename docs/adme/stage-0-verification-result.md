# AdMe Stage 0-R 검증 결과

작성일: 2026-07-06  
환경: Windows 10, `c:\Adme`

---

## 1. 실행한 검증 명령

| 명령 | 결과 | 비고 |
|---|---|---|
| `git status` | **FAIL** → `git init` 수행 | 초기: not a git repository |
| `npx supabase@latest --version` | **PASS** | v2.109.0 |
| `npx supabase@latest start` | **FAIL** | Docker Desktop 미설치 |
| `supabase db reset` | **미실행** | Docker prerequisite |
| `scripts/validate_stage0.sql` (live) | **미실행** | PostgreSQL 인스턴스 없음 |
| `npm run lint` | **N/A** | package.json 없음 |
| `npm run typecheck` | **N/A** | npm 프로젝트 없음 |

---

## 2. 실행 불가 사유

| 항목 | 상태 |
|---|---|
| Docker Desktop | **미설치** — `docker_engine` pipe 없음 |
| Supabase CLI (로컬) | npx로 2.109.0 사용 가능 |
| psql | PATH에 없음 |
| npm 프로젝트 | 없음 |

### 대체 검증 방법 (수행함)

1. **마이그레이션 정적 분석** — 7개 SQL 파일 전체 리뷰
2. **`scripts/validate_stage0_static.ps1`** — 파일·패턴 기반 14항목 검증
3. **0-R 보정 migration** — `20260706100600_stage0_r_audit_fixes.sql` 추가

---

## 3. 정적 검증 결과 (`validate_stage0_static.ps1`)

| # | 항목 | 결과 |
|---|---|---|
| 1 | 7개 migration 파일 존재 | PASS |
| 2 | 15개 CREATE TABLE | PASS |
| 3 | quizzes_public VIEW | PASS |
| 4 | quiz_answer REVOKE anon | PASS |
| 5 | point_ledger append-only 트리거 | PASS (0-R migration) |
| 6 | validate_point_ledger_insert 트리거 | PASS (0-R migration) |
| 7 | grade_quiz_answer RETURNS BOOLEAN | PASS |
| 8 | calculate_revenue_split search_path | PASS (0-R migration) |
| 9 | SECURITY DEFINER search_path | PASS |
| 10 | .gitignore .env 포함 | PASS |
| 11 | .env 파일 없음 (커밋 안전) | PASS |
| 12 | seed ON CONFLICT | PASS |
| 13 | RLS ENABLE 구문 15회 | PASS |
| 14 | validate_stage0.sql 14개 검증 블록 | PASS |

---

## 4. validate_stage0.sql live 검증 (예상 결과)

Docker 설치 후 다음 명령으로 실행:

```bash
npx supabase@latest start
npx supabase@latest db reset
npx supabase@latest db query -f scripts/validate_stage0.sql
```

| # | 검증 항목 | 정적 | Live |
|---|---|---|---|
| 1 | 15개 테이블 존재 | PASS | **미검증** |
| 2 | BIGINT 금액 컬럼 | PASS | **미검증** |
| 3 | RLS 15개 테이블 | PASS | **미검증** |
| 4 | quizzes_public VIEW, 정답 없음 | PASS | **미검증** |
| 5 | anon quizzes SELECT 차단 | PASS | **미검증** |
| 6 | grade_quiz_answer BOOLEAN | PASS | **미검증** |
| 7 | append-only UPDATE/DELETE | PASS (코드) | **미검증** |
| 8 | point_ledger INSERT 정책 없음 | PASS | **미검증** |
| 9 | admin_adjustment reason 필수 | PASS (코드) | **미검증** |
| 10 | 100/101원 배분 | PASS (로직) | **미검증** |
| 11 | SECURITY DEFINER search_path | PASS | **미검증** |
| 12 | seed 중복 없음 | PASS | **미검증** |
| 13 | 핵심 인덱스 | PASS | **미검증** |
| 14 | 비즈니스 상수 | PASS | **미검증** |

---

## 5. 0-R 수정 항목

| # | 문제 | 수정 | 파일 |
|---|---|---|---|
| 1 | point_ledger UPDATE/DELETE 가능 | append-only 트리거 | `20260706100600_stage0_r_audit_fixes.sql` |
| 2 | admin_adjustment reason 미검증 | INSERT 트리거 | 동일 |
| 3 | quizzes REVOKE authenticated → RLS 무력화 | anon만 REVOKE, advertiser 정책 추가 | 동일 |
| 4 | calculate_revenue_split search_path 없음 | SET search_path 추가 | 동일 |
| 5 | .gitignore 불완전 | 필수 항목 보강 | `.gitignore` |
| 6 | validate_stage0.sql 미흡 | 14항목으로 보강 | `scripts/validate_stage0.sql` |

### 수정하지 않은 항목 (문서화로 해소)

| 항목 | 사유 |
|---|---|
| `point_packages` 테이블 | Stage 1 scope. `calculate_revenue_split()`으로 로직 검증 가능 |
| `user_regions` 별도 테이블 | MVP 단일 지역으로 통합 — audit 문서에 승인 |

---

## 6. 광고주 선납 배분 (로직 검증)

### 100원 (`calculate_revenue_split(100)`)

| 풀 | 금액 |
|---|---:|
| reward_pool | 35 |
| partner_share | 30 |
| adme_hq | 20 |
| ops_pool | 10 |
| buffer_pool | 5 |
| **합계** | **100** |

### 101원 (`calculate_revenue_split(101)`)

| 풀 | 금액 |
|---|---:|
| reward_pool | 35 |
| partner_share | 30 |
| adme_hq | 20 |
| ops_pool | 10 |
| buffer_pool | **6** |
| **합계** | **101** |

buffer가 정수 나눗셈 잔여 1원 흡수 — `validate_stage0.sql` [10]에서 live 검증.

---

## 7. 실패 항목

| 항목 | 상태 |
|---|---|
| Docker live DB 검증 | **실패 (환경)** — Docker 미설치 |
| npm lint/typecheck | **N/A** |

---

## 8. Stage 1 진행 가능 여부

**판정: 조건부 가능**

### 조건

1. Docker 설치 후 `validate_stage0.sql` live PASS
2. Stage 1 초기 sprint에서 `point_packages` (또는 동등 구조) migration 추가

### 남은 쟁점

- `point_packages` 미구현
- live DB 검증 미완료
- consumer API에서 `quizzes_public` 강제 (BFF/RLS 테스트)

### 다음 작업

1. Docker Desktop 설치 → live validation
2. Stage 1: `point_packages` + 광고 시청 reward RPC
3. Git remote 연결 (선택)
