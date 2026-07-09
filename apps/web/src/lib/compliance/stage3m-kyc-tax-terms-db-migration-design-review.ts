import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";
import {
  BANK_ACCOUNT_VERIFICATION_STATUSES,
  CASH_OUT_GATE_DESIGN_STATUSES,
  IDENTITY_VERIFICATION_STATUSES,
  MARKETING_CONSENT_STATUSES,
  TAX_PROFILE_STATUSES,
  TERMS_ACCEPTANCE_STATUSES,
} from "./stage3l-kyc-tax-terms-design";

export const STAGE3M_KYC_TAX_TERMS_DB_MIGRATION_DESIGN_REVIEW_BUILD =
  "stage3m-kyc-tax-terms-db-migration-design-review";

export const STAGE3M_METADATA = {
  stageId: "3-M",
  stageName: "KYC/Tax/Terms DB Migration Design Review",
  designReviewOnly: true,
  migrationImplemented: false,
  migrationFileCreated: false,
  supabaseDbPushExecuted: false,
  productionMutation: false,
  actualPersonalDataCollectionImplemented: false,
  identityProviderIntegrated: false,
  bankApiIntegrated: false,
  taxFilingImplemented: false,
  withholdingCalculationImplemented: false,
  actualCashOutProcessingAllowed: false,
  legalConclusionDeclared: false,
  externalLegalTaxReviewStillRequired: true,
} as const;

type RlsAccess = "blocked" | "masked_status_read" | "admin_status_read" | "server_only";

export type Stage3MDbObjectReview = {
  objectName: string;
  purpose: string;
  ownerPrincipal: string;
  sensitivityClassification: string;
  proposedPrimaryKey: string;
  proposedForeignKeys: readonly string[];
  cardinality: string;
  immutableFields: readonly string[];
  mutableFields: readonly string[];
  statusField: string;
  statusTransitionOwner: string;
  retentionDeletionConsideration: string;
  rlsReadPolicyProposal: string;
  rlsWritePolicyProposal: string;
  serverOnlyWriteRequirement: string;
  auditRequirement: string;
  rawSensitiveDataProhibition: string;
  implementationStatus: "design_review_only";
};

