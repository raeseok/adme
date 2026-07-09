# AdMe Stage 3-M KYC / Tax / Terms DB Migration Design Review

작성일: 2026-07-10  
상태: DB migration design review only / no implementation

경고:
- DESIGN REVIEW ONLY
- NO DB MIGRATION IMPLEMENTED
- NO SUPABASE DB PUSH
- NO PERSONAL DATA COLLECTION
- NO BANK API OR IDENTITY PROVIDER INTEGRATION
- NO TAX FILING OR WITHHOLDING IMPLEMENTATION
- NO ACTUAL CASH-OUT PROCESSING
- LEGAL CONCLUSION NOT DECLARED

관련:
- [stage-3-l-kyc-tax-terms-data-model-design.md](./stage-3-l-kyc-tax-terms-data-model-design.md)
- [stage-3-k-protected-fund-reconciliation-design.md](./stage-3-k-protected-fund-reconciliation-design.md)
- [stage-3-j-r-prepaid-threshold-db-migration-design-review.md](./stage-3-j-r-prepaid-threshold-db-migration-design-review.md)
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 1. 목적

Stage 3-M은 Stage 3-L에서 설계한 KYC, 본인 명의 계좌 검증, 세무 프로필, 약관 버전, 마케팅 동의, user-level cash-out gate를 실제 Supabase migration으로 구현하기 전에 PostgreSQL/Supabase 구조와 보안 경계를 검토하는 단계다.

이번 단계의 산출물은 `stage3MDesignReviewComplete=true`, `designReviewOnly=true`, `migrationImplemented=false`, `migrationFileCreated=false`, `supabaseDbPushExecuted=false`, `actualPersonalDataCollectionImplemented=false`, `identityProviderIntegrated=false`, `bankApiIntegrated=false`, `taxFilingImplemented=false`, `withholdingCalculationImplemented=false`, `actualCashOutProcessingAllowed=false`, `productionMutation=false`, `legalConclusionDeclared=false`, `externalLegalTaxReviewStillRequired=true` 상태를 고정한다.

---

## 2. 범위

- proposed DB object inventory 설계 검토
- 개인정보 및 민감정보 저장 경계 검토
- Stage 3-L status taxonomy 저장 방식 검토
- 약관 버전 및 acceptance 이력 설계 검토
- 마케팅 동의 및 철회 이력 설계 검토
- identity verification, bank verification, tax profile 구조 검토
- `cash_redemption_requests` 연계 방식 검토
- RLS matrix, SECURITY DEFINER write path 후보, audit append-only 원칙 검토
- migration dependency/order와 rollback 고려사항 문서화
- 관리자 전용 preflight marker 및 fail-closed 검증 스크립트 추가

---

## 3. 비범위

- SQL migration 파일 생성
- `supabase/migrations` 변경
- Supabase db push/reset/repair
- dev/prod DB schema 변경
- 실제 개인정보 수집 UI 또는 저장
- 실제 이름, 주민등록번호, 생년월일, 계좌번호 입력 UI
- PASS/KYC provider, bank API, provider SDK 연동
- 세무 신고, 원천징수 계산
- `cash_redemption_requests` 실제 INSERT/UPDATE/DELETE
- `point_ledger` cash-out 기록 또는 `users.balance` 변경
- 계좌 이체, actual cash-out processing, Production mutation

---

## 4. 선행 Stage 3-L 설계 요약

Stage 3-L은 KYC/Tax/Terms data model designed=true 상태로 완료 후보가 되었으며, actual personal data collection, bank API integration, tax filing, withholding calculation, cash-out actual processing은 모두 false다.

Stage 3-L에서 확정한 enum taxonomy는 Stage 3-M에서 중복 정의하지 않고 그대로 기준으로 사용한다. reward open gate와 user-level cash-out gate는 분리되어 있으며, cash-out gate가 설계상 clear여도 `design_gate_clear_but_actual_cash_out_disabled`로 끝난다.

---

## 5. proposed DB object inventory

