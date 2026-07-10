# AdMe Stage Roadmap (Current)

작성일: 2026-07-08 (DOC-0-R 갱신)  
기준 commit: `eb080e2` 이후 current

Living 문서: [current-business-plan.md](./current-business-plan.md) · [current-development-plan.md](./current-development-plan.md) · [adme-decision-log.md](./adme-decision-log.md)

---

## 완료된 Stage

| Stage | 요약 |
|---|---|
| **Stage 0** | schema, RLS, seed, extensions |
| **Stage 0.5** | Vercel shell |
| **Stage 0.6** | consumer_regions |
| **Stage 1-C ~ 1-D-B** | Auth, social login, public UI, profile intent |
| **Stage 1-E / 1-E-R** | hierarchical region selector, region auth verify |
| **Stage 1-F / 1-F-R** | MOIS region seed full coverage |
| **Stage 2-A** | read-only ad card, quiz preview, Kakao feasibility doc |
| **Stage 2-B** | min-view timer, server grading preview |
| **Stage 2-C / 2-C-R** | ad_views, server authoritative min-view, attempt limit |
| **Stage 3-0** | dev/prod readiness markers, ledger safety preflight, transaction contract (design only) |
| **Stage 3-1** | Supabase dev/prod 실제 분리, Vercel env split |
| **Stage 3-1-R** | prod E2E ref fix, `verify:stage2c-db-uuid-campaign` 회복 |
| **DOC-0** | living document + decision log 구축 완료 |
| **Stage 1-G** | 자녀 생년·반려동물 조건·능동형 프로필 UX |
| **Stage 1-G-R** | 기본/선택 정보 섹션, Production commit 정합화 |
| **Stage 3-A** | point_ledger actual mutation RPC **dev-only** dry-run |
| **Stage 3-B** | quiz_reward full transaction RPC **dev-only** (budget + ledger + ad_views) |
| **Stage 3-C** | consumer quiz submit UI controlled integration (server action → Stage 3-B RPC) |
| **Stage 3-C-K / K2 / K3** | Production Kakao OAuth 보류 해소 → 진단 보강 → E2E 성공 + diagnostic redaction |
| **Stage 3-D** | Production reward open **preflight** (mutation=false; kill switch/release flag/allowlist/audit 설계) |
| **Stage 3-E-Preflight-R** | runtime fraud engine + controlled open approval preflight 완료 인정 (actual open=false; mutation=false) |
| **Stage 3-E-Controlled-Open-Approval** | controlled open 실행 전 approval package 완료 인정 (actual open=false; mutation=false) |
| **Stage 3-E-Controlled-Open-Approval-R** | approval marker/guard 보강 완료 인정 (reward open flag=false; kill switch=true; allowlist active=false) |
| **Stage 3-F-R Addendum** | Partner settlement attribution policy locked (`advertisers.partner_id`; monthly close; mutation=false) |
| **Stage 3-G-Partner-Settlement-Manual-Approval-Design** | 완료 인정: Partner settlement manual approval design preflight (`settlement_share_rate_snapshot`, `(partner_id, settlement_month)`, `pending -> confirmed -> paid`, paid update blocked, `chargeback next month`, `partners.status='terminated'`, do not null advertiser partner_id; actual processing=false; mutation=false; DB migration=false) |
| **Stage 3-H-Legal-Tax-Payment-Compliance-Review** | 완료 인정: actual open 전 legal/tax/payment compliance review gate 고정(external review required; all decisions pending/undetermined; mutation=false; DB migration=false) |
| **Stage 3-H-R-External-Review-Package** | 완료 인정: external legal/tax review package and attestation prep only(external review completed=false; actual open blocked; mutation=false; DB migration=false) |
| **Stage 3-I-Threshold-Based-Prepaid-Registration-Exemption-Assumption** | policy/SSOT/preflight only, no DB migration, no mutation. 초기에는 등록 면제 기준 충족을 전제로 미등록 운영, threshold unknown/exceeded 시 issuance blocked |
| **Stage 3-J-Prepaid-Threshold-Monitoring-Architecture-Design** | 완료: architecture + read-only preflight + evaluator only, no DB migration, no mutation. runtime monitoring implemented=false, actual reward open blocked |
| **Stage 3-J-R Prepaid Threshold DB Migration Design Review** | 완료: DB migration design review only, no migration, no db push, no mutation |
| **Stage 3-K Protected Fund Reconciliation Design** | 완료: protected fund reconciliation design only, no migration, no db push, no mutation |
| **Stage 3-K-R Protected Fund Status Taxonomy Alignment** | 현재 단계: evaluator/docs/admin marker/verify taxonomy alignment only, no migration, no db push, no mutation |
| **Stage 3-L KYC/Tax/Terms Data Model Design** | 완료 후보: KYC/account verification, tax review, terms versioning, marketing consent withdrawal, user-level cash-out gate design only, no migration, no db push, no mutation |
| **Stage 3-M KYC/Tax/Terms DB Migration Design Review** | 완료 후보: DB migration design review only, no migration file, no Supabase db push, no personal data collection, no provider integration, no tax filing/withholding, no actual cash-out processing |
| **Stage 3-N KYC/Tax/Terms Implementation Approval Gate** | 완료 후보: read-only approval gate, overallApprovalStatus=blocked, implementation approval not granted, no migration, no mutation |

