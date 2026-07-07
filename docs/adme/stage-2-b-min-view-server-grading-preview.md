# AdMe Stage 2-B — 최소 열람 타이머 및 서버 채점 Preview

작성일: 2026-07-08  
목적: Stage 2-A read-only UI 위에 안전한 퀴즈 제출 preview 단계 추가

---

## Stage 2-B 목표

1. 광고 상세 화면(`/consumer/ads/[campaignId]`)에 **최소 열람 타이머 UX** 추가
2. 타이머 완료 전 퀴즈 제출 UI **비활성화**
3. 타이머 완료 후 퀴즈 제출 UI **활성화**
4. 퀴즈 제출 시 **서버 권위** 구조로 정답/오답 preview 판정
5. **reward preview only** 표시 — 실제 포인트 적립 없음

---

## Stage 2-B 비목표

- `point_ledger` mutation (INSERT/UPDATE/DELETE/UPSERT)
- `ad_views` mutation (INSERT/UPDATE/DELETE/UPSERT)
- Kakao API/SDK/실제 발송
- attempt 상태 머신, 재도전 소멸 처리
- campaign budget 차감, CPV 정산
- Supabase dev/prod 분리
- public route machine marker 노출

---

## 핵심 계약 문구

- **Stage 2-B는 reward preview only 단계이다.**
- **Stage 2-B는 point_ledger를 변경하지 않는다.**
- **Stage 2-B는 ad_views를 변경하지 않는다.**
- **Stage 2-B의 최소 열람 타이머는 사용자 경험을 위한 클라이언트 UX이며, 실제 지급 권위 검증은 Stage 2-C/Stage 3에서 ad_views 또는 별도 view-session 구조로 구현한다.**
- **서버 채점 preview 응답에는 quiz_answer, correctAnswer, correctOption, correctIndex, answerIndex, solution, explanationAnswer 등 정답을 추론할 수 있는 필드를 포함하지 않는다.**

---

## 최소 열람 타이머

| 항목 | 내용 |
|---|---|
| 기본값 | 5초 |
| 표시 범위 | 3~15초 (clamp) |
| 권위 | **클라이언트 UX only** — Stage 2-B에서는 ad_views 기반 서버 권위 검증 없음 |
| `serverAuthoritativeMinView` | 항상 `false` |

---

## 서버 채점 Preview 반환 계약

### 허용 필드 (`QuizSubmitPreviewResult`)

| 필드 | 설명 |
|---|---|
| `accepted` | 제출 수락 여부 |
| `result` | `"correct"` \| `"incorrect"` \| `"not_allowed"` \| `"invalid"` |
| `rewardPreviewOnly` | 항상 `true` |
| `rewardPointsPreview` | 정답 시 preview 포인트, 그 외 `null` |
| `pointLedgerMutation` | 항상 `false` |
| `adViewsMutation` | 항상 `false` |
| `quizAnswerExposed` | 항상 `false` |
| `minViewRequiredSeconds` | 필요 최소 열람 초 |
| `minViewClientSatisfied` | 클라이언트 경과 시간 충족 여부 |
| `serverAuthoritativeMinView` | 항상 `false` |
| `nextAllowedAction` | 사용자 안내 문구 |

### 금지 필드

- `quiz_answer`, `quizAnswer`, `correctAnswer`, `correct_answer`
- `correctOption`, `correct_option`, `correctIndex`, `correct_index`
- `answerIndex`, `answer_index`, `solution`, `answer`
- `correct` (boolean key — `result: "correct"` 문자열 값은 허용)
- 정답 선택지 원문, 정답 번호, 정답 인덱스, 해설

---

## DB / RPC

- 기존 `grade_quiz_answer()` RPC: BOOLEAN만 반환, DML 없음 → Stage 2-B preview 채점에 사용
- preview 전용 migration **없음** (기존 RPC로 충분)
- fixture 캠페인: server-only fixture answer 대조 (클라이언트 비노출)

---

## Stage 2-C / Stage 3으로 넘기는 항목

| Stage | 항목 |
|---|---|
| 2-C | ad_views 실제 기록, attempt_no 상태 머신, 재도전 1회·2회 오답 소멸 |
| 3 | point_ledger quiz_reward insert, campaign budget 차감, CPV 정산 |
| 2-D / 5-K | Kakao/notification 실제 발송, opt-in 연락수단 |
| 공통 | fraud/rate-limit 고도화, Supabase dev/prod 분리 |

---

## 검증 스크립트

| 스크립트 | 목적 |
|---|---|
| `smoke:stage2b-min-view-timer` | 타이머·제출 버튼·결과 preview E2E |
| `verify:stage2b-server-grading-no-answer-exposure` | forbidden key·정답 원문 비노출 |
| `verify:stage2b-no-point-ledger-mutation` | point_ledger DML 없음 |
| `verify:stage2b-no-ad-views-mutation` | ad_views DML 없음 |
| `verify:stage2b-public-marker-guard` | public route marker 미노출 |
| `verify:stage2b-kakao-no-send` | Kakao 발송·SDK·env 없음 |

---

## Diagnostics marker (`/admin/diagnostics` only)

```
stage2BBuild=stage2b-min-view-server-grading-preview-production
stage2BMinViewTimer=true
stage2BServerGradingPreview=true
stage2BQuizAnswerClientExposure=false
stage2BPointLedgerMutation=false
stage2BAdViewsMutation=false
stage2BRewardPreviewOnly=true
stage2BKakaoActualSend=false
stage2BServerAuthoritativeMinView=false
stage2BPublicMarkerExposed=false
```
