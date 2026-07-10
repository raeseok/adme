import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";
import {
  STAGE3N_APPROVAL_GATE_ITEMS,
  type Stage3NApprovalGateItem,
} from "./stage3n-kyc-tax-terms-implementation-approval-gate";

export const STAGE3O_EXTERNAL_REVIEW_QUESTION_PACK_BUILD =
  "stage3o-external-review-question-pack";

export const STAGE3O_QUESTION_DOMAINS = [
  "legal",
  "tax",
  "privacy",
  "security",
  "identity_provider",
  "bank_provider",
  "business_owner",
  "engineering",
] as const;

export const STAGE3O_QUESTION_STATUSES = [
  "draft",
  "ready_for_review",
  "sent_for_review",
  "response_received",
  "clarification_required",
  "resolved",
  "rejected",
  "superseded",
] as const;

export const STAGE3O_EVIDENCE_STATUSES = [
  "not_requested",
  "request_ready",
  "external_response_required",
  "operator_decision_required",
  "provider_confirmation_required",
  "engineering_decision_required",
  "confirmed",
] as const;

export type Stage3OQuestionDomain = (typeof STAGE3O_QUESTION_DOMAINS)[number];
export type Stage3OQuestionStatus = (typeof STAGE3O_QUESTION_STATUSES)[number];
export type Stage3OEvidenceStatus = (typeof STAGE3O_EVIDENCE_STATUSES)[number];

export type Stage3OAnswerType =
  | "free_text"
  | "single_choice"
  | "multi_choice"
  | "yes_no_with_explanation"
  | "provider_capability_matrix"
  | "decision_matrix";

export type Stage3OExternalReviewQuestion = {
  id: string;
  sourceStage3NItemIds: readonly Stage3NApprovalGateItem["id"][];
  domain: Stage3OQuestionDomain;
  title: string;
  background: string;
  question: string;
  decisionNeeded: string;
  answerType: Stage3OAnswerType;
  answerOptions: readonly string[];
  legalOrPolicyImpact: string;
  schemaImpact: string;
  uiImpact: string;
  operationImpact: string;
  requiredReviewer: string;
  requiredBeforeDevMigration: boolean;
  requiredBeforeProductionMigration: boolean;
  requiredBeforePersonalDataCollection: boolean;
  requiredBeforeProviderIntegration: boolean;
  requiredBeforeCashOutExecution: boolean;
  status: Stage3OQuestionStatus;
  evidenceStatus: Stage3OEvidenceStatus;
  responseSummary: "";
  responseReference: "";
  decidedAt: "";
  decidedByRole: "";
  notes: string;
};

type QuestionSpec = Omit<
  Stage3OExternalReviewQuestion,
  | "background"
  | "answerType"
  | "answerOptions"
  | "legalOrPolicyImpact"
  | "schemaImpact"
  | "uiImpact"
  | "operationImpact"
  | "status"
  | "evidenceStatus"
  | "responseSummary"
  | "responseReference"
  | "decidedAt"
  | "decidedByRole"
  | "notes"
> &
  Partial<
    Pick<
      Stage3OExternalReviewQuestion,
      | "background"
      | "answerType"
      | "answerOptions"
      | "legalOrPolicyImpact"
      | "schemaImpact"
      | "uiImpact"
      | "operationImpact"
      | "status"
      | "evidenceStatus"
      | "notes"
    >
  >;

const domainDefaults: Record<
  Stage3OQuestionDomain,
  Pick<
    Stage3OExternalReviewQuestion,
    | "answerType"
    | "answerOptions"
    | "legalOrPolicyImpact"
    | "schemaImpact"
    | "uiImpact"
    | "operationImpact"
    | "status"
    | "evidenceStatus"
  >