---

## 조건부 / 최근 해소

| Stage | 이전 상태 | 현재 |
|---|---|---|
| Stage 3-1 | 조건부 (`verify:stage2c-db-uuid-campaign` FAIL) | **3-1-R로 해소** |
| Stage 1-G | 조건부 (Production commit 불일치) | **1-G-R로 해소** |
| Stage 1-G-R | 재보류 (329e73f vs fceb801) | **해소·완료** |
| Stage 3-C-K | prod Kakao provider disabled | **해소** (authorize → Kakao) |
| Stage 3-C-K2/K3 | unexpected_failure / invalid_client | **K3에서 E2E 성공·redaction 완료** |
| Stage 3-D | Kakao rotation 필수 가정 | **Kakao OAuth Secret Safety Attestation으로 보류 해소 (3-D-R)** |

---

## 다음 후보 Stage

| ID | 내용 | 금전성 mutation |
|---|---|---|
| **Stage 3-K-DB-R Protected Fund DB Migration Design Review** | protected fund DB schema/RLS/RPC/audit/admin preflight design review only. actual migration은 아님 | 없음 |
| **Stage 3-O External Review Question Pack** | Stage 3-N blocker를 외부 법률·세무·개인정보·보안 검토 질문서로 전환. migration implementation 아님 | 없음 |
| **Stage 3-N-R Approval Gate Reinforcement** | Stage 3-N gate marker/문서 보강 후보. approval flag true 전환 아님 | 없음 |
| **Stage 3-P Dev-only Migration Implementation Approval** | dev-only migration 구현 승인 후보. Stage 3-N 완료만으로 자동 진입 금지 | 별도 명시 승인 전 금지 |
| **Stage 3-J-M Prepaid Threshold DB Migration Implementation** | prepaid threshold DB migration actual implementation 후보. Stage 3-J-R 완료 후에도 기술사님 별도 명시 승인 전 금지 | 별도 명시 승인 전 금지 |
| KYC/Tax/Terms actual DB migration implementation | Stage 3-M 이후에도 자동 확정하지 않음. 별도 명시 승인, 외부 법률·세무 검토, retention/deletion 정책 확정 전 금지 | 별도 명시 승인 전 금지 |
| **Stage 3-E-Controlled-Open-Execution** | Production reward controlled open 실제 실행 후보. 전제는 registration completed가 아니라 threshold runtime monitoring implemented + exemption limits verified + explicit owner approval | 별도 명시 승인 전 보류 |
| Protected fund actual DB migration implementation | Stage 3-K-DB-R design review 이후에도 기술사님 별도 명시 승인 전 금지 | 별도 명시 승인 전 금지 |
| Cash-out actual processing | `cash_redemption_requests` 신청/승인/이체/복구 actual implementation. KYC/tax/terms design 이후에도 별도 승인 전 금지 | 별도 승인 필요 |
| Partner settlement actual generation | `partner_settlements` monthly close 생성, batch RPC, paid update block trigger, chargeback implementation. 보수적 정산/세무 구조 설계 후 별도 승인 필요 | 별도 Stage까지 미구현 |
| Auto bank transfer API | 자동 계좌이체 연동 | MVP 제외 또는 파일럿 검증 이후 |
| **Stage 1-H** | (후보) 프로필·매칭 후속 확장 | TBD |
| Auth parity | prod Google provider 정리 | 없음 |

### Stage 3-B 완료 기준

- Production point_ledger / budget / ad_views actual mutation = false
- 제품 quiz 제출 버튼 미연결
- Stage 3-A 회귀 유지

---

## 권장 순서

