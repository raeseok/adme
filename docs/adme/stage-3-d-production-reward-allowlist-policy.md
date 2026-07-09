# Stage 3-D — Controlled Production Reward Allowlist Policy

작성일: 2026-07-09  
상태: **설계만 — allowlistActive=false**

---

## 원칙

- allowlist 단위: **campaign_id**
- Production fixture seed를 allowlist용으로 **만들지 않음**
- 실제 광고주/실제 캠페인만, **명시 승인 후** 후보 가능
- Stage 3-D에서는 `allowlistActive=false`, `allowlistMutationEnabled=false` 유지

## 활성화 전 필수 조건

1. Kakao OAuth Secret Safety Attestation confirmed (rotation only if exposure suspected)
2. prod OAuth E2E verified
3. point_ledger append-only verified
4. users balance cache consistency verified
5. campaign budget sufficient verified
6. idempotency guard verified
7. duplicate submit guard verified
8. min-view guard verified
9. quiz_answer non-exposure verified
10. RLS guard verified
11. abuse guard threshold configured
12. kill switch tested
13. rollback plan documented
14. 대표 운영자 명시 승인 기록

## Env (설계)

- `ADME_PRODUCTION_REWARD_ALLOWLIST_ENABLED=false` (Stage 3-D 금지: true)
- `ADME_PRODUCTION_REWARD_ALLOWLIST_CAMPAIGN_IDS=` (comma-separated UUIDs; Stage 3-D 사용 금지)

## Diagnostics

- `stage3DControlledProductionAllowlistDesigned=true`
- `stage3DControlledProductionAllowlistActive=false`
- `stage3DControlledProductionAllowlistMutationEnabled=false`