> = {
  legal: {
    answerType: "free_text",
    answerOptions: ["external legal counsel written answer required"],
    legalOrPolicyImpact:
      "May change cash-out eligibility, consent evidence, retention, provider contracting, or user protection policy.",
    schemaImpact:
      "May change future identity, bank, legal acceptance, audit, retention, or cash redemption schema fields.",
    uiImpact:
      "May change future cash-out disclosures, consent screens, admin status labels, or deletion flows.",
    operationImpact:
      "May change review runbooks, record retention, manual approval, and dispute handling.",
    status: "ready_for_review",
    evidenceStatus: "external_response_required",
  },
  tax: {
    answerType: "free_text",
    answerOptions: ["external tax accountant written answer required"],
    legalOrPolicyImpact:
      "May change income classification, withholding, reporting, and tax record policy without declaring a conclusion here.",
    schemaImpact:
      "May change future tax profile, payment summary, correction, and reporting metadata fields.",
    uiImpact:
      "May change future tax notices, cash-out confirmation copy, and admin review labels.",
    operationImpact:
      "May change annual aggregation, tax statement, cancellation, and reconciliation procedures.",
    status: "ready_for_review",
    evidenceStatus: "external_response_required",
  },
  privacy: {
    answerType: "free_text",
    answerOptions: ["external privacy reviewer written answer required"],
    legalOrPolicyImpact:
      "May change personal data minimization, disclosure, retention, deletion, and outsourcing policy.",
    schemaImpact:
      "May change future provider reference, verification metadata, masking, audit, backup, and export fields.",
    uiImpact:
      "May change future consumer collection notices, admin masked views, and CS access boundaries.",
    operationImpact:
      "May change deletion, backup handling, export control, and incident response runbooks.",
    status: "ready_for_review",
    evidenceStatus: "external_response_required",
  },
  security: {
    answerType: "free_text",
    answerOptions: ["security reviewer written answer required"],
    legalOrPolicyImpact:
      "May change security control policy for provider callbacks, secrets, audit, logging, and incident response.",
    schemaImpact:
      "May change future idempotency, source digest, audit event, credential boundary, and callback event fields.",
    uiImpact:
      "May change future admin access control, maker-checker display, and audit export surfaces.",
    operationImpact:
      "May change rotation, monitoring, high-value review, incident, and provider outage procedures.",
    status: "ready_for_review",
    evidenceStatus: "external_response_required",
  },
  identity_provider: {
    answerType: "provider_capability_matrix",
    answerOptions: ["supported", "unsupported", "conditional", "requires contract review"],
    legalOrPolicyImpact:
      "May determine whether identity verification can meet legal, privacy, and minimization requirements.",
    schemaImpact:
      "May change future identity provider reference, callback, deduplication, and verification metadata fields.",
    uiImpact:
      "May change future identity verification status, retry, and admin review views.",
    operationImpact:
      "May change provider selection, sandbox, SLA, deletion, and support procedures.",
    status: "ready_for_review",
    evidenceStatus: "provider_confirmation_required",
  },
  bank_provider: {
    answerType: "provider_capability_matrix",
    answerOptions: ["supported", "unsupported", "conditional", "requires contract review"],
    legalOrPolicyImpact:
      "May determine whether bank verification can meet legal, privacy, and minimization requirements.",
    schemaImpact:
      "May change future bank provider reference, token lifecycle, payout recheck, and webhook metadata fields.",
    uiImpact:
      "May change future bank verification status, masked account display, retry, and admin review views.",
    operationImpact:
      "May change provider selection, payout readiness, SLA, failure handling, and support procedures.",
    status: "ready_for_review",
    evidenceStatus: "provider_confirmation_required",
  },
  business_owner: {
    answerType: "decision_matrix",
    answerOptions: ["A", "B", "C", "D", "defer"],
    legalOrPolicyImpact:
      "Business decision may set policy direction but does not replace external legal, tax, privacy, or security review.",
    schemaImpact:
      "May change future migration scope, RLS, RPC, audit, status, and projection design.",
    uiImpact:
      "May change future admin workflow, CS masking, approval, cancellation, and processing target views.",
    operationImpact:
      "May change ownership, approval, review cadence, dispute, and fraud hold procedures.",
    status: "draft",
    evidenceStatus: "operator_decision_required",
  },
  engineering: {
    answerType: "decision_matrix",
    answerOptions: ["reference only", "snapshot only", "hybrid", "defer until provider review"],
    legalOrPolicyImpact:
      "Engineering decision must stay within later legal, tax, privacy, security, provider, and owner approvals.",
    schemaImpact:
      "May change future immutable snapshot, status taxonomy, source digest, audit, and idempotency design.",
    uiImpact:
      "May change future admin display, diagnostic marker, and review traceability design.",
    operationImpact:
      "May change migration ordering, replay handling, callback deduplication, and audit runbooks.",
    status: "draft",
    evidenceStatus: "engineering_decision_required",
  },
};

const stage3NContext =
  "Stage 3-N left KYC, tax, terms, identity, bank, audit, and cash-out implementation blocked until external review, provider confirmation, operator approval, or engineering decision is recorded.";

function question(spec: QuestionSpec): Stage3OExternalReviewQuestion {
  const defaults = domainDefaults[spec.domain];
  return {
    background: stage3NContext,
    answerType: defaults.answerType,
    answerOptions: defaults.answerOptions,
    legalOrPolicyImpact: defaults.legalOrPolicyImpact,
    schemaImpact: defaults.schemaImpact,
    uiImpact: defaults.uiImpact,
    operationImpact: defaults.operationImpact,
    status: defaults.status,
    evidenceStatus: defaults.evidenceStatus,
    responseSummary: "",
    responseReference: "",
    decidedAt: "",
    decidedByRole: "",
    notes: "No external response is recorded in Stage 3-O.",
    ...spec,
  };
}

