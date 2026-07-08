/**
 * Stage 3-1 — no actual financial mutation after env split
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
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
  join(root, "src/lib/consumer-ads"),
  join(root, "src/app/consumer/ads"),
];

const ALLOWED_BASENAMES = new Set([
  "point-ledger-safety.ts",
  "quiz-reward-contract.ts",
  "readiness.ts",
  "page.tsx",
]);

function walk(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|ts)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function collectFiles(targetPath) {
  if (!statSync(targetPath, { throwIfNoEntry: false })) return [];
  const st = statSync(targetPath);
  if (st.isDirectory()) return walk(targetPath);
  return [targetPath];
}

function isAllowedException(file, pattern) {
  const basename = file.split(/[/\\]/).pop() ?? "";
  if (!ALLOWED_BASENAMES.has(basename)) return false;
  if (basename.includes("point-ledger") || basename.includes("quiz-reward")) return true;
  if (basename === "page.tsx" && pattern.source.includes("point_ledger")) return true;
  return false;
}

let failed = 0;

for (const dir of SCAN_PATHS) {
  for (const file of collectFiles(dir)) {
    const content = readFileSync(file, "utf8");
    for (const pattern of MUTATION_PATTERNS) {
      if (!pattern.test(content)) continue;
      if (isAllowedException(file, pattern)) continue;
      if (file.includes("stage2c-ad-views") && pattern.source.includes("budget_spent")) continue;
      console.error(`FAIL: ${file} matches ${pattern}`);
      failed++;
    }
  }
}

if (failed === 0) {
  console.log("PASS: Stage 3-1 paths — no actual mutation code");
}

const RUNTIME_MARKERS = [
  "stage30PointLedgerActualMutationEnabled=false",
  "stage30QuizRewardActualMutationEnabled=false",
  "stage30PointLedgerMutation=false",
  "stage30CampaignBudgetMutation=false",
  "stage30UsersBalanceMutation=false",
  "stage30PartnerSettlementsMutation=false",
  "stage30CashOutMutation=false",
  "stage30KakaoActualSend=false",
];

try {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 90000 });
  assertMarkerList(sources.combined, RUNTIME_MARKERS, "production diagnostics");
} catch (e) {
  console.error(`FAIL: runtime — ${e.message}`);
  failed++;
}

if (failed > 0) process.exit(1);
console.log("PASS: verify:stage3-1-no-actual-mutation");
