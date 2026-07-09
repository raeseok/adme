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

---

## ADME-DECISION-20260708-010

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | 소비 의향 프로필 기본 정보와 선택 정보 구분 |
| **Status** | implemented |
| **Decision** | 본인 출생년도, 성별, 주거지역을 **기본 정보**로 정리하고, 자녀 생년·반려동물 조건·주활동지역·관심정보는 **선택 정보**로 구분한다. 저장 차단은 방식 B — 주거지역만 필수, 출생년도·성별은 UX 강조만. |
| **Reason** | Stage 1-G 재보류 해소 및 프로필 정보 구조 명확화 |
| **Impact** | consumer profile UX, completion copy, diagnostics, documentation |
| **Implementation Stage** | Stage 1-G-R |
| **Related files** | docs/adme/stage-1-g-r-profile-basic-optional-sections.md, apps/web/src/app/consumer/profile/ConsumerProfileForm.tsx |

---

## ADME-DECISION-20260708-011

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | 선택 정보 입력 영역의 맞춤 소비정보 확대 문구 배치 |
| **Status** | implemented |
| **Decision** | “더 많은 조건을 등록할수록 더 많은 맞춤 소비정보를 받을 수 있습니다.” 문구를 **선택 정보 입력 영역**에 직접 노출한다. 상단 안내에만 두고 선택 섹션 내부에 없으면 FAIL. |
| **Reason** | 선택 정보 입력 동기 부여, 기술사님 UX 요구 |
| **Impact** | consumer profile UX, optional profile section copy, smoke verification |
| **Implementation Stage** | Stage 1-G-R |
| **Related files** | apps/web/src/app/consumer/profile/ConsumerProfileForm.tsx, apps/web/scripts/smoke-stage1g-r-profile-basic-optional-ux.mjs |

---

## ADME-DECISION-20260708-012

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | Stage 3-A point_ledger actual mutation은 dev-only dry-run RPC로만 허용 |
| **Status** | implemented |
| **Decision** | 첫 point_ledger actual INSERT는 `rpc_stage3a_dev_record_quiz_reward_dry_run`으로만 수행한다. JWT iss에 prod project-ref가 있으면 DB에서 거부한다. Production campaign budget·cash_out·partner_settlements mutation은 금지. |
| **Reason** | Stage 3-0 safety preflight 이후 금전성 mutation의 최소 안전 진입 |
| **Impact** | point_ledger schema (idempotency_key), diagnostics, verify scripts, Stage 3 roadmap |
| **Implementation Stage** | Stage 3-A |
| **Related files** | supabase/migrations/20260708180000_stage_3_a_point_ledger_dev_dry_run.sql, docs/adme/stage-3-a-point-ledger-dev-dry-run-result.md |

---

## ADME-DECISION-20260708-013

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-08 |
| **Title** | point_ledger 오류 정정은 UPDATE/DELETE가 아니라 adjust append만 |
| **Status** | accepted |
| **Decision** | commit된 ledger row는 불변이다. 오류 정정은 admin_adjustment(또는 동등 adjust) APPEND만 허용하며, Stage 3-A에서는 adjust 실제 mutation을 구현하지 않는다. |
| **Reason** | append-only SSOT·감사 추적성 |
| **Impact** | future Stage 3-B+, admin adjust 설계 |
| **Implementation Stage** | Stage 3-A (정책), 실행은 후속 Stage |
| **Related files** | docs/adme/stage-3-a-point-ledger-dev-dry-run-result.md, docs/adme/stage-3-0-point-ledger-safety-preflight.md |

---

