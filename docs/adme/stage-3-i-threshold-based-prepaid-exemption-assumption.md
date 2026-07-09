# AdMe Stage 3-I Threshold-Based Prepaid Registration Exemption Assumption

작성일: 2026-07-09  
상태: policy / SSOT / admin preflight only

관련:
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)
- [stage-3-h-legal-tax-payment-compliance-review.md](./stage-3-h-legal-tax-payment-compliance-review.md)
- [stage-3-h-r-external-review-package.md](./stage-3-h-r-external-review-package.md)

---

## 1. Stage 3-I 목적

Stage 3-I는 AdMe의 초기 reward/point 개발 기준을 threshold 기반 선불업 등록 면제 가정으로 정정해 고정한다.

이번 Stage는 실제 reward open, 실제 point issuance, 실제 cash-out implementation, 실제 partner settlement implementation, DB migration, Supabase db push가 아니다.

Stage 3-I는 문서, SSOT, admin preflight marker, 검증 스크립트로 다음 내부 기준을 잠근다.

- 초기에는 등록 면제 기준 충족을 전제로 미등록 운영
- 분기말 발행잔액 30억 원 미만
- 연간 총발행액 500억 원 미만
- 두 조건 모두 충족
- threshold unknown이면 issuance blocked
- threshold exceeded이면 registration track 전환
- 법률 자문 결과가 아니라 내부 개발상 위험회피 기준

---

## 2. 사용자 정정 결정 사항

- 법무검토 비용이 크므로 초기에는 등록 면제 기준 내 미등록 운영을 전제로 개발한다.
- 분기말 발행잔액 30억 원 미만 및 연간 총발행액 500억 원 미만이면 등록 면제 기준에 해당하는 것으로 내부 개발 기준을 둔다.
- 포인트 발행 실적 증가에 따라 중도 등록이 필요할 수 있으므로 발행잔액/연간총발행액 monitoring을 필수화한다.
- 나머지 세무·개인정보·약관·파트너 정산은 최대한 보수적으로 준비한다.

이 결정은 법률 자문 결과가 아니라 내부 개발상 위험회피 기준이다.

---

## 3. 이 결정의 의미

- 초기에는 선불업 등록 없이 시작하는 개발 기준이다.
- 등록 면제 기준 충족 여부를 상시 확인해야 한다.
- 발행잔액 또는 연간 총발행액 기준 초과 시 actual issuance 중단 및 registration track 전환이 필요하다.
- 집계가 불가능하거나 불명확하면 안전상 issuance blocked로 처리한다.
- 이 기준은 actual open allowed=false를 바꾸지 않는다.

---

## 4. 등록 면제 기준

내부 개발 기준상 선불업 등록 면제 가정은 아래 두 조건 모두 충족되어야 유지된다.

- 분기말 발행잔액 30억 원 미만
- 연간 총발행액 500억 원 미만
- 두 조건 모두 충족

두 조건 중 하나라도 초과하거나, 초과가 임박하거나, 집계가 불가능하면 point issuance와 actual open은 차단한다.

---

## 5. threshold monitoring 정책

- 일 단위 내부 집계
- 분기말 snapshot
- 연간 총발행액 누계
- 80% 도달 시 warning
- 95% 도달 시 hard stop 준비
- 기준 초과 또는 불명확 시 issuance blocked

warning 도달 시에는 등록 준비 검토를 시작한다. threshold exceeded이면 registration track 전환을 수행해야 한다. threshold unknown이면 issuance blocked 상태를 유지한다.

---

## 6. 보수적 개발 원칙

1. 등록 면제 기준 충족 확인 전 actual open 금지
2. threshold monitoring 없는 point issuance 금지
3. threshold unknown이면 차단
4. threshold exceeded이면 차단 및 registration track 전환
5. 보호자금 별도관리는 면제 상태에서도 권장 구조로 준비
6. point_ledger는 계속 단일 원천 유지
7. 별도 protected fund reconciliation 설계 여지 확보
8. 소비자 현금전환은 KYC/계좌 실명/세무 증빙 준비 후 가능
9. 원천징수는 필요 시 처리 가능한 구조로 보수 설계
10. 브레이키지는 정책 승인 전 수익 인식 금지
11. 광고성 정보 수신 동의 및 철회 로그 필수
12. 파트너 정산은 세금계산서/증빙/chargeback/paid update block 전제

---

## 7. 개발상 금지 상태

- stage3IActualRewardOpenAllowed=false
- stage3IControlledOpenExecutionAllowed=false
- stage3ICashOutActualImplementationAllowed=false
- stage3IPartnerSettlementActualImplementationAllowed=false
- stage3IDbMigrationAllowed=false
- stage3IProductionRewardMutation=false
- stage3IProductionPointLedgerMutation=false
- stage3IProductionCampaignBudgetMutation=false
- stage3IProductionUsersBalanceMutation=false
- stage3IProductionAdViewsMutation=false
- stage3IProductionCashRedemptionRequestsMutation=false
- stage3IProductionPartnerSettlementsMutation=false

Stage 3-E-Controlled-Open-Execution, cash-out actual processing, partner settlement actual processing, monthly close batch, partner payout action, paid update trigger migration, chargeback actual mutation은 모두 별도 승인 전 금지한다.

---

## 8. 향후 실제 DB migration 전 필요한 설계 후보

- prepaid_threshold_snapshots
- prepaid_issuance_aggregates
- prepaid_registration_status
- protected_fund_accounts
- protected_fund_ledger
- fund_reconciliation_snapshots
- user_kyc_verifications
- tax_withholding_records
- payment_statements
- commercial_ad_consents
- terms_acceptances
- cash_redemption_requests 확장
- partner_settlements 확장

이번 Stage에서는 위 table 또는 column을 만들지 않는다.

---

## 9. 이번 Stage에서 하지 않는 것

- 실제 reward open
- 실제 point issuance 구현
- 실제 cash-out implementation
- 실제 partner settlement implementation
- monthly settlement batch 구현
- partner payout action 구현
- DB migration
- Supabase db push/reset/repair
- Production reward mutation
- Production point_ledger mutation
- Production campaign budget mutation
- Production users balance mutation
- Production ad_views mutation
- Production cash_redemption_requests mutation
- Production partner_settlements mutation

---

## 10. 완료 기준

- Stage 3-I SSOT가 threshold 기반 미등록 초기 운영 가정을 반환한다.
- Stage 3-I admin marker가 `/admin/compliance-preflight`와 `/admin/diagnostics`에만 노출된다.
- public route에는 `stage3I` 또는 Stage 3-I threshold 문구가 노출되지 않는다.
- verify script가 필수 marker, 금지 표현, mutation 금지, DB migration 금지, public marker guard를 확인한다.
- actual reward open allowed=false, cash-out actual implementation allowed=false, partner settlement actual implementation allowed=false, DB migration allowed=false 상태를 유지한다.
