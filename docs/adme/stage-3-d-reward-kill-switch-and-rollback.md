# Stage 3-D — Reward Kill Switch and Rollback

작성일: 2026-07-09  
상태: **designed — default ON — adjust 실행 금지**

---

## Kill switch

- 기본값: `ADME_REWARD_KILL_SWITCH=true` (**ON**)
- true이면 모든 reward mutation 차단 (release flag 계층)
- Production reward open 이후 문제 발생 시 **즉시 ON**
- allowlist 비활성화 (`ADME_PRODUCTION_REWARD_ALLOWLIST_ENABLED=false`)
- Vercel env 변경 후 redeploy 또는 runtime config 적용
- Supabase Stage 3-B RPC Production block 유지/재차단

## Rollback 원칙

- `point_ledger`는 UPDATE/DELETE 금지
- 잘못된 적립 정정은 **adjust entry APPEND**만
- **Stage 3-D에서는 adjust 실행 금지**

## Rollback 트리거

- balance cache mismatch
- duplicate reward detected
- budget negative / overspent
- quiz_answer exposure
- RLS bypass
- abuse spike
- OAuth identity anomaly

## 운영 보고 항목

- incident time
- affected campaign_id
- affected user count
- ledger entry count
- mutation halted at
- operator
- follow-up stage

## Diagnostics

- `stage3DKillSwitchDesigned=true`
- `stage3DKillSwitchDefaultOn=true`
- `stage3DRollbackPlanReady=true`
- `stage3DAdjustMutationExecuted=false`
