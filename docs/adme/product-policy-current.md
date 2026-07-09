# AdMe Product Policy (Current)

작성일: 2026-07-08  
상태: **current** — 제품·UX·프라이버시 원칙

관련: [current-business-plan.md](./current-business-plan.md) · [adme-decision-log.md](./adme-decision-log.md)

---

## AdMe 핵심 철학

1. **소비자가 소비정보 조건을 먼저 제시**한다.
2. **광고주는 조건에 맞는 광고와 보상을 제공**한다.
3. **소비자는 광고 인식을 확인하고 보상을 획득**한다.

광고는 “뿌려지는 것”이 아니라, 소비자가 정의한 **소비정보 조건에 대한 응답**이다.

---

## 광고를 소비정보로 보는 원칙

- 매칭 단위는 인구통계 스냅샷이 아니라 **소비 의향 프로필(관심·지역·연령·가족 소비 조건 등)**
- 캠페인은 “조건에 맞는 소비자”에게만 노출
- 열람·퀴즈로 **인지 검증** 후 보상 연결

---

## 소비자·광고주 역할

| 주체 | 역할 |
|---|---|
| 소비자 | 소비정보 조건 제시 → 광고 수신 → 인식 확인 → 보상 |
| 광고주 | 조건 매칭 → 광고·보상 제공 → 예산·성과 관리 |

---

## 소비 의향 프로필 UX 문구 원칙

- **소비성향 프로필은 광고를 보내달라는 나의 요구**로 프레이밍한다.
- **기본 정보**(출생년도, 성별, 주거지역)는 맞춤 소비정보를 받기 위한 **최소 조건**
- **선택 정보**(자녀 생년, 반려동물, 주활동지역, 관심정보)는 더 정교한 맞춤 소비정보를 위한 **추가 조건**
- **더 많은 조건을 등록할수록** 더 많은 맞춤 소비정보를 받을 수 있다는 문구는 **선택 정보 섹션 내부**에 노출
- 문구는 **개인정보 제공이 아니라 소비정보 요청 조건**임을 분명히 한다.
- “개인정보를 입력해 주세요” 같은 **방어심리를 유발하는 톤**을 피한다.

예시 방향 (Stage 1-G에서 구체화):
- “내가 원하는 광고 조건을 알려주세요”
- “이 조건에 맞는 광고와 혜택을 받을 수 있어요”

---

## 개인정보·프라이버시

| 원칙 | 설명 |
|---|---|
| **광고주에게 개인 식별 row 직접 노출 금지** | consumer_user_id 등 raw 식별자 미노출 |
| quiz_answer 비노출 | correctAnswer, solution 등 정답 추론 필드 API/클라이언트 금지 |
| 자녀 생년 | 가족 개인정보 수집이 아니라 **자녀 관련 소비정보 조건** — 미입력 허용 |
| 이메일·user id | diagnostics·public UI에서 마스킹·비노출 |
| OAuth 진단 | public login에는 `oauthError` / `oauthErrorCode` / `oauthErrorSummary` / `callbackCodeMissing`만 허용. external code·authorization code·access/refresh token·client_secret 원문·일부 비노출 |

---

## UI 변경 시 사용자 직접 점검 요청

UI·visible copy·layout 변경이 포함된 작업 완료 시:

1. **Vercel Production** URL에서 기술사님 직접 확인 요청
2. 필요 시 **Preview** URL 확인 (Deployment Protection 시 로그인)
3. 완료보고에 확인 경로·기대 문구·모바일/데스크톱 여부 명시

verify script는 **보조**이며, 화면 직접 점검을 대체하지 않는다.

---

## 지역 밀착형의 위치

- 제품 **본질 아님** — **적용 가능성·운영 전략**
- region selector는 소비정보 조건 입력 UX의 일부
- “지역 광고 앱”이 아닌 “소비정보 기반 매칭” 메시지 유지

---

## 자녀 생년·반려동물 조건 (Stage 1-G implemented)

**선택 정보** 섹션에 배치. Stage 1-G-R에서 기본/선택 구분 명확화.

| 항목 | 의미 |
|---|---|
| 가장 큰 자녀 생년 | 자녀 연령대 관련 **소비정보 조건** |
| 막내 자녀 생년 | 동일 — 선택 입력 |
| 반려동물 조건 | dog/cat/other 복수 선택 — **반려동물 관련 소비정보 조건** |
| 미입력 | 허용 — 조건 미설정으로 처리 |
| 광고주 노출 | **직접 row 노출 금지** — matching actual 활용은 후속 Stage |

---

## 금전·ledger 정책 (current)

