# AdMe Stage 3-C — Consumer Quiz Submit UI Controlled Integration

작성일: 2026-07-09  
상태: **구현 완료** (Production actual mutation = false)

**선행:** [stage-3-b-quiz-reward-full-transaction-dev-only.md](./stage-3-b-quiz-reward-full-transaction-dev-only.md)

---

## 목표

- Stage 3-B `rpc_stage3b_dev_submit_quiz_reward_transaction`을 소비자 광고 상세 UI에 **제한적으로** 연결
- dev/preview + controlled E2E fixture campaign에서만 actual reward mutation 검증
- Production에서는 UI 존재하나 **actual mutation 0**, blocked UX 표시

## 비목표

- Production reward open
- client component에서 Stage 3-B RPC 직접 호출
- quiz_answer / 정답 암시 노출
- service role / RLS 완화 / point_ledger 직접 INSERT policy

---

## 구조

```
Consumer UI (QuizSubmitControlledPanel)
  → submitConsumerQuizForRewardAction (server action)
  → submitConsumerQuizForReward (stage3c-submit.server.ts)
  → rpc_stage3b_dev_submit_quiz_reward_transaction
  → sanitized Stage3CSubmitResult DTO
  → UI result message
```

### Server action 경로

`apps/web/src/app/consumer/ads/[campaignId]/actions.ts` — `submitConsumerQuizForRewardAction`

### Controlled campaigns (dev only)

- `e2e00002-…` (reward)
- `e2e00004-…` (low budget)
- `e2e00006-…` (wrong attempts)
- `e2e00008-…` (min-view)
- `e2e0000a-…` (rollback fixture)

### Production gate (app layer)

- `VERCEL_ENV=production` 또는 Supabase ref `vupsalteyltjqumppltc` → `STAGE3C_PRODUCTION_REWARD_BLOCKED`
- Stage 3-B RPC Production gate는 별도 유지 (dual boundary)

### Min-view

- UI: `MinViewTimer` — “광고 내용을 조금 더 확인해 주세요.” / “퀴즈 제출까지 N초”
- 서버/RPC: `STAGE3B_MIN_VIEW_SECONDS_NOT_MET` 최종 권위

### Result code UX

| Code | UX |
|---|---|
| STAGE3B_REWARDED | dev only: “정답입니다. 포인트가 적립되었습니다.” |
| STAGE3B_WRONG_RETRY_ALLOWED | “오답입니다. 한 번 더 도전할 수 있습니다.” |
| STAGE3B_WRONG_FINAL_NO_REWARD | 기회 종료 |
| STAGE3B_DUPLICATE_SUBMISSION_BLOCKED | 이미 처리된 제출 |
| STAGE3B_IDEMPOTENT_DUPLICATE | replay, 추가 적립 없음 |
| STAGE3B_MIN_VIEW_SECONDS_NOT_MET | 최소 열람 시간 미충족 |
| STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT | 예산 소진 |
| STAGE3C_PRODUCTION_REWARD_BLOCKED | 운영 환경 적립 미오픈 |

---

## 검증 스크립트

| Script | 목적 |
|---|---|
| `verify:stage3c-preflight-answer-hint-guard` | 선택지 label / quizzes_public answer-hint blocker |
| `verify:stage3c-client-direct-rpc-guard` | client RPC 직접 호출 금지 |
| `verify:stage3c-quiz-answer-non-exposure` | quiz_answer 계열 키 비노출 |
| `verify:stage3c-dev-ui-controlled-submit` | dev controlled submit 시나리오 |
| `verify:stage3c-production-reward-blocked` | Production mutation 차단 |
| `verify:stage3c-public-marker-guard` | public route machine marker 금지 |

---

## Diagnostics (`/admin/diagnostics` only)

- `stage3CConsumerQuizSubmitUi=true`
- `stage3CRpcName=rpc_stage3b_dev_submit_quiz_reward_transaction`
- `stage3CClientDirectRpcCall=false`
- `stage3CProductionRewardBlocked=true` (on Production)

---

## 알려진 제한사항

- Stage 2-A fixture campaign(`stage2a-fixture-*`)은 controlled integration 대상 아님
- Production reward open은 별도 Stage 승인 필요
- Playwright 기반 full UI E2E는 dev Supabase + 배포 환경 전제

## 다음 후보 Stage

- **Stage 3-D** — Production reward open preflight (별도 승인)
- advertiser campaign authoring / settlement / cash-out 순서는 새 채팅에서 설계
