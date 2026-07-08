# AdMe Decision Log

정책·아키텍처·UX 변경의 **단일 이력 원장**.  
새 결정은 ADME-DECISION-YYYYMMDD-NNN 형식으로 append한다.

Current 문서: [current-business-plan.md](./current-business-plan.md) · [current-development-plan.md](./current-development-plan.md) · [product-policy-current.md](./product-policy-current.md)

---

## ADME-DECISION-20260708-001

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | AdMe 본질 재정의 — 소비자가 소비정보 조건을 제시하고 광고주는 보상과 함께 응답 |
| **Status** | accepted |
| **Decision** | AdMe는 지역·성별 필터 광고가 아니라, 소비자가 소비정보 조건을 먼저 제시하고 광고주가 맞는 광고·보상으로 응답하며, 소비자가 광고 인식을 확인해 보상을 얻는 구조로 정의한다. |
| **Reason** | 제품 정체성 명확화, 사업계획서 v3.0 대비 진행 중 합의 반영 |
| **Impact** | 사업 문서, UX copy, 향후 캠페인·매칭 설계 |
| **Implementation Stage** | DOC-0, 이후 모든 Stage |
| **Related files** | docs/adme/current-business-plan.md, docs/adme/product-policy-current.md |

---

## ADME-DECISION-20260708-002

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | 지역 밀착형은 본질이 아니라 적용 가능성·운영 전략으로 분리 |
| **Status** | accepted |
| **Decision** | “지역 밀착 광고”를 제품 본질로 두지 않고, region 인프라·운영·마케팅 전략으로 분리한다. |
| **Reason** | 본질(소비정보 선제시)과 혼동 방지 |
| **Impact** | 사업 문서 구조, region seed는 인프라로 유지 |
| **Implementation Stage** | DOC-0 |
| **Related files** | docs/adme/current-business-plan.md |

---

## ADME-DECISION-20260708-003

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | UI 변경 시 Vercel Production 화면 사용자 직접 점검 요청 필수 |
| **Status** | accepted |
| **Decision** | UI·visible marker 변경이 포함된 Stage 완료보고에는 기술사님 Production(필요 시 Preview) 직접 화면 점검 요청을 반드시 포함한다. |
| **Reason** | verify script만으로는 UX·레이아웃 오류를 완전히 대체할 수 없음 |
| **Impact** | 완료보고 템플릿, Stage 검수 절차 |
| **Implementation Stage** | DOC-0, 모든 UI Stage |
| **Related files** | docs/adme/current-development-plan.md, docs/adme/product-policy-current.md |

---

## ADME-DECISION-20260708-004

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | 소비 의향 프로필에 가장 큰 자녀 생년·막내 자녀 생년 선택 항목 추가 |
| **Status** | implemented |
| **Decision** | 소비 의향 프로필에 선택 항목으로 가장 큰 자녀 생년, 막내 자녀 생년을 추가한다. 미입력 허용. |
| **Reason** | 자녀 관련 소비정보 조건 매칭 (가족 개인정보 수집 목적 아님) |
| **Impact** | Stage 1-G schema/UI, copy |
| **Implementation Stage** | Stage 1-G |
| **Related files** | docs/adme/current-business-plan.md, docs/adme/stage-roadmap-current.md |

---

## ADME-DECISION-20260708-005

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | 소비 의향 프로필 문구는 방어적 개인정보 제공이 아니라 능동적 소비정보 요청 관점 |
| **Status** | accepted |
| **Decision** | 프로필 UX 문구는 “개인정보를 내주는” 톤이 아니라 “내가 원하는 광고 조건을 제시한다”는 능동적 소비정보 요청 관점으로 작성한다. |
| **Reason** | 전환율·신뢰, 본질 재정의와 정합 |
| **Impact** | Stage 1-G copy, product-policy |
| **Implementation Stage** | DOC-0 (정책), Stage 1-G (구현 완료) |
| **Related files** | docs/adme/product-policy-current.md |

---

## ADME-DECISION-20260708-006

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | 사업계획서·개발계획서는 repo living document로 최신 기준 유지 |
| **Status** | implemented |
| **Decision** | docx 원본은 보존하되, Cursor 작업·완료보고의 최신 기준은 `docs/adme/current-*.md` 및 decision log이다. |
| **Reason** | 정책 drift 방지, Git 추적 가능 |
| **Impact** | DOC-0, 모든 향후 Stage |
| **Implementation Stage** | DOC-0 |
| **Related files** | docs/adme/current-business-plan.md, docs/adme/current-development-plan.md |

---

## ADME-DECISION-20260708-007

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | dev/prod Supabase 분리 완료 후에도 actual mutation은 별도 승인 전까지 false 유지 |
| **Status** | implemented |
| **Decision** | Stage 3-1 dev/prod 분리 후에도 point_ledger·quiz_reward actual mutation gate는 false. enable은 문서·PR 승인 후. |
| **Reason** | 금전성 mutation 사고 방지 |
| **Impact** | readiness markers, Stage 3-A 진입 조건 |
| **Implementation Stage** | Stage 3-0, 3-1 |
| **Related files** | docs/adme/stage-3-0-point-ledger-safety-preflight.md, apps/web/src/lib/stage3/ |

---

## ADME-DECISION-20260708-008

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | Google/Kakao prod OAuth provider Dashboard 복제는 사용자 로그인용 잔여 운영 과제 |
| **Status** | planned |
| **Decision** | Email ephemeral E2E는 prod에서 PASS. Google/Kakao 인터랙티브 로그인은 prod Supabase Dashboard에 dev와 동일 provider 설정이 필요하다. |
| **Reason** | Stage 3-1-R에서 E2E ref mismatch 해소; OAuth provider는 CLI로 복제 불가 |
| **Impact** | 운영 체크리스트, 사용자 로그인 UX |
| **Implementation Stage** | Stage 3-1-R 잔여, 운영 |
| **Related files** | docs/adme/stage-3-1-r-prod-oauth-parity-result.md, docs/adme/stage-3-1-vercel-env-checklist.md |

---

## ADME-DECISION-20260708-009

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | Stage 1-G 자녀 생년 및 반려동물 조건 선택 UX 구현 |
| **Status** | implemented |
| **Decision** | 소비 의향 프로필에 가장 큰 자녀 생년·막내 자녀 생년·반려동물 조건(dog/cat/other)을 nullable 선택 항목으로 구현하고, 프로필 문구를 능동형 소비정보 요청 관점으로 전환한다. |
| **Reason** | DOC-0 제품 철학의 사용자-facing 반영, 금전성 mutation 없이 프로필 확장 |
| **Impact** | consumer profile UI, consumer_profiles schema, diagnostics, verify scripts |
| **Implementation Stage** | Stage 1-G |
| **Related files** | docs/adme/stage-1-g-child-pet-profile-ux.md, apps/web/src/app/consumer/profile/, supabase/migrations/20260708130000_stage_1_g_child_pet_profile_conditions.sql |
