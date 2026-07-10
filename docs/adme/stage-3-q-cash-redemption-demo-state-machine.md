# AdMe Stage 3-Q Cash Redemption Demo State Machine

## 1. Purpose

Stage 3-Q는 투자자 시연에서 소비자 포인트 현금전환 업무 흐름을 이해할 수 있도록 만드는 sandbox/demo 전용 상태 머신이다.

이번 Stage는 실제 cash-out 기능이 아니다.

## 2. Sandbox Boundary

- 모든 신규 데이터는 `cash_redemption_demo_*` namespace로 분리한다.
- 실제 `cash_redemption_requests`를 생성하지 않는다.
- 실제 `point_ledger` cash_out entry를 생성하지 않는다.
- 실제 `profiles.point_balance` 또는 users balance를 차감하지 않는다.
- 실제 계좌번호, 예금주명, CI, DI, 주민등록번호, provider token, raw provider response를 저장하지 않는다.
- 실제 세금 계산, 원천징수, 지급명세서, 세무 신고를 구현하지 않는다.
- Production Supabase migration은 차단한다.

## 3. Difference From Actual Cash-Out

Stage 3-Q는 실제 지급 시스템이 아니라 상태 전이, 역할별 화면, 검토 이력, idempotency, RLS, 관리자 업무 흐름을 설명하기 위한 demo layer다. 최종 성공 상태는 `demo_completed`이며, `completed`, `paid`, `transferred` 같은 실제 송금 완료 표현을 사용하지 않는다.

## 4. Request Status Taxonomy

- `draft`
- `eligibility_check_required`
- `eligible`
- `ineligible`
- `submitted`
- `under_review`
- `on_hold`
- `approved`
- `rejected`
- `processing`
- `demo_completed`
- `cancelled`
- `expired`

## 5. Review Decision Taxonomy

- `pending`
- `approve`
- `hold`
- `reject`
- `cancel`

## 6. Eligibility Result Taxonomy

- `eligible`
- `insufficient_balance`
- `identity_verification_required`
- `bank_verification_required`
- `tax_review_required`
- `required_terms_missing`
- `protected_fund_check_failed`
- `minimum_threshold_not_met`
- `account_restricted`
- `manual_review_required`

Reason code는 내부 audit 용도이며 소비자 화면에는 사용자용 설명 코드와 분리해 표시한다.

## 7. Allowed Transitions

- `draft -> eligibility_check_required`
- `eligibility_check_required -> eligible`
- `eligibility_check_required -> ineligible`
- `eligible -> submitted`
- `submitted -> under_review`
- `submitted -> cancelled`
- `under_review -> on_hold`
- `under_review -> approved`
- `under_review -> rejected`
- `on_hold -> under_review`
- `on_hold -> rejected`
- `on_hold -> cancelled`
- `approved -> processing`
- `processing -> demo_completed`

Forbidden examples:

- `rejected -> approved`
- `demo_completed -> processing`
- `cancelled -> submitted`
- `ineligible -> submitted`
- `draft -> demo_completed`

상태 전이는 서버 권위 RPC에서만 허용한다.

## 8. Roles

- Consumer: 자신의 sandbox request와 event timeline을 읽고, dev RPC를 통해 자신의 request만 evaluate/submit할 수 있다.
- Admin: sandbox request를 읽고 review/start/hold/approve/reject/processing/demo_completed 상태로 전이할 수 있다.
- Anonymous: 읽기/쓰기 모두 차단한다.
- Advertiser/Partner: 읽기/쓰기 모두 차단한다.

Production UI는 DB mutation 없이 client-side guided demo만 수행한다.

## 9. Point Balance Principle

표시 잔액은 demo scenario balance 또는 기존 read-only balance projection을 사용한다. 이번 Stage에서 requested amount는 demo request에만 기록한다.

금지:

- `point_ledger` cash_out entry 생성
- `point_ledger` adjust entry 생성
- `profiles.point_balance` update
- campaign budget mutation
- 실제 자금 reserve

## 10. Precondition Snapshot Link

