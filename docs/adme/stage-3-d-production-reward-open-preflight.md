# Stage 3-D — Production Reward Open Preflight

작성일: 2026-07-09  
상태: **preflight only — Production reward mutation = false**

관련:
- [stage-3-d-kakao-oauth-secret-safety-attestation.md](./stage-3-d-kakao-oauth-secret-safety-attestation.md)
- [stage-3-d-kakao-secret-rotation-preflight.md](./stage-3-d-kakao-secret-rotation-preflight.md) (superseded)
- [stage-3-d-production-reward-allowlist-policy.md](./stage-3-d-production-reward-allowlist-policy.md)
- [stage-3-d-abuse-fraud-preflight-policy.md](./stage-3-d-abuse-fraud-preflight-policy.md)
- [stage-3-d-reward-kill-switch-and-rollback.md](./stage-3-d-reward-kill-switch-and-rollback.md)
- [stage-3-d-reward-audit-log-contract.md](./stage-3-d-reward-audit-log-contract.md)
- [stage-3-d-production-reward-preflight-result.md](./stage-3-d-production-reward-preflight-result.md)

---

## 목적

Production 리워드 **실제 적립을 즉시 열지 않는다**.  
오픈 전 보안·재무·원장·OAuth·감사·롤백 조건을 코드/문서/진단/검증으로 확정한다.

## 핵심 원칙

- Production reward actual mutation **계속 차단**
- Stage 3-B RPC Production block **유지** (`STAGE3B_PRODUCTION_BLOCKED`)
- Stage 3-C server action Production reward block **유지** (`STAGE3C_PRODUCTION_REWARD_BLOCKED`)
- Production `point_ledger` / campaign budget / users balance / `ad_views` reward result **변경 금지**
- Kakao OAuth E2E 성공 유지 + **Kakao OAuth Secret Safety Attestation**을 gate로 둔다 (노출 의심 없으면 rotation 불필요)
- 실제 open은 Stage 3-D/3-D-R 완료 후 **별도 명시 승인**(Stage 3-E) 단계에서만

## Release flags (설계)

| Flag | Default | Stage 3-D |
|---|---|---|
| `ADME_REWARD_KILL_SWITCH` | `true` | ON 유지 |
| `ADME_PRODUCTION_REWARD_OPEN` | `false` | false 유지 |
| `ADME_PRODUCTION_REWARD_PREFLIGHT_ONLY` | `true` | true |
| `ADME_PRODUCTION_REWARD_ALLOWLIST_ENABLED` | `false` | false |
| `ADME_PRODUCTION_REWARD_ALLOWLIST_CAMPAIGN_IDS` | empty | 설계만 |
| `ADME_PRODUCTION_REWARD_MAX_POINTS_PER_USER_PER_DAY` | empty | 설계만 |
| `ADME_PRODUCTION_REWARD_MAX_CAMPAIGN_DAILY_BUDGET` | empty | 설계만 |

구현: `apps/web/src/lib/rewards/release-flags.ts` (server-only)

## Admin UI

- `/admin/reward-preflight` — 전체 Stage 3-D markers
- `/admin/diagnostics` — Stage 3-D summary markers
- public route에 `stage3D` 문자열 노출 금지

## 비범위

- partner_settlements / cash_out / PASS 본인인증 / 전자금융
- Production fixture seed / data delete / db reset / migration repair
- Stage 3-B/3-C Production block 제거

## 다음 Stage 후보

- **Stage 3-D-R**: Kakao OAuth Secret Safety Attestation으로 보류 해소 (완료)
- **Stage 3-E**: Production reward controlled open approval (자동 진입 금지)
