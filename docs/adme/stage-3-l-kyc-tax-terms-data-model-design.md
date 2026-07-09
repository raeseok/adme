# AdMe Stage 3-L KYC / Tax / Terms Data Model Design

작성일: 2026-07-10  
상태: KYC / tax / terms proposed data model design only / no implementation

관련:
- [stage-3-h-legal-tax-payment-compliance-review.md](./stage-3-h-legal-tax-payment-compliance-review.md)
- [stage-3-h-r-external-review-package.md](./stage-3-h-r-external-review-package.md)
- [stage-3-i-threshold-based-prepaid-exemption-assumption.md](./stage-3-i-threshold-based-prepaid-exemption-assumption.md)
- [stage-3-j-prepaid-threshold-monitoring-architecture.md](./stage-3-j-prepaid-threshold-monitoring-architecture.md)
- [stage-3-j-r-prepaid-threshold-db-migration-design-review.md](./stage-3-j-r-prepaid-threshold-db-migration-design-review.md)
- [stage-3-k-protected-fund-reconciliation-design.md](./stage-3-k-protected-fund-reconciliation-design.md)
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 1. Stage 3-L 목표

Stage 3-L은 실제 cash-out 구현 전에 필요한 KYC, 본인 명의 계좌 확인, 세무 검토 대비, 약관 버전 관리, 광고성 정보 수신 동의 및 철회 구조를 proposed data model로 설계한다.

Stage 3-L 상태는 kycTaxTermsDataModelDesigned=true, readOnlyDesignOnly=true다. dbMigrationImplemented=false, supabaseDbPushExecuted=false, actualPersonalDataCollectionImplemented=false, identityProviderIntegrated=false, bankApiIntegrated=false, taxFilingImplemented=false, withholdingCalculationImplemented=false, cashOutActualProcessing=false, productionMutation=false를 유지한다.

---

## 2. Stage 3-L 비목표

- 실제 DB migration 구현
- supabase/migrations 하위 신규 SQL 추가
- Supabase db push/reset/repair
- Production mutation
- 실제 개인정보 수집 UI 구현
- PASS/KYC provider 연동
- 계좌 API 연동
- 실제 세무 신고 또는 원천징수 계산
- actual cash-out request 생성, 승인, 이체
- 법무/세무 확정 결론 선언
- reward open flag=true 전환
- kill switch=false 전환
- Stage 3-E-Controlled-Open-Execution 수행

---

## 3. reward open gate와 cash-out gate 분리 원칙

reward open gate는 플랫폼 레벨의 리워드 오픈 가능 여부다. threshold monitoring, protected fund coverage, legal/tax/payment compliance, kill switch, allowlist와 연결한다. 개별 소비자의 KYC, 계좌, 세무 상태와 직접 결합하지 않는다.

cash-out gate는 user-level 현금전환 가능 여부를 판단하는 설계 gate다. 본인확인, 본인 명의 계좌 확인, 현재 약관 수락, 세무 검토 상태, 최소 잔액, protected fund status와 연결한다. Stage 3-L에서는 모든 조건이 해소되어도 actualCashOutProcessingAllowed=false이며, status는 `design_gate_clear_but_actual_cash_out_disabled`로 끝난다.

---

## 4. 민감정보 분리 원칙

소비 의향 정보는 일반 프로필 영역으로 유지한다. cash-out 시점의 실명, 계좌 식별자, 본인확인 provider reference, 세무 식별 정보는 별도 저장 영역과 권한 경계가 필요하다.

일반 marker, public route, client payload, diagnostics, audit log에는 민감 원문을 노출하지 않는다. IP와 user agent도 원문 저장을 전제로 하지 않고 hash 또는 digest 중심으로 설계한다. 원문 저장 필요 여부는 외부 법무/보안 검토와 별도 Stage에서 결정한다.

---

## 5. proposed tables

### A. terms_documents

목적: 약관/정책 문서의 종류와 버전 관리.

설계 필드:
- id
- document_type
- version
- title
- effective_at
- retired_at
- is_current
- content_hash
- external_review_status
- created_at

document_type 후보:
- service_terms
- privacy_policy
- point_terms
- cash_out_terms
- marketing_info_consent
- partner_terms
- advertiser_terms

### B. user_terms_acceptance_events

목적: 사용자의 약관 수락, 재수락, 철회 이벤트 기록.

설계 필드:
- id
- user_id
- document_id
- event_type
- accepted_at
- revoked_at
- acceptance_channel
- ip_hash
- user_agent_hash
- source_digest
- idempotency_key
- created_at

event_type 후보:
- accepted
- reaccepted
- revoked
- system_migration_record

