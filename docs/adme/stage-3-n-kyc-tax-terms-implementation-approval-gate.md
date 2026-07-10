# AdMe Stage 3-N KYC / Tax / Terms Implementation Approval Gate

작성일: 2026-07-10  
상태: implementation approval gate / read-only / blocked

경고:
- READ-ONLY APPROVAL GATE
- NO SQL MIGRATION IMPLEMENTED
- NO DB MUTATION
- NO PERSONAL DATA COLLECTION
- NO PROVIDER INTEGRATION
- NO TAX FILING OR WITHHOLDING IMPLEMENTATION
- NO ACTUAL CASH-OUT PROCESSING
- NO LEGAL CONCLUSION DECLARED

관련:
- [stage-3-m-kyc-tax-terms-db-migration-design-review.md](./stage-3-m-kyc-tax-terms-db-migration-design-review.md)
- [stage-3-l-kyc-tax-terms-data-model-design.md](./stage-3-l-kyc-tax-terms-data-model-design.md)
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 1. Stage 목적

Stage 3-N은 Stage 3-M에서 완료된 KYC/Tax/Terms DB Migration Design Review를 실제 SQL migration 구현으로 전환하기 전에 법률, 세무, 개인정보, 보안, 운영 승인 조건을 read-only 방식으로 고정한다.

이번 단계는 implementation approval gate이며 구현이 아니다. Stage 3-N 자체 완료와 migration implementation approval은 별개다. Stage 3-N이 완료되어도 `overallApprovalStatus=blocked`가 정상 상태다.

유지 상태:
- `stage3NApprovalGateComplete=true`
- `readOnlyApprovalGate=true`
- `migrationImplemented=false`
- `migrationFileCreated=false`
- `supabaseDbPushExecuted=false`
- `actualPersonalDataCollectionImplemented=false`
- `identityProviderIntegrated=false`
- `bankApiIntegrated=false`
- `taxFilingImplemented=false`
- `withholdingCalculationImplemented=false`
- `actualCashOutProcessingAllowed=false`
- `productionMutation=false`
- `legalConclusionDeclared=false`

---

## 2. 판정 taxonomy

`overallApprovalStatus`:
- `blocked`
- `partially_approved`
- `approved`

`itemDecision`:
- `blocker`
- `required_before_dev_migration`
- `deferred_until_provider_selection`
- `deferred_until_production`
- `approved_design_principle`
- `rejected`
- `not_applicable`

`evidenceStatus`:
- `confirmed`
- `operator_attestation_required`
- `external_legal_review_required`
- `external_tax_review_required`
- `external_privacy_review_required`
- `external_security_review_required`
- `provider_confirmation_required`
- `unresolved`

`normal`, `warning`, `ok`, `caution` 같은 축약 상태는 machine-readable 판정값으로 사용하지 않는다.

---

## 3. 승인 원칙

- external review가 필요한 항목은 코드 작성자의 추정으로 approved 처리할 수 없다.
- 사업 오너의 명시 승인이 없는 항목은 `implementationApprovalGranted=true` 또는 유사 approval flag로 변경할 수 없다.
- dev-only migration 승인과 Production migration 승인을 분리한다.
- schema object 승인과 실제 개인정보 수집 승인을 분리한다.
- provider-neutral schema 승인과 특정 provider integration 승인을 분리한다.
- tax data schema 승인과 세금 계산·신고 로직 승인을 분리한다.
- legal document version schema 승인과 약관 문안의 법적 적정성 승인을 분리한다.
- cash redemption request schema 승인과 실제 송금·cash-out 처리를 분리한다.

---

## 4. 전체 판정

현재 판정:
- `overallApprovalStatus=blocked`
- `devMigrationApprovalGranted=false`
- `productionMigrationApprovalGranted=false`
- `personalDataCollectionApprovalGranted=false`
- `providerIntegrationApprovalGranted=false`
- `taxImplementationApprovalGranted=false`
- `cashOutExecutionApprovalGranted=false`

blocked 사유는 외부 법률·세무·개인정보·보안 검토, provider confirmation, 사업 오너 dev migration scope 승인, retention/deletion policy 확정이 완료되지 않았기 때문이다.

---

## 5. 핵심 14개 approval gate

### STAGE3N-001 개인정보 처리 목적 및 최소 수집 항목

- itemDecision: `blocker`
- evidenceStatus: `external_privacy_review_required`
- blocker: true
- 현재 결론: cash-out에 실제로 필요한 식별정보와 provider-only 보관 항목은 외부 개인정보/법률 검토 전 승인 불가.
- 다음 조치: 개인정보 처리 목적, 최소 수집 항목, 저장 금지 항목 검토.
- 필요 주체: external privacy counsel, legal counsel, business owner.

### STAGE3N-002 본인확인 provider 선정 전 저장 가능한 metadata 범위

- itemDecision: `deferred_until_provider_selection`
- evidenceStatus: `provider_confirmation_required`
- blocker: true
- 현재 결론: provider name, transaction/reference id, method, verified_at, result code, failure category, subject match 여부는 provider contract 확인 전 후보값이다.
- 다음 조치: provider별 metadata contract와 raw payload 금지 조건 확인.

