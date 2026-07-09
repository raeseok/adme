# AdMe Stage 3-K Protected Fund Reconciliation Design

작성일: 2026-07-09  
상태: protected fund reconciliation design only / read-only admin marker / no implementation

관련:
- [stage-3-i-threshold-based-prepaid-exemption-assumption.md](./stage-3-i-threshold-based-prepaid-exemption-assumption.md)
- [stage-3-j-prepaid-threshold-monitoring-architecture.md](./stage-3-j-prepaid-threshold-monitoring-architecture.md)
- [stage-3-j-r-prepaid-threshold-db-migration-design-review.md](./stage-3-j-r-prepaid-threshold-db-migration-design-review.md)
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 1. Stage 3-K 목적

Stage 3-K는 포인트 발행, 현금전환, 광고주 선납, 파트너 정산이 실제로 열리기 전에 소비자 미전환 포인트 부채와 보호자금 또는 리워드 재원 잔액을 어떻게 대사할지 설계한다.

이번 단계는 protected fund reconciliation design only다. no DB migration, no Supabase db push, no Production mutation 상태를 유지한다. runtime protected fund reconciliation is not implemented. actual protected fund balance is not available. calculation source is not finalized. actual reward open remains blocked.

이 문서는 법률상 보호자금 별도관리 확정 결론이 아니라, Stage 3-I의 초기 미등록·등록면제 전제에서도 보수적으로 준비하는 운영·개발 기준이다.

---

## 2. Stage 3-I/J/J-R 기준 요약

- Stage 3-I는 초기에는 등록 면제 기준 충족을 전제로 미등록 운영을 내부 개발 기준으로 둔다.
- 분기말 발행잔액은 3,000,000,000 KRW 미만이어야 한다.
- 연간 총발행액은 50,000,000,000 KRW 미만이어야 한다.
- Stage 3-J는 threshold monitoring architecture를 설계했지만 runtime monitoring은 구현하지 않았다.
- Stage 3-J-R은 threshold DB migration design review를 완료했지만 실제 migration과 Supabase db push는 수행하지 않았다.
- threshold monitoring은 prepaid registration/exemption gate이고, Stage 3-K protected fund reconciliation은 소비자 redeemable point liability coverage gate다.

---

## 3. 보호자금 대사가 필요한 이유

소비자에게 현금전환 가능한 포인트가 존재하면, 앱 내부 ledger의 포인트 부채와 실제 보호자금 또는 리워드 재원 사이에 차이가 생길 수 있다. 광고주 선납금, 캠페인 예산 배정, 포인트 적립, 현금전환 신청, 지급 완료, 환불, 소멸, 관리자 조정은 모두 coverage 상태에 영향을 줄 수 있다.

coverage unknown blocks cash-out. coverage deficit blocks cash-out. coverage unknown blocks reward open. coverage deficit blocks reward open. 이 원칙은 actual reward open remains blocked 상태를 유지하면서, 후속 구현 전 판정 기준을 먼저 고정하기 위한 것이다.

---

## 4. 핵심 용어 정의

- consumer redeemable point liability: 소비자가 현금전환을 청구할 수 있는 미전환 포인트 부채의 KRW 환산액이다.
- protected fund balance: 소비자 redeemable point liability를 커버하기 위해 별도 추적해야 하는 보호자금 또는 동등 리워드 재원의 잔액 후보다.
- reward reserve: 광고주 선납금 중 소비자 보상 지급에 사용할 내부 재원 관리 단위 후보다.
- advertiser prepaid amount: 광고주가 캠페인 집행 전 선납한 금액이다. 소비자 포인트 부채와 구분해 추적한다.
- campaign budget: 캠페인 단위로 배정된 광고비 및 reward 지급 가능 예산이다.
- breakage candidate: 유효기간 만료 등으로 소비자 청구권이 소멸될 수 있는 후보 금액이다. 정책 승인 전 수익 인식은 금지한다.
- cash-out pending amount: 소비자가 현금전환을 신청했지만 아직 지급 완료 또는 반려되지 않은 금액이다.

---

## 5. 보수적 대사 원칙

- 소비자 미전환 포인트 부채는 1원 단위로 산정한다.
- 보호자금 또는 리워드 재원은 소비자 현금전환 가능 포인트 부채 이상이어야 한다.
- coverage unknown이면 reward open 및 cash-out 차단으로 설계한다.
- coverage deficit이면 reward open 및 cash-out 차단으로 설계한다.
- cash-out 전 수동 대사가 필요하다.
- actual open 전 수동 대사가 필요하다.
- source_digest는 산정 원천과 기준 시각을 재현할 수 있어야 한다.
- 같은 원천으로 반복 산정되는 snapshot과 ledger 반영은 idempotency로 보호한다.
- audit log는 append-only로 설계한다.

