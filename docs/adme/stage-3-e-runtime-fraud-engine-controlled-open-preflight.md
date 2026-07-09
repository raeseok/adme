# Stage 3-E-Preflight — Runtime Fraud Engine & Controlled Reward Open Approval

상태: **preflight only**  
Production actual reward open: **금지**  
Production mutation: **false**  
Production URL: `https://web-ashen-xi-52.vercel.app`  
기준 HEAD / Production deploy commit: `8cd1b80`

## 목적

Stage 3-E-Preflight는 Production full reward open이 아니다. 실제 리워드 지급을 열기 전에 runtime fraud engine, controlled allowlist, kill switch, mutation guard, budget guard, point_ledger idempotency, monitoring, rollback 기준을 검증해 controlled reward open 승인 가능 조건을 준비한다.

명시 승인 전까지 다음은 모두 금지한다.

- Production full reward open
- allowlist 없는 reward open
- kill switch off 배포
- Production point_ledger / campaign budget / users balance / ad_views reward mutation
- cash_out actual processing
- partner_settlements actual processing

## Runtime Fraud Engine 최소 기준

서버 전용 모듈:

- `apps/web/src/lib/rewards/fraud-engine.ts`
- `apps/web/src/lib/rewards/reward-guards.ts`

두 모듈은 `server-only`이며 client bundle에서 import하지 않는다. fraud decision은 secret, token, authorization code, raw provider payload, allowlist 원문을 포함하지 않는다.

최소 signal:

- authenticated user required
- user role consumer required
- campaign active required
- campaign budget available
- ad view exists
- minimum viewed seconds satisfied
- attempt count within limit
- quiz answer checked only on server
- duplicate reward idempotency blocked
- same user + same campaign replay blocked
- suspicious rapid repeat attempt blocked
- kill switch on이면 무조건 block
- Production reward open flag false이면 무조건 block
- controlled allowlist enabled인 경우 user/campaign allowlist 대상만 pass
- allowlist 밖 대상은 reward mutation 전 block

Decision shape:

- `allowed: boolean`
- `reason_code: string`
- `severity: "block" | "flag" | "allow"`
- `safe_message: string`
- `internal_detail?: string`
- `decision_id: string`
- `checked_at: string`

## Fraud Reason Codes

- `REWARD_KILL_SWITCH_ON`
- `PRODUCTION_REWARD_CLOSED`
- `USER_NOT_AUTHENTICATED`
- `USER_NOT_CONSUMER`
- `CAMPAIGN_NOT_ACTIVE`
- `CAMPAIGN_BUDGET_INSUFFICIENT`
- `AD_VIEW_NOT_FOUND`
- `MIN_VIEW_SECONDS_NOT_MET`
- `QUIZ_ATTEMPT_LIMIT_EXCEEDED`
- `QUIZ_ANSWER_INCORRECT`
- `REWARD_DUPLICATE_REPLAY`
- `USER_CAMPAIGN_REPLAY_BLOCKED`
- `USER_NOT_IN_CONTROLLED_ALLOWLIST`
- `CAMPAIGN_NOT_IN_CONTROLLED_ALLOWLIST`
- `CONTROLLED_REWARD_LIMIT_EXCEEDED`
- `CONTROLLED_REWARD_WINDOW_CLOSED`
- `FRAUD_SIGNAL_RAPID_REPEAT`
- `FRAUD_ENGINE_INTERNAL_ERROR`
- `REWARD_ALLOWED`

## Controlled Allowlist 설계

Production 기본값:

- `ADME_REWARD_KILL_SWITCH=true`
- `ADME_PRODUCTION_REWARD_OPEN=false`
- `ADME_CONTROLLED_REWARD_ALLOWLIST_ENABLED=false` 또는 명시 false

Allowlist 원문은 서버 전용 환경변수 또는 관리자 전용 DB 테이블로만 관리한다. 이번 preflight 구현은 서버 전용 환경변수 설계를 우선한다.

Allowlist 범위:

- user allowlist: `ADME_PRODUCTION_REWARD_ALLOWLIST_USER_IDS`
- campaign allowlist: `ADME_PRODUCTION_REWARD_ALLOWLIST_CAMPAIGN_IDS`
- max reward count: `ADME_CONTROLLED_REWARD_MAX_REWARD_COUNT`
- max reward amount per user: `ADME_CONTROLLED_REWARD_MAX_AMOUNT_PER_USER`
- max total controlled reward amount: `ADME_CONTROLLED_REWARD_MAX_TOTAL_AMOUNT`
- max campaign spend during controlled window: `ADME_CONTROLLED_REWARD_MAX_CAMPAIGN_SPEND`
- start/end window: `ADME_CONTROLLED_REWARD_WINDOW_START`, `ADME_CONTROLLED_REWARD_WINDOW_END`
- operator approval 기록: `ADME_CONTROLLED_REWARD_OPERATOR_APPROVAL_REF`

Diagnostics는 count/configured 여부만 표시한다. user id/campaign id allowlist 원문은 public route 또는 client payload에 노출하지 않는다.

## Kill Switch 우선순위

`REWARD_KILL_SWITCH_ON`은 fraud engine의 최우선 block reason이다.