검토 대상 논리 객체:
- `consumer_identity_verifications`
- `consumer_bank_account_verifications`
- `consumer_tax_profiles`
- `legal_document_versions`
- `consumer_legal_acceptances`
- `consumer_marketing_consents`
- `cash_redemption_requests` relation_or_extension
- `kyc_tax_terms_audit_events`
- `external_provider_reference_boundary`

각 객체는 SSOT에서 `purpose`, owner principal, sensitivity classification, proposed primary key, proposed foreign keys, cardinality, immutable fields, mutable fields, status field, status transition owner, retention/deletion consideration, RLS read/write policy proposal, server-only write requirement, audit requirement, raw sensitive data prohibition, implementation status=`design_review_only`를 가진다.

명칭은 Stage 3-L의 `terms_documents`, `user_terms_acceptance_events`, `marketing_consent_events`, `identity_verification_sessions`, `bank_account_verification_sessions`, `tax_profile_review_snapshots`, `cash_out_gate_review_snapshots`, `kyc_tax_terms_audit_logs`를 실제 migration 전 PostgreSQL 관점에서 재검토한 것이다. 최종 migration 전에는 기존 명칭과 새 명칭 중 하나로 정렬해야 하며, 이번 단계에서는 대안 명칭만 제시한다.

---

## 6. 개인정보 및 민감정보 경계

민감정보 분리 원칙:
- 일반 소비자 프로필과 KYC 데이터 분리
- 일반 소비자 프로필과 계좌 검증 데이터 분리
- 계좌번호 원문 저장 금지 또는 별도 vault/provider token 방식 우선
- 주민등록번호 전체 저장 금지
- provider raw response 저장 금지
- access token, refresh token, OAuth code 저장 금지
- 공개 가능한 상태값과 비공개 원문 데이터 분리
- 관리자 화면에서도 raw identity/bank data 미노출
- 광고주·파트너 접근 완전 차단
- 로그와 오류 메시지에 민감정보 기록 금지

계좌정보 저장 방식 비교:
- provider token/reference only: Stage 3-M 권장 기본안. AdMe DB에는 provider reference digest와 verification status만 둔다.
- encrypted minimal account identifier: key management, 접근 감사, 보존 정책, 외부 보안/법률 검토가 선행될 때만 조건부 fallback이다.
- separate vault or external provider custody: 원문 또는 복호화 가능한 계좌정보가 법적으로 필요하다는 결론이 있을 때만 검토한다.

이번 단계에서는 암호화 구현, vault 연결, provider 연동을 하지 않는다.

---

## 7. status 저장 방식 비교

Stage 3-L 기준 taxonomy:
- identity verification: `not_started`, `pending_verification`, `verified`, `failed`, `expired`, `manual_review_required`, `revoked`
- bank verification: `not_registered`, `pending_verification`, `verified`, `failed`, `expired`, `manual_review_required`, `revoked`
- tax profile: `not_collected`, `collection_required_before_cash_out`, `pending_review`, `ready_for_manual_processing`, `external_review_required`, `blocked_missing_required_data`, `blocked_policy_unresolved`
- terms acceptance: `missing_required_acceptance`, `accepted_current_versions`, `accepted_legacy_versions_reacceptance_required`, `revoked_or_withdrawn`, `version_unknown_blocked`
- marketing consent: `not_asked`, `opt_in_active`, `opt_out_active`, `withdrawn`, `version_mismatch_reconfirm_required`
- cash-out gate: `blocked_reward_open_disabled`, `blocked_balance_below_minimum`, `blocked_missing_identity_verification`, `blocked_missing_bank_account_verification`, `blocked_missing_required_terms`, `blocked_terms_reacceptance_required`, `blocked_tax_profile_incomplete`, `blocked_tax_external_review_required`, `blocked_protected_fund_unknown`, `blocked_protected_fund_deficit`, `manual_review_required`, `design_gate_clear_but_actual_cash_out_disabled`

PostgreSQL enum은 타입 안정성은 높지만 status 추가/rename/삭제 migration이 까다롭다. 법무·세무·provider 정책에 따라 상태가 바뀔 수 있는 초기 단계에는 변경 리스크가 크다.

