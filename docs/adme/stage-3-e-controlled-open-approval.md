# Stage 3-E-Controlled-Open-Approval — Controlled Open Approval Package

상태: **approval only**  
Production actual reward open: **금지**  
Production mutation: **false**  
Production reward open flag: **false 유지**  
Reward kill switch: **true 유지**  
Controlled allowlist active: **false 유지**  
Production URL: `https://web-ashen-xi-52.vercel.app`  
기준 HEAD / Production deploy commit: `cb85c1d`

## 목적

Stage 3-E-Controlled-Open-Approval은 Production reward actual open 실행이 아니라, controlled open 실행 여부를 기술사님이 다음 단계에서 판단할 수 있도록 승인 조건, allowlist 계약, 예산 상한, 모니터링, 즉시 중단 절차를 확정하는 검증 패키지다.

이번 단계에서는 다음을 실행하지 않는다.

- Production full reward open
- Production controlled reward actual open
- reward open flag true 변경
- kill switch off 변경
- controlled allowlist active true 변경
- Stage 3-B / Stage 3-C Production block 제거
- Production point_ledger / campaign budget / users balance / ad_views reward result mutation
- cash_out actual processing
- partner_settlements actual processing

## Controlled Open 최소 범위

- consumer allowlist: 최대 2명
- campaign allowlist: 최대 1개
- 1인당 성공 reward 지급 횟수: 최대 1회
- 1인당 reward 지급 금액: 최대 500P
- 전체 controlled open reward 지급 총액: 최대 1,000P
- `point_per_pass`가 500P를 초과하는 campaign은 controlled open 대상에서 제외
- 같은 consumer-campaign 조합은 idempotency key 기준 1회만 인정

## Allowlist 계약

실제 이메일, Kakao ID, OAuth provider raw id는 기록하지 않는다. allowlist 식별자는 서버 내부의 `user_id` UUID와 `campaign_id` UUID만 허용한다.

이번 작업에서는 실제 allowlist를 active 상태로 만들지 않는다. 문서에는 다음 placeholder만 둔다.

- `<OPERATOR_APPROVED_CONSUMER_USER_ID_1>`
- `<OPERATOR_APPROVED_CONSUMER_USER_ID_2_OPTIONAL>`
- `<OPERATOR_APPROVED_CAMPAIGN_ID>`

실제 ID 반영은 별도 `Stage 3-E-Controlled-Open-Execution` 작업에서 기술사님의 명시 승인 후 수행한다.

Kakao actual E2E operator attestation은 다음 마스킹 기준만 기록한다.

- 확인 일시: 2026-07-09 12:00 KST
- 확인 계정 이메일: `ra***@kakao.com`
- Kakao login button visible: OK
- Kakao authorize screen reached: OK
- 실제 Kakao 로그인 완료: OK
- `/auth/callback` 정상 복귀: OK
- `/consumer/profile` authenticated: OK
- provider kakao: Kakao authorize 경유 로그인 완료 기준 인정
- logout 후 anonymous: OK
- Secret/code/token/raw callback 기록 여부: 기록 없음

## 예산 상한

- controlled open max users: 2
- controlled open max campaigns: 1
- controlled open max reward count per user: 1
- controlled open max reward amount per user: 500P
- controlled open max total reward amount: 1,000P

예산 상한 변경은 새 decision log와 새 검증 스크립트 없이는 금지한다.

## 승인 전 체크리스트

- Production reward open flag=false 유지 확인
- kill switch=true 유지 확인
- controlled allowlist active=false 유지 확인
- Stage 3-B Production block 유지 확인
- Stage 3-C Production reward block 유지 확인
- point_ledger idempotency 검증 PASS
- campaign budget atomicity 검증 PASS
- runtime fraud engine 검증 PASS
- public marker guard PASS
- quiz_answer exposure=false
- answer hint exposure=false
- `correctAnswer` / `correctOption` / `correctIndex` / `answerIndex` / `solution` 반환 없음
- RLS relaxed=false
- service role client exposure=false
- OAuth secret/code/token exposure=false
- actual mutation=false
- cash_out actual processing=false
- partner_settlements actual processing=false

## Actual Open 실행 조건

Stage 3-E-Controlled-Open-Execution으로 넘어가려면 기술사님의 다음 명시 문장이 필요하다.

> Stage 3-E-Controlled-Open-Execution을 위 승인 조건으로 실제 실행 승인한다.

위 문장 없이 Cursor는 actual open 코드를 켜거나 env를 변경하면 안 된다. 특히 reward open flag, kill switch, controlled allowlist active, Stage 3-B/3-C Production block 관련 설정을 변경하면 안 된다.

## 즉시 중단 절차

이상 징후 발생 시 다음 순서로 중단한다.

1. kill switch=true 유지 또는 재활성화
2. reward open flag=false로 복귀
3. allowlist active=false로 복귀
4. 추가 reward 지급 중단 확인
5. 원인과 영향을 문서화
6. 지급된 ledger는 삭제하지 않고 필요한 경우 별도 adjust 정책을 설계 검토 후 처리

금지 사항:

- point_ledger DELETE rollback
- point_ledger UPDATE/DELETE 허용
- Production data delete
- Supabase db reset
- Supabase migration repair
- 지급 후 DB delete rollback 설계

## 제외 범위

- cash_out actual processing 제외
- partner_settlements actual processing 제외
- Production full reward open 제외
- allowlist 없는 reward open 제외
- Production fixture seed 제외
- Production data delete 제외