1. **Stage 3-D / 3-D-R** — preflight + Kakao OAuth Secret Safety Attestation **resolved** (reward open=false 유지)
2. **Stage 3-E-Preflight-R** — runtime fraud engine, allowlist, kill switch, idempotency, budget atomicity, rollback 기준 검증 완료 인정
3. **Stage 3-E-Controlled-Open-Approval** — actual open이 아니라 승인 조건 확정 및 검증 패키지 작성
4. **Stage 3-F-Cash-out-Manual-Approval-Design** — reward actual open 전 cash-out 운영 리스크를 설계·marker·verify로 고정
5. **Stage 3-F-R Addendum** — Partner Settlement Manual Approval Design 전 attribution policy lock (`advertisers.partner_id`; partner_settlements mutation=false)
6. **Stage 3-G-Partner-Settlement-Manual-Approval-Design** — 정산 수동 승인 구조를 설계·marker·verify로 고정(actual processing=false)
7. **Stage 3-H-Legal-Tax-Payment-Compliance-Review** — Legal / Tax / Payment Compliance Review를 documentation/preflight only로 고정(no mutation, no migration) 완료
8. **Stage 3-H-R-External-Review-Package** — 외부 검토 패키지와 attestation template 준비만 수행(no mutation, no migration)
9. **Stage 3-I-Threshold-Based-Prepaid-Registration-Exemption-Assumption** — threshold 기반 미등록 초기 운영 가정과 issuance block 조건을 policy/SSOT/preflight only로 고정(no mutation, no migration)
10. **Stage 3-J-Prepaid-Threshold-Monitoring-Architecture-Design** — architecture + read-only preflight + evaluator only, no DB migration, no mutation
11. **Stage 3-J-R** — threshold DB migration design review only, no migration, no db push, no mutation
12. **Stage 3-K Protected Fund Reconciliation Design** — protected fund reconciliation design only, no migration, no db push, no mutation
13. **Stage 3-K-R Protected Fund Status Taxonomy Alignment** — status taxonomy alignment only, no migration, no db push, no mutation
14. **Stage 3-L KYC/Tax/Terms Data Model Design** — cash-out 전 KYC/account verification, 세무 검토, 약관 버전, 동의/철회, user-level cash-out gate 설계 only, no migration, no db push, no mutation
15. **Stage 3-M** — KYC/Tax/Terms DB migration design review only, no migration, no db push, no mutation
16. **Stage 3-N** — KYC/Tax/Terms implementation approval gate only, overallApprovalStatus=blocked, no migration, no mutation
17. **Stage 3-O / Stage 3-N-R / Stage 3-P 후보 검토** — External Review Question Pack 또는 approval gate 보강을 우선 검토. Stage 3-P는 별도 명시 승인 전 금지
18. **Stage 3-K-DB-R / Stage 3-J-M 후보 검토** — Stage 3-K-DB-R은 design review only, Stage 3-J-M과 protected fund/KYC actual DB migration implementation은 기술사님 별도 명시 승인 전 금지
19. **Stage 3-E-Controlled-Open-Execution** — threshold runtime monitoring implemented + runtime protected fund reconciliation completed + exemption limits verified + KYC/Tax/Terms cash-out gate implementation reviewed + 기술사님 명시 승인 전 계속 금지
20. 이후 **Partner settlement actual generation** 또는 **Cash-out actual processing** 별도 승인 Stage

---

## Stage별 상태 표

