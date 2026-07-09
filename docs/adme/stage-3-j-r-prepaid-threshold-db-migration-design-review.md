# AdMe Stage 3-J-R Prepaid Threshold DB Migration Design Review

작성일: 2026-07-09  
상태: DB migration design review only / read-only admin marker / no implementation

관련:
- [stage-3-i-threshold-based-prepaid-exemption-assumption.md](./stage-3-i-threshold-based-prepaid-exemption-assumption.md)
- [stage-3-j-prepaid-threshold-monitoring-architecture.md](./stage-3-j-prepaid-threshold-monitoring-architecture.md)
- [product-policy-current.md](./product-policy-current.md)
- [stage-roadmap-current.md](./stage-roadmap-current.md)
- [adme-decision-log.md](./adme-decision-log.md)

---

## 1. Stage 3-J-R 목적

Stage 3-J-R은 Stage 3-J에서 설계한 prepaid threshold monitoring architecture 이후 실제 DB 변경으로 바로 진입하지 않고, migration 전에 필요한 schema 후보와 guard 원칙을 문서·SSOT·read-only admin marker·검증 스크립트로 검토한다.

이번 단계는 DB migration design review only다. no DB migration, no Supabase db push, no Production mutation 상태를 유지한다.

---

## 2. Stage 3-I / Stage 3-J 기준 요약

- Stage 3-I는 초기 선불업 등록 면제 가정을 내부 개발 기준으로 고정했다.
- 분기말 발행잔액은 3,000,000,000 KRW 미만이어야 한다.
- 연간 총발행액은 50,000,000,000 KRW 미만이어야 한다.
- 두 기준은 모두 충족되어야 한다.
- Stage 3-J는 runtime 구현 없이 threshold evaluator와 read-only preflight로 architecture를 고정했다.
- runtime threshold monitoring is not implemented.
- actual production threshold values are not available.
- calculation source is not finalized.

---

## 3. 이번 단계의 범위

- design review only
- no DB migration
- no Supabase db push
- no Production mutation
- no runtime threshold monitoring
- no reward open execution
- no point_ledger mutation
- no cash-out actual implementation
- no partner settlement actual implementation

Stage 3-J-R은 실제 SQL, trigger, RPC, table creation을 만들지 않는다.

---

## 4. threshold 산정 대상 정의

### quarter-end outstanding balance

분기말 발행잔액은 기준 분기 말일의 미상환 prepaid point liability snapshot으로 설계한다. point_ledger를 장래 SSOT로 삼되, Stage 3-J-R에서는 DB 값을 읽거나 산출하지 않는다.

권장 관계:

- advertiser prepaid charge: 향후 발행 가능 재원을 증가시키는 입력으로 보되, 그 자체가 소비자 발행액은 아니다.
- reward issuance: 소비자에게 지급된 포인트로 outstanding balance와 annual total issued에 증가 방향으로 반영하는 후보다.
- cash_out: 소비자 포인트 소멸/현금전환 완료 시 outstanding balance를 감소시키는 후보다.
- refund: 광고주 충전 환불은 미사용 prepaid liability 조정 후보이며, 소비자 발행분 환수와 구분해야 한다.
- expire: 유효기간 만료로 소비자 청구권이 소멸되면 outstanding balance 감소 후보다.
- adjust: 오류 정정은 append-only ledger 조정으로 반영하되 reason_code와 audit trail이 필요하다.
- breakage: 정책 승인 전 수익 인식은 금지하고, threshold 산정에서는 소멸 확정 시점과 회계 인식 시점을 분리해야 한다.

### annual total issued

연간 총발행액은 해당 연도에 소비자에게 새로 부여된 prepaid point issuance 누계 후보다. cash_out, expire, refund, breakage로 이미 발행된 금액을 소급 차감하지 않는 보수 설계를 기본 후보로 둔다. 단, 오류 정정 adjust는 source_digest와 audit log를 통해 별도 검토한다.

