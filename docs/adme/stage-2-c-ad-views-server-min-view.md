# AdMe Stage 2-C — ad_views 기록 및 서버 권위 최소 열람 검증

작성일: 2026-07-08  
목적: Stage 2-B preview 위에 서버 기록 기반 열람·퀴즈 시도 검증 추가

---

## Stage 2-C 목표

1. 광고 상세 진입 시 서버가 열람 시작 시점을 기록한다.
2. 퀴즈 제출 시 **서버 기록 기준**으로 최소 열람 시간을 검증한다.
3. 최소 열람 미충족 시 퀴즈 제출을 거부한다.
4. 최소 열람 충족 시에만 서버 채점 preview를 수행한다.
5. 퀴즈 시도 결과를 ad_views(또는 fixture httpOnly cookie)에 기록한다.
6. `attempt_no` 상태 — 1회 오답 후 재도전, 2회 오답 후 reward preview 불가.
7. reward preview only — 실제 포인트 적립 없음.

---

## Stage 2-C 비목표

- `point_ledger` mutation
- campaign budget 차감, CPV 정산
- Kakao API/SDK/실제 발송
- quiz_answer 클라이언트/API 노출
- Supabase dev/prod 분리
- public route machine marker 노출

---

## 핵심 계약 문구

- **Stage 2-C는 ad_views 기록을 처음 도입하는 단계이다.**
- **Stage 2-C는 point_ledger를 변경하지 않는다.**
- **Stage 2-C는 reward preview only 단계이다.**
- **Stage 2-C의 최소 열람 검증은 서버 기록 기준으로 판단한다.**
- **Stage 2-C에서는 클라이언트 타이머를 신뢰하지 않는다.**
- **Stage 2-C에서는 campaign budget을 차감하지 않는다.**
- **Stage 2-C에서는 CPV 정산을 수행하지 않는다.**
- **Stage 2-C에서는 quiz_answer, correctAnswer, correctOption, correctIndex, answerIndex, solution 등 정답 추론 가능 필드를 반환하지 않는다.**

---

## ad_views 기록 정책

| 이벤트 | 동작 |
|---|---|
| 열람 시작 | `beginAdViewAction` → INSERT `status=viewed`, `attempt_no=0`, `view_started_at=now()` |
| 퀴즈 제출 | UPDATE `attempt_no`, `status` (`quiz_submitted` / `failed` / `viewed`) |
| fixture 캠페인 | httpOnly cookie (`adme_s2c_view_*`) — DB UUID 아님 |

- 하루 1 row (`idx_ad_views_consumer_campaign_day` unique index) — UPDATE로 attempt 추적
- `points_earned`는 Stage 2-C에서 항상 0
- 정답 원문 저장 금지

---

## 서버 권위 최소 열람 검증

```
view_started_at (서버) + now() → serverElapsedSeconds
serverElapsedSeconds >= minViewRequiredSeconds → 제출 허용
client timer / clientElapsedMs → UI only, 판정 미사용
```

---

## attempt_no 상태 정책

| attempt_no | 결과 | 다음 |
|---|---|---|
| 0 | 열람만 | 제출 가능 |
| 1 | 1회 오답 | 재도전 1회 (`attemptsRemaining=1`) |
| 2 | 2회 오답 | `attempt_limit_reached`, reward preview 불가 |
| 1–2 | 정답 | `already_completed`, 중복 제출 거부 |

---

## point_ledger / budget 금지

- INSERT/UPDATE/DELETE/UPSERT 금지
- `users.balance`, `campaigns.budget_spent` 변경 금지
- `partner_settlements` mutation 금지

---

## quiz_answer 비노출

- server action allowlist DTO만 반환
- DB/RPC 응답 spread 금지
- 오답 시 정답 안내 금지

---

## Kakao actual send 금지

- Kakao SDK/API/env 추가 금지
- 휴대전화번호 수집 UI 금지
- notification DB migration 금지

---

## Stage 3으로 넘기는 항목

- point_ledger 실제 적립
- campaign budget 차감
- CPV 정산
- `ad_views.status=rewarded` 실지급 연동
- Kakao 선택 동의 알림

---

## DB migration

`20260708100000_stage_2_c_ad_views_min_view.sql`

- `view_started_at TIMESTAMPTZ`
- `attempt_no SMALLINT (0–2)`
- `ad_views_update_own_consumer` RLS policy
