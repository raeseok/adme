# AdMe Stage 1-G — Child Birth Year · Pet Condition Profile UX

작성일: 2026-07-08  
상태: **완료**

**Current living docs:** [current-business-plan.md](./current-business-plan.md) · [current-development-plan.md](./current-development-plan.md) · [stage-roadmap-current.md](./stage-roadmap-current.md)

---

## 목표

- 소비 의향 프로필에 **가장 큰 자녀 생년**, **막내 자녀 생년**, **반려동물 조건**(강아지/고양이/기타) 선택 항목 추가
- 프로필 UX를 **능동형 소비정보 요청** 관점으로 개선
- 금전성 mutation 없이 저장·조회·RLS·diagnostics·verify 구축

---

## DB migration

| 항목 | 값 |
|---|---|
| 파일 | `supabase/migrations/20260708130000_stage_1_g_child_pet_profile_conditions.sql` |
| dev 적용 | `ogncvdxrrsjnwsuvgoyh` — `supabase db push` |
| prod 적용 | `vupsalteyltjqumppltc` — `supabase db push` |
| db reset | **false** |
| migration repair | **false** |

### 추가 컬럼 (nullable)

- `oldest_child_birth_year` integer
- `youngest_child_birth_year` integer
- `pet_types` text[] (`dog`, `cat`, `other`)

### Check constraints

- 자녀 생년: 1970 ~ 현재연도, oldest ≤ youngest (둘 다 not null일 때)
- pet_types: `dog` / `cat` / `other` 만 허용

---

## UX 문구 (`/consumer/profile`)

- 소비성향 프로필은 광고를 보내달라는 나의 요구입니다.
- 더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.
- 자녀 생년·반려동물 조건 — 미입력 허용, 소비정보 조건으로만 사용

---

## 보안 / RLS

- consumer 본인만 child/pet 필드 저장·조회
- advertiser/partner `consumer_profiles` raw row 직접 조회 불가
- matching API에 child/pet raw 값 미노출 (이번 Stage)
- stage1G machine marker: `/admin/diagnostics` only

---

## Diagnostics markers

- `stage1GBuild=stage1g-child-pet-profile-ux-production`
- `stage1GChildBirthYearFields=true`
- `stage1GPetConditionFields=true`
- `stage1GProfileActiveRequestCopy=true`
- `stage1GPointLedgerMutation=false`
- `stage1GPublicMarkerExposed=false`

---

## 검증 명령

```bash
cd apps/web
npm run verify:stage1g-profile-family-pet
npm run smoke:stage1g-profile-ux
npm run verify:stage1g-rls-family-pet
npm run verify:stage1g-public-marker-guard
```

---

## Production 확인 URL

- Profile: https://web-ashen-xi-52.vercel.app/consumer/profile
- Diagnostics: https://web-ashen-xi-52.vercel.app/admin/diagnostics

---

## Known limitations

- 자녀 생년·반려동물 조건은 **matching actual 활용 미구현** (저장·UI만)
- prod Google/Kakao OAuth provider 수동 복제 잔여 (ADME-DECISION-20260708-008)
- Stage 3-A point_ledger actual mutation 미착수

---

## 다음 Stage 후보

1. **Stage 3-A** — point_ledger actual mutation dev-only dry-run
2. **Stage 1-H** — 프로필·매칭 후속 (TBD)
