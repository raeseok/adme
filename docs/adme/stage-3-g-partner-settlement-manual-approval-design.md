# AdMe Stage 3-G Partner Settlement Manual Approval Design

작성일: 2026-07-09  
상태: **design/preflight only** — partner_settlements actual processing=false, DB migration=false

관련: [stage-3-g-partner-settlement-attribution-policy.md](./stage-3-g-partner-settlement-attribution-policy.md) · [stage-3-f-cash-out-manual-approval-design.md](./stage-3-f-cash-out-manual-approval-design.md) · [product-policy-current.md](./product-policy-current.md)

---

## Stage 3-G 목표

Stage 3-G는 Partner Settlement Attribution Policy Lock 이후, 파트너 정산 수동 승인 구조를 실제 구현 전에 설계·문서·admin marker·verify contract로 고정하는 단계다.

- `advertisers.partner_id` 귀속 고정 원칙을 정산 설계의 SSOT로 확정
- monthly close 이후 확정 거래 기준 settlement 생성 원칙 고정
- 익월 15일 수동 현금 지급 운영 원칙 고정
- share rate snapshot, idempotency unique key, status machine, paid immutability, chargeback, partner termination 원칙 고정
- Production reward/cash-out/partner settlement mutation gate가 계속 닫혀 있음을 검증

---

## Stage 3-G 비목표

- `partner_settlements` INSERT/UPDATE/DELETE actual processing
- monthly settlement batch 구현
- partner payout button/action 구현
- settlement approve/reject/paid action 구현
- DB migration
- `UNIQUE(partner_id, settlement_month)` 실제 migration
- `share_rate_snapshot` 실제 column migration
- paid update block trigger 실제 migration
- chargeback actual mutation
- `advertisers.partner_id` NULL 변경 코드
- campaign/ad_view/quiz_pass/settlement 시점 partner 동적 재탐색 로직
- quiz pass 시점 partner share 계산 로직
- cash-out actual processing 또는 `cash_redemption_requests` mutation

---

## Partner Attribution Fixed To Advertiser

- 파트너 귀속 기준은 `advertisers.partner_id`에 고정한다.
- 정산 귀속 경로는 `campaign -> advertiser -> advertisers.partner_id`이다.
- campaign 생성, ad_view 생성, quiz pass, settlement 생성 시점에 partner를 동적으로 재탐색하지 않는다.
- quiz pass 시점에는 partner share를 계산·기록하지 않는다.
- 광고주 등록 이후 `partner_id immutable` 원칙을 따른다.

---

## Monthly Close Settlement Lifecycle

1. 월중 quiz pass 및 reward transaction은 소비자 보상과 광고주 예산/ledger 정합성만 다룬다.
2. 월말 close 이후 확정 거래만 partner settlement 산출 대상이 된다.
3. close 전 취소·부정행위는 해당 월 확정 거래에서 제외 또는 차감한다.
4. close 후 발견된 부정행위는 paid row를 수정하지 않고 다음 달 chargeback으로 반영한다.
5. 익월 15일 운영자가 수동으로 현금 지급한다.

Stage 3-G에서는 위 lifecycle을 문서·marker로만 고정하며 batch나 지급 action은 구현하지 않는다.

---

## Settlement Status Machine

기본 상태 흐름은 `pending -> confirmed -> paid`이다.

| 상태 | 의미 |
|---|---|
| `pending` | monthly close 산출 후 운영 검토 대기 |
| `confirmed` | 운영자가 확정했지만 지급 전 |
| `paid` | 수동 지급 완료 및 불변 상태 |

`paid` 상태 이후에는 기존 row UPDATE를 차단해야 한다. 오류 정정은 paid row 수정이 아니라 다음 달 chargeback 또는 별도 승인된 adjustment settlement로 처리한다.

---

## Snapshot 설계

- settlement 생성 시점의 partner share rate를 snapshot으로 저장한다.
- 후보 컬럼명은 `settlement_share_rate_snapshot` 또는 equivalent column이다.
- 파트너 계약 조건이 나중에 바뀌어도 과거 settlement amount를 재계산하지 않는다.
- snapshot에는 계산 근거가 되는 배분율만 저장하고 secret, OAuth token, quiz_answer, 계좌번호 원문 같은 민감값은 저장하지 않는다.