---

## 5. 추천 DB 설계 후보

### A. prepaid_threshold_daily_snapshots

- id
- snapshot_date
- quarter_key
- year_key
- outstanding_balance_krw
- annual_total_issued_krw
- quarter_end_outstanding_balance_limit_krw
- annual_total_issued_limit_krw
- status
- created_at
- created_by
- source_digest

용도: 일 단위 내부 snapshot 후보. `(snapshot_date)` unique constraint와 `(quarter_key, snapshot_date)` index를 권장한다.

### B. prepaid_threshold_quarter_end_snapshots

- id
- quarter_key
- quarter_end_date
- outstanding_balance_krw
- limit_krw
- ratio
- status
- finalized_at
- finalized_by
- source_digest

용도: 분기말 발행잔액 기준의 final snapshot 후보. `(quarter_key)` unique constraint를 권장한다.

### C. prepaid_annual_issuance_aggregates

- id
- year_key
- annual_total_issued_krw
- limit_krw
- ratio
- status
- calculated_at
- source_digest

용도: 연간 총발행액 aggregate 후보. `(year_key)` unique constraint를 권장한다.

### D. prepaid_threshold_audit_logs

- id
- event_type
- previous_status
- next_status
- reason_code
- threshold_payload
- created_at
- created_by

용도: status 전환, source_digest 변경, manual finalize, guard block 이벤트 감사 후보. append-only를 권장한다.

### E. prepaid_registration_transition_events

- id
- transition_status
- trigger_reason
- threshold_payload
- required_action
- created_at
- resolved_at

용도: exceeded 상태에서 registration track required로 전환되는 운영 이벤트 후보다.

---

## 6. 추천 status enum

- `unknown_blocked`
- `normal`
- `warning`
- `hard_stop_blocked`
- `exceeded_blocked`
- `registration_track_required`

`unknown_blocked`, `hard_stop_blocked`, `exceeded_blocked`, `registration_track_required`는 issuance guard에서 차단 상태로 설계한다.

---

## 7. 추천 RPC 설계 후보

- `rpc_stage3jr_design_only_calculate_prepaid_threshold_status`
- `rpc_stage3jr_design_only_assert_prepaid_threshold_allows_issuance`

이 이름은 설계 후보다. 실제 구현은 후속 Stage에서만 가능하다. runtime threshold monitoring is not implemented.

권장 원칙:

- calculate RPC는 daily snapshot, quarter-end snapshot, annual aggregate 후보를 읽어 status와 reason_code를 반환한다.
- assert RPC는 point issuance 전 guard 후보로, threshold unknown blocks issuance, hard stop blocks issuance, exceeded 상태 차단을 강제한다.
- SECURITY DEFINER 사용 시 search_path 고정, role check, immutable audit payload, idempotency key가 필요하다.

---

## 8. 추천 RLS 설계

- admin read-only: admin route/service admin만 snapshot과 audit log 조회 가능
- service role / SECURITY DEFINER write only: batch 또는 approved backend job만 snapshot finalize/write 가능
- consumer/advertiser/partner direct access blocked: 직접 select/insert/update/delete 금지
- audit log append-only: update/delete 금지
- registration transition event는 resolved_at 변경도 admin/service 경로로만 허용

---

## 9. 추천 index / unique constraint 설계

- `prepaid_threshold_daily_snapshots(snapshot_date)` unique
- `prepaid_threshold_daily_snapshots(quarter_key, snapshot_date)`
- `prepaid_threshold_daily_snapshots(year_key, snapshot_date)`
- `prepaid_threshold_quarter_end_snapshots(quarter_key)` unique
- `prepaid_annual_issuance_aggregates(year_key)` unique
- `prepaid_threshold_audit_logs(created_at)`
- `prepaid_threshold_audit_logs(event_type, created_at)`
- `prepaid_registration_transition_events(transition_status, created_at)`
- `source_digest`는 snapshot 재계산 idempotency와 drift detection 용도 index 후보