IP 원문, user agent 원문 저장을 전제로 하지 않는다. 원문 보관이 필요하면 외부 법무/보안 검토 후 별도 Stage에서 결정한다.

### C. marketing_consent_events

목적: 광고성 정보 수신 동의 및 철회 이력 관리.

설계 필드:
- id
- user_id
- consent_scope
- event_type
- terms_document_id
- occurred_at
- source_channel
- source_digest
- idempotency_key
- created_at

consent_scope 후보:
- app_push
- email
- sms
- kakao_notification
- in_app_ad_feed

event_type 후보:
- opt_in
- opt_out
- withdrawn
- reconfirmed

광고성 정보 수신 동의 철회는 알림/메시지/광고 수신 판단과 연결한다. cash-out 자체 차단 조건과 혼동하지 않는다.

### D. identity_verification_sessions

목적: 본인확인/KYC 진행 상태 기록.

설계 필드:
- id
- user_id
- provider
- provider_session_ref_digest
- status
- verified_at
- expires_at
- failure_reason_code
- manual_review_reason_code
- source_digest
- idempotency_key
- created_at
- updated_at

주민등록번호, 신분증 이미지, provider raw id, provider raw response 저장은 Stage 3-L 설계 범위가 아니다. provider raw response는 일반 DB, 로그, marker에서 금지한다. 실제 provider 연동은 이번 Stage 범위가 아니다.

### E. bank_account_verification_sessions

목적: 현금전환용 본인 명의 계좌 확인 상태 기록.

설계 필드:
- id
- user_id
- bank_code
- account_ref_digest
- account_last4_optional
- account_holder_match_status
- status
- verified_at
- expires_at
- failure_reason_code
- manual_review_reason_code
- source_digest
- idempotency_key
- created_at
- updated_at

계좌번호 원문, 예금주명 원문, 은행 API raw response는 일반 DB, 로그, marker에 노출하지 않는다. 실제 계좌 API 연동은 이번 Stage 범위가 아니다.

### F. tax_profile_review_snapshots

목적: 현금전환 전 세무 처리 검토 상태의 스냅샷 관리.

설계 필드:
- id
- user_id
- status
- review_basis_version
- external_review_ref
- required_data_missing_codes
- manual_review_required
- reviewed_at
- reviewer_actor_type
- source_digest
- idempotency_key
- created_at

원천징수율, 소득구분, 신고의무를 확정 결론처럼 하드코딩하지 않는다. 외부 법무/세무 검토 결과를 반영할 수 있는 확장 지점만 설계한다.

### G. cash_out_gate_review_snapshots

목적: 특정 시점의 cash-out gate 판단 결과를 감사 가능하게 기록할 수 있는 구조 설계.

설계 필드:
- id
- user_id
- point_balance_won_snapshot
- minimum_cash_out_won
- identity_verification_status
- bank_account_verification_status
- required_terms_status
- tax_profile_status
- protected_fund_status
- platform_reward_open_status
- gate_status
- blocker_codes
- evaluated_at
- policy_version
- source_digest
- idempotency_key
- created_at

Stage 3-L에서는 snapshot INSERT를 구현하지 않는다. 실제 cash-out request 생성도 구현하지 않는다. gate_status는 실제 지급 허용이 아니라 design-only 판단값이다.

### H. kyc_tax_terms_audit_logs

목적: 향후 민감 프로세스 변경 이력과 운영자 수동 검토 이력 감사 구조 설계.

설계 필드:
- id
- actor_user_id
- target_user_id
- action_type
- target_table
- target_record_ref
- reason_code
- source_digest
- created_at

민감 원문 데이터는 audit log에 남기지 않는다. 운영자 사유 기록은 reason_code 중심으로 설계한다.

---

## 6. proposed enums

identity verification status:
- `not_started`
- `pending_verification`
- `verified`
- `failed`
- `expired`
- `manual_review_required`
- `revoked`

bank account verification status:
- `not_registered`
- `pending_verification`
- `verified`
- `failed`
- `expired`
- `manual_review_required`
- `revoked`

tax profile status:
- `not_collected`
- `collection_required_before_cash_out`
- `pending_review`
- `ready_for_manual_processing`
- `external_review_required`
- `blocked_missing_required_data`
- `blocked_policy_unresolved`

terms acceptance status:
- `missing_required_acceptance`
- `accepted_current_versions`
- `accepted_legacy_versions_reacceptance_required`
- `revoked_or_withdrawn`
- `version_unknown_blocked`

marketing consent status:
- `not_asked`
- `opt_in_active`
- `opt_out_active`
- `withdrawn`
- `version_mismatch_reconfirm_required`

