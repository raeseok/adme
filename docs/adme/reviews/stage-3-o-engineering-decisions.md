# Stage 3-O Engineering Decision Questions

Status: DRAFT ENGINEERING DECISION PACK. No implementation decision is finalized in Stage 3-O.

- ENGINEERING-001: Which request-time fields must be immutable snapshots for a cash redemption request?
- ENGINEERING-002: Should snapshots store raw values, provider references, digests, evaluator outputs, or a hybrid?
- ENGINEERING-003: Which statuses should remain text plus CHECK constraints in the first migration?
- ENGINEERING-004: Which taxonomies need lookup tables for labels, deprecation, metadata, or admin display?
- ENGINEERING-005: What relationship should exist between current-state projection tables and append-only history events?
- ENGINEERING-006: What canonical serialization, field ordering, redaction, and hashing rules should produce `source_digest`?
- ENGINEERING-007: What namespace and scope should idempotency keys use across users, providers, requests, and admin actions?
- ENGINEERING-008: What fields define duplicate callback events for identity and bank provider callbacks?
- ENGINEERING-009: What actor, target, reason, previous status, new status, and evidence fields should be recorded for manual admin actions?
- ENGINEERING-010: Which objects may be included in a later dev-only migration after explicit approval?

Engineering decisions must remain subordinate to later legal, tax, privacy, security, provider, and business-owner approvals. This document does not authorize SQL, RLS, RPC, SECURITY DEFINER functions, callbacks, webhooks, or cash-out mutations.
