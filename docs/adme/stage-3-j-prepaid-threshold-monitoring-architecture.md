# AdMe Stage 3-J Prepaid Threshold Monitoring Architecture Design

작성일: 2026-07-09  
상태: threshold monitoring architecture only / read-only preflight / evaluator design

관련:
- [stage-3-i-threshold-based-prepaid-exemption-assumption.md](./stage-3-i-threshold-based-prepaid-exemption-assumption.md)
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 1. Stage 3-J 목적

Stage 3-J는 Stage 3-I에서 확정한 threshold-based prepaid registration exemption assumption 이후, 실제 point issuance 또는 reward open 전 필요한 threshold monitoring architecture를 문서·SSOT·read-only UI·검증 스크립트로 고정한다.

이번 단계는 threshold monitoring architecture only다. no DB migration, no Production mutation 상태를 유지한다. actual reward open remains blocked.

---

## 2. Stage 3-I에서 확정된 기준 요약

- 초기에는 선불업 등록 없이 운영하는 내부 개발 가정을 둔다.
- 분기말 발행잔액은 3,000,000,000 KRW 미만이어야 한다.
- 연간 총발행액은 50,000,000,000 KRW 미만이어야 한다.
- 두 기준은 모두 충족되어야 한다.
- threshold unknown blocks issuance.
- threshold exceeded switches to registration track.
- warning ratio는 80%, hard stop ratio는 95%다.

---

## 3. threshold monitoring이 필요한 이유

등록 면제 가정은 실제 발행잔액과 연간 총발행액이 기준 아래에 있음을 계속 확인할 때만 개발상 유지할 수 있다. actual production threshold values are not available in Stage 3-J. calculation source is not finalized in Stage 3-J.

따라서 Stage 3-J는 실제 산출을 시작하지 않고, 향후 산출·조회·차단 guard가 따라야 할 판정 원칙을 먼저 고정한다.

---

## 4. threshold 산정 범위

### 분기말 발행잔액

분기말 발행잔액은 향후 기준 시점 snapshot으로 산정되어야 한다. Stage 3-J에서는 실제 DB 값을 읽지 않는다.

### 연간 총발행액

연간 총발행액은 향후 해당 연도 발행 누계 aggregate로 산정되어야 한다. Stage 3-J에서는 실제 누계를 계산하지 않는다.

### 두 기준 모두 충족 필요

두 기준 중 하나라도 unknown, hard stop, exceeded 상태이면 point issuance guard는 차단 쪽으로 설계한다.

---

## 5. threshold 판정 상태 머신

- `unknown_blocked`: 분기말 발행잔액 또는 연간 총발행액 중 하나라도 null이면 차단한다.
- `normal`: 두 값 모두 warning 미만이면 threshold gate는 정상 상태다.
- `warning`: 둘 중 하나라도 80% 이상이면 등록 준비 검토가 필요하다.
- `hard_stop_blocked`: 둘 중 하나라도 95% 이상이면 hard stop blocks issuance.
- `exceeded_blocked`: 둘 중 하나라도 면제 기준에 도달하거나 초과하면 차단하고 registration track으로 전환한다.

---

## 6. warning / hard stop 기준

- 80% warning: 분기말 발행잔액 2,400,000,000 KRW 또는 연간 총발행액 40,000,000,000 KRW 이상.
- 95% hard stop: 분기말 발행잔액 2,850,000,000 KRW 또는 연간 총발행액 47,500,000,000 KRW 이상.
- 기준 도달/초과: 분기말 발행잔액 3,000,000,000 KRW 또는 연간 총발행액 50,000,000,000 KRW 이상.

---

## 7. threshold evaluator 설계

`evaluatePrepaidThresholdGate`는 입력값만 받아 threshold gate 판정 결과를 반환하는 순수 함수다. Supabase, DB, mutation, runtime flag 변경을 수행하지 않는다.

반환값은 `status`, `thresholdGateAllowsIssuance`, `requiresRegistrationPreparation`, `requiresRegistrationTrack`, 기준 금액, ratio, `reasonCodes`를 포함한다. threshold gate가 정상이어도 전체 reward open 여부는 release flag, kill switch, controlled approval, 후속 monitoring 구현 상태, owner approval을 함께 봐야 한다.

---

## 8. 향후 DB 설계 후보

- `prepaid_threshold_daily_snapshots`
- `prepaid_threshold_quarter_end_snapshots`
- `prepaid_annual_issuance_aggregates`
- `prepaid_threshold_audit_logs`
- `prepaid_registration_transition_events`

이번 Stage에서는 위 table 또는 column을 만들지 않는다.

---

## 9. 향후 runtime guard 설계 후보

- point issuance 전 threshold 조회
- threshold unknown이면 차단
- hard stop 이상이면 차단
- exceeded이면 registration track 전환
- daily aggregation, quarter-end snapshot, annual aggregate reconciled 상태 확인

후속 단계에서 runtime monitoring과 DB migration은 별도 승인 후 다룬다.

---

## 10. 관리자 preflight 설계

`/admin/prepaid-threshold-preflight`는 read-only placeholder다.

표시해야 하는 상태:

- Threshold monitoring architecture is designed
- Runtime threshold monitoring is not implemented
- Actual production threshold values are not available
- Calculation source is not finalized
- Threshold unknown blocks issuance
- Hard stop blocks issuance
- Threshold exceeded switches to registration track
- Actual reward open remains blocked
- No production reward mutation
- No DB migration in Stage 3-J

---

## 11. Stage 3-J에서 하지 않는 것

- 실제 reward open
- 실제 point issuance 구현
- 실제 발행잔액 또는 연간 총발행액 DB 산출
- cash-out actual implementation
- partner settlement actual implementation
- monthly settlement batch 구현
- partner payout action 구현
- DB migration
- Supabase db push/reset/repair
- Production reward mutation
- Production point_ledger mutation
- Production campaign budget mutation
- Production users balance mutation
- Production ad_views mutation
- Production cash_redemption_requests mutation
- Production partner_settlements mutation

---

## 12. 완료 기준

- Stage 3-J SSOT가 architecture designed=true, runtime monitoring implemented=false, DB migration implemented=false 상태를 반환한다.
- `prepaid-threshold-evaluator.ts`가 unknown, normal, warning, hard stop, exceeded 판정 규칙을 순수 함수로 제공한다.
- `/admin/prepaid-threshold-preflight`, `/admin/compliance-preflight`, `/admin/diagnostics`에서 admin-only marker를 확인할 수 있다.
- public route에는 Stage 3-J marker 또는 Prepaid Threshold Monitoring Architecture 문구가 노출되지 않는다.
- 검증 스크립트가 필수 marker, 보수 표현, evaluator 판정, mutation 금지, DB migration 금지, public marker guard를 확인한다.
- actual reward open remains blocked.