| Stage | Status |
|---|---|
| Stage 0 | ✅ 완료 |
| Stage 0.5 / 0.6 | ✅ 완료 |
| Stage 1-D / E / F / F-R | ✅ 완료 |
| Stage 2-A / B / C | ✅ 완료 |
| Stage 3-0 | ✅ 완료 |
| Stage 3-1 | ✅ 완료 (3-1-R 반영) |
| Stage 3-1-R | ✅ 완료 |
| **DOC-0** | ✅ 완료 |
| **Stage 1-G** | ✅ 완료 |
| **Stage 1-G-R** | ✅ 완료 |
| **Stage 3-A** | ✅ 완료 (dev-only dry-run; Production mutation=false) |
| **Stage 3-B** | ✅ 완료 (dev-only full transaction; Production mutation=false) |
| **Stage 3-C** | ✅ 완료 (UI controlled integration; Production mutation=false) |
| **Stage 3-C-K** | ✅ 완료 (prod Kakao provider backend sync) |
| **Stage 3-C-K2** | ✅ 완료 (OAuth diagnostic 보강 배포) |
| **Stage 3-C-K3** | ✅ 완료 (Kakao E2E 성공 기록 + diagnostic redaction) |
| **Stage 3-D** | ✅ 완료 (preflight; mutation=false) |
| **Stage 3-D-R** | ✅ Kakao OAuth Secret Safety Attestation resolved (rotationRequired=false; reward open=false) |
| **Stage 3-E-Preflight-R** | ✅ 완료 인정 (actual open=false; mutation=false) |
| **Stage 3-E-Controlled-Open-Approval** | ✅ 완료 인정 (approval only; actual open=false; mutation=false) |
| **Stage 3-E-Controlled-Open-Approval-R** | ✅ 완료 인정 (marker/guard 보강; reward open=false) |
| **Stage 3-F-Cash-out-Manual-Approval-Design** | ✅ 완료 인정 (design only; cash-out actual processing=false) |
| **Stage 3-F-R Addendum** | Partner settlement attribution policy locked (policy only; partner_settlements mutation=false) |
| **Stage 3-G-Partner-Settlement-Manual-Approval-Design** | ✅ 완료 인정 (design only; partner settlement actual processing=false) |
| **Stage 3-H-Legal-Tax-Payment-Compliance-Review** | ✅ 완료 인정 (documentation/preflight only; no mutation; no migration) |
| **Stage 3-H-R-External-Review-Package** | ✅ 완료 인정 (external review package and attestation prep only; external review completed=false; actual open blocked) |
| **Stage 3-I-Threshold-Based-Prepaid-Registration-Exemption-Assumption** | ✅ 완료 |
| **Stage 3-J Prepaid Threshold Monitoring Architecture Design** | ✅ 완료 (architecture + read-only preflight + evaluator only; no DB migration; no mutation) |
| **Stage 3-J-R Prepaid Threshold DB Migration Design Review** | ✅ 완료 (DB migration design review only; no migration; no db push; no mutation) |
| **Stage 3-K Protected Fund Reconciliation Design** | ✅ 완료 (protected fund reconciliation design only; no migration; no db push; no mutation) |
| **Stage 3-K-R Protected Fund Status Taxonomy Alignment** | 현재 단계 (status taxonomy alignment only; no migration; no db push; no mutation) |
| **Stage 3-L KYC/Tax/Terms Data Model Design** | 완료 후보 (data model design only; no migration; no db push; no mutation; cash-out actual processing=false) |
| **Stage 3-M KYC/Tax/Terms DB Migration Design Review** | 완료 후보 (design review only; actual migration 아님; Supabase db push 없음; 개인정보 수집/provider 연동/세무 신고/원천징수/actual cash-out 없음) |
| **Stage 3-N KYC/Tax/Terms Implementation Approval Gate** | 완료 후보 (read-only approval gate; overallApprovalStatus=blocked; migration approval=false; no migration; no mutation) |
| **Stage 3-N-R Approval Gate Reinforcement** | 다음 후보 (approval gate 보강; approval flag true 전환 아님) |
| **Stage 3-O External Review Question Pack** | 다음 후보 (외부 검토 질문서; implementation 아님) |
| **Stage 3-P Dev-only KYC/Tax/Terms Schema Foundation** | 완료 후보 (dev Supabase only; provider-neutral schema foundation; Production migration blocked; no personal data collection; no actual cash-out) |
| **Stage 3-P-R Supabase CLI Dev Link Safety Recovery** | 완료 후보 (prod linked 상태 안전 해제, dev linked safety verify, dev DB 실측; Production DB command 없음) |
| **Stage 3-K-DB-R Protected Fund DB Migration Design Review** | 다음 후보 (design review only; actual migration 아님) |
| **Stage 3-J-M Prepaid Threshold DB Migration Implementation** | 별도 명시 승인 전 금지 |
| **KYC/Tax/Terms actual DB migration implementation** | Stage 3-M 완료 후에도 자동 확정하지 않음; 별도 명시 승인 전 금지 |
| **Stage 3-E-Controlled-Open-Execution** | 명시 승인 전 보류 |
| **Protected fund actual DB migration implementation** | 별도 명시 승인 전 금지 |
| **Cash-out actual processing** | 별도 승인 필요 |
| **Partner settlement actual generation** | 별도 승인 필요 |
| **Auto bank transfer API** | MVP 제외 또는 파일럿 검증 이후 |

---

## 검증 앵커 (완료 Stage)