`text + CHECK constraint`는 fail-closed 검증과 migration 유연성의 균형이 좋다. Stage 3-M 권장안은 core status column에 text + CHECK를 우선 적용하고, 상태 메타데이터가 필요해지면 lookup/projection table을 추가하는 방식이다.

lookup table은 display label, deprecation window, policy version, external review status 같은 메타데이터가 필요할 때 유용하다. 다만 런타임 status 변경을 admin-config처럼 다루면 보안 경계가 흐려질 수 있으므로, migration 전 명시 승인과 audit가 필요하다.

unknown 상태는 fail-closed로 처리한다.

---

## 8. 약관 버전 및 acceptance 이력

`legal_document_versions` 설계 필드:
- document type
- version
- effective_at
- published_at
- retired_at
- required 여부
- content hash 또는 immutable version identifier
- locale

`consumer_legal_acceptances` 설계 필드:
- acceptance timestamp
- accepted document version
- withdrawal/revocation timestamp
- acceptance source
- idempotency key
- source digest

IP/user agent는 개인정보 최소수집 원칙상 원문 저장을 기본값으로 두지 않는다. 필요 시 hash/digest 또는 미저장 방식부터 검토하고, 원문 보관은 외부 법무/보안 검토 후 별도 Stage에서만 가능하다.

약관 acceptance 레코드는 UPDATE 덮어쓰기가 아니라 append-only event 또는 이력 보존 구조를 우선 검토한다. 재동의 필요 여부는 문서 type/locale별 current required version과 사용자의 최신 accepted event를 비교해 판정한다. 과거 약관 원문과 content hash는 불변으로 보존한다.

---

## 9. 마케팅 동의·철회 이력

필수 약관과 선택 마케팅 동의는 분리한다. 마케팅 동의 이력은 `consumer_marketing_consents` 또는 `marketing_consent_events` 성격의 append-only event로 관리한다.

검토 항목:
- opt-in과 opt-out 이력 보존
- 철회 시점
- 동의 버전
- 동의 채널
- 현재 상태 projection과 원본 event 이력 분리
- 광고 수신 철회가 서비스 필수 약관 철회로 오인되지 않도록 분리
- 마케팅 동의가 현금전환 필수 조건이 되지 않도록 명시

---

## 10. identity verification 구조

`consumer_identity_verifications`는 KYC provider session의 원문이 아니라 provider reference digest, status, verified_at, expires_at, failure/manual review reason code, source_digest, idempotency_key를 보관하는 구조로 검토한다.

주민등록번호 전체, 신분증 이미지, provider raw id, provider raw response, access token, refresh token, OAuth code는 일반 DB/로그/marker/admin UI에 저장하지 않는다. consumer는 자신의 coarse status만 볼 수 있고, admin UI도 raw identity data를 보지 않는다.

---

## 11. bank verification 구조

`consumer_bank_account_verifications`는 현금전환용 본인 명의 계좌 확인 상태만 다룬다. 권장 저장 방식은 provider token/reference only다.

account last4 같은 최소 식별 정보도 외부 법무/보안 검토 전에는 선택 후보로만 둔다. 계좌번호 원문, 예금주명 원문, bank API raw response, provider access token/refresh token은 일반 DB/로그/marker/admin UI에 저장하지 않는다.

---

## 12. tax profile 구조

`consumer_tax_profiles`는 세무 신고나 원천징수 계산 구현이 아니라 cash-out 전 세무 검토 상태를 기록하는 metadata 구조다.

`external_review_required`, `blocked_policy_unresolved`는 외부 법무·세무 검토 필요 상태다. `ready_for_manual_processing`도 세무 신고 완료나 원천징수 계산 완료를 의미하지 않는다.

---

## 13. cash redemption request 연계

기존 `cash_redemption_requests`가 있을 경우 Stage 3-M은 migration 변경 없이 연계 방식만 검토한다.