export const STAGE3M_PROPOSED_DB_OBJECT_INVENTORY = [
  {
    objectName: "consumer_identity_verifications",
    purpose: "Track masked KYC verification state and provider reference digests.",
    ownerPrincipal: "consumer owner with trusted server authority",
    sensitivityClassification: "highly_sensitive_identity_metadata_no_raw_identity",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: ["consumer_user_id -> auth.users.id"],
    cardinality: "many verification attempts per consumer; one current projection may be derived",
    immutableFields: ["id", "consumer_user_id", "provider_ref_digest", "created_at", "source_digest"],
    mutableFields: ["status", "verified_at", "expires_at", "failure_reason_code", "revoked_at"],
    statusField: "identity_verification_status",
    statusTransitionOwner: "trusted server/RPC or approved admin review only",
    retentionDeletionConsideration:
      "policy_unresolved; external_legal_review_required; implementation_blocked_until_policy_resolved",
    rlsReadPolicyProposal:
      "consumer owner reads masked status metadata only; admin UI reads status only; advertiser/partner blocked",
    rlsWritePolicyProposal: "direct client INSERT/UPDATE/DELETE blocked",
    serverOnlyWriteRequirement: "record_identity_verification_result",
    auditRequirement: "append identity status transition event without raw identity data",
    rawSensitiveDataProhibition:
      "no resident registration number, document image, provider raw id, provider raw response, OAuth token, or OAuth code",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "consumer_bank_account_verifications",
    purpose: "Track masked bank account verification state for cash-out readiness.",
    ownerPrincipal: "consumer owner with trusted server authority",
    sensitivityClassification: "highly_sensitive_financial_metadata_no_raw_account",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: ["consumer_user_id -> auth.users.id"],
    cardinality: "many verification attempts per consumer; only one active verified reference recommended",
    immutableFields: ["id", "consumer_user_id", "provider_ref_digest", "created_at", "source_digest"],
    mutableFields: ["status", "verified_at", "expires_at", "failure_reason_code", "revoked_at"],
    statusField: "bank_account_verification_status",
    statusTransitionOwner: "trusted server/RPC or approved admin review only",
    retentionDeletionConsideration:
      "policy_unresolved; provider reference disposal and verification expiry require external review",
    rlsReadPolicyProposal:
      "consumer owner reads masked status and optional last4 only; admin UI reads status only; advertiser/partner blocked",
    rlsWritePolicyProposal: "direct client INSERT/UPDATE/DELETE blocked",
    serverOnlyWriteRequirement: "record_bank_verification_result",
    auditRequirement: "append bank verification transition event without account number or raw provider response",
    rawSensitiveDataProhibition:
      "no raw account number, no raw account holder name, no bank API raw response, no access token, no refresh token",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "consumer_tax_profiles",
    purpose: "Track tax profile review status required before manual cash-out processing.",
    ownerPrincipal: "trusted compliance server/admin review",
    sensitivityClassification: "sensitive_tax_metadata_no_tax_filing",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: ["consumer_user_id -> auth.users.id"],
    cardinality: "many review snapshots per consumer; current status derived from latest accepted snapshot",
    immutableFields: ["id", "consumer_user_id", "review_basis_version", "created_at", "source_digest"],
    mutableFields: ["status", "reviewed_at", "required_data_missing_codes", "manual_review_reason_code"],
    statusField: "tax_profile_status",
    statusTransitionOwner: "trusted server/RPC or approved compliance admin only",
    retentionDeletionConsideration:
      "external_legal_review_required; tax record retention unresolved; implementation blocked",
    rlsReadPolicyProposal:
      "consumer owner reads coarse status only; admin UI reads status/reason codes only; advertiser/partner blocked",
    rlsWritePolicyProposal: "direct client INSERT/UPDATE/DELETE blocked",
    serverOnlyWriteRequirement: "record_tax_profile_review",
    auditRequirement: "append tax profile review transition with policy version and reason code",
    rawSensitiveDataProhibition:
      "no full tax identifier, no tax filing payload, no withholding calculation result treated as final legal conclusion",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "legal_document_versions",
    purpose: "Store immutable legal document version metadata and content hash.",
    ownerPrincipal: "trusted legal/admin publishing workflow",
    sensitivityClassification: "policy_metadata_public_limited",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: [],
    cardinality: "many versions per document type and locale",
    immutableFields: ["id", "document_type", "version", "content_hash", "locale", "created_at"],
    mutableFields: ["published_at", "effective_at", "retired_at", "required"],
    statusField: "document_lifecycle_status",
    statusTransitionOwner: "trusted legal/admin publishing workflow",
    retentionDeletionConsideration: "past document versions should remain immutable for acceptance evidence",
    rlsReadPolicyProposal: "read via controlled DTO; direct table public read not required in this review",
    rlsWritePolicyProposal: "direct client writes blocked",
    serverOnlyWriteRequirement: "future legal document publish path",
    auditRequirement: "append publish/retire event with content hash and actor",
    rawSensitiveDataProhibition: "no personal data in document metadata",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "consumer_legal_acceptances",
    purpose: "Append legal acceptance, reacceptance, revocation, and withdrawal events.",
    ownerPrincipal: "consumer owner via trusted server action/RPC",
    sensitivityClassification: "consent_history_metadata",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: [
      "consumer_user_id -> auth.users.id",
      "legal_document_version_id -> legal_document_versions.id",
    ],
    cardinality: "many append-only events per consumer and document type",
    immutableFields: ["id", "consumer_user_id", "legal_document_version_id", "event_type", "occurred_at"],
    mutableFields: [],
    statusField: "terms_acceptance_status projection",
    statusTransitionOwner: "trusted server action/RPC after consumer intent validation",
    retentionDeletionConsideration:
      "acceptance evidence retention unresolved; external_legal_review_required",
    rlsReadPolicyProposal: "consumer owner reads limited acceptance status; admin UI reads status only",
    rlsWritePolicyProposal: "append through server-only path; no UPDATE overwrite",
    serverOnlyWriteRequirement: "accept_legal_document_version",
    auditRequirement: "append acceptance audit event with document version and source digest",
    rawSensitiveDataProhibition: "no full IP/user agent unless separately approved; prefer hash/digest",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "consumer_marketing_consents",
    purpose: "Append optional marketing consent opt-in, opt-out, withdrawal, and reconfirm events.",
    ownerPrincipal: "consumer owner via trusted server action/RPC",
    sensitivityClassification: "optional_consent_history_metadata",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: [
      "consumer_user_id -> auth.users.id",
      "legal_document_version_id -> legal_document_versions.id nullable",
    ],
    cardinality: "many append-only events per consumer, channel, and scope",
    immutableFields: ["id", "consumer_user_id", "consent_scope", "event_type", "occurred_at"],
    mutableFields: [],
    statusField: "marketing_consent_status projection",
    statusTransitionOwner: "trusted server action/RPC after consumer intent validation",
    retentionDeletionConsideration:
      "withdrawal history retention unresolved; implementation_blocked_until_policy_resolved",
    rlsReadPolicyProposal: "consumer owner reads current projection; admin UI reads status only",
    rlsWritePolicyProposal: "append through server-only path; no overwrite",
    serverOnlyWriteRequirement: "withdraw_marketing_consent",
    auditRequirement: "append consent event and status projection audit",
    rawSensitiveDataProhibition: "no marketing consent data exposed to advertiser/partner as identity metadata",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "cash_redemption_requests relation_or_extension",
    purpose: "Design request-time KYC, bank, tax, terms, protected fund, and threshold evidence linkage.",
    ownerPrincipal: "trusted cash-out server/admin review",
    sensitivityClassification: "financial_request_metadata_no_transfer",
    proposedPrimaryKey: "existing cash_redemption_requests.id",
    proposedForeignKeys: [
      "identity_verification_ref -> consumer_identity_verifications.id",
      "bank_verification_ref -> consumer_bank_account_verifications.id",
      "tax_profile_ref -> consumer_tax_profiles.id",
      "accepted_terms_ref -> consumer_legal_acceptances.id",
    ],
    cardinality: "one request references immutable request-time snapshots",
    immutableFields: ["idempotency_key", "request_time_gate_snapshot", "created_at"],
    mutableFields: ["manual_review_reason_code", "request_status via audited transition only"],
    statusField: "cash_redemption_request_status plus cash_out_gate_design_status",
    statusTransitionOwner: "trusted server/RPC and approved admin review only",
    retentionDeletionConsideration:
      "settlement/tax retention policy unresolved; no actual INSERT/UPDATE/DELETE in Stage 3-M",
    rlsReadPolicyProposal: "consumer owner sees request status only; admin UI status only; advertiser/partner blocked",
    rlsWritePolicyProposal: "direct client mutation blocked; actual request creation not implemented",
    serverOnlyWriteRequirement: "create_cash_redemption_request future candidate",
    auditRequirement: "append request status transition audit with immutable decision evidence",
    rawSensitiveDataProhibition: "no raw bank account, identity, provider payload, or transfer instruction stored here",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "kyc_tax_terms_audit_events",
    purpose: "Append-only audit events for all KYC, bank, tax, terms, consent, and cash-out gate transitions.",
    ownerPrincipal: "trusted server/admin audit writer",
    sensitivityClassification: "audit_metadata_no_raw_sensitive_payload",
    proposedPrimaryKey: "id uuid",
    proposedForeignKeys: ["target_user_id -> auth.users.id nullable"],
    cardinality: "many events per target record",
    immutableFields: [
      "id",
      "actor_type",
      "target_record_ref",
      "previous_status",
      "new_status",
      "reason_code",
      "source_digest",
      "created_at",
    ],
    mutableFields: [],
    statusField: "event_type",
    statusTransitionOwner: "trusted server/RPC only",
    retentionDeletionConsideration:
      "append-only retention period unresolved; external_legal_review_required",
    rlsReadPolicyProposal: "admin audit read only; consumer/advertiser/partner blocked",
    rlsWritePolicyProposal: "append-only trusted server writes; UPDATE/DELETE blocked",
    serverOnlyWriteRequirement: "audit append path inside each server-only operation",
    auditRequirement: "self-auditing append-only event stream",
    rawSensitiveDataProhibition:
      "no raw identity, raw bank account, access token, refresh token, OAuth code, provider raw response, or full email",
    implementationStatus: "design_review_only",
  },
  {
    objectName: "external_provider_reference_boundary",
    purpose: "Define storage boundary for provider references, tokens, and raw payloads.",
    ownerPrincipal: "trusted provider integration service only if later approved",
    sensitivityClassification: "restricted_provider_secret_boundary",
    proposedPrimaryKey: "not implemented; prefer provider token/reference or external vault",
    proposedForeignKeys: [],
    cardinality: "separate from consumer profile and admin UI",
    immutableFields: ["provider_ref_digest", "created_at", "source_digest"],
    mutableFields: ["revoked_at", "expires_at"],
    statusField: "provider_reference_status",
    statusTransitionOwner: "trusted server/provider integration only",
    retentionDeletionConsideration:
      "policy_unresolved; provider reference disposal requires external legal/security review",
    rlsReadPolicyProposal: "no direct client/admin raw read",
    rlsWritePolicyProposal: "no direct client writes",
    serverOnlyWriteRequirement: "future provider boundary service; not Stage 3-M",
    auditRequirement: "append provider reference lifecycle event without raw payload",
    rawSensitiveDataProhibition:
      "provider raw response, access token, refresh token, OAuth code, raw provider id, raw bank account, and full identity data prohibited",
    implementationStatus: "design_review_only",
  },
] as const satisfies readonly Stage3MDbObjectReview[];

