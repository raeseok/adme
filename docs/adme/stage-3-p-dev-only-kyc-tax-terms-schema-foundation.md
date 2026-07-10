# Stage 3-P Dev-only KYC/Tax/Terms Schema Foundation

## 1. 목적

Stage 3-P는 Stage 3-M, Stage 3-N, Stage 3-O에서 설계한 KYC/Tax/Terms 구조 중 외부 법률, 세무, 개인정보, 보안 검토 없이도 dev 환경에서만 구현 가능한 provider-neutral DB 기반을 만든다.

이번 단계는 웹서비스 개발을 계속하기 위한 개발용 스키마 기반 구축 단계다. 외부 전문가 검토는 웹서비스 기능 완성 후, 실제 Production 개인정보 수집, 계좌정보 처리, 세무 처리, 현금전환 실행 전에 진행한다.

## 2. 사업 오너 승인 범위

- dev-only 개발은 사업 오너 판단으로 진행한다.
- 외부 전문가 검토 미완료는 dev-only schema foundation의 전면 blocker가 아니다.
- 외부 전문가 검토는 Production 개인정보 수집 및 실제 cash-out 운영 전 필수 gate로 유지한다.
- `devImplementationStatus=approved`와 `productionApprovalStatus=blocked`를 분리한다.
- 기존 Stage 3-O의 `overallApprovalStatus`를 단순히 `approved`로 바꾸지 않는다.

## 3. 계속 차단되는 범위

- Production 개인정보 수집은 차단한다.
- Production schema migration은 차단한다.
- 실제 현금전환, 포인트 차감, 송금은 차단한다.
- provider 선정, SDK 설치, API 호출, callback/webhook 구현은 차단한다.
- 세무소득 분류, 원천징수 의무, 세율, 세금 계산은 확정하거나 구현하지 않는다.

## 4. Provider-neutral Schema 원칙

identity와 bank 관련 데이터는 provider reference, status, timestamp, reason code, digest, idempotency key만 저장할 수 있다.

금지 원칙:

- raw identity data 저장 금지
- raw bank account data 저장 금지
- provider raw response 저장 금지
- access token, refresh token, OAuth code, secret 저장 금지
- 실제 개인정보 fixture 저장 금지
- 실제 계좌정보 fixture 저장 금지

## 5. Raw PII 및 계좌번호 저장 금지

다음 값은 신규 schema, fixture, UI에 저장하거나 노출하지 않는다.

- 실제 이름
- 생년월일
- 휴대전화번호
- 주민등록번호
- CI
- DI
- 계좌번호
- 계좌번호 last4
- 계좌번호 hash
- 예금주명
- provider raw payload
- provider token 또는 secret

## 6. 세무 계산 금지

`consumer_tax_profiles`는 실제 세무정보가 아니라 검토 상태만 저장한다. `classification_code`는 nullable이며 실제 세무 분류 확정값을 의미하지 않는다.

금지 항목:

- `withholding_rate`
- `calculated_tax_amount`
- 실제 세율
- 원천징수 계산
- 세금 계산
- 지급명세서 생성 또는 제출 상태

## 7. Dev와 Prod 적용 분리

dev Supabase project-ref:

- `ogncvdxrrsjnwsuvgoyh`

prod Supabase project-ref:

- `vupsalteyltjqumppltc`

Stage 3-P migration은 dev Supabase에만 적용한다. Production Supabase에는 적용하지 않는다. Supabase CLI link 또는 출력에서 prod ref가 확인되면 즉시 중단한다.

금지 명령:

- `supabase db reset`
- `supabase migration repair`
- production `supabase db push`
- production link 변경
- destructive migration
- 기존 데이터 삭제

## 8. 구현 대상 DB Objects

Stage 3-P migration file:

- `20260710110500_stage_3_p_dev_only_kyc_tax_terms_schema_foundation.sql`

생성 대상:

