# AdMe Stage 3-F Cash-out Manual Approval Design

작성일: 2026-07-09  
상태: **design/preflight only** — actual cash-out processing=false, Production reward open=false 유지

관련: [stage-3-e-controlled-open-approval.md](./stage-3-e-controlled-open-approval.md) · [stage-3-e-controlled-open-runbook.md](./stage-3-e-controlled-open-runbook.md) · [product-policy-current.md](./product-policy-current.md)

---

## Stage 3-F 목표

Stage 3-F는 Stage 3-E-Controlled-Open-Approval 이후 바로 Production reward open execution으로 진입하지 않고, 포인트 현금 전환의 운영 리스크를 먼저 설계·문서·marker·검증 스크립트로 고정하는 단계다.

- 최소 현금 전환 금액, 수동 승인, 수동 이체, 실패 복구, 감사 추적 원칙 확정
- Production reward open flag=false, reward kill switch=true, allowlist active=false 유지 확인
- cash-out actual processing=false, cash-out mutation=false, auto transfer=false를 admin marker로 노출
- public route에는 Stage 3-F marker와 민감 문자열이 노출되지 않도록 guard

---

## 비목표

- Production reward open execution
- cash-out 신청/승인/거절/이체 완료 actual implementation
- 자동 계좌이체 API 연동
- point_ledger, campaign budget, users balance, ad_views, cash_out, partner_settlements Production mutation
- 계좌번호 원문 저장 또는 표시
- 실명, OAuth raw id, full email, secret, code, token, quiz_answer 노출
- RLS 완화 또는 point_ledger 직접 INSERT policy 생성

---

## 현재 cash-out inventory

용어 매핑:
- 사용자·사업 용어 `cash-out` / 현금 전환은 DB에서 `cash_redemption_requests` 요청 테이블로 추적한다.
- 현금 전환 차감 ledger debit type은 `cash_redemption`이다.
- 실패 복구 ledger type은 기존 `admin_adjustment` 또는 별도 승인된 reversal ledger append로 설계한다.
- 기존 DB 스키마를 존중하며 신규 `cash_out` 테이블 또는 임의 `cash_out` ledger type을 만들지 않는다.

| 항목 | 현재 상태 |
|---|---|
| cash-out 테이블 | `cash_redemption_requests` 존재 (`supabase/migrations/20260706100100_stage0_tables.sql`) |
| cash-out 최소 금액 | `min_cash_redemption_points()`가 10,000P 반환 (`supabase/migrations/20260706100000_stage0_extensions_enums.sql`) |
| point_ledger cash-out 타입 | `ledger_entry_type='cash_redemption'` 존재. 별도 literal `cash_out` 타입은 없음 |
| point_ledger adjust 타입 | `ledger_entry_type='admin_adjustment'` 존재. reason 필수 검증 존재 |
| point_ledger append-only | UPDATE/DELETE reject trigger 존재 |
| cash-out RLS | 기존 Stage 0 RLS에 `cash_redemption_select_own`, `cash_redemption_insert_own`, `cash_redemption_admin_update` 존재. Stage 3-F에서는 RLS를 완화하거나 새 policy를 추가하지 않음 |
| cash-out 신청 UI | 없음 |
| cash-out 관리자 승인 UI | 없음 |
| cash-out RPC/server action | 없음 |
| cash-out verify script | Stage 3-F 전용은 이번 Stage에서 추가 |
| cash-out marker | Stage 3-D/E에서 mutation=false/out-of-scope marker 존재. Stage 3-F marker는 이번 Stage에서 추가 |

주의: 기존 Stage 0 스키마에는 `cash_redemption_requests.bank_account_number`, `bank_account_holder` 컬럼이 존재한다. Stage 3-F는 이 컬럼을 사용하지 않으며, 계좌정보 수집 구현을 금지한다. 향후 actual implementation 전에는 본인 인증 계좌정보를 분리 저장하고 admin 화면에는 마스킹된 값만 노출하도록 재설계해야 한다.

---

## 현재 상태 요약

- Stage 3-E-Controlled-Open-Approval 완료 인정
- Stage 3-E-Controlled-Open-Approval-R 완료 인정
- Stage 3-E-Controlled-Open-Execution은 별도 명시 승인 전 보류
- Production reward open flag=false
- reward kill switch=true
- controlled allowlist active=false
- Production reward/ledger/budget/balance/ad_views/partner_settlements/cash_out mutation=false
- Production `cash_redemption_requests` actual processing/mutation=false

---

## 사업 기준

- 최소 현금 전환 금액: **10,000P**
- 처리 방식: **관리자 수동 승인 + 수동 계좌 이체**
- 자동 이체 API 연동: **MVP 이후**
- 이체 실패 시 DELETE rollback: **금지**
- 실패 복구: **admin_adjustment + 또는 승인된 reversal ledger append**
- 실패 복구 사유: **필수**

---

## cash-out lifecycle 초안

| 상태 | 의미 |
|---|---|
| `not_eligible` | 잔액, 본인 인증 계좌, fraud flag 등 기준 미충족 |
| `requestable` | 신청 가능 |
| `pending_review` | 신청 접수 후 관리자 검토 대기 |
| `approved_pending_transfer` | 승인 완료, 수동 이체 대기 |
| `transferred` | 수동 이체 완료 |
| `rejected` | 관리자 거절 |
| `failed_reversal_pending` | 승인/차감 후 이체 실패, 복구 ledger 대기 |
| `reversed` | 실패 복구 ledger append 완료 |
| `cancelled` | 운영 기준에 따른 취소 |