export const STAGE3M_SENSITIVE_DATA_BOUNDARY_REVIEW = {
  consumerProfileSeparatedFromKycData: true,
  consumerProfileSeparatedFromBankData: true,
  rawBankAccountNumberStorageProhibited: true,
  fullResidentRegistrationNumberStorageProhibited: true,
  providerRawResponseStorageProhibited: true,
  accessTokenStorageProhibited: true,
  refreshTokenStorageProhibited: true,
  oauthCodeStorageProhibited: true,
  publicStatusSeparatedFromPrivateRawData: true,
  adminRawIdentityBankDataExposureProhibited: true,
  advertiserAccessBlocked: true,
  partnerAccessBlocked: true,
  sensitiveDataInLogsProhibited: true,
} as const;

export const STAGE3M_BANK_ACCOUNT_STORAGE_OPTIONS = [
  {
    option: "provider token/reference only",
    recommendation: "recommended_default",
    reason:
      "Minimizes AdMe-held bank data and keeps verification detail with a regulated provider or vault boundary.",
  },
  {
    option: "encrypted minimal account identifier",
    recommendation: "conditional_fallback",
    reason:
      "Requires key management, access logging, retention policy, and external legal/security approval before implementation.",
  },
  {
    option: "separate vault or external provider custody",
    recommendation: "recommended_for_raw_or_reversible_data",
    reason:
      "If reversible account data is legally required, store it outside general app tables with strict vault controls.",
  },
] as const;

