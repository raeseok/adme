/**
 * Stage 3-1 — Preview deployment must point at dev Supabase ref
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerContains,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const SECRET_PATTERNS = [
  { pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, label: "JWT-like anon key" },
  { pattern: /service_role/i, label: "service_role string" },
];

function resolvePreviewBaseUrl() {
  const fromArg = process.argv.find((a) => a.startsWith("--url="))?.slice(6)?.trim();
  const fromEnv = process.env.ADME_PREVIEW_URL?.trim();
  const url = (fromArg || fromEnv || "").replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "Preview URL required: set ADME_PREVIEW_URL or pass --url=https://....vercel.app",
    );
  }
  return url;
}

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
  console.log("PASS: preview diagnostics — no secret patterns detected");
}

async function loadPreviewDiagnostics(baseUrl) {
  try {
    const sources = await loadDiagnosticsFromHttp(baseUrl, { maxWaitMs: 20000 });
    if (extractMarkerValue(sources.combined, "stage30Build").includes("stage3-0")) {
      return sources;
    }
  } catch {
    // Protected Preview deployments may require Vercel CLI curl bypass.
  }

  console.log("INFO: falling back to vercel curl for protected Preview deployment");
  const html = execSync(
    `npx vercel curl "/admin/diagnostics" --deployment ${JSON.stringify(baseUrl)}`,
    { cwd: webRoot, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
  return {
    combined: html,
    textContent: html,
    innerText: html,
    html,
  };
}

async function main() {
  const base = resolvePreviewBaseUrl();
  console.log(`INFO: preview base URL host=${new URL(base).hostname}`);

  const sources = await loadPreviewDiagnostics(base);
  const combined = sources.combined;

  assertEquals(combined, "stage30VercelEnv", "preview", "preview env");
  assertEquals(combined, "stage30ExpectedProdSupabaseRefConfigured", "true", "expected prod ref");
  assertEquals(combined, "stage30ExpectedDevSupabaseRefConfigured", "true", "expected dev ref");
  assertEquals(combined, "stage30DevProdSupabaseSeparated", "true", "dev/prod separated");
  assertEquals(combined, "stage30CurrentEnvMatchesExpectedRef", "true", "preview ref match");
  assertEquals(
    combined,
    "stage30ReadinessStatus",
    "READY_FOR_STAGE3_DESIGN_ONLY",
    "readiness",
  );

  const currentRef = extractMarkerValue(combined, "stage30CurrentSupabaseProjectRef");
  const expectedDev = extractMarkerValue(combined, "stage30ExpectedDevSupabaseRef");
  const expectedProd = extractMarkerValue(combined, "stage30ExpectedProdSupabaseRef");

  if (expectedDev && currentRef !== expectedDev) {
    throw new Error(
      `Preview current ref "${currentRef}" must equal expected dev ref "${expectedDev}"`,
    );
  }
  if (expectedProd && expectedDev && expectedProd === expectedDev) {
    throw new Error("expected prod and dev refs must differ");
  }
  console.log(`PASS: preview current ref=${currentRef}`);

  assertMarkerContains(
    combined,
    "stage30PointLedgerActualMutationEnabled=false",
    "preview actual mutation disabled",
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
    assertFalseMarker(combined, key, "preview actual mutation guard");
  }

  assertNoSecrets(combined);
  console.log("PASS: verify:stage3-1-env-split-preview");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
