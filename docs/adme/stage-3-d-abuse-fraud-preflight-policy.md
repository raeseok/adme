# Stage 3-D — Abuse / Fraud Preflight Policy

작성일: 2026-07-09  
상태: **policy ready — runtime engine partial/not ready**

---

## 범위

이번 Stage에서 완전한 fraud engine을 **구현하지 않는다**.  
Production reward open 전 최소 abuse guard 항목을 문서화하고 readiness를 표시한다.

## 최소 항목

| 항목 | Stage 3-D |
|---|---|
| user/day reward cap | 설계 (`ADME_PRODUCTION_REWARD_MAX_POINTS_PER_USER_PER_DAY`) |
| campaign/day reward cap | 설계 (`ADME_PRODUCTION_REWARD_MAX_CAMPAIGN_DAILY_BUDGET`) |
| IP/device/session rate limit | 설계 |
| account age threshold | 설계 |
| repeated wrong/correct pattern | 설계 |
| min-view enforcement | **유지** (Stage 2-C / 3-B / 3-C) |
| option shuffle | **유지** |
| duplicate submit guard | **유지** |
| idempotency guard | **유지** |
| Kakao OAuth identity availability | **유지** (E2E) |
| PASS 본인인증 연계 | 향후 필요 — 비범위 |
| abuse 시 kill switch / campaign pause | 절차 문서화 |

## Readiness

- `stage3DAbuseFraudPreflightPolicyReady=true`
- `stage3DAbuseFraudRuntimeEngineReady=false`
- `stage3DProductionRewardOpenReady=false`

openReady는 runtime engine·rotation attestation·원장 정합성이 모두 충족되고 **별도 승인**이 있을 때만 재평가한다.