## ADME-DECISION-20260709-001

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-B quiz_reward canonical entry_type 및 dev-only full transaction |
| **Status** | implemented |
| **Decision** | quiz_reward 지급 시 `point_ledger.entry_type='quiz_reward'`를 canonical로 사용한다. full transaction은 `rpc_stage3b_dev_submit_quiz_reward_transaction`으로 dev JWT에서만 actual mutation(budget, ledger, ad_views, balance cache)을 허용한다. consumer role 내부 gate 필수. advertiser/partner는 consumer raw ledger 접근 금지. |
| **Reason** | Stage 3-A dry-run 이후 원자적 transaction 검증; Production mutation 분리 유지 |
| **Impact** | enum 확장, idempotency receipt, diagnostics stage3B markers, verify scripts |
| **Implementation Stage** | Stage 3-B |
| **Related files** | docs/adme/stage-3-b-quiz-reward-full-transaction-dev-only.md, supabase/migrations/20260709120000_stage_3_b_quiz_reward_full_transaction_dev_only.sql |

---

## ADME-DECISION-20260709-002

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-C consumer quiz submit UI controlled integration |
| **Status** | implemented |
| **Decision** | Stage 3-B RPC는 `submitConsumerQuizForRewardAction` server action을 통해서만 호출한다. client component 직접 RPC 호출 금지. dev/preview + controlled E2E fixture campaign에서만 actual mutation 허용. Production은 app gate(`STAGE3C_PRODUCTION_REWARD_BLOCKED`) + Stage 3-B RPC gate 이중 차단. quiz_answer 및 정답 암시 label 비노출 유지. |
| **Reason** | 제품 UI 연결과 Production reward open 분리 |
| **Impact** | consumer ad detail UI, diagnostics stage3C markers, verify:stage3c-* scripts |
| **Implementation Stage** | Stage 3-C |
| **Related files** | docs/adme/stage-3-c-consumer-quiz-submit-ui-controlled-integration.md, apps/web/src/lib/quiz-rewards/, apps/web/src/components/campaigns/QuizSubmitControlledPanel.tsx |

---

## ADME-DECISION-20260709-003

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-C-K Production Kakao OAuth provider backend sync |
| **Status** | implemented |
| **Decision** | Production Supabase(`vupsalteyltjqumppltc`) Kakao OAuth는 dev와 동일 provider credentials를 Management API로 backend에 반영해야 한다. Dashboard Enabled 표시만으로 authorize endpoint 활성화를 가정하지 않는다. 앱 OAuth 코드 변경 없이 provider config sync로 해소. |
| **Reason** | Stage 3-1 env split 후 prod OAuth provider 미복제 잔여 |
| **Impact** | verify:prod-kakao-oauth-authorize, stage-3-c-k-prod-kakao-oauth-fix-result.md |
| **Implementation Stage** | Stage 3-C-K |
| **Related files** | docs/adme/stage-3-c-k-prod-kakao-oauth-fix-result.md, apps/web/scripts/verify-prod-kakao-oauth-authorize.mjs |

---

## ADME-DECISION-20260709-004

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-C-K3 Production Kakao OAuth E2E 정상화 및 OAuth diagnostic redaction |
| **Status** | implemented |
| **Decision** | Production Kakao OAuth는 (1) prod Supabase provider backend 활성화, (2) Kakao Developers prod callback URI 등록, (3) Client Secret 정합성 확보 후 정상화되었다. OAuth 진단 UI는 `error`/`error_code`/요약(`oauthErrorSummary`)만 public 화면에 표시하고, external code·authorization code·access/refresh token·client_secret 원문·일부를 노출하지 않는 redaction 정책을 적용한다. Stage 3-D 착수 전 Auth E2E 성공 조건은 충족되었으나, Production reward open은 별도 preflight·승인을 거쳐야 한다. |
| **Reason** | K/K2에서 provider·redirect·credentials 오류를 순차 해소했고, K2 진단 UI의 description 원문 표시로 code 일부 노출 위험이 남아 보안 보강이 필요했다. |
| **Impact** | oauth-error redaction, verify:oauth-redaction-guard, stage-3-c-k3 문서, Stage 3-D 착수 전제 |
| **Implementation Stage** | Stage 3-C-K3 |
| **Related files** | docs/adme/stage-3-c-k3-kakao-oauth-e2e-and-redaction-result.md, apps/web/src/lib/auth/oauth-error.ts, apps/web/scripts/verify-oauth-redaction-guard.mjs |

