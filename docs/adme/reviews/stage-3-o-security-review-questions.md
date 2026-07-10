# Stage 3-O Security Review Questions

Status: READY FOR REVIEW REQUEST. No security implementation, callback endpoint, webhook, credential storage, or RLS change is made by this document.

- SECURITY-001: What signature, certificate, timestamp, and canonical payload verification should be required for provider callbacks?
- SECURITY-002: What nonce, timestamp, source digest, event id, and replay window controls should prevent callback replay?
- SECURITY-003: What idempotency scope should apply to provider transaction ids and callback event ids?
- SECURITY-004: Is the principle of not storing provider access tokens, refresh tokens, OAuth codes, or provider secrets in app tables feasible?
- SECURITY-005: If provider credentials are unavoidable, where should they be stored and what rotation, access, and incident procedures are required?
- SECURITY-006: What redaction standard should block identity, bank, tax, provider reference, and failure reason data from logs, APM, analytics, and support tools?
- SECURITY-007: What role, authentication, session, IP, device, and audit controls are required for admin identity and bank review screens?
- SECURITY-008: Should cash-out review, bank correction, high-value payout, or data export require maker-checker approval?
- SECURITY-009: Should high-value cash-out requests require additional approval, anomaly detection, cooldown, or manual investigation?
- SECURITY-010: What controls are needed to make audit logs append-only and tamper-evident?
- SECURITY-011: Who may export audit logs and what approval, masking, retention, and download controls are required?
- SECURITY-012: What encryption, key management, restore approval, and access logging should apply to backups containing future cash-out metadata?
- SECURITY-013: What incident response, containment, notification, and evidence preservation procedure is required for identity, bank, or tax data exposure?
- SECURITY-014: How should provider outage, response tampering, callback delay, duplicate callback, and partial failure be handled safely?
- SECURITY-015: What technical controls should prevent real personal, bank, provider, or tax data from entering non-production environments?

Review output should identify required controls before dev migration, provider integration, personal data collection, production migration, and actual cash-out execution.
