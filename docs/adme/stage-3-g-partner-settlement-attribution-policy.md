# AdMe Stage 3-G Partner Settlement Attribution Policy

작성일: 2026-07-09  
상태: **policy lock only** — partner_settlements actual mutation=false

관련: [product-policy-current.md](./product-policy-current.md) · [adme-decision-log.md](./adme-decision-log.md) · [stage-3-f-cash-out-manual-approval-design.md](./stage-3-f-cash-out-manual-approval-design.md) · [stage-3-g-partner-settlement-manual-approval-design.md](./stage-3-g-partner-settlement-manual-approval-design.md)

---

## 목표

Stage 3-G Partner Settlement Attribution Policy는 Partner Settlement Manual Approval Design 또는 actual settlement implementation 전에 흔들리면 안 되는 귀속·마감·스냅샷·멱등성 원칙을 고정한다.

이번 문서는 actual implementation이 아니다. `partner_settlements` INSERT/UPDATE/DELETE, monthly close batch, paid trigger, settlement payout action, chargeback actual mutation은 모두 false다.

Stage 3-G Partner Settlement Manual Approval Design은 이 policy lock을 구현 전 계약으로 받아 SSOT, admin marker, 문서, verify contract만 추가한다. actual processing, monthly close batch, payout action, DB migration은 별도 승인 전까지 계속 금지한다.

---

## 광고주 귀속 고정 원칙

- 파트너 귀속 기준은 `advertisers.partner_id`에 고정한다.
- 광고주의 `advertisers.partner_id`는 광고주 등록 시점에 확정한다.
- 광고주 등록 이후 `partner_id immutable` 원칙을 따른다.
- 캠페인 생성 시점, 광고 노출 시점, 퀴즈 통과 시점, 정산 시점에 partner를 동적으로 재탐색하지 않는다.
- 정산 귀속 기준은 `campaign -> advertiser -> advertisers.partner_id`이다.
- `advertisers.partner_id`를 임의 변경하면 과거 정산 근거가 흔들리므로 원칙적으로 금지한다.

---

## Monthly Close 정산 원칙

- 퀴즈 통과 시점에는 파트너 몫을 계산하지 않는다.
- 퀴즈 통과 시점에는 광고주 예산 차감 및 원장 기록만 처리한다.
- `partner_settlements`는 `monthly close` 이후 확정 거래 집계 기준으로 생성한다.
- 익월 15일 수동 현금 지급을 기본으로 한다.
- 월 마감 전 부정행위 취소는 해당 월 확정 거래에서 제외 또는 차감한다.
- 월 마감 후 발견된 부정행위는 이미 확정된 settlement를 직접 수정하지 않고 `chargeback next month` 방식으로 다음 달 정산에서 차감한다.

---

## Settlement Snapshot 원칙

- `partner_settlements`에는 계산 당시 배분율을 snapshot으로 저장한다.
- 예: `settlement_share_rate_snapshot` 또는 equivalent column.
- 파트너 계약 조건이 나중에 변경되어도 과거 정산액이 재계산되지 않도록 한다.

---

## Idempotency 원칙

- `(partner_id, settlement_month)` UNIQUE 제약을 둔다.
- 월말 정산 batch가 두 번 실행되어도 중복 정산이 발생하지 않아야 한다.
- batch 재실행은 동일 월·동일 partner에 대해 idempotent 해야 한다.

---

## Status Machine 원칙

- `partner_settlements.status`는 `pending -> confirmed -> paid` 흐름을 기본으로 한다.
- `paid update blocked`: paid 상태가 된 레코드는 UPDATE를 차단하는 DB trigger 또는 equivalent guard를 둔다.
- paid 이후 조정은 기존 row 수정이 아니라 다음 달 chargeback 또는 별도 adjustment settlement로 처리한다.

---

## Chargeback 처리 원칙

- 마감 전 부정행위 취소는 해당 월 확정 거래에서 제외 또는 차감한다.
- 마감 후 부정행위 발견은 다음 달 정산에서 `chargeback next month`로 차감한다.
- paid 상태의 settlement를 직접 UPDATE하지 않는다.

---

## Partner Termination 처리 원칙

- 계약 해지 시 `advertisers.partner_id`를 NULL로 바꾸지 않는다.
- `do not null advertiser partner_id`: 과거 귀속 근거 보존을 위해 광고주 row의 partner 귀속값을 제거하지 않는다.
- 파트너 이탈은 `partners.status='terminated'` 등 상태값으로 관리한다.
- 정산 batch는 `partners.status`를 확인하되, 과거 귀속 근거를 훼손하지 않는다.
- terminated partner에 대한 미정산 확정 거래는 계약·운영 정책에 따라 final settlement 또는 hold 상태로 처리한다.

---

## 이후 구현 예정 항목

- DB migration
- `UNIQUE(partner_id, settlement_month)`
- `settlement_share_rate_snapshot` column
- settlement status enum/check
- paid update block trigger
- monthly close RPC
- chargeback settlement line item
- admin confirmation UI
- partner payout action

---

## 이번 Stage에서 구현하지 않는 항목

- `partner_settlements` INSERT/UPDATE/DELETE
- monthly close batch
- paid trigger
- settlement payout action
- chargeback actual mutation
- partner settlement admin approval UI
- `advertisers.partner_id`를 NULL로 바꾸는 코드
- quiz pass 시점 partner share 계산·기록 로직
- Stage 3-G manual approval design에서의 DB migration