---

## ADME-DECISION-20260709-005

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Production reward open은 Stage 3-D에서 실행하지 않고 preflight·kill switch·release flag·secret rotation·audit·guard 검증 후 별도 승인 단계로 분리 |
| **Status** | accepted |
| **Decision** | Production reward actual mutation은 Stage 3-D에서 열지 않는다. Stage 3-D는 Kakao Client Secret rotation attestation, release flag/kill switch 설계, controlled allowlist 설계, 원장·budget·RLS·정답 비노출·idempotency/duplicate/min-view guard 검증, abuse/fraud preflight 정책, audit log contract, rollback 절차를 확정한다. Stage 3-B RPC Production block과 Stage 3-C Production reward block은 제거하지 않는다. 실제 open은 별도 명시 승인(Stage 3-E 후보)에서만 다룬다. |
| **Reason** | Auth E2E 성공과 금전성 mutation open을 분리해 재무·보안 리스크를 통제한다. 과거 Client Secret 이미지 노출 이력으로 rotation이 선행 gate다. |
| **Impact** | Stage 3-D docs/scripts/diagnostics, product-policy, roadmap; Production reward openReady=false 유지 |
| **Implementation Stage** | Stage 3-D |
| **Related files** | docs/adme/stage-3-d-production-reward-open-preflight.md, docs/adme/stage-3-d-kakao-secret-rotation-preflight.md, apps/web/src/lib/rewards/release-flags.ts |

## ADME-DECISION-20260709-006

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Kakao Client Secret 재발급은 필수 조건이 아니며, 노출 의심이 없으면 safety attestation으로 Stage 3-D-R 보류 해소 |
| **Status** | accepted |
| **Decision** | Kakao Client Secret 재발급(rotation)은 노출 증거·합리적 의심이 있을 때만 수행한다. 노출 의심이 없으면 `rotationRequired=false`, `rotationPerformed=false`가 정상이다. Stage 3-D-R blocker는 Kakao OAuth Secret Safety Attestation으로 해소한다: secret 원문/일부/hash/digest 미기록, dev/prod Supabase Kakao provider 정상 설정 확인, authorize·prod OAuth E2E 재확인. Production reward open은 계속 금지하며 Stage 3-E controlled open approval로 분리한다. |
| **Reason** | 과거 rotation-first gate는 과도했다. 단순 로그인 설정 문제와 현재 E2E 성공이 확인되면 불필요한 재발급 없이 보안 상태를 attestation으로 기록하는 것이 운영 리스크를 줄인다. |
| **Impact** | kakao-secret-attestation.ts, admin markers, Stage 3-D-R docs/scripts, Vercel attestation env (boolean/date only); openReady=false 유지 |
| **Implementation Stage** | Stage 3-D-R |
| **Related files** | docs/adme/stage-3-d-kakao-oauth-secret-safety-attestation.md, docs/adme/stage-3-d-kakao-secret-rotation-preflight.md, apps/web/src/lib/rewards/kakao-secret-attestation.ts |

---

## ADME-DECISION-20260709-007

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-E는 Production full reward open이 아니라 controlled reward open approval preflight로 한정 |
| **Status** | accepted |
| **Decision** | Stage 3-E는 Production full reward open이 아니다. runtime fraud engine, controlled allowlist, kill switch, budget guard, ledger idempotency, monitoring, rollback 기준 충족 전 실제 reward open은 금지한다. cash_out과 partner_settlements actual processing은 Stage 3-E 범위에서 제외한다. |
| **Reason** | 금전성 mutation을 열기 전 fraud/allowlist/budget/ledger/rollback 안전 기준을 먼저 코드·문서·검증 체계로 고정하기 위함 |
| **Impact** | Stage 3-E diagnostics, fraud engine, verify scripts, product-policy, roadmap; Production reward open=false 및 kill switch=true 유지 |
| **Implementation Stage** | Stage 3-E-Preflight |
| **Related files** | docs/adme/stage-3-e-runtime-fraud-engine-controlled-open-preflight.md, apps/web/src/lib/rewards/fraud-engine.ts, apps/web/src/lib/rewards/reward-guards.ts |