- Stage 3-1: `verify:stage3-1-env-split-production`, `verify:stage3-1-env-split-preview`
- Stage 3-0: `verify:stage3-0-env-separation-readiness`, `verify:stage3-0-point-ledger-no-mutation`
- Stage 2-C: `verify:stage2c-db-uuid-campaign`, `verify:stage2c-r-ad-views-rls`
- DOC-0: `verify:doc-0-current-docs`
- Stage 1-G: `verify:stage1g-profile-family-pet`, `smoke:stage1g-profile-ux`, `verify:stage1g-rls-family-pet`, `verify:stage1g-public-marker-guard`
- Stage 1-G-R: `smoke:stage1g-r-profile-basic-optional-ux`, `verify:stage1g-r-production-commit`, `verify:stage1g-r-public-marker-guard`
- Stage 3-A: `verify:stage3a-dev-dry-run`, `verify:stage3a-production-blocked`, `verify:stage3a-public-marker-guard`
- Stage 3-B: `verify:stage3b-dev-full-transaction`, `verify:stage3b-production-blocked`, `verify:stage3b-quiz-answer-non-exposure`, `verify:stage3b-ledger-raw-access-guard`, `verify:stage3b-public-marker-guard`
- Stage 3-C: `verify:stage3c-preflight-answer-hint-guard`, `verify:stage3c-client-direct-rpc-guard`, `verify:stage3c-quiz-answer-non-exposure`, `verify:stage3c-dev-ui-controlled-submit`, `verify:stage3c-production-reward-blocked`, `verify:stage3c-public-marker-guard`
- Stage 3-C-K/K3: `verify:prod-kakao-oauth-authorize`, `verify:oauth-redaction-guard`
- Stage 3-D / 3-D-R: `verify:stage3d-kakao-oauth-secret-safety-attestation`, `verify:stage3d-production-reward-blocked`, `verify:stage3d-release-flags`, `verify:stage3d-kakao-secret-redaction`, `verify:stage3d-quiz-answer-non-exposure`, `verify:stage3d-point-ledger-append-only`, `verify:stage3d-balance-cache-consistency-readonly`, `verify:stage3d-production-budget-safety-readonly`, `verify:stage3d-rls-guard`, `verify:stage3d-public-marker-guard`, `smoke:stage3d-reward-preflight-ui`
- Stage 3-E-Preflight-R: `verify:stage3e-preflight`, `verify:stage3e-kill-switch`, `verify:stage3e-fraud-engine`, `verify:stage3e-idempotency`, `verify:stage3e-budget-atomicity`, `verify:stage3e-production-blocked`, `verify:stage3e-public-marker-guard`
- Stage 3-E-Controlled-Open-Approval: `verify:stage3e-controlled-open-approval`, `verify:stage3e-controlled-open-production-blocked`, `verify:stage3e-controlled-open-public-marker-guard`, `verify:stage3e-controlled-open-no-mutation`, `verify:stage3e-controlled-open-redaction`, `verify:stage3e-controlled-open-limits`
- Stage 3-F-Cash-out-Manual-Approval-Design: `verify:stage3f-cash-out-design`
- Stage 3-G-Partner-Settlement-Manual-Approval-Design: `verify:stage3g-partner-settlement-design`
- Stage 3-H-Legal-Tax-Payment-Compliance-Review: `verify:stage3h-compliance-review`
- Stage 3-H-R-External-Review-Package: `verify:stage3hr-external-review-package`
- Stage 3-I-Threshold-Based-Prepaid-Registration-Exemption-Assumption: `verify:stage3i-threshold-based-prepaid-exemption-assumption`
- Stage 3-J-Prepaid-Threshold-Monitoring-Architecture-Design: `verify:stage3j-prepaid-threshold-monitoring-architecture`
- Stage 3-J-R-Prepaid-Threshold-DB-Migration-Design-Review: `verify:stage3jr-prepaid-threshold-db-migration-design-review`
- Stage 3-K-Protected-Fund-Reconciliation-Design: `verify:stage3k-protected-fund-reconciliation-design`
- Stage 3-K-R-Protected-Fund-Status-Taxonomy-Alignment: `verify:stage3k-protected-fund-reconciliation-design`
- Stage 3-L-KYC-Tax-Terms-Data-Model-Design: `verify:stage3l-kyc-tax-terms-data-model-design`
- Stage 3-M-KYC-Tax-Terms-DB-Migration-Design-Review: `verify:stage3m-kyc-tax-terms-db-migration-design-review`
- Stage 3-N-KYC-Tax-Terms-Implementation-Approval-Gate: `verify:stage3n-kyc-tax-terms-implementation-approval-gate`
- Stage 3-P-Dev-only-KYC-Tax-Terms-Schema-Foundation: `verify:supabase-dev-link-safety`, `verify:stage3p-dev-kyc-tax-terms-schema-foundation`

