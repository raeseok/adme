# Stage 3-O Business Owner Decision Questions

Status: DRAFT DECISION PACK. No option is selected in Stage 3-O.

- BUSINESS-001: Should AdMe allow any dev-only migration before external review is complete?
  Options: A. no migration before external review; B. empty schema and constraints without sensitive fields only; C. provider-neutral schema and RLS only; D. RPC stubs also allowed; defer.
  Impact: A minimizes rollback and compliance risk but slows engineering. B allows early shape validation with rework risk. C tests access control but may encode premature assumptions. D increases velocity with the highest rollback and review cost.
- BUSINESS-002: Should admin cash-out review use one-person approval or maker-checker approval?
- BUSINESS-003: Should AdMe define a high-value cash-out threshold that triggers extra review?
- BUSINESS-004: How often should identity verification expire or require re-verification?
- BUSINESS-005: How often should bank account verification expire or require re-verification?
- BUSINESS-006: Does CS need to see bank account last four digits, or is coarse status sufficient?
- BUSINESS-007: Should points be deducted at request submission, approval, transfer completion, or held separately?
- BUSINESS-008: Until what point may a user cancel a cash-out request?
- BUSINESS-009: What target processing time should be promised or internally tracked?
- BUSINESS-010: When should payment be held for dispute, abuse, fraud investigation, or legal review?

Each decision should later record the selected option, rationale, affected policies, affected UI, affected operations, rollback cost, and whether external legal, tax, privacy, or security review must be completed first.