---

## ADME-DECISION-20260709-008

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-E controlled open은 actual execution이 아니라 approval 단계로 분리 |
| **Status** | accepted |
| **Decision** | Stage 3-E controlled open은 바로 실행하지 않고 approval 단계로 분리한다. controlled open 초깃값은 최대 2명, 최대 1개 campaign, 1인 1회, 1인 500P, 전체 1,000P로 제한한다. kill switch는 기본 true를 유지하고, reward open flag는 false를 유지하며, allowlist active는 false를 유지한다. cash_out 및 partner_settlement actual processing은 제외한다. point_ledger delete rollback은 금지한다. actual open은 별도 Stage 3-E-Controlled-Open-Execution 승인 문장 없이는 금지한다. |
| **Reason** | Production reward actual mutation 전 금전·개인정보·보안 리스크를 controlled open 조건, 예산 상한, allowlist 계약, 즉시 중단 절차로 고정하기 위함 |
| **Impact** | approval 문서, 운영 runbook, admin marker, verify scripts, product-policy, roadmap; Production reward open=false 및 kill switch=true 유지 |
| **Implementation Stage** | Stage 3-E-Controlled-Open-Approval |
| **Related files** | docs/adme/stage-3-e-controlled-open-approval.md, docs/adme/stage-3-e-controlled-open-runbook.md, apps/web/src/lib/rewards/stage3e-controlled-open-approval.ts |

---

## ADME-DECISION-20260709-009

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-E Approval 이후 reward execution 전 cash-out manual approval design 선행 |
| **Status** | accepted |
| **Decision** | Stage 3-E Approval 완료 후 바로 controlled open execution에 진입하지 않는다. 실제 reward mutation 전 cash-out manual approval design을 선행한다. 사용자·사업 용어 cash-out은 기존 DB의 `cash_redemption_requests` 및 ledger type `cash_redemption`/`admin_adjustment`에 매핑한다. 신규 `cash_out` 테이블 또는 임의 `cash_out` ledger type은 만들지 않는다. cash-out은 수동 승인·수동 이체로 설계하고, 실패 복구는 point_ledger DELETE rollback이 아니라 reason 필수 adjust/reversal ledger append 방식으로 한다. 계좌정보·실명정보·이메일 전체값은 marker·문서·로그에 기록하지 않는다. Stage 3-E Execution은 기술사님의 별도 명시 승인 전까지 금지한다. |
| **Reason** | Production reward actual mutation이 열리기 전에 현금 전환 신청·승인·수동 이체·실패 복구·감사 추적·개인정보 노출 리스크를 먼저 고정하기 위함 |
| **Impact** | Stage 3-F design 문서, product policy, roadmap, admin marker, public marker guard, verify script; Production reward open=false 및 cash-out actual processing=false 유지 |
| **Implementation Stage** | Stage 3-F-Cash-out-Manual-Approval-Design |
| **Related files** | docs/adme/stage-3-f-cash-out-manual-approval-design.md, docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, apps/web/src/lib/rewards/stage3f-cash-out-manual-approval.ts |

---