---

## Idempotency 설계

- settlement 생성은 `(partner_id, settlement_month)` UNIQUE 제약을 전제로 설계한다.
- monthly close batch가 재실행되어도 같은 partner·month row가 중복 생성되면 안 된다.
- batch idempotency key 후보는 `partner_settlement:<partner_id>:<settlement_month>`이다.
- Stage 3-G에서는 UNIQUE migration이나 batch idempotency actual code를 만들지 않는다.

---

## Paid Immutability 설계

- `paid update blocked`는 future DB trigger 또는 equivalent server guard의 필수 요구사항이다.
- paid row의 amount, partner_id, settlement_month, share snapshot, status 직접 변경을 금지한다.
- paid 이후 오류 정정은 다음 달 chargeback 또는 별도 adjustment settlement append로 처리한다.
- Stage 3-G에서는 paid update trigger migration을 만들지 않는다.

---

## Chargeback 설계

- 월 마감 전 부정행위는 해당 월 확정 거래에서 제외 또는 차감한다.
- 월 마감 후 발견된 부정행위는 `chargeback next month`로 다음 달 settlement에서 차감한다.
- paid settlement row를 직접 UPDATE하거나 DELETE하지 않는다.
- Stage 3-G에서는 chargeback line item schema나 actual mutation을 구현하지 않는다.

---

## Partner Termination 설계

- 파트너 이탈·계약 해지 시 `advertisers.partner_id`를 NULL로 변경하지 않는다.
- `do not null advertiser partner_id`를 정산 근거 보존 원칙으로 둔다.
- 파트너 상태는 `partners.status='terminated'`로 관리한다.
- terminated partner의 미정산 확정 거래는 future actual implementation에서 final settlement 또는 hold 정책으로 별도 승인받는다.

---

## 향후 actual implementation DB migration 후보

- `partner_settlements.settlement_month`
- `partner_settlements.settlement_share_rate_snapshot`
- `UNIQUE(partner_id, settlement_month)`
- settlement status enum/check: `pending`, `confirmed`, `paid`
- paid update block trigger
- chargeback line item 또는 adjustment settlement reference
- monthly close batch/RPC idempotency audit table

위 항목은 후보일 뿐이며, 이번 Stage에서는 DB migration이 없다.

---

## Stage 3-G marker

Admin-only route(`/admin/diagnostics`, `/admin/reward-preflight`, `/admin/partner-settlement-preflight`)에만 노출한다.

- `stage3GPartnerSettlementManualApprovalDesign=true`
- `stage3GPartnerSettlementActualProcessing=false`
- `stage3GPartnerSettlementMutation=false`
- `stage3GMonthlyCloseBatch=false`
- `stage3GPartnerSettlementAutoPayout=false`
- `stage3GAdvertiserPartnerAttributionLocked=true`
- `stage3GDynamicPartnerLookupAllowed=false`
- `stage3GQuizPassPartnerShareCalculation=false`
- `stage3GMonthlyCloseRequired=true`
- `stage3GNextMonthPayoutDay=15`
- `stage3GShareRateSnapshotRequired=true`
- `stage3GSettlementIdempotencyRequired=true`
- `stage3GSettlementUniqueKeyRequired=true`
- `stage3GSettlementStatusMachineRequired=true`
- `stage3GPaidUpdateBlockedRequired=true`
- `stage3GChargebackNextMonthRequired=true`
- `stage3GPartnerTerminationStatusRequired=true`
- `stage3GAdvertiserPartnerIdNullAllowed=false`
- `stage3GPartnerSettlementsMutation=false`
- `stage3GCashRedemptionRequestsMutation=false`

Public route에는 `stage3G`, `PartnerSettlementManualApproval`, `advertisers.partner_id`, `partner_settlements`, `share_rate_snapshot`, `settlement_month`, `chargeback`, `secret`, `token`, `quiz_answer` marker를 노출하지 않는다.
