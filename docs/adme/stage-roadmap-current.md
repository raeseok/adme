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
| **Stage 3-E-Preflight** | runtime fraud engine + controlled open approval preflight (actual open=false; mutation=false) |

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
| **Stage 3-E-Controlled-Open** | Production reward **controlled open approval** (Stage 3-E-Preflight 완료·별도 명시 승인 후) | 명시 승인 후에만 |
| **Stage 1-H** | (후보) 프로필·매칭 후속 확장 | TBD |
| Auth parity | prod Google provider 정리 | 없음 |

### Stage 3-B 완료 기준

- Production point_ledger / budget / ad_views actual mutation = false
- 제품 quiz 제출 버튼 미연결
- Stage 3-A 회귀 유지

---

## 권장 순서

1. **Stage 3-D / 3-D-R** — preflight + Kakao OAuth Secret Safety Attestation **resolved** (reward open=false 유지)
2. **Stage 3-E-Preflight** — runtime fraud engine, allowlist, kill switch, idempotency, budget atomicity, rollback 기준 검증
3. **Stage 3-E-Controlled-Open** — Production reward controlled open approval (명시 승인; 자동 진입 금지)
4. 이후 **Stage 1-H** 또는 advertiser campaign authoring / cash_out 별도 Stage

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
| **Stage 3-E-Preflight** | 진행/검증 대상 (actual open=false; mutation=false) |

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
- Stage 3-E-Preflight: `verify:stage3e-preflight`, `verify:stage3e-kill-switch`, `verify:stage3e-fraud-engine`, `verify:stage3e-idempotency`, `verify:stage3e-budget-atomicity`, `verify:stage3e-production-blocked`, `verify:stage3e-public-marker-guard`

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

- [stage-3-0-supabase-env-separation.md](./stage-3-0-supabase-env-separation.md)
- [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)
- [stage-3-1-supabase-env-split-result.md](./stage-3-1-supabase-env-split-result.md)
- [stage-3-1-r-prod-oauth-parity-result.md](./stage-3-1-r-prod-oauth-parity-result.md)