cash-out gate design status:
- `blocked_reward_open_disabled`
- `blocked_balance_below_minimum`
- `blocked_missing_identity_verification`
- `blocked_missing_bank_account_verification`
- `blocked_missing_required_terms`
- `blocked_terms_reacceptance_required`
- `blocked_tax_profile_incomplete`
- `blocked_tax_external_review_required`
- `blocked_protected_fund_unknown`
- `blocked_protected_fund_deficit`
- `manual_review_required`
- `design_gate_clear_but_actual_cash_out_disabled`

`eligible`, `cash_out_allowed`, `ready_to_pay`처럼 실제 현금전환 허용으로 오해될 수 있는 status는 사용하지 않는다.

---

## 7. proposed RLS 방향

- terms_documents: public client 직접 노출은 최소화하고, 필요한 current document DTO만 별도 read path로 제공한다.
- user_terms_acceptance_events: 본인 read 최소화, write는 approved server path만 허용한다.
- marketing_consent_events: 본인 consent status 조회는 요약 DTO로 제한하고, event append는 server path만 허용한다.
- identity_verification_sessions: consumer direct select 차단 또는 masked status DTO만 허용한다.
- bank_account_verification_sessions: consumer direct raw row 접근 차단, masked account_last4_optional과 status DTO만 허용한다.
- tax_profile_review_snapshots: admin/approved server read 중심, consumer direct 접근 차단.
- cash_out_gate_review_snapshots: admin/approved server read 중심, consumer-facing status는 별도 요약으로 제한.
- audit logs: admin read-only, append-only, update/delete 금지.

---

## 8. proposed SECURITY DEFINER write path 방향

향후 write path는 client direct mutation이 아니라 server action, route handler, approved backend job, SECURITY DEFINER RPC 중 하나로 제한한다. 모든 write는 idempotency_key, source_digest, actor context, reason_code를 요구한다.

SECURITY DEFINER는 RLS 우회를 의미하므로 최소 권한, 고정 search_path, parameter validation, append-only insert, audit log append를 같이 검토해야 한다.

---

## 9. proposed audit / idempotency / source_digest 방향

source_digest는 외부 provider 결과 원문이 아니라 provider/session/status/timestamp/policy version을 canonical payload로 정규화한 digest다. idempotency_key는 동일 약관 수락, 동일 consent event, 동일 KYC callback, 동일 계좌 확인 callback, 동일 tax review snapshot, 동일 gate evaluation replay를 중복 반영하지 않도록 한다.

audit log는 민감 원문을 저장하지 않고 actor, target, action_type, reason_code, target_record_ref, source_digest만 기록한다.

---

## 10. 약관 버전 관리 구조

terms_documents는 문서 종류와 버전의 SSOT다. is_current는 같은 document_type에서 하나만 true가 되도록 후속 migration에서 partial unique 또는 equivalent guard를 검토한다.

user_terms_acceptance_events는 accepted/reaccepted/revoked/system_migration_record 이벤트를 append-only로 저장한다. current terms 필요 여부는 document_type별 current version과 사용자의 latest accepted document를 비교해 계산한다.

---

## 11. 광고성 정보 수신 동의 및 철회 구조

marketing_consent_events는 scope별 opt_in, opt_out, withdrawn, reconfirmed 이벤트를 append-only로 기록한다. withdrawn 또는 opt_out_active는 알림/메시지/광고성 수신 판단과 연결한다.

광고성 정보 수신 동의 철회는 cash-out gate를 곧바로 차단하는 조건으로 설계하지 않는다. 다만 관련 약관 문서 버전 mismatch가 있으면 reconfirm 대상이 될 수 있다.

---

## 12. 세무 검토 대비 구조

tax_profile_review_snapshots는 세법상 확정 판단이 아니라 플랫폼 내부 검토 상태다. `external_review_required`와 `blocked_policy_unresolved`는 외부 법무/세무 검토 결과가 필요한 상태이며, `ready_for_manual_processing`도 실제 세무 신고 또는 원천징수 계산 완료를 의미하지 않는다.

특정 원천징수율, 소득구분, 지급명세서 제출 의무를 Stage 3-L에서 하드코딩하지 않는다.

---

## 13. 본인확인/KYC 구조

identity_verification_sessions는 provider session의 digest와 상태만 추적한다. provider raw id, provider raw response, 신분증 이미지, 주민등록번호 저장은 설계하지 않는다.

`verified`는 provider 또는 manual review가 완료되었다는 내부 상태 후보일 뿐이며, 실제 provider 연동은 후속 Stage에서 별도 승인 후 설계/구현한다.

---

## 14. 본인 명의 계좌 확인 구조

bank_account_verification_sessions는 계좌 확인 session과 digest 중심 상태를 기록한다. account_ref_digest와 account_last4_optional만 설계 후보로 두며, 계좌번호 원문과 예금주명 원문은 일반 DB/로그/marker에 기록하지 않는다.