## ADME-DECISION-20260709-010

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Partner Settlement Attribution Locked to Advertiser |
| **Status** | accepted |
| **Decision** | 파트너 귀속 기준은 `advertisers.partner_id`로 고정한다. 캠페인·광고 노출·퀴즈 통과·정산 시점에 partner를 동적으로 재탐색하지 않는다. 광고주 등록 이후 `partner_id immutable` 원칙을 적용한다. 정산은 퀴즈 통과 시점이 아니라 `monthly close` 후 확정 거래 기준으로 생성한다. `partner_settlements`는 `settlement_share_rate_snapshot` 등 배분율 snapshot을 저장한다. `(partner_id, settlement_month)` UNIQUE로 batch idempotency를 보장한다. 상태는 `pending -> confirmed -> paid`로 관리한다. `paid update blocked` 원칙에 따라 paid 상태는 직접 UPDATE 차단 대상이다. 마감 후 부정행위 취소는 `chargeback next month`로 반영한다. 계약 해지 시 `advertisers.partner_id`를 NULL로 변경하지 않고 `partners.status='terminated'`로 관리한다. `do not null advertiser partner_id`를 policy contract로 고정한다. |
| **Reason** | 정산 시점에 “이 광고비가 누구 몫인지” 역추적하지 않고, 과거 정산 근거를 보존하며, 환불·부정행위 취소·파트너 이탈 상황에서 회계 안정성을 확보하기 위함. batch 중복 실행에 따른 중복 정산을 방지하고 paid settlement의 불변성을 확보한다. |
| **Impact** | product policy, roadmap, Stage 3-F cross-reference, Stage 3-G policy document, verify source/doc contract. Production partner_settlements mutation=false 유지 |
| **Implementation Stage** | Stage 3-F-R Addendum / Stage 3-G policy lock only |
| **Related files** | docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, docs/adme/stage-3-f-cash-out-manual-approval-design.md, docs/adme/stage-3-g-partner-settlement-attribution-policy.md |

---

## ADME-DECISION-20260709-011

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Partner Settlement Manual Approval Design을 Stage 3-G로 분리 |
| **Status** | accepted |
| **Decision** | Partner Settlement Manual Approval Design을 Stage 3-G로 분리하고, 실제 `partner_settlements` 생성·확정·지급은 별도 승인 전까지 금지한다. Stage 3-G에서는 SSOT, admin marker, 문서, verify contract만 구축한다. monthly close batch, paid update trigger, chargeback mutation, partner payout action은 후속 Stage로 분리한다. `advertisers.partner_id` attribution lock, dynamic partner lookup 금지, quiz pass partner share calculation 금지, share rate snapshot, `(partner_id, settlement_month)` idempotency unique key, `pending -> confirmed -> paid` status machine, paid immutability, next-month chargeback, `partners.status='terminated'`, `do not null advertiser partner_id` 원칙은 유지한다. |
| **Reason** | 정산 실제 구현 전 회계·운영·멱등성·불변성 기준을 code marker와 verify contract로 먼저 고정하고, Production mutation 및 DB migration 사고를 방지하기 위함 |
| **Impact** | Stage 3-G design 문서, product policy, roadmap, admin marker, public marker guard, verify script. Production reward open=false, reward kill switch=true, allowlist active=false, `partner_settlements` mutation=false 유지 |
| **Implementation Stage** | Stage 3-G-Partner-Settlement-Manual-Approval-Design |
| **Related files** | docs/adme/stage-3-g-partner-settlement-manual-approval-design.md, docs/adme/stage-3-g-partner-settlement-attribution-policy.md, docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, apps/web/src/lib/rewards/stage3g-partner-settlement-manual-approval.ts |

---

