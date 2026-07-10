# Stage 3-O Privacy Review Questions

Status: READY FOR REVIEW REQUEST. No personal data collection or storage approval is granted by this document.

- PRIVACY-001: Which personal data items are strictly necessary for cash-out identity, bank, tax, dispute, and audit purposes?
- PRIVACY-002: Is it appropriate to store only an identity provider reference or digest and not store names, birth dates, phone numbers, CI, DI, or raw payloads?
- PRIVACY-003: Is it appropriate to store only a bank provider token or reference and avoid storing the full account number?
- PRIVACY-004: Is storing bank name and account-number last four digits necessary and lawful for confirmation, CS support, dispute, or audit?
- PRIVACY-005: Is storing a hash of the bank account number necessary, effective, and still personal or financial personal information?
- PRIVACY-006: What standard prevents identity and bank reason codes from including personal data or raw provider messages?
- PRIVACY-007: What retention period should apply to verification metadata by purpose?
- PRIVACY-008: What deletion, anonymization, or separation rules should apply on withdrawal or deletion request?
- PRIVACY-009: What limited retention exceptions are permissible for fraud investigation, abuse prevention, dispute response, and legal hold?
- PRIVACY-010: What purpose, retention period, notice, consent, masking, or hashing method should apply to IP and user-agent?
- PRIVACY-011: What is the minimum identity and bank verification state that may be shown to admins?
- PRIVACY-012: What masked information, if any, may CS staff view and under what role, logging, and approval controls?
- PRIVACY-013: Is the policy forbidding real personal data in development, preview, local, fixtures, and tests appropriate and sufficient?
- PRIVACY-014: How should deletion or anonymization requests be handled when personal data may exist in backups?
- PRIVACY-015: Who may export identity, bank, tax, cash-out, or audit data, and how should downloads be logged and restricted?
- PRIVACY-016: What outsourcing, overseas transfer, subprocessor, deletion, and audit items must be reviewed for identity, bank, and tax providers?
- PRIVACY-017: What cash-out related items must be added to the privacy policy before collection begins?

The preferred design direction is data minimization and separation of ad consumption preference data from cash-out identity, bank, and tax data. The reviewer should confirm or correct that direction.
