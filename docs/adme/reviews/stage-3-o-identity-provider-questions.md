# Stage 3-O Identity Provider Candidate Questions

Status: READY FOR PROVIDER CONFIRMATION REQUEST. No provider is selected or integrated by this document.

- IDENTITY-PROVIDER-001: Which identity verification methods are available and suitable for AdMe cash-out verification?
- IDENTITY-PROVIDER-002: What result callback format, required fields, optional fields, and error model are provided?
- IDENTITY-PROVIDER-003: Is the transaction/reference id stable, unique, non-reusable, and queryable over time?
- IDENTITY-PROVIDER-004: Can the provider support duplicate person/account detection without exposing raw identity values?
- IDENTITY-PROVIDER-005: Can the provider supply CI or DI, and under what legal, contractual, and technical constraints?
- IDENTITY-PROVIDER-006: Can AdMe prevent duplicate cash-out accounts without storing CI or DI directly?
- IDENTITY-PROVIDER-007: Can the integration avoid sending name, birth date, or mobile phone number raw values back to AdMe?
- IDENTITY-PROVIDER-008: Can AdMe avoid storing raw provider responses while still requerying or verifying result evidence?
- IDENTITY-PROVIDER-009: For how long can a verification result be revalidated or queried?
- IDENTITY-PROVIDER-010: What callback signature, timestamp, nonce, and canonicalization method is supported?
- IDENTITY-PROVIDER-011: What replay prevention, event id, nonce, and duplicate callback controls are supported?
- IDENTITY-PROVIDER-012: Is a sandbox available without real personal data, and how closely does it match production?
- IDENTITY-PROVIDER-013: Can development and production credentials, callbacks, and data retention be separated?
- IDENTITY-PROVIDER-014: Where is verification data stored and processed?
- IDENTITY-PROVIDER-015: Does any overseas transfer, remote access, or cross-border subprocessing occur?
- IDENTITY-PROVIDER-016: What subprocessors are used and how are changes notified?
- IDENTITY-PROVIDER-017: What data deletion or return process applies when the contract ends?
- IDENTITY-PROVIDER-018: What rate limits, uptime SLA, incident process, and support commitments apply?
- IDENTITY-PROVIDER-019: What setup, per-verification, requery, failure, and support costs apply?

Provider answers should be recorded as capability evidence only. Stage 3-O does not create callbacks, webhooks, credentials, SDK installation, API calls, or provider secrets.