신청 생성 시점의 sandbox 사전조건은 Stage 3-P `cash_redemption_precondition_snapshots`에 연결한다.

표시 항목:

- identity verification status
- bank verification status
- tax review status
- required terms status
- protected fund status
- minimum threshold status
- displayed available point balance
- requested amount
- evaluator version
- evaluated at

Stage 3-P snapshot의 status taxonomy는 실제 검증 결과와 충돌하지 않도록 provider-neutral status를 사용하고, Stage 3-Q request의 `is_sandbox=true`, `source_digest`, `evaluator_version`으로 demo context를 명확히 한다.

## 11. Tables

- `cash_redemption_demo_requests`
- `cash_redemption_demo_events`
- `cash_redemption_demo_review_assignments`

`cash_redemption_demo_events`는 append-only event history다.

## 12. RPC

Dev-only RPC:

- `rpc_stage3q_demo_evaluate_cash_redemption`
- `rpc_stage3q_demo_submit_cash_redemption`
- `rpc_stage3q_demo_start_review`
- `rpc_stage3q_demo_place_on_hold`
- `rpc_stage3q_demo_approve`
- `rpc_stage3q_demo_reject`
- `rpc_stage3q_demo_start_processing`
- `rpc_stage3q_demo_complete`
- `rpc_stage3q_demo_reset`

모든 RPC는 `SECURITY DEFINER`, 고정 `search_path`, caller role 검증, 상태 전이 검증, idempotency, append-only event 생성, dev project guard, sandbox guard를 포함한다.

## 13. Demo Scenarios

- Scenario A 정상 승인: 18,500P, 10,000P, `submitted -> under_review -> approved -> processing -> demo_completed`
- Scenario B 최소 잔액 부족: 7,800P, 10,000P, `minimum_threshold_not_met`, 제출 불가
- Scenario C 계좌확인 필요: 25,000P, `bank_verification_required`, 제출 전 안내
- Scenario D 보류 후 승인: 32,000P, `manual_review_required`, `under_review -> on_hold -> under_review -> approved -> processing -> demo_completed`

실제 이름, 이메일, 전화번호, 계좌번호는 사용하지 않는다.

## 14. Demo Reset

- Production: client-side demo state reset only, DB mutation 없음
- dev: `rpc_stage3q_demo_reset` 또는 validation transaction으로 Stage 3-Q demo data만 정리
- 기존 `point_ledger`, `profiles`, `campaigns`, `cash_redemption_requests`는 변경하지 않음

## 15. Production Guard

- Production Supabase migration 금지
- Production DB write 금지
- Production Vercel에는 UI와 client-side guided demo만 배포
- dev RPC는 dev project-ref `ogncvdxrrsjnwsuvgoyh`에서만 실행
- prod project-ref `vupsalteyltjqumppltc` issuer 감지 시 차단
- `is_sandbox=true` request만 처리

## 16. Stage 3-Q State

- `stage3QDemoStateMachineComplete=true`
- `investorDemoFocused=true`
- `sandboxOnly=true`
- `devMigrationImplemented=true`
- `devSupabasePushExecuted=true`
- `productionMigrationImplemented=false`
- `productionSupabasePushExecuted=false`
- `devDbStateMachineVerified=true`
- `productionDbMutationAllowed=false`
- `actualPointDeductionImplemented=false`
- `actualBankTransferImplemented=false`
- `actualTaxCalculationImplemented=false`
- `actualPersonalDataCollectionImplemented=false`
- `demoResetAvailable=true`
- `consumerDemoUxComplete=true`
- `adminDemoUxComplete=true`
- `mobileVerified=true`
- `desktopVerified=true`
- `overallDemoStatus=ready`

## 17. Future External Review Before Actual Cash-Out

실제 기능 전환 전에는 법무, 세무, 개인정보, 보안, identity provider, bank provider, 지급/정산, 선불업/전자금융거래법 검토가 필요하다. Stage 3-Q 완료는 actual cash-out 승인으로 해석하지 않는다.
