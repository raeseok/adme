# Stage 3-D — Reward Audit Log Contract

작성일: 2026-07-09  
상태: **contract ready — Production insert = false**

---

## 원칙

- Production reward mutation audit를 **설계**한다.
- Stage 3-D에서 Production DB에 audit row를 **자동 insert하지 않는다**.
- redaction 필수: secret / token / code / quiz_answer / raw body 전체 저장 금지

## Event types

- `reward_open_preflight_started`
- `reward_open_preflight_passed`
- `reward_open_preflight_failed`
- `reward_open_approved`
- `reward_open_rejected`
- `reward_kill_switch_enabled`
- `reward_kill_switch_disabled`
- `reward_allowlist_changed`
- `reward_transaction_attempted`
- `reward_transaction_blocked`
- `reward_transaction_succeeded`
- `reward_transaction_failed`
- `reward_adjustment_required`

## 최소 필드

| Field | Notes |
|---|---|
| event_type | 위 enum |
| environment | production / preview / development |
| actor_type | operator / system / user |
| actor_id 또는 operator alias | PII 최소화 |
| campaign_id | nullable |
| user_id | nullable / redacted |
| idempotency_key | nullable |
| request_id | nullable |
| result_code | e.g. STAGE3B_PRODUCTION_BLOCKED |
| created_at | timestamptz |
| redaction_applied | always true |
| secret_exposed | always false |
| token_exposed | always false |

## 금지

- OAuth token / Client Secret / authorization code 저장
- quiz_answer 저장
- raw request body 전체 저장

## Diagnostics

- `stage3DAuditLogContractReady=true`
- `stage3DAuditLogProductionInsert=false`
- `stage3DAuditRedactionRequired=true`