export const STAGE3M_STATUS_TAXONOMY_REVIEW = {
  sourceStage: "3-L",
  identityVerificationStatuses: IDENTITY_VERIFICATION_STATUSES,
  bankAccountVerificationStatuses: BANK_ACCOUNT_VERIFICATION_STATUSES,
  taxProfileStatuses: TAX_PROFILE_STATUSES,
  termsAcceptanceStatuses: TERMS_ACCEPTANCE_STATUSES,
  marketingConsentStatuses: MARKETING_CONSENT_STATUSES,
  cashOutGateDesignStatuses: CASH_OUT_GATE_DESIGN_STATUSES,
  postgresEnumAssessment:
    "Strong type safety but harder to change safely; not recommended as first choice for evolving compliance statuses.",
  textCheckConstraintAssessment:
    "Recommended initial approach: text plus CHECK or domain-like guard balances fail-closed validation and migration flexibility.",
  lookupTableAssessment:
    "Useful when statuses need metadata, display labels, deprecation windows, or admin-configured policy versions.",
  recommendedStrategy:
    "text + CHECK constraint for core status columns, with optional lookup/projection table after taxonomy stabilizes",
  enumMigrationRiskReviewed: true,
  transitionAuditRequired: true,
  backwardCompatibilityReviewed: true,
  unknownStatusFailClosed: true,
} as const;

