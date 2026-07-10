# Stage 3-O Bank / Account Verification Provider Candidate Questions

Status: READY FOR PROVIDER CONFIRMATION REQUEST. No bank API is called and no SDK is installed by this document.

- BANK-PROVIDER-001: Does the provider support real-name bank account verification suitable for cash-out?
- BANK-PROVIDER-002: Can AdMe integrate without storing full account numbers in its application database?
- BANK-PROVIDER-003: Does the provider return a reusable account token or reference for future payouts?
- BANK-PROVIDER-004: What validity period, revocation model, and re-verification rule applies to account references?
- BANK-PROVIDER-005: Must users re-enter or re-verify account information before each payout?
- BANK-PROVIDER-006: Does the provider return bank name and account-number last four digits, and can those fields be suppressed?
- BANK-PROVIDER-007: How is account holder match, mismatch, partial match, or unavailable result represented?
- BANK-PROVIDER-008: Can dormant, closed, suspended, or changed account status be detected after verification?
- BANK-PROVIDER-009: How are dormant, closed, restricted, or invalid accounts handled before payout?
- BANK-PROVIDER-010: What callback/webhook signature verification, replay prevention, and event id controls are supported?
- BANK-PROVIDER-011: What idempotency keys and duplicate payout or duplicate verification safeguards are supported?
- BANK-PROVIDER-012: Is a sandbox available without real bank account data, and how close is it to production?
- BANK-PROVIDER-013: What personal data outsourcing, overseas transfer, and subprocessor disclosures apply?
- BANK-PROVIDER-014: Can AdMe avoid storing raw bank provider payloads and still prove verification results?
- BANK-PROVIDER-015: Does the integration require access tokens, refresh tokens, certificates, or secrets to be stored by AdMe?
- BANK-PROVIDER-016: What cost, SLA, support, retry, outage, and settlement delay procedures apply?

Provider answers should identify whether each capability is supported, unsupported, conditional, or requires contract review. Stage 3-O does not collect or store account numbers, account last four digits, hashes, or provider tokens.
