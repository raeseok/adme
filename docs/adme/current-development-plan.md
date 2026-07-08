# AdMe Current Development Plan (Living Document)

작성일: 2026-07-08  
상태: **current** — repo 내 최신 개발 기준 문서

---

## 문서 목적

이 문서는 AdMe **기술·Stage·보안·검증**의 현재 기준을 정의한다.  
`AdMe_개발계획서_v1.0.docx`는 최초 출발 기준이며, 구현·배포·분리 이후의 **실제 상태**는 본 문서가 우선한다.

관련:
- [current-business-plan.md](./current-business-plan.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 원본 개발계획서와의 관계

- docx: 초기 아키텍처·마일스톤 가설
- 본 문서: Stage 완료 인정·deploy commit·Supabase ref·verify script 기준의 **실측 current state**

---

## 현재 기술 스택

| 계층 | 기술 |
|---|---|
| Frontend / API | Next.js 16 (apps/web) |
| Auth / DB | Supabase (PostgreSQL, RLS, Auth) |
| Deploy | Vercel (Production / Preview) |
| E2E / Verify | Playwright, node verify scripts |
| Repo | GitHub (raeseok/adme) |

---

## 현재 Supabase dev/prod 구조

| 환경 | project-ref | 용도 |
|---|---|---|
| **dev** | `ogncvdxrrsjnwsuvgoyh` | Local, Preview, migration 선적용 |
| **prod** | `vupsalteyltjqumppltc` | Vercel Production only |

| Vercel env | Supabase |
|---|---|
| Production | prod (`vupsalteyltjqumppltc`) |
| Preview | dev (`ogncvdxrrsjnwsuvgoyh`) |
| Local (.env.local) | dev |

상세: [stage-3-1-supabase-env-split-result.md](./stage-3-1-supabase-env-split-result.md)

Env 체크리스트: [stage-3-1-vercel-env-checklist.md](./stage-3-1-vercel-env-checklist.md)

---

## 현재 route 목록 (apps/web)

| Route | 비고 |
|---|---|
| `/` | public |
| `/consumer` | 소비자 홈 |
| `/consumer/profile` | 소비 의향 프로필 |
| `/consumer/ads` | 광고 목록 |
| `/consumer/ads/[campaignId]` | 광고 상세·퀴즈 |
| `/advertiser` | 광고주 (shell) |
| `/partner` | 파트너 (shell) |
| `/admin` | admin shell |
| `/admin/diagnostics` | **machine marker visible (admin only)** |
| `/auth/login` | 로그인 |
| `/auth/callback` | OAuth callback |

---

## Stage별 현재 완료 상태

| Stage | 상태 | 요약 |
|---|---|---|
| Stage 0 | 완료 | schema audit, extensions, base tables |
| Stage 0.5 | 완료 | Vercel shell |
| Stage 0.6 | 완료 | consumer_regions |
| Stage 1-C/D | 완료 | Supabase Auth, social login |
| Stage 1-D-A/B | 완료 | public UI cleanup, profile intent UX |
| Stage 1-E/E-R | 완료 | hierarchical region selector, region auth |
| Stage 1-F/F-R | 완료 | MOIS region seed full coverage |
| Stage 2-A | 완료 | read-only ad card, quiz preview |
| Stage 2-B | 완료 | min-view timer, server grading preview |
| Stage 2-C/C-R | 완료 | ad_views, server authoritative min-view |
| Stage 3-0 | 완료 | ledger safety preflight, readiness markers |
| Stage 3-1 / 3-1-R | 완료 | dev/prod split, DB UUID E2E 회복 |
| Stage 1-G | 완료 | child/pet profile fields, active UX copy, diagnostics |
| Stage 1-G-R | 완료 | basic/optional profile sections, completion copy, stage1GR markers |

---

## Stage 1-G 완료 (2026-07-08)

- migration: `20260708130000_stage_1_g_child_pet_profile_conditions.sql`
- columns: `oldest_child_birth_year`, `youngest_child_birth_year`, `pet_types`
- UI: `/consumer/profile` 능동형 소비정보 요청 copy + 자녀 생년·반려동물 조건
- diagnostics: stage1G markers on `/admin/diagnostics` only
- verify: `verify:stage1g-*`, `smoke:stage1g-profile-ux`
- 금전성 mutation: **없음**

상세: [stage-1-g-child-pet-profile-ux.md](./stage-1-g-child-pet-profile-ux.md)

---

## Stage 1-G-R 완료 (2026-07-08)

- Production deploy commit = repo HEAD 정합화 (재보류 해소)
- UI: `/consumer/profile` **기본 정보** / **선택 정보** 섹션 분리
- 기본 정보: 출생년도, 성별, 주거지역 (방식 B — 주거지역만 저장 필수)
- 선택 정보: 자녀 생년, 반려동물, 주활동지역, 관심정보
- 선택 정보 섹션 내부에 “더 많은 조건을 등록할수록…” 문구 배치
- diagnostics: stage1GR markers on `/admin/diagnostics` only
- verify: `smoke:stage1g-r-*`, `verify:stage1g-r-*` + Stage 1-G 회귀
- 금전성 mutation: **없음**

상세: [stage-1-g-r-profile-basic-optional-sections.md](./stage-1-g-r-profile-basic-optional-sections.md)

---

## 현재 보안 불가침 원칙

| 원칙 | enforce |
|---|---|
| quiz_answer 비노출 | server-only, API/클라이언트/network 금지 |
| point_ledger actual mutation 금지 | gate false, verify scripts |
| campaign budget mutation 금지 | Stage 3-0까지 |
| users balance mutation 금지 | Stage 3-0까지 |
| partner_settlements mutation 금지 | Stage 3-0까지 |
| service role client 노출 금지 | browser/client 미사용 |
| public marker guard | stage30·stage1G·stage1GR 등은 `/admin/diagnostics` only |
| RLS disable / anon write policy 추가 금지 | migration·운영 금지 |
| consumer_profiles child/pet raw row | advertiser/partner 직접 조회 금지 |

Preflight: [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)

---

## Stage 3-A 후보 (planned)

point_ledger **actual mutation** dev-only dry-run:

- transaction contract: [stage-3-0-quiz-reward-transaction-contract.md](./stage-3-0-quiz-reward-transaction-contract.md)
- idempotency key (user + campaign + quiz / ad_view_id)
- budget row lock → ledger insert → budget 차감 (단일 transaction)
- rollback/adjust 정책: ledger append-only, 보정은 reverse entry
- **prod 적용 전** dev 검증 + 별도 승인

---

## 검증 원칙

1. **Vercel Production visible 기준** — `/admin/diagnostics` marker, public route guard
2. **UI 변경 시 기술사님 직접 점검 요청 필수** (Production + 필요 시 Preview)
3. **repo commit = Production deploy commit** 정합성
4. **GitHub repo 문서** — 작업 전 `docs/adme/current-*.md` 대조
5. verify script PASS 없이 Stage 완료 인정 금지
6. secret raw value 로그·문서·diagnostics 금지 (project-ref 수준만)

주요 verify (package.json):
- `verify:stage3-1-env-split-production`
- `verify:stage3-0-point-ledger-no-mutation`
- `verify:stage2c-db-uuid-campaign`
- `verify:stage1g-profile-family-pet`
- `verify:stage1g-public-marker-guard`
- `smoke:stage1g-r-profile-basic-optional-ux`
- `verify:stage1g-r-production-commit`
- `verify:stage1g-r-public-marker-guard`
- `verify:doc-0-current-docs`

---

## 잔여 운영 과제

- prod Supabase Dashboard: Google/Kakao OAuth provider dev와 동일 복제 (인터랙티브 로그인)
- 문서: [stage-3-1-r-prod-oauth-parity-result.md](./stage-3-1-r-prod-oauth-parity-result.md)