기존 `redemption_status` enum(`pending`, `approved`, `rejected`, `paid`, `cancelled`)은 MVP 설계 초안보다 단순하다. actual implementation 전에는 lifecycle 상태 확장 또는 별도 상태 매핑을 다시 승인받아야 한다.

---

## point_ledger 처리 원칙

### 신청 시점 즉시 차감

장점:
- 사용자가 중복 신청으로 잔액을 초과 사용하는 위험을 줄인다.
- cash-out pending 금액이 원장에 즉시 반영되어 잔액 SSOT와 맞다.
- 동일 사용자 중복 pending 신청 제어가 단순하다.

단점:
- 이체 실패 시 복구 ledger가 반드시 필요하다.
- 운영자가 실패 복구를 누락하면 잔액 불일치 또는 민원 리스크가 생긴다.

### 승인 시점 차감

장점:
- 거절/취소 시 복구 ledger가 필요하지 않다.
- pending 상태에서 사용자의 표시 잔액을 그대로 유지할 수 있다.

단점:
- 승인 직전 잔액 재검증이 필요하다.
- pending 신청 중 사용자가 포인트를 사용하면 승인 실패/부분 승인 정책이 복잡해진다.

### Stage 3-F 기본안

개발계획서 기준 기본안은 **신청 시점 `cash_redemption` 기록으로 즉시 차감**이다. 이 방식은 actual implementation 전 별도 승인 필요하며, Stage 3-F에서는 mutation을 실행하지 않는다.

원칙:
- 실패 시 `admin_adjustment` 또는 승인된 reversal ledger로 복구
- 복구 사유 필수
- `point_ledger` UPDATE/DELETE 금지
- `point_ledger` 직접 INSERT policy 금지
- 모든 ledger mutation은 서버 전용 RPC 또는 server action 경유
- 모든 cash-out debit/reversal/admin decision에는 `idempotency_key` 필수

---

## idempotency 설계

- debit: `cash_out_request:<request_id>:debit`
- reversal: `cash_out_request:<request_id>:reversal`
- admin decision: `cash_out_request:<request_id>:admin-decision`

idempotency key는 같은 request에 대해 동일 이벤트가 중복 처리되지 않도록 서버에서 생성·검증한다. client가 임의 key를 직접 제출하는 방식은 금지한다.

---

## 관리자 수동 승인 감사 필드 초안

- `request_id`
- `consumer_user_id`
- `requested_amount`
- `approved_amount`
- `status`
- `admin_user_id`
- `admin_decision_at`
- `admin_note_required`
- `rejection_reason`
- `transfer_due_date`
- `transfer_completed_at`
- `ledger_cash_out_entry_id`
- `ledger_reversal_entry_id`
- `created_at`
- `updated_at`

---

## 개인정보·계좌정보 원칙

- 이번 Stage에서 계좌정보 수집 구현 금지
- 계좌번호 원문 저장 설계 금지
- 향후 본인 인증 계좌 정보는 cash-out request와 분리 저장
- admin 화면에는 은행명, 뒤 4자리 등 마스킹된 표시만 허용
- 문서·로그·marker에 계좌번호, 실명, OAuth raw id, full email 기록 금지
- OAuth code/token, Kakao Client Secret 원문/일부/hash/digest 기록 금지

---

## 운영자 체크리스트

- 잔액 10,000P 이상 여부
- 본인 인증 계좌 등록 여부
- 동일 사용자 중복 pending 신청 여부
- 일일/월간 전환 한도 검토
- 부정행위 flag 여부
- `point_ledger` 합계와 users balance cache 정합성
- 리워드 재원 pool sufficiency 확인
- 승인/거절/복구 사유 기록 여부

---

## Stage 3-E Execution과의 관계

- Stage 3-F는 actual reward open 전 운영 안전장치다.
- Stage 3-F 완료는 Stage 3-E Execution을 자동 승인하지 않는다.
- Stage 3-F 완료 후에도 기술사님 explicit approval 없이는 reward open flag=true, kill switch=false, allowlist active=true 전환 금지다.
- Cash-out actual processing 역시 별도 승인 전까지 false다.

---

## Stage 3-F marker

Admin-only route(`/admin/diagnostics`, `/admin/reward-preflight`, `/admin/cash-out-preflight`)에만 노출한다.

- `stage3FCashOutManualApprovalDesign=true`
- `stage3FCashOutActualProcessing=false`
- `stage3FCashOutMutation=false`
- `stage3FCashOutAutoTransfer=false`
- `stage3FCashOutMinAmount=10000`
- `stage3FCashOutManualApprovalRequired=true`
- `stage3FCashOutDeleteRollbackAllowed=false`
- `stage3FCashOutAdjustmentReversalRequired=true`
- `stage3FCashOutAccountRawRecorded=false`
- `stage3FCashOutFullEmailRecorded=false`
- `stage3FProductionRewardOpenFlag=false`
- `stage3FRewardKillSwitch=true`
- `stage3FControlledAllowlistActive=false`
- `stage3FProductionRewardMutation=false`
- `stage3FPointLedgerMutation=false`
- `stage3FCampaignBudgetMutation=false`
- `stage3FUsersBalanceMutation=false`
- `stage3FAdViewsMutation=false`
- `stage3FPartnerSettlementsMutation=false`
- `stage3FCashOutProcessing=false`
- `stage3FDeployCommit=<current commit>`

Public route에는 `stage3F`, `cashOut`, account raw, full email, secret, token, `quiz_answer` marker를 노출하지 않는다.
