import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3P_DEV_ONLY_KYC_TAX_TERMS_SCHEMA_FOUNDATION_BUILD =
  "stage3p-dev-only-kyc-tax-terms-schema-foundation";

export const STAGE3P_MIGRATION_FILENAME =
  "20260710110500_stage_3_p_dev_only_kyc_tax_terms_schema_foundation.sql";

export const STAGE3P_ADMIN_ROUTE =
  "/admin/dev-kyc-tax-terms-schema-foundation";

export const STAGE3P_PROJECT_REFS = {
  devSupabaseProjectRef: "ogncvdxrrsjnwsuvgoyh",
  prodSupabaseProjectRef: "vupsalteyltjqumppltc",
} as const;

export const STAGE3P_DB_OBJECTS = [
  "consumer_identity_verifications",
  "consumer_bank_account_verifications",
  "consumer_tax_profiles",
  "legal_document_versions",
  "consumer_legal_acceptances",
  "consumer_marketing_consents",
  "cash_redemption_precondition_snapshots",
] as const;

export const STAGE3P_VISIBLE_MARKERS = [
  "ADME_STAGE_3_P_DEV_KYC_TAX_TERMS_SCHEMA_FOUNDATION",
  "Business owner dev approval: GRANTED",
  "External review: DEFERRED UNTIL PRE-LAUNCH",
  "Dev Supabase linked ref: ogncvdxrrsjnwsuvgoyh",
  "Dev migration: APPLIED",
  "Dev DB verification: PASSED",
  "Production migration: BLOCKED",
  "Production DB mutation: NOT EXECUTED",
  "Provider-neutral schema only",
  "No raw identity data",
  "No raw bank account data",
  "No tax calculation",
  "No actual cash-out processing",
] as const;

export const STAGE3P_RLS_SUMMARY = [
  {
    principal: "anonymous",
    access: "blocked",
    writeAccess: "blocked",
  },
  {
    principal: "consumer",
    access: "own coarse status only through column grants and RLS",
    writeAccess: "blocked",
  },
  {
    principal: "advertiser",
    access: "blocked",
    writeAccess: "blocked",
  },
  {
    principal: "partner",
    access: "blocked",
    writeAccess: "blocked",
  },
  {
    principal: "admin",
    access: "minimal status read only",
    writeAccess: "blocked",
  },
] as const;

export type Stage3PDevImplementationStatus = "approved";
export type Stage3PProductionApprovalStatus = "blocked";

export type Stage3PDevOnlyKycTaxTermsSchemaFoundationState = {
  stage3PDevSchemaFoundationComplete: true;
  businessOwnerDevApprovalGranted: true;
  externalReviewDeferredUntilPreLaunch: true;
  devMigrationApprovalGranted: true;
  productionMigrationApprovalGranted: false;
  devMigrationImplemented: true;
  productionMigrationImplemented: false;
  devSupabasePushExecuted: true;
  productionSupabasePushExecuted: false;
  providerNeutralSchemaOnly: true;
  rawIdentityDataStored: false;
  rawBankAccountDataStored: false;
  providerRawResponseStored: false;
  providerCredentialsStored: false;
  taxCalculationImplemented: false;
  withholdingCalculationImplemented: false;
  actualPersonalDataCollectionImplemented: false;
  actualCashOutProcessingAllowed: false;
  pointLedgerCashOutMutationImplemented: false;
  productionMutation: false;
  legalConclusionDeclared: false;
  devImplementationStatus: Stage3PDevImplementationStatus;
  productionApprovalStatus: Stage3PProductionApprovalStatus;
  migrationFilename: typeof STAGE3P_MIGRATION_FILENAME;
  dbObjectCount: number;
  dbObjects: string;
  devSupabaseProjectRef: typeof STAGE3P_PROJECT_REFS.devSupabaseProjectRef;
  prodSupabaseProjectRef: typeof STAGE3P_PROJECT_REFS.prodSupabaseProjectRef;
  devDbVerificationPassed: true;
  devRlsVerificationPassed: true;
  devIdempotencyVerificationPassed: true;
  productionDbMutationExecuted: false;
  deployCommit: string;
};

export function getStage3PDevOnlyKycTaxTermsSchemaFoundationState(): Stage3PDevOnlyKycTaxTermsSchemaFoundationState {
  return {
    stage3PDevSchemaFoundationComplete: true,
    businessOwnerDevApprovalGranted: true,
    externalReviewDeferredUntilPreLaunch: true,
    devMigrationApprovalGranted: true,
    productionMigrationApprovalGranted: false,
    devMigrationImplemented: true,
    productionMigrationImplemented: false,
    devSupabasePushExecuted: true,
    productionSupabasePushExecuted: false,
    providerNeutralSchemaOnly: true,
    rawIdentityDataStored: false,
    rawBankAccountDataStored: false,
    providerRawResponseStored: false,
    providerCredentialsStored: false,
    taxCalculationImplemented: false,
    withholdingCalculationImplemented: false,
    actualPersonalDataCollectionImplemented: false,
    actualCashOutProcessingAllowed: false,
    pointLedgerCashOutMutationImplemented: false,
    productionMutation: false,
    legalConclusionDeclared: false,
    devImplementationStatus: "approved",
    productionApprovalStatus: "blocked",
    migrationFilename: STAGE3P_MIGRATION_FILENAME,
    dbObjectCount: STAGE3P_DB_OBJECTS.length,
    dbObjects: STAGE3P_DB_OBJECTS.join(","),
    devSupabaseProjectRef: STAGE3P_PROJECT_REFS.devSupabaseProjectRef,
    prodSupabaseProjectRef: STAGE3P_PROJECT_REFS.prodSupabaseProjectRef,
    devDbVerificationPassed: true,
    devRlsVerificationPassed: true,
    devIdempotencyVerificationPassed: true,
    productionDbMutationExecuted: false,
    deployCommit: getDeployCommit(),
  };
}