### STAGE3N-003 계좌정보 provider token/reference 방식 현실성

- itemDecision: `deferred_until_provider_selection`
- evidenceStatus: `provider_confirmation_required`
- blocker: true
- 현재 결론: token/reference 장기 재사용, payout 재검증, bank name/last4 저장 필요성은 provider 확인 전 승인 불가.
- 다음 조치: bank provider token lifecycle과 provider 교체 가능성 확인.

### STAGE3N-004 계좌번호 일부 마스킹 값 저장 필요 여부

- itemDecision: `blocker`
- evidenceStatus: `external_privacy_review_required`
- blocker: true
- 현재 결론: last 4 digits 또는 hash도 개인금융정보 최소화 원칙상 외부 개인정보 검토 필요.
- 다음 조치: CS 필요성과 미저장 대안 비교.

### STAGE3N-005 신원·계좌 verification 결과의 보존기간

- itemDecision: `blocker`
- evidenceStatus: `external_legal_review_required`
- blocker: true
- 현재 결론: 성공/실패 결과, provider reference, audit evidence, cash redemption 완료 후 보존기간 미확정.
- 다음 조치: 보존기간 법률 검토.

### STAGE3N-006 계정 탈퇴 시 삭제·익명화·법정 보존 구분

- itemDecision: `blocker`
- evidenceStatus: `external_legal_review_required`
- blocker: true
- 현재 결론: 즉시 삭제, 지연 삭제, 익명화, 법정 보존, fraud/audit hold, legal hold 구분 미확정.
- 다음 조치: 탈퇴 처리와 금융·세무·감사 보존 충돌 검토.

### STAGE3N-007 현금전환 관련 세무소득 분류

- itemDecision: `blocker`
- evidenceStatus: `external_tax_review_required`
- blocker: true
- 현재 결론: 기타소득, 사업소득, 비과세 가능성 및 광고 참여 보상의 법적 성격 미확정.
- 다음 조치: 세무사 검토.

### STAGE3N-008 원천징수 의무 및 세율·기준금액

- itemDecision: `blocker`
- evidenceStatus: `external_tax_review_required`
- blocker: true
- 현재 결론: 원천징수 대상, 필요경비, 건별/연간 기준, 주민세, 지급명세서 제출 여부 미확정.
- 다음 조치: 원천징수 및 신고 기준 외부 세무 검토.

### STAGE3N-009 세무 profile 저장 필드 범위

- itemDecision: `blocker`
- evidenceStatus: `external_tax_review_required`
- blocker: true
- 현재 결론: tax residency, income classification, withholding eligibility, exemption status, provider reference 범위 미확정. raw 주민등록번호 저장 금지.
- 다음 조치: tax metadata 필수/선택/금지 field list 확정.

### STAGE3N-010 약관·전자적 동의 증거로 IP/user-agent 저장 필요성

- itemDecision: `blocker`
- evidenceStatus: `external_legal_review_required`
- blocker: true
- 현재 결론: document version, accepted_at, user id, request id, IP, user-agent, locale, device metadata, source channel 중 원문 저장 범위 미확정.
- 다음 조치: 전자적 동의 증거 항목별 원문/hash/미저장 기준 검토.

### STAGE3N-011 cash redemption 신청 시 immutable snapshot 범위

- itemDecision: `required_before_dev_migration`
- evidenceStatus: `unresolved`
- blocker: true
- 현재 결론: identity/bank/tax/terms/protected fund/threshold/balance/requested amount/evaluator version snapshot 범위 미확정.
- 다음 조치: request-time evidence contract 확정.

### STAGE3N-012 admin manual review 권한과 이중 승인 필요 여부

- itemDecision: `required_before_dev_migration`
- evidenceStatus: `operator_attestation_required`
- blocker: true
- 현재 결론: reviewer/approver role, maker-checker, self approval ban, high-value approval threshold 미확정.
- 다음 조치: admin role matrix와 audit requirement 운영 승인.

### STAGE3N-013 실제 migration 구현의 dev-only 범위

- itemDecision: `blocker`
- evidenceStatus: `operator_attestation_required`
- blocker: true
- 현재 결론: dev-only migration scope 미승인. 빈 테이블/constraint/RLS/RPC stub/seed 금지/destructive 금지/rollback 기준 미확정.
- 다음 조치: 사업 오너와 engineering owner의 명시 승인.

### STAGE3N-014 Production migration 별도 단계 분리

- itemDecision: `approved_design_principle`
- evidenceStatus: `confirmed`
- blocker: false
- 현재 결론: Production migration은 반드시 별도 단계로 분리한다.
- 다음 조치: Production migration 작업지시는 별도 명시 승인 후에만 작성.

---

## 6. 추가 승인 항목