kill switch가 true이면 다음 mutation은 모두 false여야 한다.

- point_ledger insert
- campaign budget 차감
- users balance update
- ad_views rewarded 상태 변경
- partner_settlements mutation
- cash_out mutation

검증 명령:

- `npm run verify:stage3e-kill-switch`

## Ledger / Budget Guard

point_ledger idempotency:

- `point_ledger(entry_type, idempotency_key)` unique index 유지
- `quiz_submission_idempotency.idempotency_key` primary key 유지
- 동일 user + campaign + idempotency_key replay는 duplicate insert 없이 idempotent replay 또는 block
- Production point_ledger mutation은 Stage 3-E-Preflight에서 false

campaign budget atomicity:

- Stage 3-B RPC는 dev-only full transaction이다.
- campaign row lock(`FOR UPDATE`), budget remaining check, budget increment, point_ledger insert가 하나의 RPC transaction 안에 있다.
- 예산 부족 시 point_ledger insert 없음.
- 동시 요청은 unique/idempotency guard와 row lock으로 이중 지급 및 음수 예산을 방지한다.
- 금전 관련 컬럼은 integer 계열(`BIGINT`)을 사용하고 `FLOAT`/`REAL`을 사용하지 않는다.

users balance cache:

- point_ledger 합계와 profiles balance cache 정합성은 read-only 검증으로만 확인한다.
- Stage 3-E-Preflight에서 balance 보정 mutation은 하지 않는다.

ad_views:

- reward 지급 성공 시에만 rewarded 상태가 기록되어야 한다.
- fraud/kill switch/allowlist block 요청은 rewarded 상태로 표시하면 안 된다.

검증 명령:

- `npm run verify:stage3e-idempotency`
- `npm run verify:stage3e-budget-atomicity`
- `npm run verify:stage3e-production-blocked`

## Production Block 유지

- Stage 3-B RPC Production block 유지: true
- Stage 3-C Production reward block 유지: true
- Stage 3-E-Preflight는 Production actual reward mutation을 수행하지 않는다.
- Production 검증은 blocked/dry-run/read-only 방식만 허용한다.

## Rollback / Incident 원칙

리워드 지급 후 단순 DB delete rollback은 금지한다. point_ledger는 append-only 원장이다.

문제 발생 시 대응:

1. kill switch on
2. campaign pause
3. 추가 지급 중단
4. 원장 정정은 delete/update가 아니라 adjust append로만 처리
5. cash_out과 partner_settlements는 별도 Stage 전까지 계속 닫음

## Security Attestation

- Secret 원문/일부/hash/digest 기록 없음
- OAuth authorization code/token 기록 없음
- Kakao raw callback payload 기록 없음
- quiz_answer exposure=false
- answer hint exposure=false
- RLS relaxed=false
- service role client exposure=false
- public marker exposed=false
- allowlist raw exposed=false

## Diagnostics / Admin Marker

Stage 3-E marker는 `/admin/diagnostics`와 `/admin/reward-preflight`에서만 표시한다.

대표 marker:

- `stage3EPreflightEnabled=true`
- `stage3EFraudEnginePresent=true`
- `stage3EProductionRewardOpen=false`
- `stage3EKillSwitch=true`
- `stage3EControlledAllowlistActive=false`
- `stage3ECashOutOpen=false`
- `stage3EPartnerSettlementsOpen=false`
- `stage3EProductionRewardMutation=false`
- `stage3EQuizAnswerExposed=false`
- `stage3ERlsRelaxed=false`
- `stage3EServiceRoleExposed=false`
- `stage3EPublicMarkerExposed=false`
- `stage3EDeployCommit=<current commit>`

Public route에 `stage3E` marker 노출 금지:

- `npm run verify:stage3e-public-marker-guard`

## 검증 명령

필수:

- `npm run lint`
- `npm run build`
- `npm run verify:stage3e-preflight`
- `npm run verify:stage3e-kill-switch`
- `npm run verify:stage3e-fraud-engine`
- `npm run verify:stage3e-idempotency`
- `npm run verify:stage3e-budget-atomicity`
- `npm run verify:stage3e-production-blocked`
- `npm run verify:stage3e-public-marker-guard`

회귀:

- `npm run verify:stage3b-production-blocked`
- `npm run verify:stage3c-production-reward-blocked`
- `npm run verify:stage3d-production-reward-blocked`
- `npm run verify:stage3d-release-flags`
- `npm run verify:stage3d-kakao-oauth-secret-safety-attestation`
- `npm run verify:stage3d-quiz-answer-non-exposure`
- `npm run verify:stage3d-point-ledger-append-only`
- `npm run verify:stage3d-balance-cache-consistency-readonly`
- `npm run verify:stage3d-production-budget-safety-readonly`
- `npm run verify:stage3d-rls-guard`
- `npm run verify:stage3d-public-marker-guard`

## Kakao OAuth 재확인

Production actual Kakao OAuth E2E는 실제 계정 인터랙티브 확인이 필요하다. 이 preflight 문서는 secret/code/token/raw callback payload를 기록하지 않는다.

Cursor 세션에서 실제 계정 인터랙티브 로그인을 수행하지 못하면 완료 판정은 `operator attestation required` blocker로 표시한다.
