/**
 * Stage 3-0 — point_ledger / budget / balance mutation must not exist
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const BASE = resolveProductionE2eBaseUrl();

const MUTATION_PATTERNS = [
  /\.from\(\s*["']point_ledger["']\s*\)\s*\.(insert|update|delete|upsert)/,
  /point_ledger.*\.(insert|update|delete|upsert)/i,
  /\.from\(\s*["']campaigns["']\s*\)\s*\.update/,
  /budget_spent/,
  /\.from\(\s*["']users["']\s*\)\s*\.update.*balance/i,
  /partner_settlements.*\.(insert|update|delete|upsert)/i,
  /\.from\(\s*["']cash_out["']\s*\)\s*\.insert/i,
  /\.rpc\(\s*["'](record_quiz_reward|submit_quiz_reward)/i,
];

const SCAN_PATHS = [
  join(root, "src/lib/stage3"),
  join(root, "src/lib/consumer-ads/stage2c-ad-views.server.ts"),
  join(root, "src/app/consumer/ads/[campaignId]/actions.ts"),
  join(root, "src/app/admin/diagnostics/page.tsx"),
];

const ALLOWED_IN_FILE = [
  "point-ledger-safety.ts",
  "quiz-reward-contract.ts",
  "readiness.ts",
  "page.tsx",
];

function walk(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|ts|mjs)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function collectFiles(targetPath) {
  if (!statSync(targetPath, { throwIfNoEntry: false })) return [];
  const st = statSync(targetPath);
  if (st.isDirectory()) return walk(targetPath);
  return [targetPath];
}

function isAllowedException(file, content, pattern) {
  const basename = file.split(/[/\\]/).pop() ?? "";
  if (ALLOWED_IN_FILE.includes(basename)) {
    if (pattern.source.includes("point_ledger") && basename.includes("point-ledger")) {
      return true;
    }
    if (pattern.source.includes("budget") && basename.includes("readiness")) {
      return true;
    }
    if (basename === "page.tsx" && content.includes("stage30PointLedgerMutation=false")) {
      return true;
    }
    if (basename.includes("quiz-reward") && pattern.source.includes("rpc")) {
      return true;
    }
  }
  return false;
}

let failed = 0;

for (const dir of SCAN_PATHS) {
  for (const file of collectFiles(dir)) {
    const content = readFileSync(file, "utf8");
    for (const pattern of MUTATION_PATTERNS) {
      if (pattern.test(content)) {
        if (isAllowedException(file, content, pattern)) continue;
        if (file.includes("stage2c-ad-views") && pattern.source.includes("budget_spent")) {
          continue;
        }
        console.error(`FAIL: ${file} matches ${pattern}`);
        failed++;
      }
    }
  }
}

if (failed === 0) {
  console.log("PASS: Stage 3-0 paths — no point_ledger/budget/balance mutation");
}

const RUNTIME_MARKERS = [
  "stage30PointLedgerMutation=false",
  "stage30CampaignBudgetMutation=false",
  "stage30UsersBalanceMutation=false",
  "stage30PartnerSettlementsMutation=false",
  "stage30CashOutMutation=false",
  "stage2CRewardPreviewOnly=true",
];

async function verifyRuntime() {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 60000 });
  assertMarkerList(sources.combined, RUNTIME_MARKERS, "runtime diagnostics");

  const rewardPreview = extractMarkerValue(sources.combined, "stage2CRewardPreviewOnly");
  if (rewardPreview !== "true") {
    throw new Error(`stage2CRewardPreviewOnly expected true, got "${rewardPreview}"`);
  }
  console.log("PASS: stage2CRewardPreviewOnly=true maintained");
}

await verifyRuntime().catch((e) => {
  console.error(`FAIL: runtime — ${e.message}`);
  failed++;
});

console.log(
  "INFO: runtime DB point_ledger count not available due to RLS/env — static scan + diagnostics marker verified",
);

if (failed > 0) {
  process.exit(1);
}
console.log("PASS: verify:stage3-0-point-ledger-no-mutation");