export const STAGE3M_LEGAL_DOCUMENT_VERSIONING_REVIEW = {
  documentTypeRequired: true,
  versionRequired: true,
  effectiveAtRequired: true,
  publishedAtRequired: true,
  retiredAtSupported: true,
  requiredFlagSupported: true,
  contentHashOrImmutableVersionIdentifierRequired: true,
  localeRequired: true,
  acceptanceTimestampRequired: true,
  acceptedDocumentVersionRequired: true,
  withdrawalRevocationTimestampSupported: true,
  acceptanceSourceRequired: true,
  ipUserAgentMinimization:
    "Prefer hash/digest or omit unless external legal/security review requires retention.",
  reacceptanceDecision:
    "Compare current required document versions by type/locale against latest append-only acceptance event.",
  historicalDocumentImmutabilityRequired: true,
  currentVersionDecision:
    "Use published_at/effective_at/retired_at and required flag; avoid destructive overwrite.",
  acceptanceHistoryStrategy: "append_only_event_history_preferred",
} as const;

export const STAGE3M_MARKETING_CONSENT_HISTORY_REVIEW = {
  requiredTermsSeparatedFromOptionalMarketingConsent: true,
  optInOptOutHistoryPreserved: true,
  withdrawalTimestampRequired: true,
  consentVersionRequired: true,
  consentChannelRequired: true,
  currentProjectionAndEventHistorySeparated: true,
  withdrawalNotConfusedWithRequiredTermsRevocation: true,
  marketingConsentNotRequiredForCashOut: true,
} as const;

export const STAGE3M_CASH_REDEMPTION_REQUEST_LINKAGE_REVIEW = {
  existingTableName: "cash_redemption_requests",
  identityVerificationSnapshotOrReference: true,
  bankVerificationSnapshotOrReference: true,
  taxProfileSnapshotOrReference: true,
  acceptedTermsVersionSnapshotOrReference: true,
  protectedFundGateResult: true,
  thresholdGateResult: true,
  manualReviewReason: true,
  immutableRequestTimeDecisionEvidence: true,
  idempotencyKeyRequired: true,
  requestStatusTransitionAudit: true,
  cashOutActualProcessingDisabledMarker: true,
  existingMigrationChangeAllowed: false,
  actualRequestMutationImplemented: false,
  pointLedgerCashOutMutationImplemented: false,
  userBalanceMutationImplemented: false,
  bankTransferImplemented: false,
} as const;

export const STAGE3M_RLS_MATRIX = [
  {
    role: "anonymous",
    access: "blocked" as RlsAccess,
    proposal: "No SELECT/INSERT/UPDATE/DELETE on proposed operational tables.",
  },
  {
    role: "consumer owner",
    access: "masked_status_read" as RlsAccess,
    proposal:
      "May read own coarse status/projection only; no raw identity, raw bank, provider reference, or audit payload.",
  },
  {
    role: "advertiser",
    access: "blocked" as RlsAccess,
    proposal: "No access to consumer identity, bank, tax, terms, consent, or cash-out gate data.",
  },
  {
    role: "partner",
    access: "blocked" as RlsAccess,
    proposal: "No access to consumer identity, bank, tax, terms, consent, or cash-out gate data.",
  },
  {
    role: "admin UI",
    access: "admin_status_read" as RlsAccess,
    proposal: "Read minimal statuses/reason codes only; raw identity and raw bank data remain hidden.",
  },
  {
    role: "trusted server/RPC",
    access: "server_only" as RlsAccess,
    proposal:
      "Performs validated writes through approved server-only paths; service role never exposed to clients.",
  },
] as const;