---

## 6. protected fund reconciliation status

- `unknown_blocked`: liability 또는 protected fund balance가 null, 음수, stale, source_digest missing, review pending인 상태다.
- `normal`: coverage ratio가 1.05 이상이고 coverage gate 기준을 충족한 상태다.
- `warning`: coverage ratio가 1.00 이상 1.05 미만인 상태다. target buffer에는 미달하므로 운영 검토가 필요하다.
- `deficit_blocked`: protected fund balance가 consumer redeemable point liability보다 작은 상태다.

---

## 7. coverage ratio 정책

- minimum 100%: coverage ratio는 최소 1.0 이상이어야 한다.
- warning below 105%: coverage ratio가 1.05 미만이면 warning으로 표시한다.
- target buffer 110%: coverage ratio 1.10은 권장 buffer다.
- target buffer는 권장값이며, warning 기준은 1.05로 둔다.

---

## 8. 보호자금 대사에 영향을 주는 이벤트

- advertiser prepaid charge: 광고주 선납금 증가. reward reserve 또는 protected fund ledger의 입금 후보가 될 수 있다.
- campaign budget allocation: 선납금이 캠페인 예산으로 배정되는 내부 earmark 후보이며 소비자 부채 증가 자체는 아니다.
- quiz_reward point liability increase: 소비자 redeemable point liability를 증가시키는 주요 이벤트 후보다.
- cash_out request: pending cash-out amount를 증가시키며 수동 대사 대상이 된다.
- cash_out paid: 소비자 포인트 부채와 보호자금 잔액을 함께 감소시키는 후보 이벤트다.
- cash_out reversal: 실패 복구 또는 반려 시 pending amount와 liability 반영 방향을 audit log로 남겨야 한다.
- point expire: 소비자 청구권 소멸 후보지만 breakage 정책 승인 전 수익 인식과 분리한다.
- breakage recognition candidate: 정책 승인 전까지 revenue recognition blocked 상태로 둔다.
- advertiser refund: 미사용 선납금 환불 후보이며 소비자 발행분 환수와 구분한다.
- admin adjust: 오류 정정은 reason, source_digest, idempotency_key, audit log가 필수다.

---

## 9. 추천 DB 설계 후보

### A. protected_fund_accounts

- id
- account_label
- account_type
- currency
- is_active
- created_at
- created_by

용도: 보호자금 또는 리워드 재원 계정을 추상화한다. raw bank account data exposed=false 원칙을 유지한다.

### B. protected_fund_ledger

- id
- protected_fund_account_id
- event_type
- amount_krw
- direction
- related_user_id
- related_advertiser_id
- related_campaign_id
- related_cash_redemption_request_id
- related_point_ledger_id
- idempotency_key
- source_digest
- memo
- created_at
- created_by

용도: protected fund inflow/outflow 후보의 append-only ledger다. 실제 ledger write는 후속 Stage에서만 검토한다.

### C. protected_fund_daily_snapshots

- id
- snapshot_date
- protected_fund_balance_krw
- consumer_redeemable_point_liability_krw
- coverage_ratio
- status
- source_digest
- created_at
- created_by

용도: daily reconciliation snapshot 후보다. snapshot_date unique와 source_digest drift review를 권장한다.

### D. protected_fund_reconciliation_snapshots

- id
- reconciliation_date
- protected_fund_balance_krw
- point_ledger_liability_krw
- pending_cash_out_krw
- coverage_ratio
- status
- discrepancy_krw
- reviewed_at
- reviewed_by
- source_digest

용도: 수동 검토 및 close 전 reconciliation snapshot 후보다.

### E. protected_fund_audit_logs

- id
- event_type
- previous_status
- next_status
- reason_code
- payload_digest
- created_at
- created_by

용도: status 전환, source_digest 변경, manual review, guard block 이벤트 감사 후보다.

### F. protected_fund_adjustment_requests

- id
- request_type
- amount_krw
- reason
- status
- requested_by
- reviewed_by
- created_at
- reviewed_at

용도: 관리자 조정 요청과 승인 이력을 분리한다.

---

## 10. 추천 RPC 설계 후보

- `rpc_stage3k_design_only_calculate_protected_fund_coverage`
- `rpc_stage3k_design_only_assert_protected_fund_allows_cash_out`
- `rpc_stage3k_design_only_assert_protected_fund_allows_reward_open`

이름은 설계 후보다. 실제 구현은 후속 Stage에서만 가능하다. runtime protected fund reconciliation is not implemented.