검토 항목:
- identity verification snapshot/reference
- bank verification snapshot/reference
- tax profile snapshot/reference
- accepted terms version snapshot/reference
- protected fund gate result
- threshold gate result
- manual review reason
- immutable request-time decision evidence
- idempotency key
- request status transition audit
- cash-out actual processing disabled marker

금지 유지:
- 현금전환 신청 구현 금지
- 실제 point_ledger cash_out 기록 금지
- 실제 users balance 변경 금지
- 실제 계좌 이체 구현 금지
- 기존 `cash_redemption_requests` migration 변경 금지

---

## 14. RLS matrix

역할별 접근 원칙:
- anonymous: 전면 차단
- consumer owner: 자신의 공개 가능한 status와 제한된 metadata만 조회
- advertiser: 전면 차단
- partner: 전면 차단
- admin UI: 최소 상태 정보만 조회, raw data 금지
- trusted server/RPC: 필요한 최소 작업만 허용

직접 client INSERT/UPDATE/DELETE는 금지한다. service role은 클라이언트에서 사용하지 않는다.

NON-EXECUTABLE DESIGN EXAMPLE:

```sql
-- NON-EXECUTABLE DESIGN EXAMPLE ONLY
-- create policy proposed_consumer_status_read
-- on proposed_table
-- for select
-- using (auth.uid() = consumer_user_id);
-- direct client writes remain blocked.
```

---

## 15. SECURITY DEFINER write path

후보 함수:
- `record_identity_verification_result`: trusted provider callback/admin backend만 호출. status allowlist, source_digest idempotency, audit event 필수. search_path 고정 필요. raw provider payload 입력 금지. production implementation status=false.
- `record_bank_verification_result`: trusted bank callback/admin backend만 호출. provider reference digest 중심. raw account number 입력 금지. idempotency와 audit 필수. production implementation status=false.
- `record_tax_profile_review`: trusted compliance backend/admin만 호출. policy version, reason code, external review blocker 기록. production implementation status=false.
- `accept_legal_document_version`: authenticated consumer intent를 server action/RPC가 검증 후 append. UPDATE overwrite 금지. production implementation status=false.
- `withdraw_marketing_consent`: optional consent withdrawal event append. cash-out 필수 조건과 분리. production implementation status=false.
- `evaluate_cash_out_preconditions`: read/evaluate only. 실제 request, ledger, balance, transfer mutation 없음. production implementation status=false.
- `create_cash_redemption_request`: 향후 후보. Stage 3-M에서는 구현하지 않는다. 실제 승인 전 production implementation status=false.

SECURITY DEFINER가 필요한 함수는 search_path를 고정하고, public/anon/authenticated execute revoke를 검토해야 한다.

---

## 16. audit 및 append-only 원칙

감사 이벤트는 다음을 기록한다:
- 누가
- 언제
- 어떤 상태를
- 어떤 이전 상태에서
- 어떤 새 상태로
- 어떤 정책 버전 또는 provider reference digest를 근거로
- 어떤 reason code로 변경했는지

감사 로그에는 raw identity, raw bank account, token, provider raw response, full email이 포함되지 않아야 한다. 감사 이벤트는 append-only를 원칙으로 하고, UPDATE/DELETE 금지 정책을 후속 migration에서 검토한다.

---

## 17. idempotency 전략

각 write path는 idempotency key와 source_digest를 가진다. provider callback, 약관 수락, 마케팅 동의 철회, tax review, cash-out gate evaluation replay, 미래 cash redemption request 생성은 중복 반영을 막아야 한다.

source_digest는 raw provider payload가 아니라 provider/session/status/timestamp/policy version을 정규화한 canonical payload digest다.

---

## 18. 보존·삭제·익명화 미확정 사항

확정 법률 결론을 선언하지 않는다. 다음 항목은 미확정이다:
- 계정 탈퇴 시 일반 프로필 삭제와 금융·세무·정산 기록 보존의 충돌: policy_unresolved
- 법적 보존기간: external_legal_review_required
- soft delete와 anonymization: implementation_blocked_until_policy_resolved
- provider reference 폐기: external_legal_review_required
- 계좌 검증 만료: policy_unresolved
- 신원 검증 철회/revoked: policy_unresolved
- 약관 acceptance 이력 보존: external_legal_review_required
- 마케팅 동의 철회 이력 보존: external_legal_review_required
- 운영 로그 보존 최소화: policy_unresolved

