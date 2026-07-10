import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";
import {
  STAGE3M_PROPOSED_DB_OBJECT_INVENTORY,
  STAGE3M_RLS_MATRIX,
  STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW,
  STAGE3M_STATUS_TAXONOMY_REVIEW,
} from "./stage3m-kyc-tax-terms-db-migration-design-review";

export const STAGE3N_KYC_TAX_TERMS_IMPLEMENTATION_APPROVAL_GATE_BUILD =
  "stage3n-kyc-tax-terms-implementation-approval-gate";

export const STAGE3N_OVERALL_APPROVAL_STATUSES = [
  "blocked",
  "partially_approved",
  "approved",
] as const;

export const STAGE3N_ITEM_DECISIONS = [
  "blocker",
  "required_before_dev_migration",
  "deferred_until_provider_selection",
  "deferred_until_production",
  "approved_design_principle",
  "rejected",
  "not_applicable",
] as const;

export const STAGE3N_EVIDENCE_STATUSES = [
  "confirmed",
  "operator_attestation_required",
  "external_legal_review_required",
  "external_tax_review_required",
  "external_privacy_review_required",
  "external_security_review_required",
  "provider_confirmation_required",
  "unresolved",
] as const;

export type Stage3NOverallApprovalStatus =
  (typeof STAGE3N_OVERALL_APPROVAL_STATUSES)[number];
export type Stage3NItemDecision = (typeof STAGE3N_ITEM_DECISIONS)[number];
export type Stage3NEvidenceStatus = (typeof STAGE3N_EVIDENCE_STATUSES)[number];

export type Stage3NApprovalGateItem = {
  id: string;
  title: string;
  reviewFocus: readonly string[];
  itemDecision: Stage3NItemDecision;
  evidenceStatus: Stage3NEvidenceStatus;
  blocker: boolean;
  blockerReason: string;
  currentConclusion: string;
  nextRequiredAction: string;
  nextRequiredActor: string;
  requiredExternalReviewActors: readonly string[];
  requiredBeforeDevMigration: boolean;
  requiredBeforeProduction: boolean;
  sourceStage3MReferences: readonly string[];
};