export const STAGE3M_NON_EXECUTABLE_RLS_PSEUDO_SQL =
  "NON-EXECUTABLE DESIGN EXAMPLE: create policy proposed_consumer_status_read on proposed_table for select using (auth.uid() = consumer_user_id); direct writes remain blocked.";

export type Stage3MServerOnlyWritePathReview = {
  functionName: string;
  purpose: string;
  caller: string;
  authorizationRule: string;
  inputValidation: string;
  idempotencyRequirement: string;
  allowedStatusTransition: string;
  auditEvent: string;
  searchPathFixedRequired: true;
  securityDefinerNeeded: boolean;
  revokeExecuteFromPublicAnonAuthenticated: true;
  rawProviderPayloadInputProhibited: true;
  productionImplementationStatus: false;
};

export const STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW = [
  {
    functionName: "record_identity_verification_result",
    purpose: "Record KYC provider/manual review result without raw payload.",
    caller: "trusted provider callback handler or admin review backend",
    authorizationRule: "trusted server identity plus target consumer authorization",
    inputValidation: "status allowlist, provider ref digest format, expiry bounds, reason code allowlist",
    idempotencyRequirement: "provider event id or source_digest unique replay guard",
    allowedStatusTransition: "pending_verification -> verified/failed/manual_review_required/expired/revoked",
    auditEvent: "identity_verification_status_changed",
    searchPathFixedRequired: true,
    securityDefinerNeeded: true,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
  {
    functionName: "record_bank_verification_result",
    purpose: "Record bank account verification result with provider reference only.",
    caller: "trusted bank callback handler or admin review backend",
    authorizationRule: "trusted server identity and consumer ownership match",
    inputValidation: "status allowlist, provider ref digest, optional last4, expiry bounds",
    idempotencyRequirement: "provider event id or source_digest unique replay guard",
    allowedStatusTransition: "pending_verification -> verified/failed/manual_review_required/expired/revoked",
    auditEvent: "bank_verification_status_changed",
    searchPathFixedRequired: true,
    securityDefinerNeeded: true,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
  {
    functionName: "record_tax_profile_review",
    purpose: "Record tax profile review status and unresolved policy blockers.",
    caller: "trusted compliance backend/admin review",
    authorizationRule: "approved compliance admin or trusted backend job",
    inputValidation: "tax status allowlist, reason codes, policy version required",
    idempotencyRequirement: "review idempotency key and source_digest",
    allowedStatusTransition:
      "not_collected/collection_required_before_cash_out -> pending_review/ready_for_manual_processing/external_review_required/blocked_*",
    auditEvent: "tax_profile_status_changed",
    searchPathFixedRequired: true,
    securityDefinerNeeded: true,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
  {
    functionName: "accept_legal_document_version",
    purpose: "Append legal acceptance event for a required document version.",
    caller: "server action after authenticated consumer intent",
    authorizationRule: "auth.uid equals consumer_user_id and document is published/effective",
    inputValidation: "document id exists, required/current decision, idempotency key",
    idempotencyRequirement: "unique consumer/document/event idempotency key",
    allowedStatusTransition: "missing_required_acceptance -> accepted_current_versions or legacy reacceptance",
    auditEvent: "legal_document_accepted",
    searchPathFixedRequired: true,
    securityDefinerNeeded: false,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
  {
    functionName: "withdraw_marketing_consent",
    purpose: "Append optional marketing opt-out or withdrawal event.",
    caller: "server action after authenticated consumer intent",
    authorizationRule: "auth.uid equals consumer_user_id",
    inputValidation: "scope/channel/status allowlist and current projection check",
    idempotencyRequirement: "unique consumer/scope/event idempotency key",
    allowedStatusTransition: "opt_in_active -> opt_out_active/withdrawn; not required for cash-out",
    auditEvent: "marketing_consent_withdrawn",
    searchPathFixedRequired: true,
    securityDefinerNeeded: false,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
  {
    functionName: "evaluate_cash_out_preconditions",
    purpose: "Evaluate user-level cash-out gate without creating payment or ledger mutation.",
    caller: "trusted server route/action",
    authorizationRule: "consumer owner or admin review context",
    inputValidation: "status allowlists, protected fund taxonomy allowlist, threshold gate result",
    idempotencyRequirement: "source_digest for replayable decision evidence",
    allowedStatusTransition: "none; read/evaluate only",
    auditEvent: "cash_out_preconditions_evaluated",
    searchPathFixedRequired: true,
    securityDefinerNeeded: false,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
  {
    functionName: "create_cash_redemption_request",
    purpose: "Future append request with immutable decision evidence; not implemented in Stage 3-M.",
    caller: "trusted cash-out server path after explicit approval",
    authorizationRule: "consumer owner, all gates clear, actual processing approval recorded",
    inputValidation: "idempotency key, snapshot refs, minimum balance, gate status fail-closed",
    idempotencyRequirement: "unique consumer/idempotency key and request-time source_digest",
    allowedStatusTransition: "new request -> pending_manual_review only if future approval exists",
    auditEvent: "cash_redemption_request_created",
    searchPathFixedRequired: true,
    securityDefinerNeeded: true,
    revokeExecuteFromPublicAnonAuthenticated: true,
    rawProviderPayloadInputProhibited: true,
    productionImplementationStatus: false,
  },
] as const satisfies readonly Stage3MServerOnlyWritePathReview[];

export const STAGE3M_AUDIT_APPEND_ONLY_REVIEW = {
  recordsActor: true,
  recordsTimestamp: true,
  recordsPreviousStatus: true,
  recordsNewStatus: true,
  recordsPolicyVersionOrProviderReferenceDigest: true,
  recordsReasonCode: true,
  rawIdentityDataProhibited: true,
  rawBankAccountDataProhibited: true,
  tokenPayloadProhibited: true,
  providerRawResponseProhibited: true,
  appendOnlyPreferred: true,
  updateDeleteBlockedInFuturePolicy: true,
} as const;

export const STAGE3M_RETENTION_DELETION_REVIEW = {
  accountDeletionProfileVsFinancialTaxRetentionConflict: "policy_unresolved",
  legalRetentionPeriod: "external_legal_review_required",
  softDeleteAndAnonymization: "implementation_blocked_until_policy_resolved",
  providerReferenceDisposal: "external_legal_review_required",
  bankVerificationExpiry: "policy_unresolved",
  identityVerificationRevocation: "policy_unresolved",
  legalAcceptanceHistoryRetention: "external_legal_review_required",
  marketingConsentWithdrawalHistoryRetention: "external_legal_review_required",
  operationalLogMinimization: "policy_unresolved",
} as const;

export const STAGE3M_MIGRATION_DEPENDENCY_ORDER = [
  "lookup/status constraints or enum strategy",
  "legal document versions",
  "consumer legal acceptances",
  "marketing consent history",
  "identity verification metadata",
  "bank verification metadata",
  "tax profile metadata",
  "audit events",
  "cash redemption request relation/constraint",
  "RLS",
  "server-only RPC",
  "grants/revokes",
  "verification queries",
] as const;

export type Stage3MKycTaxTermsDbMigrationDesignReviewState = {
  stage3MDesignReviewComplete: true;
  designReviewOnly: true;
  migrationImplemented: false;
  migrationFileCreated: false;
  supabaseDbPushExecuted: false;
  actualPersonalDataCollectionImplemented: false;
  identityProviderIntegrated: false;
  bankApiIntegrated: false;
  taxFilingImplemented: false;
  withholdingCalculationImplemented: false;
  actualCashOutProcessingAllowed: false;
  productionMutation: false;
  legalConclusionDeclared: false;
  externalLegalTaxReviewStillRequired: true;
  rawIdentityDataExposed: false;
  rawBankAccountDataExposed: false;
  providerRawPayloadStored: false;
  accessTokenStored: false;
  refreshTokenStored: false;
  oauthCodeStored: false;
  advertiserAccessAllowed: false;
  partnerAccessAllowed: false;
  publicMarkerExposed: false;
  proposedDbObjectsReviewed: true;
  proposedDbObjectCount: number;
  rlsMatrixReviewed: true;
  serverOnlyWritePathReviewed: true;
  securityDefinerWritePathCount: number;
  auditAppendOnlyReviewed: true;
  idempotencyReviewed: true;
  legalDocumentVersioningReviewed: true;
  marketingConsentHistoryReviewed: true;
  retentionDeletionPolicyResolved: false;
  implementationApprovalGranted: false;
  stage3MStatusStorageRecommendation: string;
  stage3MBankAccountStorageRecommendation: string;
  stage3MIdentityVerificationStatusEnum: string;
  stage3MBankAccountVerificationStatusEnum: string;
  stage3MTaxProfileStatusEnum: string;
  stage3MTermsAcceptanceStatusEnum: string;
  stage3MMarketingConsentStatusEnum: string;
  stage3MCashOutGateStatusEnum: string;
  stage3MDeployCommit: string;
};

export function getStage3MKycTaxTermsDbMigrationDesignReviewState(): Stage3MKycTaxTermsDbMigrationDesignReviewState {
  return {
    stage3MDesignReviewComplete: true,
    designReviewOnly: STAGE3M_METADATA.designReviewOnly,
    migrationImplemented: STAGE3M_METADATA.migrationImplemented,
    migrationFileCreated: STAGE3M_METADATA.migrationFileCreated,
    supabaseDbPushExecuted: STAGE3M_METADATA.supabaseDbPushExecuted,
    actualPersonalDataCollectionImplemented:
      STAGE3M_METADATA.actualPersonalDataCollectionImplemented,
    identityProviderIntegrated: STAGE3M_METADATA.identityProviderIntegrated,
    bankApiIntegrated: STAGE3M_METADATA.bankApiIntegrated,
    taxFilingImplemented: STAGE3M_METADATA.taxFilingImplemented,
    withholdingCalculationImplemented:
      STAGE3M_METADATA.withholdingCalculationImplemented,
    actualCashOutProcessingAllowed:
      STAGE3M_METADATA.actualCashOutProcessingAllowed,
    productionMutation: STAGE3M_METADATA.productionMutation,
    legalConclusionDeclared: STAGE3M_METADATA.legalConclusionDeclared,
    externalLegalTaxReviewStillRequired:
      STAGE3M_METADATA.externalLegalTaxReviewStillRequired,
    rawIdentityDataExposed: false,
    rawBankAccountDataExposed: false,
    providerRawPayloadStored: false,
    accessTokenStored: false,
    refreshTokenStored: false,
    oauthCodeStored: false,
    advertiserAccessAllowed: false,
    partnerAccessAllowed: false,
    publicMarkerExposed: false,
    proposedDbObjectsReviewed: true,
    proposedDbObjectCount: STAGE3M_PROPOSED_DB_OBJECT_INVENTORY.length,
    rlsMatrixReviewed: true,
    serverOnlyWritePathReviewed: true,
    securityDefinerWritePathCount:
      STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW.length,
    auditAppendOnlyReviewed: true,
    idempotencyReviewed: true,
    legalDocumentVersioningReviewed: true,
    marketingConsentHistoryReviewed: true,
    retentionDeletionPolicyResolved: false,
    implementationApprovalGranted: false,
    stage3MStatusStorageRecommendation:
      STAGE3M_STATUS_TAXONOMY_REVIEW.recommendedStrategy,
    stage3MBankAccountStorageRecommendation: "provider token/reference only",
    stage3MIdentityVerificationStatusEnum:
      IDENTITY_VERIFICATION_STATUSES.join(","),
    stage3MBankAccountVerificationStatusEnum:
      BANK_ACCOUNT_VERIFICATION_STATUSES.join(","),
    stage3MTaxProfileStatusEnum: TAX_PROFILE_STATUSES.join(","),
    stage3MTermsAcceptanceStatusEnum: TERMS_ACCEPTANCE_STATUSES.join(","),
    stage3MMarketingConsentStatusEnum: MARKETING_CONSENT_STATUSES.join(","),
    stage3MCashOutGateStatusEnum: CASH_OUT_GATE_DESIGN_STATUSES.join(","),
    stage3MDeployCommit: getDeployCommit(),
  };
}
