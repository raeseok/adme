# AdMe Stage 2-A — Read-Only 광고 카드·퀴즈 Schema Audit

작성일: 2026-07-08  
기준 commit: Stage 2-A 작업 시점  
대상: `supabase/migrations/`, `apps/web` Stage 2-A 구현

---

## 1. 요약

Stage 2-A는 광고 카드·퀴즈 **read-only UI 골격**과 **정답 비노출·point_ledger 불가침** 검증 준비 단계이다.  
이번 Stage에서 DB mutation, 퀴즈 제출, 포인트 적립, ad_views 기록, 카카오톡 실제 발송은 수행하지 않는다.

---

## 2. 광고/퀴즈 관련 DB 테이블 존재 여부

| 테이블 / VIEW | 존재 | Stage 2-A 사용 | 비고 |
|---|---|---|---|
| `campaigns` | ✅ | read-only SELECT (active) | 정답 컬럼 없음 |
| `quizzes` | ✅ | **직접 조회 금지** | `quiz_answer` 포함 |
| `quizzes_public` | ✅ (VIEW) | read-only SELECT | `quiz_answer` 제외 |
| `ad_views` | ✅ | **기록하지 않음** | Stage 2-C 이후 |
| `point_ledger` | ✅ | **mutation 금지** | Stage 3까지 적립 없음 |
| `interest_categories` | ✅ | 라벨 조회 | 기준 문서 `categories` 대응 |
| `consumer_profiles` | ✅ | 기존 Stage 1 흐름 | 소비 의향 프로필 |
| `consumer_category_interests` | ✅ | 기존 Stage 1 흐름 | 기준 `user_categories` 대응 |
| `consumer_regions` | ✅ (Stage 0.6) | RLS read-only | 다중 지역 junction |
| `regions` | ✅ | 라벨 조회 | 시·도/구·동 계층 |
| `advertisers` | ✅ | `company_name`만 DTO | 연락처·사업자번호 제외 |

---

## 3. campaigns 정답 컬럼 여부

| 항목 | 결과 |
|---|---|
| `campaigns.quiz_answer` | **없음** |
| 정답 저장 위치 | `quizzes.quiz_answer` (TEXT, NOT NULL) |
| 소비자 조회 경로 | `quizzes_public` VIEW만 허용 |

`campaigns` 테이블 주요 컬럼: `id`, `advertiser_id`, `title`, `description`, `region_id`, `category_id`, `ad_content_url`, `ad_content_text`, `budget_total`, `budget_spent`, `reward_per_view`, `max_views_per_consumer`, `status`, `starts_at`, `ends_at`.

---

## 4. 클라이언트 DTO에서 반드시 제외할 컬럼·필드

### campaigns / quizzes 원본

- `quiz_answer`, `answer`, `correct`, `correctOption`, `correctOptionId`, `correctIndex`, `answerIndex`, `isCorrect`, `solution`, `explanationForCorrectAnswer`
- `advertisers.contact_phone`, `advertisers.business_registration_number`, `advertisers.user_id`
- `budget_total`, `budget_spent` (광고주 내부 예산 — 소비자 DTO 불필요)
- `auth token`, `email` 원문, `full user id`

### Stage 2-A Client DTO (`ConsumerAdCardDto`) 포함 필드만

- `campaignId`, `title`, `advertiserDisplayName`, `categoryLabel`, `regionLabel`, `bodyExcerpt`, `pointPreviewLabel`, `minViewSecondsPreview`, `quizQuestion`, `quizOptions`, `readOnlyMode`

---

## 5. point_ledger — 이번 Stage mutation 금지

- `point_ledger` INSERT / UPDATE / DELETE **금지**
- `quiz_reward` (`ad_reward` entry_type) 적립 **금지** (Stage 3)
- UI 표현: "예상 적립", "미리보기 포인트"만 허용
- 금지 표현: "적립 완료", "지급 완료", "원장 반영"

검증: `npm run verify:stage2a-point-ledger-no-mutation`

---

## 6. ad_views — 이번 Stage 기록하지 않음

- `ad_views` INSERT / UPDATE / DELETE **금지** (Stage 2-C)
- 최소 열람 타이머 강제 **금지** (Stage 2-B)

---

## 7. Stage 2-B로 넘길 항목

| 항목 | Stage |
|---|---|
| 최소 열람 타이머 강제 | 2-B |
| 퀴즈 제출 + 서버 채점 (`grade_quiz_answer` RPC) | 2-B |
| 오답 재도전 / 2회 종료 | 2-C |
| `ad_views` attempt 기록 | 2-C |
| `point_ledger` quiz_reward 적립 | 3 |
| 카카오톡 수신 동의 UI·상태 저장 | 2-D |
| 카카오톡 실제 발송 | 5-K |

---

## 8. RLS·보안 확인

| 항목 | 상태 |
|---|---|
| RLS 전 테이블 활성화 | ✅ 유지 |
| `quizzes` anon 직접 SELECT | ❌ REVOKE |
| `quizzes_public` consumer SELECT | ✅ 정답 미포함 |
| service role key 사용 | ❌ 금지 |
| anon write policy 추가 | ❌ 금지 |

---

## 9. Stage 2-A DB mutation 여부

| 대상 | Stage 2-A |
|---|---|
| `point_ledger` | mutation 없음 |
| `ad_views` | mutation 없음 |
| `campaigns` / `quizzes` seed | Production insert 없음 |
| notification 관련 migration | 생성 없음 (문서 후보만) |

---

## 10. 운영 리스크 (잔존)

- **개발/운영 Supabase 미분리**: 실제 연락수단 수집·카카오 발송 전환 전까지 dev/prod 프로젝트 분리 필요
- Production DB에 active campaign seed 없음 → Stage 2-A는 server-only fixture fallback 사용
- `point_ledger` runtime count 검증은 RLS로 anon 제한 시 static scan으로 대체

---

## 11. 관련 코드 경로

| 경로 | 역할 |
|---|---|
| `apps/web/src/lib/consumer-ads/types.ts` | Client DTO |
| `apps/web/src/lib/consumer-ads/fetch-consumer-ads.server.ts` | DB 조회 (quiz_answer 미포함) |
| `apps/web/src/lib/consumer-ads/stage2a-fixtures.server.ts` | server-only fixture + sentinel |
| `apps/web/src/app/consumer/ads/` | 소비자 read-only UI |