export const STAGE3N_APPROVAL_GATE_ITEMS = [
  {
    id: "STAGE3N-001",
    title: "Personal data processing purpose and minimum collection scope",
    reviewFocus: [
      "cash-out에 실제로 필요한 식별정보",
      "이름, 생년월일, 휴대전화번호, CI/DI, 주민등록번호 수집 필요 여부",
      "수집하지 않아도 되는 항목",
      "provider에서만 보유하고 AdMe가 저장하지 않을 항목",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_privacy_review_required",
    blocker: true,
    blockerReason:
      "Actual KYC/cash-out personal data scope cannot be approved by code author assumption.",
    currentConclusion:
      "개인정보 처리 목적과 최소 수집 항목은 외부 개인정보/법률 검토 전 migration approval 불가.",
    nextRequiredAction: "외부 개인정보/법률 검토 질문 확정 및 회신 확보",
    nextRequiredActor: "external privacy counsel and business owner",
    requiredExternalReviewActors: ["privacy", "legal"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["sensitive data boundary", "identity metadata"],
  },
  {
    id: "STAGE3N-002",
    title: "Identity provider metadata allowed before provider selection",
    reviewFocus: [
      "provider name",
      "provider transaction/reference id",
      "verification method",
      "verified_at",
      "result code",
      "failure reason category",
      "subject match 여부",
      "raw payload 금지",
    ],
    itemDecision: "deferred_until_provider_selection",
    evidenceStatus: "provider_confirmation_required",
    blocker: true,
    blockerReason:
      "Provider-neutral metadata columns must match selected provider contract before implementation.",
    currentConclusion: "provider confirmation 전에는 reference/digest metadata 범위만 후보로 유지.",
    nextRequiredAction: "본인확인 provider 후보별 metadata contract 확인",
    nextRequiredActor: "provider owner and security reviewer",
    requiredExternalReviewActors: ["provider", "security"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["consumer_identity_verifications"],
  },
  {
    id: "STAGE3N-003",
    title: "Bank account provider token/reference feasibility",
    reviewFocus: [
      "token/reference 장기 재사용 가능성",
      "payout 시 재검증 필요 여부",
      "은행명 및 계좌 끝자리 저장 필요 여부",
      "provider 교체 가능성",
    ],
    itemDecision: "deferred_until_provider_selection",
    evidenceStatus: "provider_confirmation_required",
    blocker: true,
    blockerReason: "Bank token/reference feasibility is provider-contract dependent.",
    currentConclusion: "provider token/reference only 원칙은 유지하되 provider 확인 전 구현 승인 불가.",
    nextRequiredAction: "bank provider token lifecycle, payout 재검증, migration portability 확인",
    nextRequiredActor: "bank provider owner and security reviewer",
    requiredExternalReviewActors: ["provider", "security"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["consumer_bank_account_verifications"],
  },
  {
    id: "STAGE3N-004",
    title: "Need for storing partial masked bank account value",
    reviewFocus: [
      "last 4 digits 저장 운영 필요성",
      "개인금융정보 최소화 원칙",
      "관리자 CS 화면 필요성",
      "hash 저장 필요성 및 실효성",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_privacy_review_required",
    blocker: true,
    blockerReason: "Even masked account fragments may be personal financial data.",
    currentConclusion: "계좌번호 일부 마스킹 값도 외부 개인정보 검토 전 저장 승인 불가.",
    nextRequiredAction: "last4/hash/미저장 대안별 개인정보 영향 검토",
    nextRequiredActor: "external privacy reviewer and operations owner",
    requiredExternalReviewActors: ["privacy", "security"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["bank account storage options"],
  },
  {
    id: "STAGE3N-005",
    title: "Retention period for identity and bank verification results",
    reviewFocus: [
      "성공/실패 결과별 보존기간",
      "provider reference 보존기간",
      "audit evidence 보존기간",
      "cash redemption 완료 후 보존 여부",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_legal_review_required",
    blocker: true,
    blockerReason: "Retention periods are legal policy, not implementation detail.",
    currentConclusion: "보존기간 확정 전 verification/audit schema approval 불가.",
    nextRequiredAction: "verification 결과/증빙별 보존기간 법률 검토",
    nextRequiredActor: "external legal counsel",
    requiredExternalReviewActors: ["legal", "privacy"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["retention/deletion review"],
  },
  {
    id: "STAGE3N-006",
    title: "Account deletion, anonymization, legal hold, and retention split",
    reviewFocus: [
      "즉시 삭제",
      "지연 삭제",
      "익명화",
      "법정 보존",
      "fraud/audit hold",
      "legal hold",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_legal_review_required",
    blocker: true,
    blockerReason: "Deletion/anonymization policy must precede personal-data table implementation.",
    currentConclusion: "탈퇴/익명화/법정 보존 구분 미확정으로 implementation blocked.",
    nextRequiredAction: "탈퇴 처리와 금융·세무·감사 보존 충돌 검토",
    nextRequiredActor: "external legal counsel and privacy reviewer",
    requiredExternalReviewActors: ["legal", "privacy"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["retention/deletion review"],
  },
  {
    id: "STAGE3N-007",
    title: "Tax income classification for cash redemption rewards",
    reviewFocus: [
      "기타소득, 사업소득 또는 비과세 가능성",
      "광고 참여 보상의 법적 성격",
      "연간 합산 기준",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_tax_review_required",
    blocker: true,
    blockerReason: "Tax classification cannot be inferred by implementation team.",
    currentConclusion: "세무소득 분류 외부 검토 전 tax profile schema approval 불가.",
    nextRequiredAction: "세무사 검토 질문서 작성 및 회신 확보",
    nextRequiredActor: "external tax accountant",
    requiredExternalReviewActors: ["tax"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["consumer_tax_profiles"],
  },
  {
    id: "STAGE3N-008",
    title: "Withholding obligation, rate, and reporting threshold",
    reviewFocus: [
      "원천징수 대상 여부",
      "필요경비 적용 여부",
      "지급 건별 또는 연간 기준",
      "주민세 포함 여부",
      "지급명세서 제출 여부",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_tax_review_required",
    blocker: true,
    blockerReason: "Withholding logic and schema fields require external tax review.",
    currentConclusion: "세율/기준금액/신고 의무는 하드코딩 금지 및 외부 세무 검토 필요.",
    nextRequiredAction: "원천징수 및 지급명세서 기준 확인",
    nextRequiredActor: "external tax accountant",
    requiredExternalReviewActors: ["tax"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["tax profile metadata"],
  },
  {
    id: "STAGE3N-009",
    title: "Tax profile stored field scope",
    reviewFocus: [
      "tax residency",
      "income classification",
      "withholding eligibility",
      "exemption status",
      "tax review status",
      "raw 주민등록번호 저장 금지",
      "외부 세무 처리 provider reference 사용 가능성",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_tax_review_required",
    blocker: true,
    blockerReason: "Tax fields may imply legal/tax conclusions or sensitive identifiers.",
    currentConclusion: "세무 profile 저장 필드 범위는 외부 세무 검토 전 승인 불가.",
    nextRequiredAction: "필수/선택/금지 tax metadata field list 확정",
    nextRequiredActor: "external tax accountant and privacy reviewer",
    requiredExternalReviewActors: ["tax", "privacy"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["consumer_tax_profiles"],
  },
  {
    id: "STAGE3N-010",
    title: "Need for IP/user-agent as electronic consent evidence",
    reviewFocus: [
      "document version",
      "accepted_at",
      "user id",
      "request id",
      "IP",
      "user-agent",
      "locale",
      "device metadata",
      "source channel",
    ],
    itemDecision: "blocker",
    evidenceStatus: "external_legal_review_required",
    blocker: true,
    blockerReason: "Consent evidence scope must balance proof and minimization.",
    currentConclusion: "IP/user-agent 원문 저장 여부는 외부 법률/개인정보 검토 필요.",
    nextRequiredAction: "전자적 동의 증거 항목별 원문/hash/미저장 기준 검토",
    nextRequiredActor: "external legal counsel and privacy reviewer",
    requiredExternalReviewActors: ["legal", "privacy"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["consumer_legal_acceptances"],
  },
  {
    id: "STAGE3N-011",
    title: "Immutable cash redemption request-time snapshot scope",
    reviewFocus: [
      "identity verification status/reference",
      "bank verification status/reference",
      "tax review status/reference",
      "accepted terms version",
      "protected fund gate",
      "threshold gate",
      "available balance",
      "requested amount",
      "evaluated_at",
      "evaluator version",
    ],
    itemDecision: "required_before_dev_migration",
    evidenceStatus: "unresolved",
    blocker: true,
    blockerReason: "Request-time evidence scope affects schema shape and idempotency.",
    currentConclusion: "dev-only migration 전 immutable snapshot/ref 범위 확정 필요.",
    nextRequiredAction: "cash redemption request evidence contract 확정",
    nextRequiredActor: "engineering owner and business owner",
    requiredExternalReviewActors: [],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["cash_redemption_requests relation_or_extension"],
  },
  {
    id: "STAGE3N-012",
    title: "Admin manual review permission and maker-checker requirement",
    reviewFocus: [
      "reviewer role",
      "approver role",
      "maker-checker separation",
      "self approval 금지",
      "고액 전환 이중 승인",
      "모든 admin action audit",
    ],
    itemDecision: "required_before_dev_migration",
    evidenceStatus: "operator_attestation_required",
    blocker: true,
    blockerReason: "Admin authority model affects RLS/RPC grants and audit schema.",
    currentConclusion: "manual review 권한과 이중 승인 기준은 dev migration 전 운영 확인 필요.",
    nextRequiredAction: "admin role matrix, self-approval ban, high-value approval threshold 확정",
    nextRequiredActor: "business operations owner",
    requiredExternalReviewActors: [],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["RLS matrix", "audit events"],
  },
  {
    id: "STAGE3N-013",
    title: "Dev-only scope for actual migration implementation",
    reviewFocus: [
      "prod 적용 금지",
      "빈 테이블 및 constraint까지만 허용할지",
      "RLS와 RPC stub 포함 여부",
      "seed data 금지 여부",
      "destructive migration 금지",
      "rollback 계획",
    ],
    itemDecision: "blocker",
    evidenceStatus: "operator_attestation_required",
    blocker: true,
    blockerReason: "No dev migration scope has been explicitly approved.",
    currentConclusion: "dev-only migration implementation approval is not granted.",
    nextRequiredAction: "dev-only migration scope and rollback approval by owner",
    nextRequiredActor: "business owner and engineering owner",
    requiredExternalReviewActors: [],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["migration dependency/order"],
  },
  {
    id: "STAGE3N-014",
    title: "Production migration must be separated into a later stage",
    reviewFocus: [
      "dev migration",
      "dev verification",
      "external review",
      "production schema approval",
      "production migration",
      "data collection UI",
      "provider integration",
      "live cash-out",
    ],
    itemDecision: "approved_design_principle",
    evidenceStatus: "confirmed",
    blocker: false,
    blockerReason: "not_applicable",
    currentConclusion: "Production migration은 반드시 별도 단계로 분리한다.",
    nextRequiredAction: "Production migration 작업지시는 별도 명시 승인 후에만 작성",
    nextRequiredActor: "business owner",
    requiredExternalReviewActors: [],
    requiredBeforeDevMigration: false,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["implementation approval separation"],
  },
  {
    id: "STAGE3N-015",
    title: "Status taxonomy and text CHECK strategy",
    reviewFocus: ["Stage 3-L taxonomy", "text + CHECK constraint", "lookup table need", "current projection need"],
    itemDecision: "required_before_dev_migration",
    evidenceStatus: "unresolved",
    blocker: true,
    blockerReason: "Final status storage affects first migration shape.",
    currentConclusion: "text + CHECK 우선 원칙은 설계 승인이나 최종 column/constraint scope 미확정.",
    nextRequiredAction: "status column, CHECK list, projection table 필요 여부 확정",
    nextRequiredActor: "engineering owner",
    requiredExternalReviewActors: [],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: [STAGE3M_STATUS_TAXONOMY_REVIEW.recommendedStrategy],
  },
  {
    id: "STAGE3N-016",
    title: "Append-only history, source_digest, and idempotency scope",
    reviewFocus: [
      "append-only UPDATE/DELETE 금지",
      "source_digest 생성 기준",
      "idempotency key scope",
      "duplicate provider callback 처리",
      "replay attack 방지",
    ],
    itemDecision: "required_before_dev_migration",
    evidenceStatus: "unresolved",
    blocker: true,
    blockerReason: "Idempotency and replay scope must be fixed before RPC/table design.",
    currentConclusion: "append-only 원칙은 승인된 설계 원칙이나 digest/idempotency scope 미확정.",
    nextRequiredAction: "canonical source payload, unique key scope, replay window 확정",
    nextRequiredActor: "engineering owner and security reviewer",
    requiredExternalReviewActors: ["security"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["append-only audit", "idempotency"],
  },
  {
    id: "STAGE3N-017",
    title: "Provider callback signature, secret storage, and raw payload redaction",
    reviewFocus: [
      "provider callback signature 검증 요구",
      "secrets 저장 위치",
      "failure reason code 개인정보 포함 금지",
      "admin 화면 raw payload 비노출",
      "log/telemetry 민감정보 redaction",
    ],
    itemDecision: "deferred_until_provider_selection",
    evidenceStatus: "external_security_review_required",
    blocker: true,
    blockerReason: "Provider integration security controls must exist before callback/RPC implementation.",
    currentConclusion: "provider callback endpoint 및 secret 저장은 이번 단계와 dev migration 전 모두 미승인.",
    nextRequiredAction: "provider별 signature, secret, redaction, failure reason policy 확인",
    nextRequiredActor: "security reviewer and provider owner",
    requiredExternalReviewActors: ["security", "provider"],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["external_provider_reference_boundary"],
  },
  {
    id: "STAGE3N-018",
    title: "Backup, export/download, incident response, and subprocessors",
    reviewFocus: [
      "backup에 포함되는 민감정보 범위",
      "export/download 권한",
      "incident response 및 breach 대응",
      "데이터 처리 위탁사 목록 관리",
      "개인정보 국외 이전 가능성",
      "provider subprocessor 확인",
    ],
    itemDecision: "deferred_until_production",
    evidenceStatus: "external_security_review_required",
    blocker: true,
    blockerReason: "Production readiness requires security/privacy operations review.",
    currentConclusion: "운영 보안/위탁/침해대응 항목은 Production 전 필수이며 현재 미승인.",
    nextRequiredAction: "backup/export/incident/subprocessor 운영 통제 검토",
    nextRequiredActor: "security reviewer and privacy reviewer",
    requiredExternalReviewActors: ["security", "privacy", "provider"],
    requiredBeforeDevMigration: false,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["sensitive data boundary"],
  },
  {
    id: "STAGE3N-019",
    title: "Test data, dev/prod Supabase split, and no real personal data fixtures",
    reviewFocus: [
      "테스트 데이터에 실제 개인정보 사용 금지",
      "개발·운영 Supabase 분리 유지",
      "seed data 금지",
      "provider token/secret fixture 금지",
    ],
    itemDecision: "required_before_dev_migration",
    evidenceStatus: "operator_attestation_required",
    blocker: true,
    blockerReason: "Dev migration cannot proceed without test-data and environment-split attestation.",
    currentConclusion: "실제 개인정보 fixture 금지와 dev/prod 분리 유지 확인 필요.",
    nextRequiredAction: "dev-only migration test data policy와 env split attestation 작성",
    nextRequiredActor: "engineering owner",
    requiredExternalReviewActors: [],
    requiredBeforeDevMigration: true,
    requiredBeforeProduction: true,
    sourceStage3MReferences: ["dev/prod project separation"],
  },
] as const satisfies readonly Stage3NApprovalGateItem[];

const blockerCount = STAGE3N_APPROVAL_GATE_ITEMS.filter(
  (item) => item.blocker,
).length;

const unresolvedCount = STAGE3N_APPROVAL_GATE_ITEMS.filter(
  (item) => item.evidenceStatus === "unresolved",
).length;

export const STAGE3N_APPROVAL_PRINCIPLES = {
  externalReviewCannotBeApprovedByCodeAuthorAssumption: true,
  businessOwnerExplicitApprovalRequired: true,
  devMigrationApprovalSeparatedFromProductionMigrationApproval: true,
  schemaObjectApprovalSeparatedFromPersonalDataCollectionApproval: true,
  providerNeutralSchemaSeparatedFromProviderIntegrationApproval: true,
  taxDataSchemaSeparatedFromTaxCalculationAndFilingApproval: true,
  legalDocumentVersionSchemaSeparatedFromLegalTextApproval: true,
  cashRedemptionSchemaSeparatedFromActualTransferApproval: true,
} as const;

export const STAGE3N_STAGE3M_REVIEW_INPUTS = {
  proposedDbObjectCount: STAGE3M_PROPOSED_DB_OBJECT_INVENTORY.length,
  rlsMatrixRoleCount: STAGE3M_RLS_MATRIX.length,
  securityDefinerCandidateCount: STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW.length,
  stage3MStatusStorageRecommendation:
    STAGE3M_STATUS_TAXONOMY_REVIEW.recommendedStrategy,
} as const;

export type Stage3NKycTaxTermsImplementationApprovalGateState = {
  stage3NApprovalGateComplete: true;
  readOnlyApprovalGate: true;
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
  externalTaxReviewStillRequired: true;
  externalPrivacyReviewStillRequired: true;
  externalSecurityReviewStillRequired: true;
  providerSelectionRequired: true;
  devMigrationApprovalGranted: false;
  productionMigrationApprovalGranted: false;
  personalDataCollectionApprovalGranted: false;
  providerIntegrationApprovalGranted: false;
  taxImplementationApprovalGranted: false;
  cashOutExecutionApprovalGranted: false;
  overallApprovalStatus: "blocked";
  blockerCount: number;
  unresolvedCount: number;
  approvalGateItemCount: number;
  coreBlockerItemCount: 14;
  stage3NNoApproveButton: true;
  stage3NNoOverrideButton: true;
  stage3NNoMutationAction: true;
  stage3NNoPersonalDataFixture: true;
  stage3NNoBankAccountFixture: true;
  stage3NNoProviderRawPayloadFixture: true;
  stage3NNoTokenSecretFixture: true;
  stage3NStage3MDesignReviewComplete: true;
  stage3NStage3MImplementationApprovalGranted: false;
  stage3NDeployCommit: string;
};

export function getStage3NKycTaxTermsImplementationApprovalGateState(): Stage3NKycTaxTermsImplementationApprovalGateState {
  return {
    stage3NApprovalGateComplete: true,
    readOnlyApprovalGate: true,
    migrationImplemented: false,
    migrationFileCreated: false,
    supabaseDbPushExecuted: false,
    actualPersonalDataCollectionImplemented: false,
    identityProviderIntegrated: false,
    bankApiIntegrated: false,
    taxFilingImplemented: false,
    withholdingCalculationImplemented: false,
    actualCashOutProcessingAllowed: false,
    productionMutation: false,
    legalConclusionDeclared: false,
    externalLegalTaxReviewStillRequired: true,
    externalTaxReviewStillRequired: true,
    externalPrivacyReviewStillRequired: true,
    externalSecurityReviewStillRequired: true,
    providerSelectionRequired: true,
    devMigrationApprovalGranted: false,
    productionMigrationApprovalGranted: false,
    personalDataCollectionApprovalGranted: false,
    providerIntegrationApprovalGranted: false,
    taxImplementationApprovalGranted: false,
    cashOutExecutionApprovalGranted: false,
    overallApprovalStatus: "blocked",
    blockerCount,
    unresolvedCount,
    approvalGateItemCount: STAGE3N_APPROVAL_GATE_ITEMS.length,
    coreBlockerItemCount: 14,
    stage3NNoApproveButton: true,
    stage3NNoOverrideButton: true,
    stage3NNoMutationAction: true,
    stage3NNoPersonalDataFixture: true,
    stage3NNoBankAccountFixture: true,
    stage3NNoProviderRawPayloadFixture: true,
    stage3NNoTokenSecretFixture: true,
    stage3NStage3MDesignReviewComplete: true,
    stage3NStage3MImplementationApprovalGranted: false,
    stage3NDeployCommit: getDeployCommit(),
  };
}