---

## 관련 Stage 문서 (historical)

- [stage-1-g-child-pet-profile-ux.md](./stage-1-g-child-pet-profile-ux.md)
- [stage-1-g-r-profile-basic-optional-sections.md](./stage-1-g-r-profile-basic-optional-sections.md)
- [stage-3-a-point-ledger-dev-dry-run-result.md](./stage-3-a-point-ledger-dev-dry-run-result.md)
- [stage-3-b-quiz-reward-full-transaction-dev-only.md](./stage-3-b-quiz-reward-full-transaction-dev-only.md)
- [stage-3-c-consumer-quiz-submit-ui-controlled-integration.md](./stage-3-c-consumer-quiz-submit-ui-controlled-integration.md)
- [stage-3-c-k-prod-kakao-oauth-fix-result.md](./stage-3-c-k-prod-kakao-oauth-fix-result.md)
- [stage-3-c-k3-kakao-oauth-e2e-and-redaction-result.md](./stage-3-c-k3-kakao-oauth-e2e-and-redaction-result.md)
- [stage-3-d-production-reward-open-preflight.md](./stage-3-d-production-reward-open-preflight.md)
- [stage-3-d-kakao-oauth-secret-safety-attestation.md](./stage-3-d-kakao-oauth-secret-safety-attestation.md)
- [stage-3-d-kakao-secret-rotation-preflight.md](./stage-3-d-kakao-secret-rotation-preflight.md) (superseded)
- [stage-3-d-production-reward-preflight-result.md](./stage-3-d-production-reward-preflight-result.md)
- [stage-3-e-runtime-fraud-engine-controlled-open-preflight.md](./stage-3-e-runtime-fraud-engine-controlled-open-preflight.md)
- [stage-3-e-controlled-open-approval.md](./stage-3-e-controlled-open-approval.md)
- [stage-3-e-controlled-open-runbook.md](./stage-3-e-controlled-open-runbook.md)
- [stage-3-f-cash-out-manual-approval-design.md](./stage-3-f-cash-out-manual-approval-design.md)
- [stage-3-g-partner-settlement-attribution-policy.md](./stage-3-g-partner-settlement-attribution-policy.md)
- [stage-3-g-partner-settlement-manual-approval-design.md](./stage-3-g-partner-settlement-manual-approval-design.md)
- [stage-3-h-legal-tax-payment-compliance-review.md](./stage-3-h-legal-tax-payment-compliance-review.md)
- [stage-3-h-r-external-review-package.md](./stage-3-h-r-external-review-package.md)
- [stage-3-i-threshold-based-prepaid-exemption-assumption.md](./stage-3-i-threshold-based-prepaid-exemption-assumption.md)
- [stage-3-j-prepaid-threshold-monitoring-architecture.md](./stage-3-j-prepaid-threshold-monitoring-architecture.md)
- [stage-3-j-r-prepaid-threshold-db-migration-design-review.md](./stage-3-j-r-prepaid-threshold-db-migration-design-review.md)
- [stage-3-k-protected-fund-reconciliation-design.md](./stage-3-k-protected-fund-reconciliation-design.md)
- [stage-3-l-kyc-tax-terms-data-model-design.md](./stage-3-l-kyc-tax-terms-data-model-design.md)
- [stage-3-m-kyc-tax-terms-db-migration-design-review.md](./stage-3-m-kyc-tax-terms-db-migration-design-review.md)
- [stage-3-n-kyc-tax-terms-implementation-approval-gate.md](./stage-3-n-kyc-tax-terms-implementation-approval-gate.md)
- [stage-3-p-dev-only-kyc-tax-terms-schema-foundation.md](./stage-3-p-dev-only-kyc-tax-terms-schema-foundation.md)

- [stage-3-0-supabase-env-separation.md](./stage-3-0-supabase-env-separation.md)
- [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)
- [stage-3-1-supabase-env-split-result.md](./stage-3-1-supabase-env-split-result.md)
- [stage-3-1-r-prod-oauth-parity-result.md](./stage-3-1-r-prod-oauth-parity-result.md)