- `consumer_identity_verifications`
- `consumer_bank_account_verifications`
- `consumer_tax_profiles`
- `legal_document_versions`
- `consumer_legal_acceptances`
- `consumer_marketing_consents`
- `cash_redemption_precondition_snapshots`

모든 신규 operational table은 RLS를 활성화한다. status column은 PostgreSQL native enum을 사용하지 않고 `text + CHECK constraint`를 사용한다. 금액 관련 column은 `BIGINT`만 사용한다.

현재 적용 상태:

- migration 파일 생성 완료
- 초기에는 `npx supabase projects list`에서 Production ref `vupsalteyltjqumppltc`가 `linked=true`로 확인되어 dev DB push를 중단했음
- Stage 3-P-R에서 로컬 Supabase CLI link metadata만 안전하게 해제하고 dev ref `ogncvdxrrsjnwsuvgoyh`로 재연결했음
- Production project를 변경한 것이 아니라 local CLI link target만 변경했음
- `npm run verify:supabase-dev-link-safety` PASS 후 dev Supabase에만 적용했음
- dev DB schema, RLS, idempotency 실측 검증 PASS
- Production Supabase에는 적용하지 않음

## 9. RLS 및 권한 원칙

anonymous:

- 전면 차단

advertiser:

- 전면 차단

partner:

- 전면 차단

consumer:

- 본인 데이터의 coarse 또는 masked status만 조회
- 직접 INSERT, UPDATE, DELETE 금지
- `provider_reference`와 내부 `reason_code`는 consumer projection에서 제외

admin:

- 최소 status 조회만 허용
- 직접 write 금지
- provider raw data가 존재하지 않으므로 raw access도 없음

이번 단계에서는 실제 provider result write RPC 또는 dev fixture용 `SECURITY DEFINER` RPC를 만들지 않는다.

## 10. Append-only 및 Idempotency

다음 테이블은 이벤트성 또는 evidence snapshot 성격이며 기존 행 수정보다 새 row 추가 방식으로 다룬다.

- `consumer_identity_verifications`
- `consumer_bank_account_verifications`
- `consumer_legal_acceptances`
- `consumer_marketing_consents`
- `cash_redemption_precondition_snapshots`

일반 authenticated client에는 direct write grant 또는 write policy를 만들지 않는다. 관리 목적의 직접 SQL 우회까지 완전히 차단한다고 과장하지 않는다.

idempotency unique scope:

- `consumer_identity_verifications`: `unique(consumer_id, idempotency_key)`
- `consumer_bank_account_verifications`: `unique(consumer_id, idempotency_key)`
- `consumer_tax_profiles`: `unique(consumer_id, idempotency_key)`
- `consumer_legal_acceptances`: `unique(consumer_id, legal_document_version_id, idempotency_key)`
- `consumer_marketing_consents`: `unique(consumer_id, consent_channel, idempotency_key)`
- `cash_redemption_precondition_snapshots`: `unique(consumer_id, idempotency_key)`

## 11. 기존 Cash Redemption 구조 연계

기존 `cash_redemption_requests`에는 raw `bank_name`, `bank_account_number`, `bank_account_holder` 구조가 남아 있다. Stage 3-P는 이 테이블을 수정하거나 mutation하지 않는다.

이번 단계 연결 방식:

- 기존 테이블 mutation 없음
- 기존 Production 구조에 FK 추가 없음
- `request_reference text`로 느슨하게 연결
- 실제 request 생성 없음
- `point_ledger` cash-out 없음
- balance 차감 없음

향후 실제 연계가 필요한 위치:

- provider 및 개인정보 검토 후 `cash_redemption_requests` raw bank field 제거 또는 vault/provider reference 분리
- request-time precondition snapshot과 actual request state machine 연결
- point deduction timing 및 rollback policy 확정
- maker-checker admin approval 및 audit event 설계

## 12. 구현 제외 항목