추가 gate:
- status taxonomy 최종 승인
- text + CHECK constraint 유지 여부
- lookup table 필요 여부
- current-state projection 필요 여부
- append-only history의 UPDATE/DELETE 금지
- source_digest 생성 기준
- idempotency key scope
- duplicate provider callback 처리
- replay attack 방지
- provider callback signature 검증 요구
- secrets 저장 위치
- failure reason code의 개인정보 포함 금지
- admin 화면 raw payload 비노출
- log/telemetry 민감정보 redaction
- backup에 포함되는 민감정보 범위
- export/download 권한
- incident response 및 breach 대응
- 데이터 처리 위탁사 목록 관리
- 개인정보 국외 이전 가능성
- provider subprocessor 확인
- 테스트 데이터에 실제 개인정보 사용 금지
- 개발·운영 Supabase 분리 유지

SSOT에서는 `STAGE3N-015`부터 `STAGE3N-019`까지로 묶어 관리한다.

---

## 7. Stage 3-M 설계 입력

Stage 3-N은 Stage 3-M의 다음 설계를 approval gate로 변환한다.

- proposed DB object inventory
- RLS matrix
- SECURITY DEFINER write path candidates
- source_digest와 idempotency
- append-only audit
- legal document immutable versioning
- marketing consent append-only history
- cash redemption request-time snapshot/reference
- provider token/reference only 원칙
- retention/deletion unresolved marker

Stage 3-M 설계 완료는 Stage 3-N approval granted를 의미하지 않는다.

---

## 8. 관리자 read-only 화면

신규 관리자 경로:
- `/admin/kyc-tax-terms-implementation-approval`

화면 요구:
- 관리자 전용
- read-only
- form submit 없음
- mutation action 없음
- approve 버튼 없음
- override 버튼 없음
- 개인정보 없음
- 실제 계좌정보 없음
- provider raw data 없음
- token/secret 없음
- 이메일 전체 노출 없음
- 각 gate 항목의 id, title, itemDecision, evidenceStatus, blocker reason, next required actor 표시
- `overallApprovalStatus`, `blockerCount`, `unresolvedCount` 표시
- dev migration approval과 Production migration approval 분리 표시

Visible marker:
- `ADME_STAGE_3_N_KYC_TAX_TERMS_IMPLEMENTATION_APPROVAL_GATE`
- Stage 3-N KYC/Tax/Terms Implementation Approval Gate
- Read-only approval gate
- Migration implementation: BLOCKED
- Production mutation: DISABLED
- External legal review required
- External tax review required
- External privacy review required
- Provider selection required
- No personal data collection
- No bank account storage
- No tax filing
- No actual cash-out processing

---

## 9. 기존 관리자 화면 연계

Stage 3-N 요약 marker는 다음 관리자 화면에만 노출한다.
- `/admin/compliance-preflight`
- `/admin/diagnostics`
- `/admin/kyc-tax-terms-db-migration-review`

공개·소비자 경로에는 Stage 3-N 내부 marker를 노출하지 않는다.
- `/auth/login`
- `/consumer/profile`
- `/consumer/ads`

---

## 10. 검증 기준

신규 명령:
- `npm run verify:stage3n-kyc-tax-terms-implementation-approval-gate`

검증 항목:
- Stage 3-N SSOT 존재
- 신규 관리자 route 존재
- machine-readable taxonomy 값 검증
- `normal`/`warning`/`ok`/`caution`이 machine-readable status로 사용되지 않음
- `overallApprovalStatus=blocked`
- 모든 approval flags false
- migration/personal data/provider/tax/cash-out/production mutation false
- external review flags true
- blockerCount와 실제 blocker 수 일치
- unresolvedCount와 실제 unresolved 항목 수 일치
- 신규 화면에 form/action/approve/override 없음
- 실제 개인정보, 계좌번호, provider raw response, token/secret fixture 없음
- `supabase/migrations` 변경 없음
- Stage 3-M/L/K/J-R/J/I/H-R/H 회귀 PASS

---

## 11. 금지 사항

금지:
- SQL migration 파일 생성
- `supabase/migrations` 변경
- Supabase db push/reset/repair
- remote DB schema 변경
- table/column/constraint/RLS/RPC/SECURITY DEFINER 생성
- seed data 생성
- 개인정보 수집 UI
- 이름/주민등록번호/CI/DI/휴대전화번호 본인확인 구현
- 계좌번호 입력 UI 또는 저장
- PASS/KYC/bank provider 연동
- provider SDK 설치/API 호출/callback endpoint 구현
- provider raw response/token/secret 저장
- 세금 계산, 원천징수 계산, 세율 하드코딩, 세무 신고
- `cash_redemption_requests`, `point_ledger`, `users.balance` mutation
- 실제 계좌이체
- `actualCashOutProcessingAllowed` 값을 true로 설정
- reward open flag true, kill switch false, allowlist active true
- RLS 완화, direct client mutation 허용
- advertiser/partner consumer identity 접근
- raw identity/bank data 관리자 화면 노출
- public/consumer route Stage 3-N marker 노출

---

## 12. 다음 단계 후보

Stage 3-N 결과를 기준으로 가능한 다음 단계:
- Stage 3-N-R: approval gate 보강
- Stage 3-O: External Review Question Pack
- Stage 3-P: Dev-only Migration Implementation Approval
- 보류 유지

다음 단계는 자동으로 migration 구현으로 정하지 않는다. 명시 승인 없이 Stage 3-P 이후 migration 작업지시서를 작성하지 않는다.