- point_ledger: **append-only** — UPDATE/DELETE 금지; 오류 정정은 adjust APPEND만 (실행은 후속 Stage)
- Stage 3-A: **dev-only** dry-run RPC INSERT 허용; **Production mutation = false**
- Stage 3-B: **dev-only** full transaction (`entry_type=quiz_reward` canonical); budget·ad_views·balance cache mutation은 dev만; **Production mutation = false**
- Stage 3-C: consumer quiz submit UI는 `submitConsumerQuizForRewardAction` server action 경유만; client RPC 직접 호출 금지; controlled E2E fixture campaign만 dev actual mutation; **Production mutation = false**
- Stage 3-C-K3: Production Kakao OAuth E2E 성공 기록. Auth E2E 충족과 Production reward open은 분리 — reward open은 Stage 3-D preflight·별도 승인
- Stage 3-D: Production reward open **preflight only**. `ADME_REWARD_KILL_SWITCH` 기본 ON, `ADME_PRODUCTION_REWARD_OPEN` 기본 false, controlled allowlist designed·active=false. partner_settlements / cash_out / PASS / 전자금융은 **비범위**
- Stage 3-D-R: Kakao OAuth Secret Safety Attestation **완료**. 노출 의심 없으면 rotation 불필요(`rotationRequired=false`). secret 원문/일부/hash/digest 미기록. Production reward open 전제조건은 계속 유지(open=false)
- Stage 3-E-Preflight-R: runtime fraud engine, controlled allowlist, kill switch priority, idempotency, budget atomicity, public marker guard를 준비·검증하는 approval preflight 완료 인정. **Production actual reward open은 아님**. open flag=false, kill switch=true, Production mutation=false 유지. cash_out / partner_settlements actual processing은 계속 비범위
- Stage 3-E-Controlled-Open-Approval: controlled open을 바로 실행하지 않고 승인 조건 확정 단계로 분리한다. 초기 상한은 consumer 최대 2명, campaign 최대 1개, 1인당 성공 지급 1회, 1인당 500P, 전체 1,000P다. `point_per_pass`가 500P를 초과하는 campaign은 제외한다. allowlist 없는 reward open은 금지하며, allowlist 실제 ID 반영과 active=true 전환은 별도 Stage 3-E-Controlled-Open-Execution 명시 승인 전 금지한다
- Stage 3-F-Cash-out-Manual-Approval-Design: 실제 reward mutation 전에 cash-out 운영 리스크를 먼저 고정한다. 최소 전환 금액은 10,000P, MVP 처리 방식은 관리자 수동 승인 + 수동 이체, 자동이체 API는 MVP 제외다. cash-out actual processing=false, cash-out mutation=false이며 Production reward open gate와 cash-out processing gate는 별도 승인으로 분리한다
- Stage 3-G-Partner-Settlement-Manual-Approval-Design: partner attribution lock을 전제로 정산 수동 승인 구조를 설계·문서·admin marker·verify contract로만 고정한다. partner settlement actual processing=false, `partner_settlements` mutation=false, monthly close batch=false, partner payout action=false이며 DB migration은 없다
- advertiser/partner: consumer **raw** `point_ledger` row 직접 접근 금지 (aggregate DTO는 후속)
- campaign budget / partner_settlements / cash_out actual 변경: **Production 금지**
- Production actual enable은 **별도 승인** (Stage 3-E-Controlled-Open-Execution 후보). reward full open, cash_out actual processing, partner_settlements actual processing은 계속 금지

상세: [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md) · [stage-3-a-point-ledger-dev-dry-run-result.md](./stage-3-a-point-ledger-dev-dry-run-result.md) · [stage-3-b-quiz-reward-full-transaction-dev-only.md](./stage-3-b-quiz-reward-full-transaction-dev-only.md) · [stage-3-c-consumer-quiz-submit-ui-controlled-integration.md](./stage-3-c-consumer-quiz-submit-ui-controlled-integration.md) · [stage-3-c-k3-kakao-oauth-e2e-and-redaction-result.md](./stage-3-c-k3-kakao-oauth-e2e-and-redaction-result.md) · [stage-3-d-production-reward-open-preflight.md](./stage-3-d-production-reward-open-preflight.md) · [stage-3-d-kakao-oauth-secret-safety-attestation.md](./stage-3-d-kakao-oauth-secret-safety-attestation.md) · [stage-3-e-runtime-fraud-engine-controlled-open-preflight.md](./stage-3-e-runtime-fraud-engine-controlled-open-preflight.md) · [stage-3-e-controlled-open-approval.md](./stage-3-e-controlled-open-approval.md) · [stage-3-e-controlled-open-runbook.md](./stage-3-e-controlled-open-runbook.md) · [stage-3-f-cash-out-manual-approval-design.md](./stage-3-f-cash-out-manual-approval-design.md) · [stage-3-g-partner-settlement-attribution-policy.md](./stage-3-g-partner-settlement-attribution-policy.md) · [stage-3-g-partner-settlement-manual-approval-design.md](./stage-3-g-partner-settlement-manual-approval-design.md)

---

## Cash-out manual approval policy