- Production migration
- 실제 개인정보 수집 UI
- 계좌정보 입력 UI
- provider integration
- callback/webhook endpoint
- provider SDK 설치
- provider raw response table
- credential/token storage
- tax calculation
- withholding calculation
- tax filing
- `cash_redemption_requests` 실제 생성
- `point_ledger` cash_out mutation
- user balance 차감
- 실제 송금

## 13. Rollback 기준

dev 환경 rollback은 신규 Stage 3-P DB objects 제거로 한정한다. 기존 테이블과 기존 데이터는 삭제하지 않는다.

rollback 검토 순서:

1. Production project-ref가 아닌 dev project-ref인지 확인한다.
2. 신규 Stage 3-P object 외 기존 object를 drop하지 않는다.
3. migration repair 또는 db reset을 사용하지 않는다.
4. dev schema foundation만 되돌리는 별도 forward migration을 작성한다.

## 14. 검증 기준

필수 검증:

- Stage 3-P SSOT 문서 존재
- migration 파일 존재
- 신규 DB objects 존재
- 모든 신규 테이블 RLS enabled
- anonymous 차단
- advertiser 차단
- partner 차단
- consumer direct INSERT, UPDATE, DELETE 차단
- admin direct write 차단
- raw identity column 부재
- raw bank account column 부재
- token, secret, raw response column 부재
- 계좌번호, last4, hash column 부재
- `withholding_rate` column 부재
- `calculated_tax_amount` column 부재
- idempotency unique constraint 존재
- `source_digest` 존재
- amount column `BIGINT`
- `FLOAT`, `REAL` 금지
- actual cash-out RPC 없음
- `point_ledger` cash_out mutation 없음
- dev project-ref 적용 확인
- prod project-ref 미적용 확인
- Stage 3-O 이하 회귀 PASS

Dev fixture 원칙:

- 실제 개인정보 사용 금지
- 실제 계좌번호 사용 금지
- fixture를 migration seed로 영구 추가하지 않음
- privileged SQL transaction에서만 검증하고 rollback

## 15. Linked Project Safety Check

Stage 3-P-R부터 모든 dev DB 작업 전 다음 명령을 선행한다.

- `npm run verify:supabase-dev-link-safety`

검증 원칙:

- expected dev ref는 `ogncvdxrrsjnwsuvgoyh`
- forbidden prod ref는 `vupsalteyltjqumppltc`
- local link metadata의 linked ref는 dev ref와 정확히 일치해야 함
- `npx supabase projects list`에서 dev ref는 `linked=true`, prod ref는 `linked=false`여야 함
- Stage 3-P migration 파일은 정확히 1개여야 함
- destructive SQL, `point_ledger`, `cash_redemption_requests`, balance mutation이 없어야 함
- secret, token, database password, connection string은 출력하지 않음

projects list에 prod가 존재하는 것과 현재 linked target이 prod인 것은 구분한다. DB mutation 전 linked ref가 prod이면 자동 중단한다.

## 16. Stage 3-P 상태

- `stage3PDevSchemaFoundationComplete=true`
- `businessOwnerDevApprovalGranted=true`
- `externalReviewDeferredUntilPreLaunch=true`
- `devMigrationApprovalGranted=true`
- `productionMigrationApprovalGranted=false`
- `devMigrationImplemented=true`
- `productionMigrationImplemented=false`
- `devSupabasePushExecuted=true`
- `productionSupabasePushExecuted=false`
- `providerNeutralSchemaOnly=true`
- `rawIdentityDataStored=false`
- `rawBankAccountDataStored=false`
- `providerRawResponseStored=false`
- `providerCredentialsStored=false`
- `taxCalculationImplemented=false`
- `withholdingCalculationImplemented=false`
- `actualPersonalDataCollectionImplemented=false`
- `actualCashOutProcessingAllowed=false`
- `pointLedgerCashOutMutationImplemented=false`
- `productionMutation=false`
- `legalConclusionDeclared=false`
- `devImplementationStatus=approved`
- `productionApprovalStatus=blocked`