`verified`는 본인 명의 계좌 확인 상태 후보일 뿐이며, 실제 은행 API 연동 또는 이체는 Stage 3-L 범위가 아니다.

---

## 15. cash-out gate evaluator 설계

입력:
- rewardOpenFlag
- killSwitchOn
- pointBalanceWon
- minimumCashOutWon
- identityVerificationStatus
- bankAccountVerificationStatus
- requiredTermsAcceptanceStatus
- taxProfileStatus
- protectedFundStatus
- manualReviewRequired

판정 순서:
1. rewardOpenFlag=false 또는 killSwitchOn=true이면 `blocked_reward_open_disabled`
2. pointBalanceWon < minimumCashOutWon이면 `blocked_balance_below_minimum`
3. identityVerificationStatus !== verified이면 `blocked_missing_identity_verification`
4. bankAccountVerificationStatus !== verified이면 `blocked_missing_bank_account_verification`
5. requiredTermsAcceptanceStatus === missing_required_acceptance이면 `blocked_missing_required_terms`
6. requiredTermsAcceptanceStatus === accepted_legacy_versions_reacceptance_required이면 `blocked_terms_reacceptance_required`
7. taxProfileStatus가 not_collected 또는 blocked_missing_required_data이면 `blocked_tax_profile_incomplete`
8. taxProfileStatus가 external_review_required 또는 blocked_policy_unresolved이면 `blocked_tax_external_review_required`
9. protectedFundStatus === unknown_blocked이면 `blocked_protected_fund_unknown`
10. protectedFundStatus === deficit_blocked이면 `blocked_protected_fund_deficit`
11. manualReviewRequired=true이면 `manual_review_required`
12. 모두 해소되어도 `design_gate_clear_but_actual_cash_out_disabled`

반환값은 machine-readable status, blockerCodes, actualCashOutProcessingAllowed=false를 포함한다.

---

## 16. Stage 3-M 이후로 넘길 항목

- Stage 3-L-R 설계 검토 보류 해소
- Stage 3-M KYC/Tax/Terms DB Migration Design Review
- 실제 migration SQL 작성 여부 검토
- RLS/SECURITY DEFINER 상세 검토
- 외부 법무/세무/보안 검토 결과 반영
- provider integration design
- bank API integration design
- cash-out request implementation design

---

## 17. 절대 금지 사항

- DB migration 추가
- Supabase db push/reset/repair
- Production mutation
- actual personal data collection
- identity/PASS/KYC provider integration
- bank API integration
- tax filing implementation
- withholding calculation implementation
- cash-out actual processing
- reward open flag true
- kill switch false
- legal conclusion declared=true
- public/consumer route에 Stage 3-L 내부 marker 노출
- service role key client 노출
- OAuth secret/code/token 기록
- quiz_answer 또는 정답 추론 필드 노출
- RLS 완화

---

## 18. 검증 marker 목록

Admin-only marker:
- stage3LKycTaxTermsDataModelDesigned=true
- stage3LReadOnlyDesignOnly=true
- stage3LDbMigrationImplemented=false
- stage3LSupabaseDbPushExecuted=false
- stage3LActualPersonalDataCollectionImplemented=false
- stage3LIdentityProviderIntegrated=false
- stage3LBankApiIntegrated=false
- stage3LTaxFilingImplemented=false
- stage3LWithholdingCalculationImplemented=false
- stage3LCashOutActualProcessing=false
- stage3LProductionMutation=false
- stage3LRewardOpenGateSeparated=true
- stage3LCashOutGateUserLevelDesigned=true
- stage3LTermsVersioningDesigned=true
- stage3LMarketingConsentWithdrawalDesigned=true
- stage3LSensitiveDataBoundaryDesigned=true
- stage3LLegalConclusionDeclared=false
- stage3LExternalLegalTaxReviewStillRequired=true
- stage3LPublicMarkerExposure=false
- stage3LGateActualCashOutAllowed=false

---

## 19. 완료보고 기준

- Stage 3-L SSOT 파일이 존재한다.
- proposed data model 문서가 존재한다.
- 순수 cash-out gate evaluator가 존재한다.
- `/admin/kyc-tax-terms-preflight`, `/admin/compliance-preflight`, `/admin/diagnostics`에 admin-only marker가 노출된다.
- `verify:stage3l-kyc-tax-terms-data-model-design`이 PASS한다.
- public/consumer route에는 Stage 3-L marker가 노출되지 않는다.
- no DB migration, no Supabase db push, no Production mutation 상태를 유지한다.
- actualCashOutProcessingAllowed가 true 값을 반환하지 않는다.
