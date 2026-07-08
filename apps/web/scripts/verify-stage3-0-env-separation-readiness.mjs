/**
 * Stage 3-0 — Supabase dev/prod separation readiness via /admin/diagnostics
 */
import {
  assertMarkerContains,
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const REQUIRED_MARKERS = [
  "stage30Build=stage3-0-supabase-ledger-safety-readiness-production",
  "stage30PointLedgerActualMutationEnabled=false",
  "stage30PointLedgerMutation=false",
  "stage30CampaignBudgetMutation=false",
  "stage30QuizAnswerClientExposure=false",
];

const SECRET_PATTERNS = [
  { pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, label: "JWT-like anon key" },
  { pattern: /service_role/i, label: "service_role string" },
  { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/, label: "SUPABASE_SERVICE_ROLE_KEY value" },
  { pattern: /KAKAO.*SECRET\s*=\s*\S+/i, label: "Kakao secret" },
  { pattern: /VERCEL.*TOKEN\s*=\s*\S+/i, label: "Vercel token" },
];

function assertNoSecrets(combined) {
  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(combined)) {
      throw new Error(`diagnostics exposes secret pattern: ${label}`);
    }
  }
  console.log("PASS: diagnostics — no secret patterns detected");
}

function assertFalseMarker(combined, key, label) {
  const value = extractMarkerValue(combined, key);
  if (value !== "false") {
    throw new Error(`${label}: expected ${key}=false, got "${value}"`);
  }
  console.log(`PASS: ${label} — ${key}=false`);
}

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 60000,
  });
  const combined = sources.combined;

  assertMarkerContains(
    combined,
    "stage30Build=stage3-0-supabase-ledger-safety-readiness-production",
    "stage30 build",
  );

  const currentRef = extractMarkerValue(combined, "stage30CurrentSupabaseProjectRef");
  if (!currentRef || currentRef === "unknown") {
    throw new Error(`stage30CurrentSupabaseProjectRef missing or unknown: "${currentRef}"`);
  }
  console.log(`PASS: stage30CurrentSupabaseProjectRef=${currentRef}`);

  assertMarkerList(combined, REQUIRED_MARKERS, "stage30 required markers");

  const separated = extractMarkerValue(combined, "stage30DevProdSupabaseSeparated");
  const readiness = extractMarkerValue(combined, "stage30ReadinessStatus");

  if (separated === "false") {
    if (readiness !== "BLOCKED_DEV_PROD_NOT_SEPARATED") {
      throw new Error(
        `expected stage30ReadinessStatus=BLOCKED_DEV_PROD_NOT_SEPARATED when separated=false, got "${readiness}"`,
      );
    }
    console.log("PASS: not separated — BLOCKED_DEV_PROD_NOT_SEPARATED");
  } else if (separated === "true") {
    if (readiness !== "READY_FOR_STAGE3_DESIGN_ONLY") {
      throw new Error(
        `expected stage30ReadinessStatus=READY_FOR_STAGE3_DESIGN_ONLY when separated=true, got "${readiness}"`,
      );
    }
    console.log("PASS: separated — READY_FOR_STAGE3_DESIGN_ONLY");
  } else {
    throw new Error(`unexpected stage30DevProdSupabaseSeparated="${separated}"`);
  }

  for (const key of [
    "stage30PointLedgerActualMutationEnabled",
    "stage30QuizRewardActualMutationEnabled",
    "stage30PointLedgerMutation",
    "stage30CampaignBudgetMutation",
    "stage30UsersBalanceMutation",
    "stage30PartnerSettlementsMutation",
    "stage30CashOutMutation",
  ]) {
    assertFalseMarker(combined, key, "actual mutation guard");
  }

  assertNoSecrets(combined);

  console.log("PASS: verify:stage3-0-env-separation-readiness");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