---

## 11. 추천 RLS 설계

- admin read-only: admin route 또는 approved admin role만 snapshot과 audit log를 조회한다.
- service role 또는 SECURITY DEFINER write path only: approved backend job만 ledger/snapshot/audit append를 수행한다.
- consumer/advertiser/partner direct access blocked: 직접 select/insert/update/delete를 차단한다.
- raw bank account data exposed=false: admin preflight에도 계좌 원문을 노출하지 않는다.
- audit log append-only: update/delete 금지.

---

## 12. source_digest / idempotency 설계

`source_digest`는 산정 원천 범위, 기준 시각, point_ledger range, cash_redemption_requests pending range, protected fund ledger range, excluded event policy, calculation version을 canonical JSON으로 정규화한 뒤 hash한 값으로 설계한다.

`idempotency_key`는 같은 외부 입금, 같은 cash-out paid event, 같은 admin adjustment가 중복 반영되지 않도록 한다. 같은 source_digest와 idempotency_key 조합은 replay로 처리하고, 서로 다른 digest는 audit log drift review 대상으로 기록한다.

---

## 13. admin preflight에서 보여야 할 값

- Protected Fund Reconciliation Design
- Protected fund reconciliation is designed
- Runtime protected fund reconciliation is not implemented
- Actual protected fund balance is not available
- Calculation source is not finalized
- Coverage unknown blocks cash-out
- Coverage deficit blocks cash-out
- Coverage unknown blocks reward open
- Coverage deficit blocks reward open
- Actual reward open remains blocked
- No production mutation
- No DB migration in Stage 3-K
- coverage minimum ratio 1.0
- coverage warning ratio 1.05
- coverage target buffer ratio 1.10

---

## 14. cash-out actual implementation 전 필수 조건

- protected fund coverage source finalized
- runtime protected fund reconciliation completed in a later approved Stage
- actual protected fund balance obtained through an approved source
- KYC/account verification data model
- tax/withholding-ready data model
- terms acceptance log
- fraud check and admin approval workflow
- cash_redemption_requests status machine review
- source_digest, idempotency, audit log
- bank account raw exposure blocked

Stage 3-K에서는 위 항목을 구현하지 않는다.

---

## 15. reward open 전 필수 조건

- threshold runtime monitoring implemented
- runtime protected fund reconciliation completed in a later approved Stage
- exemption limits verified
- actual protected fund values reviewed
- reward kill switch and release flag approval
- controlled allowlist explicit approval
- owner explicit approval

Stage 3-E-Controlled-Open-Execution은 위 조건과 별도 승인 전 계속 금지한다. actual reward open remains blocked.

---

## 16. partner settlement과의 관계

partner settlement는 소비자 보호자금과 분리한다. partner payout은 별도 정산 부채이며, 소비자 redeemable point liability coverage와 혼합하지 않는다.

Stage 3-G 기준을 유지한다:

- partner_settlements actual processing=false
- monthly close batch=false
- partner payout action=false
- paid update block
- chargeback next month
- `advertisers.partner_id` attribution lock

---

## 17. Stage 3-K에서 하지 않는 것

- actual DB migration 구현
- supabase/migrations 하위 신규 SQL 추가
- Supabase db push/reset/repair
- Production mutation
- Production reward mutation
- Production point_ledger mutation
- Production campaign budget mutation
- Production users balance mutation
- Production ad_views mutation
- Production cash_redemption_requests mutation
- Production partner_settlements mutation
- 은행 API 연동
- 실제 보호계좌 잔액 조회
- 실제 보호자금 ledger mutation
- cash-out actual implementation
- partner settlement actual implementation
- monthly settlement batch
- partner payout action
- breakage 수익 인식
- actual reward open 실행

---

## 18. 완료 기준

- Stage 3-K SSOT가 protected fund reconciliation designed=true, read-only design only=true, runtime/DB/API/balance/source/mutation flags=false를 반환한다.
- protected fund reconciliation evaluator가 `unknown_blocked`, `normal`, `warning`, `deficit_blocked`를 순수 함수로 판정한다.
- `/admin/protected-fund-preflight`, `/admin/compliance-preflight`, `/admin/diagnostics`에 admin-only marker가 노출된다.
- public route에는 `stage3K` 또는 Protected Fund Reconciliation Design 문구가 노출되지 않는다.
- no DB migration, no Supabase db push, no Production mutation 상태가 검증된다.
- runtime protected fund reconciliation is not implemented.
- actual protected fund balance is not available.
- calculation source is not finalized.
- actual reward open remains blocked.