## ADME-DECISION-20260709-012

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Stage 3-H Legal / Tax / Payment Compliance Review Gate |
| **Status** | accepted |
| **Decision** | actual reward open 전 법무/세무/결제 규제 검토를 별도 gate로 분리한다. Stage 3-H는 문서·SSOT·admin preflight·검증만 수행한다. DB migration 및 Production mutation은 금지한다. 전자금융거래법/소득세/개인정보/광고성 정보/약관/파트너계약 검토 완료 전 actual open은 금지한다. 모든 핵심 판단은 external legal and tax review 전까지 pending_external_legal_tax_review, requires_counsel 또는 undetermined 상태로 둔다. |
| **Reason** | Production reward open, cash-out actual processing, partner settlement actual generation 전에 법무·세무·결제 리스크와 blocker를 machine-readable gate로 고정하기 위함 |
| **Impact** | Stage 3-H compliance SSOT, admin marker, product policy, roadmap, legal/tax review questionnaire, public marker guard, verify script. Production reward open=false, reward kill switch=true, allowlist active=false, cash-out actual processing=false, partner settlement actual processing=false, DB migration=false 유지 |
| **Implementation Stage** | Stage 3-H-Legal-Tax-Payment-Compliance-Review |
| **Related files** | docs/adme/stage-3-h-legal-tax-payment-compliance-review.md, docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, apps/web/src/lib/compliance/stage3h-legal-tax-payment-compliance.ts, apps/web/src/app/admin/compliance-preflight/page.tsx |

---

## ADME-DECISION-20260709-013

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | External Legal / Tax Review Package Before Actual Reward Open |
| **Status** | accepted |
| **Decision** | 외부 검토 패키지와 attestation 양식을 actual open 전 별도 단계로 분리한다. external review completed=false 상태에서는 actual open allowed=false다. Stage 3-H-R에서는 DB migration 및 Production mutation을 금지한다. 법무/세무 자문 결과 없이 등록 면제, 원천징수 면제 등 확정값을 기록하지 않는다. |
| **Reason** | Stage 3-H compliance gate 이후 외부 법무법인·세무사에게 전달할 자료와 회신 기록 양식을 분리해 actual open 전 검토 증빙과 blocker를 명확히 유지하기 위함 |
| **Impact** | Stage 3-H-R external review package, legal counsel questionnaire, tax accountant questionnaire, attestation template, admin compliance/diagnostics marker, verify script. Production reward open=false, reward kill switch=true, allowlist active=false, cash-out actual processing=false, partner settlement actual processing=false, DB migration=false 유지 |
| **Implementation Stage** | Stage 3-H-R-External-Review-Package |
| **Related files** | docs/adme/stage-3-h-r-external-review-package.md, docs/adme/external-review/legal-counsel-questionnaire.md, docs/adme/external-review/tax-accountant-questionnaire.md, docs/adme/external-review/external-counsel-attestation-template.md, apps/web/src/lib/compliance/stage3hr-external-review-package.ts |

---

## ADME-DECISION-20260709-014

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Threshold-Based Prepaid Registration Exemption Assumption |
| **Status** | accepted |
| **Decision** | 외부 법무검토 비용을 당장 투입하지 않고, 초기에는 등록 면제 기준 충족을 전제로 미등록 운영을 가정한다. 등록 면제 기준은 내부 개발상 분기말 발행잔액 30억 원 미만 및 연간 총발행액 500억 원 미만으로 고정한다. 두 조건 중 하나라도 초과하거나, 초과가 임박하거나, 집계가 불가능하면 point issuance와 actual open을 차단한다. 포인트 발행 실적에 따라 중도에 선불업 등록 track으로 전환할 수 있도록 한다. 세무, 개인정보, 광고성 정보, 약관, 파트너 정산은 최대한 보수적으로 준비한다. 이 결정은 법률 자문 결과가 아니라 내부 개발상 위험회피 기준이다. |
| **Reason** | 초기 운영의 법무비용과 속도를 고려하되, 발행잔액/연간총발행액 threshold를 monitoring/preflight/policy gate로 고정해 초과 또는 불명확 상태의 point issuance를 차단하기 위함 |
| **Impact** | Stage 3-I threshold-based prepaid exemption assumption SSOT, admin compliance/diagnostics marker, product policy, roadmap, verify script. Production reward open=false, reward kill switch=true, allowlist active=false, cash-out actual processing=false, partner settlement actual processing=false, DB migration=false 유지 |
| **Implementation Stage** | Stage 3-I-Threshold-Based-Prepaid-Registration-Exemption-Assumption |
| **Related files** | docs/adme/stage-3-i-threshold-based-prepaid-exemption-assumption.md, docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, apps/web/src/lib/compliance/stage3i-threshold-based-prepaid-exemption-assumption.ts |

