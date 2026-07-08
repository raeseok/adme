# AdMe Stage 1-G-R — Basic · Optional Profile Sections

작성일: 2026-07-08  
상태: **완료**

**Current living docs:** [current-business-plan.md](./current-business-plan.md) · [current-development-plan.md](./current-development-plan.md) · [stage-roadmap-current.md](./stage-roadmap-current.md)

**선행 Stage:** [stage-1-g-child-pet-profile-ux.md](./stage-1-g-child-pet-profile-ux.md)

---

## 목표

1. **Production deploy commit = repo HEAD** 정합화 (Stage 1-G 재보류 해소)
2. `/consumer/profile`에 **기본 정보** / **선택 정보** 섹션 분리
3. 선택 정보 섹션 내부에 맞춤 소비정보 확대 문구 배치
4. stage1GR diagnostics marker 및 verify script 추가

---

## 재보류 해소

| 항목 | 값 |
|---|---|
| 기존 Production deploy | `329e73f` (Stage 1-G feature) |
| 기존 repo HEAD | `fceb801` (verify script 안정화) |
| 해소 | Stage 1-G-R commit push 후 Production redeploy → HEAD 일치 |

---

## UI 구조 (`/consumer/profile`)

### 상단 안내

- 소비성향 프로필은 광고를 보내달라는 나의 요구입니다.
- 아래 항목은 개인 신원이 아닌 소비정보 조건입니다.

### 기본 정보

| 필드 | 비고 |
|---|---|
| 출생년도 | UX 기본 정보 |
| 성별 | UX 기본 정보 |
| 주거지역 | 저장 시 필수 (방식 B) |

설명: 기본 정보는 맞춤 소비정보를 받기 위한 **최소 조건**

### 선택 정보

| 필드 | 비고 |
|---|---|
| 가장 큰 자녀 생년 | Stage 1-G 유지 |
| 막내 자녀 생년 | Stage 1-G 유지 |
| 반려동물 조건 | Stage 1-G 유지 |
| 주활동지역 1·2 | 기존 selector 유지 |
| 관심정보 / 관심 소비 분야 | 미선택 시 전체로 저장 |

설명: 선택 정보는 더 정교한 맞춤 소비정보를 위한 **추가 조건**

필수 문구 (선택 정보 섹션 **내부**):
- “더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.”
- “입력하지 않아도 기본 프로필 저장은 가능합니다.”

---

## 완성도 (방식 B)

- **기본 정보 남은 항목**: 출생년도, 성별, 주거지역
- **선택 정보 추가 가능 항목**: 자녀 생년, 반려동물, 주활동지역, 관심정보
- 저장 차단: **주거지역만** (출생년도·성별은 강조만)

---

## DB / migration

- **신규 migration 없음** — Stage 1-G schema 유지
- db reset: **false**
- migration repair: **false**

---

## Diagnostics markers (stage1GR)

`/admin/diagnostics` only:

- `stage1GRBuild=stage1g-r-profile-basic-optional-sections-production`
- `stage1GRProductionCommitMatchesRepoHead=true`
- `stage1GRBasicProfileFields=true`
- `stage1GROptionalProfileFields=true`
- `stage1GRBasicFields=birth_year,gender,residential_region`
- `stage1GROptionalFields=child_birth_years,pet_types,activity_regions,interest_categories`
- `stage1GROptionalCopyVisible=true`
- `stage1GROptionalCopyLocation=optional_profile_section`
- `stage1GRPointLedgerMutation=false`
- `stage1GRPublicMarkerExposed=false`
- `stage1GRDeployCommit={deployCommit}`

기존 stage1G markers 유지.

---

## 검증 명령

```bash
cd apps/web
npm run lint
npm run build
npm run smoke:stage1g-r-profile-basic-optional-ux
npm run verify:stage1g-r-production-commit
npm run verify:stage1g-r-public-marker-guard
# + Stage 1-D/E/F/G 회귀 (spec §6 전체)
```

---

## Production 확인 URL

- Profile: https://web-ashen-xi-52.vercel.app/consumer/profile
- Diagnostics: https://web-ashen-xi-52.vercel.app/admin/diagnostics

---

## Known limitations

- 자녀 생년·반려동물 matching actual 활용 미구현 (Stage 1-G와 동일)
- prod Google/Kakao OAuth provider 수동 복제 잔여
- Stage 3-A point_ledger actual mutation 미착수

---

## Decision log

- ADME-DECISION-20260708-010 — 기본/선택 정보 구분
- ADME-DECISION-20260708-011 — 선택 정보 섹션 맞춤 문구 배치
