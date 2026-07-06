# AdMe Stage 0 스키마 정합성 감사 (Stage 0-R)

작성일: 2026-07-06  
기준: AdMe 개발계획서 v1.0 Stage 0 (13개 기준 테이블)  
대상: `c:\Adme\supabase\migrations\` 실제 구현

---

## 1. 요약 판정

| 항목 | 판정 |
|------|------|
| 13개 기준 테이블 대응 | **승인** (Stage 0-F) — `point_packages` compatibility VIEW 추가 |
| 15개 핵심 테이블 구조 | **유지** — Stage 1~5 확장에 유리 |
| quiz_answer 비노출 | **승인** — VIEW + REVOKE(anon) + RPC BOOLEAN |
| point_ledger SSOT / append-only | **승인** (0-R migration `20260706100600` 적용 후) |
| BIGINT 금액 | **승인** |
| RLS | **승인** — 15개 테이블 전부 활성화 |

---

## 2. 기준 13개 테이블 vs 실제 구현 매핑

| 기준 테이블 | 실제 구현 테이블 | 상태 | 판단 | 비고 |
|---|---|---|---|---|
| users | `profiles` | 이름변경 | 승인 | Supabase `auth.users` + `profiles` 확장. `profiles.point_balance` = 기준 `users.point_balance_cache` |
| regions | `regions` | 일치 | 승인 | 시·도/구 계층, seed 포함 |
| categories | `interest_categories` | 이름변경 | 승인 | Stage 1 UI/API에서 alias 문서화 권장 |
| consumption_profiles | `consumer_profiles` | 이름변경 | 승인 | 월 소비 의향(`monthly_intent_min/max`) BIGINT |
| user_regions | `consumer_profiles.region_id` | 통합 | 승인 | M:N → 1:N 단순화. 다중 지역 필요 시 Stage 2+에서 junction 복원 검토 |
| user_categories | `consumer_category_interests` | 이름변경 | 승인 | M:N junction 유지 |
| partners | `partners` | 일치 | 승인 | `settlement_balance` BIGINT 캐시 |
| advertisers | `advertisers` | 일치 | 승인 | `prepay_balance` = 기준 `available_point_balance_cache` |
| campaigns | `campaigns` + `quizzes` | 분리 | 승인 | 퀴즈를 별도 테이블로 분리. 1 캠페인 : N 퀴즈 |
| ad_views | `ad_views` | 일치 | 승인 | `points_earned` BIGINT |
| point_packages | `point_packages` **VIEW** | 호환 VIEW | **승인** (Stage 0-F) | 실테이블 `advertiser_prepayments` + `calculate_revenue_split()` 파생 VIEW |
| point_ledger | `point_ledger` | 일치 | 승인 | SSOT, append-only 트리거 적용 |
| partner_settlements | `partner_settlements` | 일치 | 승인 | `amount` BIGINT (기준 `gross_amount`/`share_amount` 단일화) |

### 컬럼명 대응 (주요)

| 기준 컬럼 | 실제 컬럼 | 비고 |
|---|---|---|
| `users.point_balance_cache` | `profiles.point_balance` | 원장 합계 캐시 |
| `advertisers.available_point_balance_cache` | `advertisers.prepay_balance` | 동일 역할 |
| `campaigns.point_per_pass` | `campaigns.reward_per_view` | 1회 시청 보상 |
| `campaigns.budget_points_total` | `campaigns.budget_total` | BIGINT |
| `campaigns.budget_points_spent` | `campaigns.budget_spent` | BIGINT |
| `point_packages.*` | `point_packages` VIEW 컬럼 | `advertiser_prepayments` + `calculate_revenue_split()` 파생 |

---

## 3-A. point_packages 최종 해소 (Stage 0-F)

### 선택 방식: **B안 — compatibility VIEW**

| 항목 | 내용 |
|------|------|
| relation type | **VIEW** (`public.point_packages`) |
| 실데이터 저장 | `advertiser_prepayments` 테이블 (단일 원장) |
| 배분 컬럼 | `CROSS JOIN LATERAL calculate_revenue_split(amount)` |
| 이중 원장 | **없음** — VIEW는 읽기 전용 파생 |

### advertiser_prepayments와의 관계

```
record_advertiser_prepayment() [admin RPC]
    │
    ├─► INSERT advertiser_prepayments  (실데이터)
    ├─► INSERT point_ledger            (SSOT, reference_type='point_packages')
    └─► point_packages VIEW            (조회용, 자동 반영)

point_packages VIEW ──SELECT──► advertiser_prepayments
                              └──► calculate_revenue_split()
