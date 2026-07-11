# AdMe Stage 4-A Advertiser Console Investor Demo Flow

Stage 4-A implements an investor-facing advertiser console sandbox. It demonstrates the complete advertiser journey from dashboard to campaign creation, consumer preview, admin review, approval, performance dashboard, and demo reset.

## Scope

- Advertiser dashboard, campaign list, five-step campaign wizard, campaign detail, preview, performance dashboard.
- Minimal admin campaign review flow for Stage 4-A demo campaigns.
- Deterministic browser-only demo state with schema version `adme-stage4a-advertiser-demo-v1`.
- Production guided demo only. No Supabase mutation, no SQL migration, no campaign execution, no advertiser payment, no point budget deduction.

## Production Safety

Production campaign mutation is disabled. Production DB mutation is disabled. Stage 4-A routes do not call Supabase mutation methods or mutation RPCs.

Forbidden operations:

- `campaigns` INSERT/UPDATE/DELETE.
- `point_ledger` mutation.
- advertiser payment, PG SDK, webhook, callback, settlement, or actual ad execution.
- personal data collection, account information, tax calculation, transfer, or service role exposure.
- quiz answer exposure to consumer preview, diagnostics, URL query, browser store, console logging, or shared serialized campaign DTO.

## Demo State

The browser store may persist only campaign demo IDs, status values, event timeline, answerRegistered boolean, submitted campaign ID, and reset version. It must not persist real quiz answer values, email, phone, business registration number, account information, user UUID, auth token, Supabase key, or personal data.

Allowed status transitions:

- draft -> ready_for_preview
- ready_for_preview -> draft
- ready_for_preview -> submitted
- submitted -> under_review
- under_review -> changes_requested
- changes_requested -> draft
- under_review -> approved
- under_review -> rejected
- approved -> active
- active -> completed

Invalid transitions are blocked in the Stage 4-A state machine.

## Visible Markers

- Stage 4-A Advertiser Console Investor Demo Flow
- 투자자 데모 · 광고주 콘솔
- DEMO / SANDBOX — 실제 결제·캠페인 집행 없음
- 소비자의 개인 식별 정보는 광고주에게 제공되지 않습니다.
- 정답은 서버 전용 정보이며 소비자 화면에 노출되지 않습니다.
- 투자자 데모 · 캠페인 검토
- Production DB mutation 없음
- Demo Performance Data

## Verification

`npm run verify:stage4a-advertiser-console-demo` checks required routes, visible markers, diagnostics markers, deterministic fixtures, integer point calculations, invalid transition blocking, quiz answer non-exposure, browser store safety, no Stage 4-A SQL migration, and no production mutation code.
