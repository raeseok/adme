/**
 * Stage 3-1 — Production env must point at prod Supabase ref with separation markers
 */
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const SECRET_PATTERNS = [
  { pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, label: "JWT-like anon key" },
  { pattern: /service_role/i, label: "service_role string" },
  { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/, label: "SUPABASE_SERVICE_ROLE_KEY value" },
];

function assertEquals(combined, key, expected, label) {
  const actual = extractMarkerValue(combined, key);
  if (actual !== expected) {
    throw new Error(`${label}: expected ${key}=${expected}, got "${actual}"`);
  }
  console.log(`PASS: ${label} — ${key}=${expected}`);
}

function assertFalseMarker(combined, key, label) {
  assertEquals(combined, key, "false", label);
}

function assertNoSecrets(combined) {
  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(combined)) {
      throw new Error(`diagnostics exposes secret pattern: ${label}`);
    }
  }
  console.log("PASS: diagnostics — no secret patterns detected");
}

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 90000 });
  const combined = sources.combined;

  assertEquals(combined, "stage30VercelEnv", "production", "production env");
  assertEquals(combined, "stage30ExpectedProdSupabaseRefConfigured", "true", "expected prod ref");
  assertEquals(combined, "stage30ExpectedDevSupabaseRefConfigured", "true", "expected dev ref");
  assertEquals(combined, "stage30DevProdSupabaseSeparated", "true", "dev/prod separated");
  assertEquals(combined, "stage30CurrentEnvMatchesExpectedRef", "true", "production ref match");
  assertEquals(
    combined,
    "stage30ReadinessStatus",
    "READY_FOR_STAGE3_DESIGN_ONLY",
    "readiness",
  );

  const currentRef = extractMarkerValue(combined, "stage30CurrentSupabaseProjectRef");
  const expectedProd = extractMarkerValue(combined, "stage30ExpectedProdSupabaseRef");
  const expectedDev = extractMarkerValue(combined, "stage30ExpectedDevSupabaseRef");

  if (expectedProd && currentRef !== expectedProd) {
    throw new Error(
      `Production current ref "${currentRef}" must equal expected prod ref "${expectedProd}"`,
    );
  }
  if (expectedProd && expectedDev && expectedProd === expectedDev) {
    throw new Error("expected prod and dev refs must differ");
  }
  console.log(`PASS: production current ref=${currentRef}`);

  assertMarkerList(
    combined,
    [
      "stage30Build=stage3-0-supabase-ledger-safety-readiness-production",
      "stage30PointLedgerActualMutationEnabled=false",
      "stage30PointLedgerMutation=false",
      "stage30CampaignBudgetMutation=false",
      "stage30QuizAnswerClientExposure=false",
    ],
    "production safety markers",
  );

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
  console.log("PASS: verify:stage3-1-env-split-production");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