---

## ADME-DECISION-20260709-015

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Prepaid Threshold Monitoring Architecture Before Actual Issuance |
| **Status** | accepted |
| **Decision** | Stage 3-I의 threshold-based exemption assumption 이후 actual point issuance 전 threshold monitoring architecture를 별도 단계로 설계한다. Stage 3-J에서는 실제 DB migration이나 Production mutation 없이 threshold evaluator, read-only preflight, 문서, SSOT만 추가한다. threshold unknown, hard stop, exceeded 상태에서는 issuance를 차단하는 설계를 채택한다. actual production threshold values와 calculation source는 Stage 3-J에서 finalized하지 않는다. runtime monitoring과 DB migration은 후속 단계에서 별도 승인 후 진행한다. |
| **Reason** | 선불업 등록 면제 기준을 내부 개발 기준으로 두더라도 실제 발행 전 분기말 발행잔액과 연간 총발행액을 보수적으로 확인할 architecture contract가 필요하기 때문이다. |
| **Impact** | Stage 3-J prepaid threshold monitoring architecture SSOT, pure evaluator, admin threshold preflight, compliance/diagnostics marker, product policy, roadmap, verify script. Production reward open=false, reward kill switch=true, allowlist active=false, cash-out actual processing=false, partner settlement actual processing=false, DB migration=false 유지 |
| **Implementation Stage** | Stage 3-J-Prepaid-Threshold-Monitoring-Architecture-Design |
| **Related files** | docs/adme/stage-3-j-prepaid-threshold-monitoring-architecture.md, docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, apps/web/src/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture.ts, apps/web/src/lib/compliance/prepaid-threshold-evaluator.ts |

---

## ADME-DECISION-20260709-016

| 필드 | 내용 |
|---|---|
| **Date** | 2026-07-09 |
| **Title** | Prepaid Threshold DB Migration Design Review Before Migration |
| **Status** | accepted |
| **Decision** | Stage 3-J 이후 실제 threshold DB migration으로 바로 들어가지 않고 migration design review 단계를 분리한다. Stage 3-J-R에서는 추천 테이블, RLS, RPC, index, audit log, admin preflight 설계를 문서화한다. Stage 3-J-R에서는 실제 DB migration, Supabase db push, Production mutation을 금지한다. runtime threshold monitoring과 actual threshold values는 후속 Stage에서 별도 승인 후 구현한다. |
| **Reason** | 분기말 발행잔액 30억 원 미만 및 연간 총발행액 500억 원 미만 기준을 실제 DB 구조로 구현하기 전에 point_ledger, advertiser prepaid charge, campaign budget, cash-out, refund, expire, breakage와 threshold 산정값의 관계를 보수적으로 검토하기 위함 |
| **Impact** | Stage 3-J-R design review SSOT, DB design review document, admin prepaid-threshold/compliance/diagnostics marker, product policy, roadmap, verify script. Production reward open=false, reward kill switch=true, allowlist active=false, cash-out actual processing=false, partner settlement actual processing=false, DB migration=false 유지 |
| **Implementation Stage** | Stage 3-J-R-Prepaid-Threshold-DB-Migration-Design-Review |
| **Related files** | docs/adme/stage-3-j-r-prepaid-threshold-db-migration-design-review.md, docs/adme/product-policy-current.md, docs/adme/stage-roadmap-current.md, apps/web/src/lib/compliance/stage3jr-prepaid-threshold-db-migration-design-review.ts |