export const STAGE3O_EXTERNAL_REVIEW_QUESTIONS = [
  question({
    id: "LEGAL-001",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-008"],
    domain: "legal",
    title: "Cash-convertible point regulatory classification",
    question:
      "Does the AdMe point structure, where users earn points by viewing ads and passing quizzes and may later request cash conversion, fall within prepaid electronic payment instruments or another electronic finance regulatory category?",
    decisionNeeded:
      "Identify whether the future schema must support regulated balance, user protection, issuance, or reporting controls before any migration.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-002",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-008"],
    domain: "legal",
    title: "Regulatory duties if classification applies",
    question:
      "If the structure may be regulated, what duties could arise for outstanding balance, usage limits, registration or filing, escrow or guarantee, and user protection?",
    decisionNeeded:
      "Determine future monitoring, limit, protected fund, and disclosure requirements without declaring applicability in code.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-003",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-008"],
    domain: "legal",
    title: "Advertiser prepayment segregation or guarantee",
    question:
      "When advertiser-prepaid funds are used as the reward source for consumer points, is fund segregation, escrow, guarantee, or a similar protection mechanism required or recommended?",
    decisionNeeded:
      "Determine whether future protected-fund reconciliation must become an operational prerequisite to cash-out.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-004",
    sourceStage3NItemIds: ["STAGE3N-001", "STAGE3N-002"],
    domain: "legal",
    title: "Minimum identity data retained by platform",
    question:
      "For cash-out identity verification, which data must AdMe directly retain and which data may remain only with an identity provider?",
    decisionNeeded:
      "Set the future identity verification storage boundary before personal data collection or provider integration.",
    requiredReviewer: "external legal counsel and privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-005",
    sourceStage3NItemIds: ["STAGE3N-001", "STAGE3N-009"],
    domain: "legal",
    title: "Legally required identity or tax identifiers",
    question:
      "Among name, birth date, mobile phone number, CI, DI, and resident registration number, are any items legally required to be stored by AdMe for identity verification, cash-out, dispute, or tax purposes?",
    decisionNeeded:
      "Identify required, optional, provider-only, and prohibited fields before schema or collection design.",
    requiredReviewer: "external legal counsel and tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-006",
    sourceStage3NItemIds: ["STAGE3N-003", "STAGE3N-004"],
    domain: "legal",
    title: "Bank verification retention duty",
    question:
      "Is AdMe legally required to retain bank account verification result details, full account number, partial account number, or only a provider reference for cash-out evidence?",
    decisionNeeded:
      "Decide future bank verification evidence fields without storing account data in Stage 3-O.",
    requiredReviewer: "external legal counsel and privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-007",
    sourceStage3NItemIds: ["STAGE3N-005"],
    domain: "legal",
    title: "Identity and bank verification retention period",
    question:
      "What retention period applies to identity verification and bank verification success, failure, revocation, expiry, and provider reference records?",
    decisionNeeded:
      "Set retention and deletion policy before any verification table implementation.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-008",
    sourceStage3NItemIds: ["STAGE3N-005", "STAGE3N-011"],
    domain: "legal",
    title: "Cash-out record retention by outcome",
    question:
      "For completed, failed, canceled, disputed, or reversed cash-out requests, what records and retention periods are required?",
    decisionNeeded:
      "Determine future cash redemption request and audit event retention policy.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-009",
    sourceStage3NItemIds: ["STAGE3N-006"],
    domain: "legal",
    title: "Withdrawal deletion, separation, anonymization, or statutory retention",
    question:
      "On account withdrawal, which information must be deleted immediately, separately retained, anonymized, or preserved under statutory retention or dispute hold?",
    decisionNeeded:
      "Resolve deletion and legal hold policy before schema implementation.",
    requiredReviewer: "external legal counsel and privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-010",
    sourceStage3NItemIds: ["STAGE3N-010"],
    domain: "legal",
    title: "Electronic terms acceptance evidence scope",
    question:
      "For terms acceptance evidence, are document version, accepted_at, and user id sufficient, or must IP address and user-agent also be retained?",
    decisionNeeded:
      "Set legal acceptance evidence fields before legal acceptance schema implementation.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-011",
    sourceStage3NItemIds: ["STAGE3N-010"],
    domain: "legal",
    title: "IP and user-agent retention notice",
    question:
      "If IP address or user-agent retention is necessary, what purpose, retention period, notice, consent, and minimization method should apply?",
    decisionNeeded:
      "Decide whether future acceptance evidence stores raw values, hashes, metadata, or none.",
    requiredReviewer: "external legal counsel and privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-012",
    sourceStage3NItemIds: ["STAGE3N-010"],
    domain: "legal",
    title: "Marketing consent separated from required terms",
    question:
      "Is the current design that separates optional marketing consent from service-required terms appropriate for the future cash-out flow?",
    decisionNeeded:
      "Confirm that future consent schema and UI do not make marketing consent a cash-out prerequisite.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-013",
    sourceStage3NItemIds: ["STAGE3N-010", "STAGE3N-011"],
    domain: "legal",
    title: "Additional cash-out terms or consent",
    question:
      "Is a separate cash-out agreement, payout terms, tax consent, identity verification consent, or bank verification consent required before cash conversion?",
    decisionNeeded:
      "Determine future required document types and acceptance gates.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-014",
    sourceStage3NItemIds: ["STAGE3N-011", "STAGE3N-012"],
    domain: "legal",
    title: "Fraud, cancellation, clawback, and suspension terms",
    question:
      "What terms are needed for abuse, invalid ad viewing, quiz manipulation, reward cancellation, clawback, account suspension, and dispute handling?",
    decisionNeeded:
      "Determine future fraud hold, cancellation, and audit policy before cash-out operation.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-015",
    sourceStage3NItemIds: ["STAGE3N-012", "STAGE3N-013"],
    domain: "legal",
    title: "Manual approval and manual transfer pilot conditions",
    question:
      "Under what conditions may AdMe run a pilot using admin manual review and manual bank transfer, and what records, segregation, approvals, and user notices would be required?",
    decisionNeeded:
      "Determine whether manual pilot operation needs maker-checker, written notices, and special logs.",
    requiredReviewer: "external legal counsel",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "LEGAL-016",
    sourceStage3NItemIds: ["STAGE3N-002", "STAGE3N-003", "STAGE3N-018"],
    domain: "legal",
    title: "Provider outsourcing, third-party transfer, or overseas transfer",
    question:
      "For external identity and bank providers, should the arrangement be treated as personal data processing outsourcing, third-party provision, overseas transfer, or another structure?",
    decisionNeeded:
      "Determine contract, notice, consent, subprocessor, and provider review requirements.",
    requiredReviewer: "external legal counsel and privacy reviewer",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-001",
    sourceStage3NItemIds: ["STAGE3N-007"],
    domain: "tax",
    title: "Income classification for ad and quiz cash-out rewards",
    question:
      "How should cash-converted rewards earned by viewing advertisements and passing quizzes be classified for Korean tax purposes?",
    decisionNeeded:
      "Decide future tax profile fields without declaring a classification in Stage 3-O.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-002",
    sourceStage3NItemIds: ["STAGE3N-007"],
    domain: "tax",
    title: "Possible income categories",
    question:
      "Could the reward be treated as other income, business income, wage income, prize income, non-taxable income, or another category depending on user behavior or campaign structure?",
    decisionNeeded:
      "List possible classifications and the facts needed to choose among them later.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-003",
    sourceStage3NItemIds: ["STAGE3N-007"],
    domain: "tax",
    title: "Repeated earning changes income character",
    question:
      "Does the tax treatment change if the same user repeatedly earns points and requests cash conversion over time?",
    decisionNeeded:
      "Determine whether future aggregation and user activity metrics are needed for tax review.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-004",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-008"],
    domain: "tax",
    title: "Per-payment, monthly, or annual basis",
    question:
      "Should tax judgment and reporting be based on each payment, monthly totals, annual totals, campaign totals, or another basis?",
    decisionNeeded:
      "Determine future aggregation keys and reporting periods.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-005",
    sourceStage3NItemIds: ["STAGE3N-008"],
    domain: "tax",
    title: "Withholding obligation existence",
    question:
      "Does AdMe have any withholding obligation when cash-convertible rewards are paid to users?",
    decisionNeeded:
      "Determine whether future cash-out must include tax withholding controls.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-006",
    sourceStage3NItemIds: ["STAGE3N-008"],
    domain: "tax",
    title: "Withholding method if required",
    question:
      "If withholding is required, what rate, local income tax treatment, necessary expense treatment, minimum collection basis, and rounding method should apply?",
    decisionNeeded:
      "Identify required calculation inputs; no rate or threshold is hardcoded in Stage 3-O.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-007",
    sourceStage3NItemIds: ["STAGE3N-008"],
    domain: "tax",
    title: "Small repeated payment handling",
    question:
      "How should 10,000 KRW-level or other small repeated cash-out payments be handled for tax withholding and reporting?",
    decisionNeeded:
      "Determine whether future cash-out requires small-payment accumulation logic.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-008",
    sourceStage3NItemIds: ["STAGE3N-008", "STAGE3N-009"],
    domain: "tax",
    title: "Annual cumulative payment tracking",
    question:
      "Does AdMe need to track annual cumulative payments by user for tax withholding, reporting, or classification?",
    decisionNeeded:
      "Determine future annual summary, user tax profile, and reporting metadata needs.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-009",
    sourceStage3NItemIds: ["STAGE3N-009"],
    domain: "tax",
    title: "Payment statement filing fields",
    question:
      "Is payment statement filing required, and if so which fields must be collected, retained, processed, and submitted?",
    decisionNeeded:
      "Determine whether tax identifiers, payment summaries, and filing status fields are needed.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-010",
    sourceStage3NItemIds: ["STAGE3N-001", "STAGE3N-009"],
    domain: "tax",
    title: "Unique identifier custody for tax processing",
    question:
      "If resident registration number or another unique identifier is required for tax handling, must AdMe directly store it or may it be entrusted to a tax agency or provider?",
    decisionNeeded:
      "Determine whether future schema can avoid direct unique identifier storage.",
    requiredReviewer: "external tax accountant and privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-011",
    sourceStage3NItemIds: ["STAGE3N-008", "STAGE3N-011"],
    domain: "tax",
    title: "Failure, cancellation, clawback, and correction",
    question:
      "How should withholding and payment statement corrections be handled when cash-out fails, is canceled, is disputed, or is clawed back?",
    decisionNeeded:
      "Determine future cancellation and correction event fields.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-012",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-011"],
    domain: "tax",
    title: "Income recognition timing",
    question:
      "Is income recognized when points are earned, when a cash-out request is accepted, when cash is actually paid, or at another point?",
    decisionNeeded:
      "Determine future event timestamps needed for tax evidence.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-013",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-008"],
    domain: "tax",
    title: "Expired points tax treatment",
    question:
      "How do expired points affect consumer income recognition, AdMe revenue recognition, withholding, or reporting?",
    decisionNeeded:
      "Determine whether future point expiration events need tax metadata.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "TAX-014",
    sourceStage3NItemIds: ["STAGE3N-007", "STAGE3N-009"],
    domain: "tax",
    title: "Business recipient treatment",
    question:
      "If a business or sole proprietor receives ad participation rewards, is the treatment different from an individual consumer?",
    decisionNeeded:
      "Determine whether future user type, business registration, or invoice metadata is needed.",
    requiredReviewer: "external tax accountant",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-001",
    sourceStage3NItemIds: ["STAGE3N-001"],
    domain: "privacy",
    title: "Minimum personal data for cash-out",
    question:
      "Under data minimization principles, which personal data items are strictly necessary for cash-out identity, bank, tax, dispute, and audit purposes?",
    decisionNeeded:
      "Define required, optional, provider-only, and prohibited personal data fields.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-002",
    sourceStage3NItemIds: ["STAGE3N-001", "STAGE3N-002"],
    domain: "privacy",
    title: "Identity provider reference-only storage",
    question:
      "Is it appropriate to store only an identity provider reference or digest and not store names, birth dates, phone numbers, CI, DI, or raw provider payloads?",
    decisionNeeded:
      "Confirm whether future identity schema may remain reference-only.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-003",
    sourceStage3NItemIds: ["STAGE3N-003", "STAGE3N-004"],
    domain: "privacy",
    title: "Bank token/reference-only storage",
    question:
      "Is it appropriate to store only a bank provider token or reference and avoid storing the full account number?",
    decisionNeeded:
      "Confirm whether future bank schema can avoid raw account storage.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-004",
    sourceStage3NItemIds: ["STAGE3N-004"],
    domain: "privacy",
    title: "Bank name and last four digits",
    question:
      "Is storing bank name and account number last four digits necessary and lawful for user confirmation, CS support, dispute handling, or audit?",
    decisionNeeded:
      "Decide whether masked bank display fields are allowed in future UI/schema.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-005",
    sourceStage3NItemIds: ["STAGE3N-004"],
    domain: "privacy",
    title: "Bank account hash necessity",
    question:
      "Is storing a hash of the bank account number necessary, effective, and still personal data or financial personal information?",
    decisionNeeded:
      "Decide whether future account deduplication can use provider references instead of hashes.",
    requiredReviewer: "external privacy reviewer and security reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-006",
    sourceStage3NItemIds: ["STAGE3N-002", "STAGE3N-017"],
    domain: "privacy",
    title: "Failure reason code minimization",
    question:
      "What standard should be used so identity and bank verification success or failure reason codes do not include personal data or raw provider messages?",
    decisionNeeded:
      "Define future reason-code taxonomy and redaction requirements.",
    requiredReviewer: "external privacy reviewer and security reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-007",
    sourceStage3NItemIds: ["STAGE3N-005"],
    domain: "privacy",
    title: "Verification metadata retention by purpose",
    question:
      "What retention period should apply to verification metadata by purpose, such as cash-out eligibility, fraud prevention, dispute response, and legal/tax retention?",
    decisionNeeded:
      "Define future purpose-specific retention and deletion controls.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-008",
    sourceStage3NItemIds: ["STAGE3N-006"],
    domain: "privacy",
    title: "Withdrawal, deletion, and anonymization",
    question:
      "What deletion, anonymization, or separation rules should apply when a user withdraws or requests deletion?",
    decisionNeeded:
      "Resolve future deletion workflow before personal data schema implementation.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-009",
    sourceStage3NItemIds: ["STAGE3N-006", "STAGE3N-012"],
    domain: "privacy",
    title: "Fraud and dispute retention exception",
    question:
      "What limited retention exceptions are permissible for fraud investigation, abuse prevention, dispute response, and legal hold?",
    decisionNeeded:
      "Define future fraud hold and dispute evidence retention rules.",
    requiredReviewer: "external privacy reviewer and legal counsel",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-010",
    sourceStage3NItemIds: ["STAGE3N-010"],
    domain: "privacy",
    title: "IP and user-agent collection basis",
    question:
      "What collection purpose, retention period, notice, consent, masking, or hashing method should apply to IP address and user-agent?",
    decisionNeeded:
      "Decide whether future acceptance and audit records include raw, hashed, or omitted client metadata.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-011",
    sourceStage3NItemIds: ["STAGE3N-012"],
    domain: "privacy",
    title: "Minimum admin-visible identity and bank state",
    question:
      "What is the minimum identity and bank verification state that may be shown to admins without exposing raw personal or financial data?",
    decisionNeeded:
      "Define future admin review DTO and masked status boundaries.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-012",
    sourceStage3NItemIds: ["STAGE3N-004", "STAGE3N-012"],
    domain: "privacy",
    title: "CS-visible masking scope",
    question:
      "What masked information, if any, may CS staff view for bank or identity support, and under what role, logging, and approval controls?",
    decisionNeeded:
      "Define future CS role and masked display boundaries.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-013",
    sourceStage3NItemIds: ["STAGE3N-019"],
    domain: "privacy",
    title: "No real personal data in development and test",
    question:
      "Is the policy that forbids real personal data in development, preview, local, fixtures, and tests appropriate and sufficient?",
    decisionNeeded:
      "Confirm development data policy before any dev-only migration.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: false,
  }),
  question({
    id: "PRIVACY-014",
    sourceStage3NItemIds: ["STAGE3N-018"],
    domain: "privacy",
    title: "Backup deletion request handling",
    question:
      "How should deletion or anonymization requests be handled when personal data may exist in backups?",
    decisionNeeded:
      "Define backup retention and restoration controls before production data collection.",
    requiredReviewer: "external privacy reviewer and security reviewer",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-015",
    sourceStage3NItemIds: ["STAGE3N-018"],
    domain: "privacy",
    title: "Data export rights and download control",
    question:
      "Who may export identity, bank, tax, cash-out, or audit data, what approval is required, and how should downloads be logged and restricted?",
    decisionNeeded:
      "Define future export permission and audit policy.",
    requiredReviewer: "external privacy reviewer and security reviewer",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-016",
    sourceStage3NItemIds: ["STAGE3N-002", "STAGE3N-003", "STAGE3N-018"],
    domain: "privacy",
    title: "Provider outsourcing and overseas transfer review items",
    question:
      "What processing outsourcing, overseas transfer, subprocessor, deletion, and audit items must be reviewed for identity, bank, and tax providers?",
    decisionNeeded:
      "Define provider due diligence checklist before provider integration.",
    requiredReviewer: "external privacy reviewer",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  question({
    id: "PRIVACY-017",
    sourceStage3NItemIds: ["STAGE3N-001", "STAGE3N-010"],
    domain: "privacy",
    title: "Privacy policy cash-out additions",
    question:
      "What cash-out related items must be added to the privacy policy before identity, bank, tax, or cash-out collection begins?",
    decisionNeeded:
      "Determine future privacy policy update requirements.",
    requiredReviewer: "external privacy reviewer and legal counsel",
    requiredBeforeDevMigration: false,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: true,
    requiredBeforeProviderIntegration: true,
    requiredBeforeCashOutExecution: true,
  }),
  ...[
    ["SECURITY-001", "Provider callback signature verification", "What signature, certificate, timestamp, and canonical payload verification should be required for identity and bank provider callbacks?"],
    ["SECURITY-002", "Callback replay prevention", "What nonce, timestamp, source digest, event id, and replay window controls should be required to prevent callback replay?"],
    ["SECURITY-003", "Provider transaction id idempotency", "What idempotency scope should apply to provider transaction ids and callback event ids across retries, users, and providers?"],
    ["SECURITY-004", "Token and secret storage prohibition", "Is the principle of not storing provider access tokens, refresh tokens, OAuth codes, or provider secrets in app tables feasible for the expected integrations?"],
    ["SECURITY-005", "Credential storage and rotation", "If provider credentials are unavoidable, where should they be stored and what rotation, access, and incident procedures are required?"],
    ["SECURITY-006", "Log, APM, and analytics redaction", "What redaction standard should block identity, bank, tax, provider reference, and failure reason data from logs, APM, analytics, and support tools?"],
    ["SECURITY-007", "Admin review access control", "What role, authentication, session, IP, device, and audit controls are required for admin identity and bank review screens?"],
    ["SECURITY-008", "Maker-checker requirement", "Should cash-out review, bank correction, high-value payout, or data export require maker-checker approval?"],
    ["SECURITY-009", "High-value cash-out controls", "Should high-value cash-out requests require additional approval, anomaly detection, cooldown, or manual investigation?"],
    ["SECURITY-010", "Append-only audit assurance", "What database, application, and operational controls are needed to make audit logs append-only and tamper-evident?"],
    ["SECURITY-011", "Audit log export authorization", "Who may export audit logs and what approval, masking, retention, and download controls are required?"],
    ["SECURITY-012", "Backup encryption and restore rights", "What encryption, key management, restore approval, and access logging should apply to backups containing future cash-out metadata?"],
    ["SECURITY-013", "Incident response and breach procedure", "What incident response, containment, notification, and evidence preservation procedure is required for identity, bank, or tax data exposure?"],
    ["SECURITY-014", "Provider outage and delayed callback handling", "How should provider outage, response tampering, callback delay, duplicate callback, and partial failure be handled safely?"],
    ["SECURITY-015", "Non-production test data controls", "What technical controls should prevent real personal, bank, provider, or tax data from entering local, preview, and development environments?"],
  ].map(([id, title, text], index) =>
    question({
      id,
      sourceStage3NItemIds:
        index < 3
          ? ["STAGE3N-016", "STAGE3N-017"]
          : index < 6
            ? ["STAGE3N-017", "STAGE3N-018"]
            : index < 11
              ? ["STAGE3N-012", "STAGE3N-018"]
              : ["STAGE3N-018", "STAGE3N-019"],
      domain: "security",
      title,
      question: text,
      decisionNeeded:
        "Define security review criteria for a later implementation stage without implementing controls in Stage 3-O.",
      requiredReviewer: "security reviewer",
      requiredBeforeDevMigration: index <= 9 || index === 14,
      requiredBeforeProductionMigration: true,
      requiredBeforePersonalDataCollection: index >= 5,
      requiredBeforeProviderIntegration: index <= 6 || index === 13,
      requiredBeforeCashOutExecution: true,
    }),
  ),
  ...[
    ["IDENTITY-PROVIDER-001", "Available identity verification methods", "Which identity verification methods are available and suitable for AdMe cash-out verification?"],
    ["IDENTITY-PROVIDER-002", "Result callback format", "What result callback format, required fields, optional fields, and error model are provided?"],
    ["IDENTITY-PROVIDER-003", "Transaction reference stability", "Is the transaction or reference id stable, unique, non-reusable, and queryable over time?"],
    ["IDENTITY-PROVIDER-004", "Duplicate person detection", "Can the provider support duplicate person or duplicate account detection without exposing raw identity values?"],
    ["IDENTITY-PROVIDER-005", "CI and DI availability", "Can the provider supply CI or DI, and under what legal, contractual, and technical constraints?"],
    ["IDENTITY-PROVIDER-006", "Duplicate prevention without CI or DI storage", "Can AdMe prevent duplicate cash-out accounts without storing CI or DI directly?"],
    ["IDENTITY-PROVIDER-007", "Raw identity avoidance", "Can the integration avoid sending name, birth date, or mobile phone number raw values back to AdMe?"],
    ["IDENTITY-PROVIDER-008", "Raw response non-storage and requery", "Can AdMe avoid storing raw provider responses while still requerying or verifying result evidence when needed?"],
    ["IDENTITY-PROVIDER-009", "Result revalidation period", "For how long can a verification result be revalidated or queried?"],
    ["IDENTITY-PROVIDER-010", "Callback signature verification", "What callback signature, timestamp, nonce, and canonicalization method is supported?"],
    ["IDENTITY-PROVIDER-011", "Replay prevention support", "What replay prevention, event id, nonce, and duplicate callback controls are supported?"],
    ["IDENTITY-PROVIDER-012", "Sandbox support", "Is a sandbox available without real personal data, and how closely does it match production?"],
    ["IDENTITY-PROVIDER-013", "Development and production credentials", "Can development and production credentials, callbacks, and data retention be separated?"],
    ["IDENTITY-PROVIDER-014", "Data storage location", "Where is verification data stored and processed?"],
    ["IDENTITY-PROVIDER-015", "Overseas transfer", "Does any overseas transfer, remote access, or cross-border subprocessing occur?"],
    ["IDENTITY-PROVIDER-016", "Subprocessor list", "What subprocessors are used and how are changes notified?"],
    ["IDENTITY-PROVIDER-017", "Contract termination deletion", "What data deletion or return process applies when the contract ends?"],
    ["IDENTITY-PROVIDER-018", "Rate limit and SLA", "What rate limits, uptime SLA, incident process, and support commitments apply?"],
    ["IDENTITY-PROVIDER-019", "Cost model", "What setup, per-verification, requery, failure, and support costs apply?"],
  ].map(([id, title, text]) =>
    question({
      id,
      sourceStage3NItemIds: ["STAGE3N-002", "STAGE3N-017", "STAGE3N-018"],
      domain: "identity_provider",
      title,
      question: text,
      decisionNeeded:
        "Record provider capability evidence for later provider selection without selecting or integrating a provider in Stage 3-O.",
      requiredReviewer: "identity provider candidate",
      requiredBeforeDevMigration: true,
      requiredBeforeProductionMigration: true,
      requiredBeforePersonalDataCollection: true,
      requiredBeforeProviderIntegration: true,
      requiredBeforeCashOutExecution: true,
    }),
  ),
  ...[
    ["BANK-PROVIDER-001", "Real-name account verification", "Does the provider support real-name bank account verification suitable for cash-out?"],
    ["BANK-PROVIDER-002", "No full account storage integration", "Can AdMe integrate without storing full account numbers in its application database?"],
    ["BANK-PROVIDER-003", "Reusable account token or reference", "Does the provider return a reusable account token or reference for future payouts?"],
    ["BANK-PROVIDER-004", "Token or reference expiry", "What validity period, revocation model, and re-verification rule applies to account references?"],
    ["BANK-PROVIDER-005", "Payout re-entry or re-verification", "Must users re-enter or re-verify account information before each payout?"],
    ["BANK-PROVIDER-006", "Bank name and last four return", "Does the provider return bank name and account-number last four digits, and can those fields be suppressed?"],
    ["BANK-PROVIDER-007", "Owner match result representation", "How is account holder match, mismatch, partial match, or unavailable result represented?"],
    ["BANK-PROVIDER-008", "Account status change detection", "Can dormant, closed, suspended, or changed account status be detected after verification?"],
    ["BANK-PROVIDER-009", "Dormant or closed account handling", "How are dormant, closed, restricted, or invalid accounts handled before payout?"],
    ["BANK-PROVIDER-010", "Webhook signature verification", "What callback or webhook signature verification, replay prevention, and event id controls are supported?"],
    ["BANK-PROVIDER-011", "Idempotency support", "What idempotency keys and duplicate payout or duplicate verification safeguards are supported?"],
    ["BANK-PROVIDER-012", "Sandbox support", "Is a sandbox available without real bank account data, and how close is it to production?"],
    ["BANK-PROVIDER-013", "Outsourcing and overseas transfer", "What personal data outsourcing, overseas transfer, and subprocessor disclosures apply?"],
    ["BANK-PROVIDER-014", "Raw payload non-storage", "Can AdMe avoid storing raw bank provider payloads and still prove verification results?"],
    ["BANK-PROVIDER-015", "Access token storage need", "Does the integration require access tokens, refresh tokens, certificates, or secrets to be stored by AdMe?"],
    ["BANK-PROVIDER-016", "Cost, SLA, and outage handling", "What cost, SLA, support, retry, outage, and settlement delay procedures apply?"],
  ].map(([id, title, text]) =>
    question({
      id,
      sourceStage3NItemIds: ["STAGE3N-003", "STAGE3N-004", "STAGE3N-017"],
      domain: "bank_provider",
      title,
      question: text,
      decisionNeeded:
        "Record provider capability evidence for later provider selection without selecting or integrating a provider in Stage 3-O.",
      requiredReviewer: "bank/account verification provider candidate",
      requiredBeforeDevMigration: true,
      requiredBeforeProductionMigration: true,
      requiredBeforePersonalDataCollection: true,
      requiredBeforeProviderIntegration: true,
      requiredBeforeCashOutExecution: true,
    }),
  ),
  question({
    id: "BUSINESS-001",
    sourceStage3NItemIds: ["STAGE3N-013"],
    domain: "business_owner",
    title: "Dev-only migration before external review",
    question:
      "Should AdMe allow any dev-only migration before external review is complete?",
    answerOptions: [
      "A. No migration before external review",
      "B. Empty schema and constraints without sensitive fields only",
      "C. Provider-neutral schema and RLS only",
      "D. RPC stubs also allowed",
      "defer",
    ],
    decisionNeeded:
      "Choose a migration scope and rollback cost after reviewing risk; Stage 3-O does not choose it.",
    notes:
      "A minimizes risk and delay cost is product velocity. B allows structure with low data risk but may need rework. C tests access rules but may encode premature assumptions. D maximizes implementation velocity with highest rollback and review cost.",
    requiredReviewer: "business owner",
    requiredBeforeDevMigration: true,
    requiredBeforeProductionMigration: true,
    requiredBeforePersonalDataCollection: false,
    requiredBeforeProviderIntegration: false,
    requiredBeforeCashOutExecution: true,
  }),
  ...[
    ["BUSINESS-002", "One-person or maker-checker admin review", "Should admin cash-out review use one-person approval or maker-checker approval?"],
    ["BUSINESS-003", "High-value conversion threshold", "Should AdMe define a high-value cash-out threshold that triggers extra review?"],
    ["BUSINESS-004", "Identity re-verification cadence", "How often should identity verification expire or require re-verification?"],
    ["BUSINESS-005", "Bank re-verification cadence", "How often should bank account verification expire or require re-verification?"],
    ["BUSINESS-006", "CS display of bank last four", "Does CS need to see bank account last four digits, or is coarse status sufficient?"],
    ["BUSINESS-007", "Point deduction timing", "Should points be deducted at request submission, approval, transfer completion, or held separately?"],
    ["BUSINESS-008", "Cancellation window", "Until what point may a user cancel a cash-out request?"],
    ["BUSINESS-009", "Processing target business days", "What target processing time should be promised or internally tracked?"],
    ["BUSINESS-010", "Dispute and abuse payment hold", "When should payment be held for dispute, abuse, fraud investigation, or legal review?"],
  ].map(([id, title, text]) =>
    question({
      id,
      sourceStage3NItemIds: ["STAGE3N-012", "STAGE3N-013"],
      domain: "business_owner",
      title,
      question: text,
      decisionNeeded:
        "Record business owner choice and impact before later implementation; no default is selected in Stage 3-O.",
      requiredReviewer: "business owner",
      requiredBeforeDevMigration: id !== "BUSINESS-009",
      requiredBeforeProductionMigration: true,
      requiredBeforePersonalDataCollection: false,
      requiredBeforeProviderIntegration: false,
      requiredBeforeCashOutExecution: true,
    }),
  ),
  ...[
    ["ENGINEERING-001", "Cash redemption immutable snapshot field scope", "Which request-time fields must be immutable snapshots for a cash redemption request?"],
    ["ENGINEERING-002", "Snapshot raw value, reference, or evaluator output", "Should snapshots store raw values, provider references, digests, evaluator outputs, or a hybrid?"],
    ["ENGINEERING-003", "Text plus CHECK status scope", "Which statuses should remain text plus CHECK constraints in the first migration?"],
    ["ENGINEERING-004", "Lookup table taxonomy candidates", "Which taxonomies need lookup tables for labels, deprecation, metadata, or admin display?"],
    ["ENGINEERING-005", "Current-state projection and append-only history", "What relationship should exist between current-state projection tables and append-only history events?"],
    ["ENGINEERING-006", "Canonical source_digest serialization", "What canonical serialization, field ordering, redaction, and hashing rules should produce source_digest?"],
    ["ENGINEERING-007", "Idempotency key namespace and scope", "What namespace and scope should idempotency keys use across users, providers, requests, and admin actions?"],
    ["ENGINEERING-008", "Provider callback deduplication", "What fields define duplicate callback events for identity and bank provider callbacks?"],
    ["ENGINEERING-009", "Manual admin action audit payload", "What actor, target, reason, previous status, new status, and evidence fields should be recorded for manual admin actions?"],
    ["ENGINEERING-010", "Dev-only migration object scope", "Which objects may be included in a later dev-only migration after explicit approval?"],
  ].map(([id, title, text], index) =>
    question({
      id,
      sourceStage3NItemIds:
        index < 2
          ? ["STAGE3N-011"]
          : index < 5
            ? ["STAGE3N-015"]
            : index < 8
              ? ["STAGE3N-016", "STAGE3N-017"]
              : ["STAGE3N-012", "STAGE3N-013"],
      domain: "engineering",
      title,
      question: text,
      decisionNeeded:
        "Choose an implementation design option and impact point later; Stage 3-O records the question only.",
      requiredReviewer: "engineering owner",
      requiredBeforeDevMigration: true,
      requiredBeforeProductionMigration: true,
      requiredBeforePersonalDataCollection: false,
      requiredBeforeProviderIntegration: index >= 5 && index <= 7,
      requiredBeforeCashOutExecution: true,
    }),
  ),
] as const satisfies readonly Stage3OExternalReviewQuestion[];

const stage3NItemsById: ReadonlyMap<string, Stage3NApprovalGateItem> = new Map(
  STAGE3N_APPROVAL_GATE_ITEMS.map((item) => [item.id, item]),
);

const totalGateItemCount = STAGE3N_APPROVAL_GATE_ITEMS.length;
const explicitBlockerCount = STAGE3N_APPROVAL_GATE_ITEMS.filter(
  (item) => item.itemDecision === "blocker",
).length;
const approvalBlockingItemCount = STAGE3N_APPROVAL_GATE_ITEMS.filter(
  (item) => item.blocker,
).length;
const approvedDesignPrincipleCount = STAGE3N_APPROVAL_GATE_ITEMS.filter(
  (item) => item.itemDecision === "approved_design_principle",
).length;
const unresolvedEvidenceCount = STAGE3N_APPROVAL_GATE_ITEMS.filter(
  (item) => item.evidenceStatus === "unresolved",
).length;

function countQuestions(domain: Stage3OQuestionDomain) {
  return STAGE3O_EXTERNAL_REVIEW_QUESTIONS.filter(
    (questionItem) => questionItem.domain === domain,
  ).length;
}

export const STAGE3O_QUESTION_COUNT_TAXONOMY = {
  totalGateItemCount,
  explicitBlockerCount,
  approvalBlockingItemCount,
  approvedDesignPrincipleCount,
  unresolvedEvidenceCount,
  externalReviewQuestionCount:
    countQuestions("legal") +
    countQuestions("tax") +
    countQuestions("privacy") +
    countQuestions("security"),
  providerQuestionCount:
    countQuestions("identity_provider") + countQuestions("bank_provider"),
  operatorDecisionCount: countQuestions("business_owner"),
  totalQuestionCount: STAGE3O_EXTERNAL_REVIEW_QUESTIONS.length,
  legalQuestionCount: countQuestions("legal"),
  taxQuestionCount: countQuestions("tax"),
  privacyQuestionCount: countQuestions("privacy"),
  securityQuestionCount: countQuestions("security"),
  identityProviderQuestionCount: countQuestions("identity_provider"),
  bankProviderQuestionCount: countQuestions("bank_provider"),
  businessOwnerDecisionCount: countQuestions("business_owner"),
  engineeringDecisionCount: countQuestions("engineering"),
} as const;

export const STAGE3O_REVIEW_RESPONSE_TEMPLATE_FIELDS = [
  "questionId",
  "reviewerOrganization",
  "reviewerRole",
  "reviewerNameOrMaskedReference",
  "requestedAt",
  "respondedAt",
  "answerSummary",
  "authoritativeSource",
  "assumptions",
  "jurisdiction",
  "effectiveDate",
  "expiryOrReviewDate",
  "followUpRequired",
  "followUpQuestions",
  "affectedSchemaObjects",
  "affectedPolicies",
  "affectedUI",
  "affectedOperations",
  "decisionRecommendation",
  "acceptedByBusinessOwner",
  "acceptedAt",
  "evidenceReference",
] as const;

export type Stage3OExternalReviewQuestionPackState = {
  stage3OQuestionPackComplete: true;
  readOnlyQuestionPack: true;
  externalQuestionsPrepared: true;
  externalQuestionsSent: false;
  externalResponsesReceived: false;
  legalReviewCompleted: false;
  taxReviewCompleted: false;
  privacyReviewCompleted: false;
  securityReviewCompleted: false;
  identityProviderSelected: false;
  bankProviderSelected: false;
  businessOwnerDecisionsCompleted: false;
  engineeringDecisionsCompleted: false;
  devMigrationApprovalGranted: false;
  productionMigrationApprovalGranted: false;
  migrationImplemented: false;
  migrationFileCreated: false;
  supabaseDbPushExecuted: false;
  actualPersonalDataCollectionImplemented: false;
  actualCashOutProcessingAllowed: false;
  productionMutation: false;
  legalConclusionDeclared: false;
  overallApprovalStatus: "blocked";
  questionCount: number;
  deployCommit: string;
} & typeof STAGE3O_QUESTION_COUNT_TAXONOMY;

export function getStage3OExternalReviewQuestionPackState(): Stage3OExternalReviewQuestionPackState {
  return {
    stage3OQuestionPackComplete: true,
    readOnlyQuestionPack: true,
    externalQuestionsPrepared: true,
    externalQuestionsSent: false,
    externalResponsesReceived: false,
    legalReviewCompleted: false,
    taxReviewCompleted: false,
    privacyReviewCompleted: false,
    securityReviewCompleted: false,
    identityProviderSelected: false,
    bankProviderSelected: false,
    businessOwnerDecisionsCompleted: false,
    engineeringDecisionsCompleted: false,
    devMigrationApprovalGranted: false,
    productionMigrationApprovalGranted: false,
    migrationImplemented: false,
    migrationFileCreated: false,
    supabaseDbPushExecuted: false,
    actualPersonalDataCollectionImplemented: false,
    actualCashOutProcessingAllowed: false,
    productionMutation: false,
    legalConclusionDeclared: false,
    overallApprovalStatus: "blocked",
    questionCount: STAGE3O_EXTERNAL_REVIEW_QUESTIONS.length,
    deployCommit: getDeployCommit(),
    ...STAGE3O_QUESTION_COUNT_TAXONOMY,
  };
}

export function getStage3OQuestionsByDomain(domain: Stage3OQuestionDomain) {
  return STAGE3O_EXTERNAL_REVIEW_QUESTIONS.filter(
    (questionItem) => questionItem.domain === domain,
  );
}

export function getInvalidStage3OSourceItemIds() {
  return STAGE3O_EXTERNAL_REVIEW_QUESTIONS.flatMap((questionItem) =>
    questionItem.sourceStage3NItemIds.filter(
      (itemId) => !stage3NItemsById.has(itemId),
    ),
  );
}
