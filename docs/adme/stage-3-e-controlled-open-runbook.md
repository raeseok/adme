# Stage 3-E-Controlled-Open Runbook

상태: **approval/runbook only**  
Production actual open: **금지**  
Production mutation: **false**  
Reward open flag: **false 유지**  
Kill switch: **true 유지**  
Controlled allowlist active: **false 유지**

## 1. Controlled Open 전 운영자 확인 순서

1. repo HEAD와 Production deploy commit이 승인 대상 commit과 일치하는지 확인한다.
2. `git status` clean을 확인한다.
3. Production URL이 `https://web-ashen-xi-52.vercel.app`인지 확인한다.
4. `/admin/reward-preflight`와 `/admin/diagnostics`에서 Stage 3-E-Controlled-Open-Approval marker를 확인한다.
5. `stage3EControlledOpenApproval=true`, `stage3EControlledOpenApprovalOnly=true`, `stage3EActualOpenExecuted=false`를 확인한다.
6. `stage3EProductionRewardOpenFlag=false`, `stage3ERewardKillSwitch=true`, `stage3EControlledAllowlistActive=false`를 확인한다.
7. Stage 3-B Production block과 Stage 3-C Production reward block이 유지되는지 확인한다.

## 2. Actual Open 승인 문장 요건

actual controlled open은 기술사님의 다음 명시 문장이 있어야만 진행할 수 있다.

> Stage 3-E-Controlled-Open-Execution을 위 승인 조건으로 실제 실행 승인한다.

위 문장이 없으면 Cursor는 reward open flag, kill switch, controlled allowlist active, Stage 3-B/3-C block 관련 설정을 변경하지 않는다.

## 3. Vercel Production Env 변경 전 확인 항목

Stage 3-E-Controlled-Open-Approval 단계에서는 Vercel Production env를 actual open 방향으로 변경하지 않는다.

Execution 단계에서 별도 승인 후 env 변경이 필요할 경우 변경 전 확인 항목:

- repo HEAD와 Production deploy commit 일치
- Production Supabase project-ref가 `vupsalteyltjqumppltc`
- Preview/Local Supabase project-ref가 `ogncvdxrrsjnwsuvgoyh`
- reward open flag 기본값 false
- kill switch 우선순위 true
- allowlist active 전환 대상 ID가 내부 UUID placeholder에서 승인된 실제 UUID로 치환되었는지 확인
- actual open 승인 문장 존재

## 4. Supabase Prod Project-Ref 확인

- dev Supabase project-ref: `ogncvdxrrsjnwsuvgoyh`
- prod Supabase project-ref: `vupsalteyltjqumppltc`
- Vercel Production Supabase project-ref: `vupsalteyltjqumppltc`
- Preview/Local Supabase project-ref: `ogncvdxrrsjnwsuvgoyh`

Production controlled open 판단 전 `/admin/reward-preflight`와 `/admin/diagnostics`에서 `stage3ECurrentSupabaseProjectRef=vupsalteyltjqumppltc`를 확인한다.

## 5. Allowlist 식별자 취급 원칙

- 실제 이메일 전체를 문서, 코드, 로그, 완료보고에 기록하지 않는다.
- Kakao provider raw id를 기록하지 않는다.
- OAuth raw callback payload를 기록하지 않는다.
- allowlist 식별자는 내부 `user_id` UUID와 `campaign_id` UUID만 허용한다.
- Approval 단계 문서에는 `<OPERATOR_APPROVED_CONSUMER_USER_ID_1>`, `<OPERATOR_APPROVED_CONSUMER_USER_ID_2_OPTIONAL>`, `<OPERATOR_APPROVED_CAMPAIGN_ID>` placeholder만 둔다.
- allowlist active=true 전환은 별도 Execution 승인 전 금지한다.

## 6. Reward 지급 성공 시 확인 항목

이 항목은 Approval 단계에서 실행하지 않고, 별도 Execution 승인 후에만 사용한다.

- 성공 지급 수가 consumer당 1회를 초과하지 않음
- 지급 포인트가 consumer당 500P를 초과하지 않음
- 전체 지급 총액이 1,000P를 초과하지 않음
- `point_per_pass`가 500P 이하인 campaign만 대상
- 같은 consumer-campaign 조합이 idempotency key 기준 1회만 인정됨
- point_ledger append-only 원칙 유지
- campaign budget 차감과 point_ledger insert가 원자적으로 일치
- ad_views reward result는 성공 지급 시에만 반영

## 7. 문제 발생 시 Kill Switch 절차

1. kill switch=true 유지 또는 즉시 재활성화
2. reward open flag=false 확인
3. controlled allowlist active=false 확인
4. 추가 지급 요청 차단 확인
5. 원인, 영향 범위, 지급된 ledger entry 범위를 문서화
6. 삭제 rollback이 아니라 별도 adjust 정책 설계 필요 여부를 검토

## 8. Rollback 금지 원칙

- point_ledger DELETE rollback 금지
- point_ledger UPDATE/DELETE 허용 금지
- point_ledger 직접 INSERT policy 생성 금지
- Production data delete 금지
- Supabase db reset 금지
- Supabase migration repair 금지
- 지급 후 DB delete rollback 설계 금지

## 9. 개인정보·OAuth Secret Redaction 원칙

- operator email은 `ra***@kakao.com` 같은 마스킹 형식만 허용
- Kakao Client Secret 원문/일부/hash/digest 기록 금지
- OAuth authorization code 기록 금지
- access token 기록 금지
- refresh token 기록 금지
- raw callback payload 기록 금지
- `quiz_answer`, 정답 암시 label, `correctAnswer`, `correctOption`, `correctIndex`, `answerIndex`, `solution` 노출 금지

## 10. 완료보고 Attestation 항목

완료보고에는 다음을 포함한다.

- actual open 실행 여부: false
- Production reward open flag: false
- kill switch: true
- controlled allowlist active: false
- max users: 2
- max campaigns: 1
- max reward count per user: 1
- max reward amount per user: 500P
- max total reward amount: 1,000P
- allowlist 실제 ID 반영 여부: false
- 실제 이메일 전체 기록 여부: false
- OAuth provider raw id 기록 여부: false
- Production mutation 여부: false
- public marker exposed 여부: false
- OAuth secret/code/token exposure 여부: false
- 지급 후 DB delete rollback 설계 여부: false