- 사용자·사업 용어 `cash-out` / 현금 전환은 DB의 `cash_redemption_requests` 테이블에 매핑한다.
- ledger debit type은 기존 `cash_redemption`을 사용하고, 실패 복구는 기존 `admin_adjustment` 또는 별도 승인된 reversal ledger append로 설계한다.
- 신규 `cash_out` 테이블 또는 임의 `cash_out` ledger type을 만들지 않는다.
- 최소 전환 금액은 **10,000P**다.
- MVP 단계에서는 자동이체 API를 연동하지 않는다.
- 현금 전환은 관리자 수동 승인과 수동 계좌 이체로 설계한다.
- 이체 실패 시 `point_ledger` DELETE rollback은 금지한다.
- 실패 복구는 reason 필수 `admin_adjustment` 또는 승인된 reversal ledger append로만 설계한다.
- 계좌정보 원문, 실명, OAuth provider raw id, full email은 문서·로그·marker에 기록하지 않는다.
- 향후 계좌정보는 cash-out request와 분리 저장하고 admin 화면에는 마스킹된 값만 표시한다.
- cash-out actual processing은 아직 **false**다.
- `cash_redemption_requests` actual mutation은 아직 **false**다.
- Production reward open과 cash-out processing은 서로 다른 approval gate다.

---

## Partner Settlement Attribution Policy

- 광고주의 파트너 귀속 기준은 `advertisers.partner_id`에 고정한다.
- `advertisers.partner_id`는 광고주 등록 시점에 확정하며, 광고주 등록 이후 `partner_id immutable` 원칙을 따른다.
- 캠페인 생성 시점, 광고 노출 시점, 퀴즈 통과 시점, 월말 정산 시점에 partner를 동적으로 재탐색하지 않는다.
- 정산 귀속 기준은 `campaign -> advertiser -> advertisers.partner_id`이다.
- 광고주의 `partner_id`를 임의 변경하면 과거 정산 근거가 흔들리므로 원칙적으로 금지한다.
- 이번 Stage에서는 partner_settlements actual mutation=false이며, DB migration/RPC/batch/trigger/UI를 구현하지 않는다.

---

## Partner Settlement Monthly Close Policy

- 퀴즈 통과 시점에는 파트너 몫을 계산하지 않는다.
- 퀴즈 통과 시점에는 광고주 예산 차감 및 원장 기록만 처리한다.
- `partner_settlements`는 `monthly close` 이후 확정 거래 집계 기준으로 생성한다.
- 익월 15일 수동 현금 지급을 기본으로 한다.
- `partner_settlements`에는 계산 당시 배분율을 `settlement_share_rate_snapshot` 또는 equivalent column으로 저장한다.
- 파트너 계약 조건이 나중에 변경되어도 과거 정산액은 재계산하지 않는다.
- `(partner_id, settlement_month)` UNIQUE 제약으로 월말 정산 batch idempotency를 보장해야 한다.
- `partner_settlements.status`는 `pending -> confirmed -> paid` 흐름을 기본으로 한다.
- `paid update blocked`: paid 상태가 된 settlement는 직접 UPDATE를 차단하는 DB trigger 또는 equivalent guard 대상이다.
- 월 마감 전 부정행위 취소는 해당 월 확정 거래에서 제외 또는 차감한다.
- 월 마감 후 발견된 부정행위는 이미 확정된 settlement를 직접 수정하지 않고 `chargeback next month` 방식으로 다음 달 정산에서 차감한다.
- Stage 3-G에서는 monthly close batch, settlement approval/paid action, paid update trigger, chargeback actual mutation을 구현하지 않는다.

---

## Partner Termination Policy

- 계약 해지 시 `advertisers.partner_id`를 NULL로 바꾸지 않는다.
- `do not null advertiser partner_id`: 과거 귀속 근거 보존을 위해 광고주 row의 partner 귀속값을 제거하지 않는다.
- 파트너 이탈은 `partners.status='terminated'` 등 상태값으로 관리한다.
- 정산 batch는 `partners.status`를 확인하되, 과거 귀속 근거를 훼손하지 않는다.
- terminated partner에 대한 미정산 확정 거래는 계약·운영 정책에 따라 final settlement 또는 hold 상태로 처리한다.

---

## machine marker 정책

- stage30·stage1G·stage1GR·stage3A·stage3D·stage3E·stage3F 등 진단 marker: **admin route only**
- Stage 3-F marker는 `/admin/diagnostics`, `/admin/reward-preflight`, `/admin/cash-out-preflight`에만 노출
- Stage 3-G marker는 `/admin/diagnostics`, `/admin/reward-preflight`, `/admin/partner-settlement-preflight`에만 노출
- public route에 `stage3D`/`stage3E`/`stage3F`/`stage3G` 문자열 자체 노출 금지 — verify public-marker-guard로 검증