```

### Stage 1 write 경로

| 작업 | 허용 경로 | 금지 |
|------|-----------|------|
| 선납 등록 | `record_advertiser_prepayment()` RPC | VIEW 직접 INSERT |
| 선납 조회 | `point_packages` VIEW 또는 `advertiser_prepayments` | consumer 접근 |
| 환불 처리 | Stage 1 RPC (refunded/refund_amount) | VIEW 직접 UPDATE |

### RLS (point_packages 경로)

| 역할 | advertiser_prepayments | point_packages VIEW |
|------|------------------------|---------------------|
| admin | ALL | SELECT (underlying RLS) |
| advertiser | own SELECT | own SELECT |
| partner | region 광고주 SELECT | region 광고주 SELECT |
| consumer | **거부** | **거부** |

VIEW에 INSERT/UPDATE/DELETE 트리거 없음 — 직접 write 불가.

### Stage 0-LV live 확인 (2026-07-06)

| 항목 | Live 결과 |
|------|-----------|
| point_packages VIEW 존재 | **미검증** — DB 연결 실패 |
| advertiser_prepayments 연동 | **미검증** |
| 100/101원 VIEW 배분 | **미검증** (validate [16]) |
| write 경로 RPC only | 코드 확인 ✅, live 미실행 |

---

## 3. 15개 테이블이 된 이유

### 기준 13개 대비 변동

```
13 (기준)
 -1  user_regions        → consumer_profiles.region_id 로 통합
 -1  point_packages      → VIEW로 해소 (실테이블 advertiser_prepayments)
 +1  quizzes             → campaigns 에서 퀴즈 분리
 +3  advertiser_prepayments, cash_redemption_requests, system_pool_balances
 ─────────────────────────────────────────────────
 =15  (실제 물리 테이블)
 +1  quizzes_public (VIEW, 테이블 아님)