---

## 10. source_digest / idempotency 설계

`source_digest`는 산정 원천 범위, 기준 시각, ledger range, aggregate query version, excluded event policy를 canonical JSON으로 정규화한 뒤 hash한 값으로 설계한다.

같은 `snapshot_date` 또는 `year_key`에서 같은 `source_digest`가 반복되면 idempotent replay로 처리한다. 다른 digest가 들어오면 audit log에 previous/next payload를 append하고 admin preflight에서 drift review required를 표시하는 후보를 둔다.

---

## 11. threshold unknown 처리 원칙

threshold unknown blocks issuance. 분기말 발행잔액 또는 연간 총발행액 중 하나라도 null, stale, unfinalized, source_digest missing, reconciliation pending이면 issuance guard는 차단으로 설계한다.

---

## 12. hard stop 처리 원칙

hard stop blocks issuance. 95% 이상 도달 시 신규 발행을 차단하고 registration preparation required 상태를 admin preflight에 표시하는 후보를 둔다.

---

## 13. exceeded 처리 및 registration track 전환 원칙

threshold exceeded switches to registration track. 기준 도달 또는 초과 시 `exceeded_blocked`에서 `registration_track_required` 운영 이벤트를 생성하는 설계를 권장한다. 실제 전환 이벤트 생성은 후속 Stage의 승인된 DB/RPC 구현에서만 가능하다.

---

## 14. admin preflight에서 보여야 할 값

- Prepaid Threshold DB Migration Design Review
- DB migration design is reviewed
- Actual DB migration is not implemented
- Supabase db push is not executed
- Runtime threshold monitoring is not implemented
- This is read-only design review only
- quarter-end outstanding balance limit
- annual total issued limit
- warning ratio
- hard stop ratio
- actual production threshold values are not available
- calculation source is not finalized
- threshold unknown blocks issuance
- hard stop blocks issuance
- threshold exceeded switches to registration track

---

## 15. migration 구현 전 추가 검토사항

- point_ledger entry_type별 threshold 반영 방향 확정
- advertiser prepaid charge와 consumer point issuance의 분리 기준 확정
- cash_out 완료 시점과 outstanding balance 감소 시점 확정
- refund/expire/breakage/adjust 반영 기준 확정
- source_digest canonical payload 확정
- admin read-only role mapping 확정
- SECURITY DEFINER write path와 audit append-only 보장 방식 확정
- daily/quarter/year aggregate backfill 정책 확정
- production threshold 값 검증 방식 확정

---

## 16. Stage 3-J-R에서 하지 않는 것

- actual DB migration 구현
- supabase/migrations 하위 신규 SQL 추가
- Supabase db push/reset/repair
- Production mutation
- Production reward mutation
- Production point_ledger mutation
- Production campaign budget mutation
- Production users balance mutation
- Production ad_views mutation
- Production cash_redemption_requests mutation
- Production partner_settlements mutation
- runtime threshold monitoring 구현
- actual production threshold values 산출
- calculation source 확정
- actual reward open 허용
- cash-out actual implementation
- partner settlement actual implementation

---

## 17. 완료 기준

- Stage 3-J-R SSOT가 design reviewed=true, read-only design only=true, DB/RPC/runtime/mutation flags=false를 반환한다.
- 추천 table, RLS, RPC, index, audit log, admin preflight 설계 후보가 문서화된다.
- `/admin/prepaid-threshold-preflight`, `/admin/compliance-preflight`, `/admin/diagnostics`에 admin-only marker가 노출된다.
- public route에는 `stage3JR` 또는 Prepaid Threshold DB Migration Design Review 문구가 노출되지 않는다.
- no DB migration, no Supabase db push, no Production mutation 상태가 검증된다.
- runtime threshold monitoring is not implemented.
- actual production threshold values are not available.
- calculation source is not finalized.
