# AdMe Stage 4-B Partner Dashboard Investor Demo Flow

Stage 4-B implements a partner-facing investor demo for regional partner operations. It is a deterministic sandbox that shows assigned region, advertiser portfolio, campaign aggregates, monthly ad spend, estimated partner revenue, monthly settlement status, regional demand insights, and Partner Demo Reset.

## Scope

- Partner routes: `/partner`, `/partner/dashboard`, `/partner/advertisers`, `/partner/advertisers/[advertiserId]`, `/partner/settlements`, `/partner/settlements/[settlementId]`, `/partner/insights`.
- Admin demo routes: `/admin/partner-settlements`, `/admin/partner-settlements/[settlementId]`.
- Browser-only demo store with schema version `adme-stage4b-partner-demo-v1`.
- Deterministic aggregate fixture data only.

## Safety Boundary

Production DB mutation is disabled. Dev DB migration is not required and not implemented. Stage 4-B does not insert, update, delete, or upsert `partners`, `advertisers`, `campaigns`, `partner_settlements`, `point_ledger`, or `ad_views`.

Actual partner settlement, actual payout, actual tax processing, actual contract processing, and actual account data storage are out of scope. The admin settlement controls only mutate browser demo state.

## Taxonomy

The current DB enum for settlement status is `pending`, `approved`, `paid`, `cancelled`. Stage 3-G design documents describe the future status-machine principle as `pending -> confirmed -> paid`; Stage 4-B follows the implemented enum for demo state and labels it as review pending, approved, paid, and cancelled.

The current `partners` table uses `is_active`; Stage 3-G documents a future `partners.status='terminated'` policy. Stage 4-B uses a demo-only contract taxonomy of `active`, `pending_review`, and `terminated` without writing to the database.

## Business Rules

- Advertiser attribution is fixed to the demo `partnerId` at fixture creation time.
- Partner settlement is monthly and never calculated at quiz pass time.
- Partner share is 30% of confirmed ad spend.
- All money calculations are integer won calculations.
- Paid settlement rows are not mutated in real storage; demo state changes are browser-only.
- Consumer PII, user UUID, raw profile data, raw ad views, raw point ledger rows, and quiz answers are not exposed.

## Verification

`npm run verify:stage4b-partner-dashboard-demo` checks required files and routes, visible markers, deterministic fixtures, integer settlement calculations, fixed advertiser partner attribution, Demo Reset isolation, diagnostics markers, and mutation/PII guards.
