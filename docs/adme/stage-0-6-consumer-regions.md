# AdMe Stage 0.6 — 소비자 주거지역·주활동지역 다중 지역 DB 구조

작성일: 2026-07-07  
Stage: 0.6 — `consumer_regions` 테이블 추가, legacy `region_id` 유지

---

## 1. 목적

Stage 1-B 소비자 소비 의향 프로필 UI 구현 전에, 사업/개발 계획서 기준 다중 지역 구조를 DB에 반영한다.

| 항목 | Stage 0 (기존) | Stage 0.6 (신규) |
|------|----------------|------------------|
| 주거지역 | `consumer_profiles.region_id` 단일 | `consumer_regions` `region_type = 'residence'` 최대 1개 |
| 주활동지역 | 없음 | `consumer_regions` `region_type = 'activity'`, slot 1·2 각 1개 (최대 2개) |
| 광고 매칭 | 단일 region | 주거 + 주활동 모두 포함 (Stage 1-B 이후 UI/로직) |

---

## 2. 기존 단일 `region_id` 구조의 한계

- `consumer_profiles.region_id`는 주거·활동 구분 없이 지역 1개만 표현
- 주활동지역 2개, 광고 매칭 시 다중 지역 union 등을 UI만으로 처리하면 Stage 2 매칭 로직에서 재작업 비용 증가
- `consumer_category_interests`는 이미 M:N 패턴이 있으므로 지역도 별도 테이블로 분리하는 것이 일관됨

---

## 3. 새 `consumer_regions` 구조

```text
consumer_regions
├── id                  UUID PK
├── consumer_profile_id UUID FK → consumer_profiles(id) ON DELETE CASCADE
├── region_id           UUID FK → regions(id)
├── region_type         TEXT    'residence' | 'activity'
├── activity_slot       SMALLINT NULL (activity: 1|2, residence: NULL)
├── created_at / updated_at
```

**Owner FK 기준:** `consumer_profile_id` → `consumer_profiles(id)`  
(`consumer_profiles`는 `id` PK + `user_id` UNIQUE → `profiles(id)`)

---

## 4. DB 제약 (residence / activity)

| 제약 | 구현 |
|------|------|
| `region_type` 값 | CHECK `IN ('residence', 'activity')` |
| residence slot | `activity_slot IS NULL` |
| activity slot | `activity_slot IN (1, 2)` |
| 주거지역 최대 1개 | partial unique `(consumer_profile_id) WHERE region_type = 'residence'` |
| activity slot 유일 | partial unique `(consumer_profile_id, activity_slot) WHERE region_type = 'activity'` |
| 동일 지역 중복 | UNIQUE `(consumer_profile_id, region_type, region_id)` |

---

## 5. RLS 정책 요약

`consumer_category_interests`와 동일 패턴 (`current_consumer_profile_id()` 재사용):

| 역할 | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| anon | ❌ (정책 없음) | ❌ | ❌ | ❌ |
| authenticated (본인) | ✅ | ✅ (`is_consumer`) | ✅ | ✅ |
| admin | ✅ | — | ✅ | ✅ |

---

## 6. Backfill 방식

Migration에서 idempotent INSERT:

- `consumer_profiles.region_id IS NOT NULL`인 row에 대해
- `consumer_regions`에 `region_type = 'residence'` row가 없을 때만 insert
- `consumer_profiles.region_id` 컬럼은 **삭제·null 처리하지 않음**

---

## 7. Validation

| 파일 | 용도 |
|------|------|
| `supabase/validation/validate_stage0_6_consumer_regions.sql` | Stage 0.6 전용 16항목 검증 |
| `scripts/run_live_validation_stage0_6_pg17.ps1` | Stage 0 + 0.6 migration + 양쪽 validation |

**2026-07-07 로컬 live 검증:** `run_live_validation_stage0_6_pg17.ps1` — validate_stage0 [1]–[16] + validate_stage0_6 [1]–[16] **ALL PASS**

| # | 항목 | 결과 |
|---|------|------|
| 1 | consumer_regions table exists | PASS |
| 2 | RLS enabled | PASS |
| 3 | region_type check | PASS |
| 4 | residence max 1 | PASS |
| 5 | activity max 2 structure | PASS |
| 6 | activity slot 1/2 unique, slot 3 blocked | PASS |
| 7 | FK to regions | PASS |
| 8 | owner FK to consumer_profiles | PASS |
| 9 | updated_at trigger | PASS |
| 10 | legacy region_id preserved | PASS |
| 11 | point_ledger unchanged | PASS |
| 12 | quiz_answer unchanged | PASS |
| 13 | BIGINT monetary columns | PASS |
| 14 | anon blocked | PASS |
| 15 | authenticated CRUD policies | PASS |
| 16 | backfill idempotent + constraint smoke | PASS |

**원격 dev Supabase:** CLI `supabase login` 미설정으로 이번 세션에서 `db push` 미적용. migration 파일은 저장소에 준비됨 — 로그인 후 `supabase db push`로 적용 가능.

Stage 0 핵심 원칙 유지 검증 포함:

- `point_ledger` append-only 트리거
- `quizzes.quiz_answer` 비노출
- BIGINT 금액 컬럼

---

## 8. Stage 1-B에서 사용할 DB 구조

Stage 1-B UI는 다음을 read/write 한다.

1. **주거지역 1개** — `consumer_regions` (`region_type = 'residence'`)
2. **주활동지역 최대 2개** — `consumer_regions` (`region_type = 'activity'`, `activity_slot` 1·2)
3. **관심 분야** — 기존 `consumer_category_interests`
4. **소비 금액 범위** — 기존 `consumer_profiles.monthly_intent_min/max`

`consumer_profiles.region_id`는 legacy 표시/호환용으로만 참조 가능 (SSOT는 `consumer_regions`).

---

## 9. Legacy `consumer_profiles.region_id` 유지 이유

- Stage 0 migration·앱·진단 코드가 단일 필드를 참조할 수 있음
- backfill로 `consumer_regions`와 값 동기화
- Stage 1-B에서 신규 저장은 `consumer_regions` 우선
- **제거 시점:** Stage 2 이후 별도 판단 (이번 단계에서 삭제 금지)

---

## 10. Migration 파일

`supabase/migrations/20260707120000_stage_0_6_consumer_regions.sql`

---

## 11. 관련 문서

- [Stage 0 검증 결과](./stage-0-verification-result.md)
- [Stage 0.5 Vercel Shell](./stage-0-5-vercel-shell.md)
- 다음 단계: **Stage 1-B** — 소비자 소비 의향 프로필 UI skeleton