```

### 추가 3개 테이블

| 테이블 | 역할 | Stage 1~5 영향 | 판단 |
|---|---|---|---|
| `advertiser_prepayments` | 관리자 수동 선납 감사 추적 + `ledger_entry_id` 연결 | admin 콘솔·정산 추적에 필수 | **유지** |
| `cash_redemption_requests` | 10,000P+ 현금 전환 요청·승인 워크플로 | MVP 수동 전환 전제와 일치 | **유지** |
| `system_pool_balances` | reward/adme/ops/buffer 풀 캐시 | `point_ledger` 대조용. Stage 1 배분 RPC와 연동 | **유지** |

### `quizzes` 분리

- **관계**: `campaigns` 1 ──< `quizzes` N (`campaign_id` FK, CASCADE)
- **이유**: 정답(`quiz_answer`) 컬럼 RLS/REVOKE 분리, 다문항 퀴즈 확장
- **`quizzes_public`**: **VIEW** (테이블 아님). `security_invoker = true`. `quiz_answer` 미포함

### Stage 1 UI 영향

| 변경 | 영향 | 대응 |
|---|---|---|
| `users` → `profiles` | Supabase 관례 | API layer에서 `User` DTO alias |
| `categories` → `interest_categories` | 명칭 차이 | OpenAPI/타입 alias |
| `user_regions` 통합 | 다중 지역 UI 불가 | MVP 단일 지역면 문제 없음 |
| `point_packages` 없음 | 선납 패키지 UI 목록 없음 | Stage 1 migration 추가 |

---

## 4. quiz_answer 비노출 구조

### 4.1 정답 저장 위치

| 항목 | 값 |
|---|---|
| 테이블 | `public.quizzes` |
| 컬럼 | `quiz_answer` (TEXT, NOT NULL) |

### 4.2 소비자/일반 클라이언트 경로

| 경로 | 정답 노출 | 근거 |
|---|---|---|
| `quizzes_public` VIEW | **없음** | SELECT 목록에 `quiz_answer` 제외 |
| `quizzes` + anon | **차단** | `REVOKE ALL ON quizzes FROM anon` |
| `quizzes` + authenticated consumer | **차단** | RLS: consumer용 SELECT 정책 없음 → 0 rows. **직접 SELECT 권한은 있으나 RLS로 차단** |
| `grade_quiz_answer()` RPC | **원문 미반환** | 반환 타입 `BOOLEAN` |
| PostgREST `quizzes` REST | consumer | RLS 0 rows (정답 유출 없음) |

### 4.3 광고주 정책 (MVP 결정)

| 역할 | `quizzes` 기본 테이블 | `quizzes_public` |
|---|---|---|
| 광고주 | **본인 캠페인 퀴즈 SELECT/INSERT/UPDATE 가능** (정답 포함) | 사용 불필요 |
| 소비자 | 접근 불가 (RLS) | **필수 조회 경로** |
| admin | 전체 | — |

**정책**: 광고주 콘솔에서 본인이 등록한 퀴즈 정답 관리 가능. **소비자 앱/API는 `quizzes_public` + `grade_quiz_answer()`만 사용** — 네트워크 응답에 정답 포함 금지.

### 4.4 0-R 수정 (migration `20260706100600`)

- **버그 수정**: 기존 `REVOKE ALL ON quizzes FROM authenticated` 가 admin/advertiser RLS 정책을 무력화
- **수정**: anon만 REVOKE, authenticated에 GRANT + RLS 역할 분리

### 4.5 검증 절차

`scripts/validate_stage0.sql` 항목 [4][5][6] + DB 실행 시 UPDATE/DELETE append-only [7]

---

## 5. point_ledger 구조

### 5.1 SSOT 원칙

- 모든 포인트 증감은 `point_ledger` INSERT로만 기록
- `profiles.point_balance`, `advertisers.prepay_balance` 등은 **캐시** (`sync_balance_cache_from_ledger` 트리거)
- 대조: `verify_consumer_balance()`, `verify_advertiser_balance()`

### 5.2 append-only (0-R 적용)

| 동작 | 결과 |
|---|---|
| UPDATE | `point_ledger is append-only: UPDATE operations are not allowed` |
| DELETE | `point_ledger is append-only: DELETE operations are not allowed` |
| authenticated INSERT | RLS INSERT 정책 없음 → 거부 |
| admin RPC INSERT | `record_advertiser_prepayment()` 등 SECURITY DEFINER |

### 5.3 entry_type ↔ 기준 유형 매핑

| 기준 유형 | `ledger_entry_type` | INSERT 제약 |
|---|---|---|
| charge | `advertiser_prepay` | advertiser, amount > 0 |
| quiz_reward | `ad_reward` | consumer + user_id, amount > 0 |
| cash_out | `cash_redemption` | consumer, amount < 0 |
| adjust | `admin_adjustment` | **reason 필수** (description 또는 metadata.reason) |
| (내부) | `campaign_spend`, `partner_settlement`, `revenue_allocation` | 유형별 account_type 검증 |

### 5.4 point_packages 대체 (Stage 1)

선납 100원 배분은 `calculate_revenue_split(gross)` 로 검증:

- 100원 → 35/30/20/10/5 (합 100)
- 101원 → 35/30/20/10/6 (buffer가 +1 흡수)

Stage 1에서 `point_packages` 테이블 또는 `point_ledger.metadata` 패키지 스냅샷 추가 예정.

---

## 6. SECURITY DEFINER 함수 점검

| 함수 | search_path | 권한 검증 | 입력 검증 | 민감정보 반환 |
|---|---|---|---|---|
| `record_advertiser_prepayment()` | `public` ✓ | `is_admin()` ✓ | amount > 0 ✓ | prepay UUID만 |
| `grade_quiz_answer()` | `public` ✓ | `auth.uid()` ✓ | quiz 존재 ✓ | **BOOLEAN만** |
| `handle_new_user()` | `public` ✓ | trigger | role metadata | 없음 |
| `sync_balance_cache_from_ledger()` | `public` ✓ | trigger | — | 없음 |
| `is_admin()` 등 helper | `public` ✓ | — | — | 없음 |

---

## 7. RLS 정책 요약

| 테이블 | RLS | SELECT | INSERT | UPDATE | DELETE | 비고 |
|---|:---:|---|---|---|---|---|
| profiles | ✓ | own/admin | own/admin | own/admin | — | |
| regions | ✓ | active/all | admin | admin | admin | |
| interest_categories | ✓ | active/all | admin | admin | admin | |
| consumer_profiles | ✓ | own/admin | own | own/admin | — | |
| consumer_category_interests | ✓ | own/admin | own | — | own/admin | |
| advertisers | ✓ | own/partner/admin | own | own/admin | — | |
| advertiser_prepayments | ✓ | own/admin | admin | — | — | |
| partners | ✓ | own/admin | own | own/admin | — | |
| partner_settlements | ✓ | own/admin | admin | admin | admin | |
| campaigns | ✓ | role-based | advertiser | advertiser/admin | — | |
| quizzes | ✓ | admin/advertiser-own | advertiser-own | advertiser-own | — | consumer 차단 |
| ad_views | ✓ | role-based | consumer | — | — | |
| point_ledger | ✓ | own/admin | **없음** | **없음** | **없음** | append-only |
| cash_redemption_requests | ✓ | own/admin | own | admin | — | |
| system_pool_balances | ✓ | admin | admin | admin | admin | |

### 역할별 접근 요약

| 테이블 | consumer | advertiser | partner | admin |
|---|---|---|---|---|
| profiles | own | own | own | all |
| campaigns | active만 | own | region | all |
| quizzes | **차단** (public view 사용) | own campaign | 차단 | all |
| ad_views | own | own campaign 집계 | region | all |
| point_ledger | own | own advertiser | own partner | all |

---

## 8. Stage 1 영향 및 남은 쟁점

### Stage 1 진행: **보류** (Stage 0-LV live 검증 PASS 전까지 Stage 0.5/Stage 1-A 진입 불가)

| 쟁점 | 우선순위 | 상태 (2026-07-06 LV) |
|---|---|---|
| **live DB 검증** | **최고** | ❌ Docker/PG17/원격 모두 실패 |
| point_packages VIEW | — | ✅ 코드 완료, live 미확인 |
| `user_regions` 단일 지역 | 중 | MVP OK |
| `ledger_entry_type` 명칭 | 낮 | API DTO alias |
| consumer API `quizzes_public` 강제 | 중 | Stage 1 BFF |

### 다음 작업 제안

1. Docker Desktop 설치 → `validate_stage0.sql` live 실행
2. Stage 1: `point_packages` migration + 광고 시청→배분→원장 RPC
3. API layer 타입 alias (`profiles`↔`users`, `interest_categories`↔`categories`)