---

## 19. migration dependency/order

향후 실제 migration 작성 시 권장 순서:
1. lookup/status constraints 또는 enum 전략
2. legal document versions
3. consumer legal acceptances
4. marketing consent history
5. identity verification metadata
6. bank verification metadata
7. tax profile metadata
8. audit events
9. cash redemption request relation/constraint
10. RLS
11. server-only RPC
12. grants/revokes
13. verification queries

실제 migration timestamp 파일은 생성하지 않는다.

---

## 20. rollback 고려사항

실제 migration 단계에서는 object 생성 순서와 reverse dependency를 별도 rollback plan으로 검토해야 한다. append-only event와 audit table은 데이터 보존 정책 때문에 단순 DROP/DELETE rollback이 부적절할 수 있다.

Stage 3-M에서는 rollback SQL을 만들지 않는다. rollback 고려사항은 design review note로만 남긴다.

---

## 21. 외부 법률·세무 검토 필요 사항

외부 검토 필요:
- KYC/본인확인 데이터 최소 보관 범위
- 계좌 검증 reference 또는 vault 방식의 법적 적정성
- 세무 프로필 필수 수집 항목
- 원천징수, 지급명세서, 신고 의무
- 약관 acceptance와 revocation 이력 보존기간
- 마케팅 동의 철회 이력 보존기간
- 계정 탈퇴와 금융/세무/정산 기록 보존 충돌

---

## 22. 구현 전 승인 gate

실제 migration implementation은 별도 명시 승인 이후에만 가능하다. Stage 3-M 완료가 Stage 3-M-Implementation을 자동 확정하지 않는다.

필수 승인 전제:
- status 저장 방식 확정
- 계좌정보 보관 방식 확정
- retention/deletion policy 확정
- RLS/RPC/grants/revokes 설계 승인
- 외부 법률·세무 검토 항목 정리
- Supabase dev/prod project-ref 분리 상태 확인

---

## 23. 명시적 금지 사항

- SQL migration 파일 생성 금지
- Supabase db push/reset/repair 금지
- 개인정보 실제 수집 금지
- 계좌번호 입력·저장 금지
- identity provider 또는 bank API 연동 금지
- provider SDK 설치 금지
- provider raw response 저장 금지
- OAuth token/code 저장 금지
- 세무 신고 또는 원천징수 계산 금지
- actual cash-out processing 금지
- `point_ledger` cash-out mutation 금지
- `users.balance` mutation 금지
- `cash_redemption_requests` actual mutation 금지
- RLS 완화 금지
- advertiser/partner에게 consumer identity 상태 노출 금지
- raw bank/identity data 관리자 화면 노출 금지
- legal conclusion 선언 금지
- external legal/tax review 필요 상태 해제 금지
- `normal`/`warning`을 protected fund machine-readable status로 재도입 금지

---

## 24. 완료 판정 기준

- Stage 3-M SSOT 설계 파일이 존재한다.
- Stage 3-M 설계 검토 문서가 존재한다.
- 신규 관리자 페이지 `/admin/kyc-tax-terms-db-migration-review`가 관리자 marker를 표시한다.
- `/admin/compliance-preflight`, `/admin/diagnostics`, `/admin/kyc-tax-terms-preflight`에 Stage 3-M 요약 marker가 추가된다.
- `verify:stage3m-kyc-tax-terms-db-migration-design-review`가 PASS한다.
- Stage 3-L enum taxonomy가 훼손되지 않는다.
- protected fund 6개 taxonomy가 훼손되지 않는다.
- `supabase/migrations` 변경이 없다.
- public/consumer route에 Stage 3-M marker가 노출되지 않는다.
- actual cash-out processing, DB migration, Supabase db push, Production mutation이 모두 false 상태다.
