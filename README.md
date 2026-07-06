# AdMe

AdMe MVP — Supabase PostgreSQL 기반 Stage 0 데이터베이스 스키마.

## Stage 0 범위

- 역할 기반 사용자 구조 (`consumer`, `advertiser`, `partner`, `admin`)
- 소비 의향 프로필, 지역, 관심 카테고리
- 캠페인, 퀴즈, 광고 열람
- `point_ledger` 단일 진실 원천 (SSOT)
- 광고주 선납, 파트너 정산, 현금 전환 요청
- RLS 전면 적용, `quiz_answer` 클라이언트 노출 방어

## 디렉터리 구조

```
supabase/
  config.toml
  migrations/
    20260706100000_stage0_extensions_enums.sql
    20260706100100_stage0_tables.sql
    20260706100200_stage0_rls.sql
    20260706100300_stage0_functions_triggers.sql
    20260706100400_stage0_indexes.sql
    20260706100500_stage0_seed.sql
scripts/
  validate_stage0.sql
```

## 사전 요구 사항

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker Desktop (로컬 Supabase 실행 시)

## 로컬 실행

```bash
# Supabase 로컬 시작
supabase start

# 마이그레이션 적용 (start 시 자동 적용)
supabase db reset

# 검증 SQL 실행
supabase db execute -f scripts/validate_stage0.sql
```

## 원격 Supabase 프로젝트 연결

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## 핵심 설계 원칙

| 원칙 | 구현 |
|------|------|
| 1P = 1원 | 모든 금액 `BIGINT` 원 단위 |
| 현금 전환 최소 | `10,000P` (`min_cash_redemption_points()`) |
| 수익 배분 | 100원 기준 35/30/20/10/5 (`revenue_split_per_100_won()`) |
| 포인트 SSOT | `point_ledger` — 잔액 컬럼은 캐시 |
| 퀴즈 정답 방어 | `quizzes_public` 뷰 + `REVOKE` + `grade_quiz_answer()` RPC |
| 서버 권위 | 원장 INSERT는 SECURITY DEFINER RPC (admin 선납 등) |

## 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `profiles` | Auth 사용자 + 역할 + 포인트 캐시 |
| `regions` | 지역 (시·도 / 구) |
| `interest_categories` | 관심·소비 카테고리 |
| `consumer_profiles` | 소비 의향 프로필 |
| `consumer_category_interests` | 소비자 ↔ 카테고리 |
| `advertisers` | 광고주 |
| `advertiser_prepayments` | 광고주 선납 기록 |
| `partners` | 지역 파트너 |
| `partner_settlements` | 파트너 정산 |
| `campaigns` | 광고 캠페인 |
| `quizzes` | 퀴즈 (정답 비공개) |
| `quizzes_public` | 퀴즈 공개 뷰 (정답 제외) |
| `ad_views` | 광고 열람 |
| `point_ledger` | 포인트 원장 (SSOT) |
| `cash_redemption_requests` | 현금 전환 요청 |
| `system_pool_balances` | 내부 수익 풀 캐시 |

## Stage 1 이후 확장 포인트

- `grade_quiz_answer()` → `ad_views` + `point_ledger` + 수익 배분 연동
- `record_advertiser_prepayment()` 패턴으로 현금 전환·정산 RPC 확장
- 캠페인 매칭 API (region + category + intent)

## 작업 전 확인 (2026-07-06)

```text
git status → 저장소 미초기화 (git init 필요)
```

Git 저장소 초기화:

```bash
git init
git add .
git commit -m "feat: AdMe Stage 0 Supabase DB schema"
```
