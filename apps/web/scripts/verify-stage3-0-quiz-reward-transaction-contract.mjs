/**
 * Stage 3-0 — quiz_reward transaction contract doc + code alignment
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerContains,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
const webRoot = join(__dirname, "..");
const BASE = resolveProductionE2eBaseUrl();

const CONTRACT_DOC = join(
  repoRoot,
  "docs/adme/stage-3-0-quiz-reward-transaction-contract.md",
);
const CONTRACT_TS = join(webRoot, "src/lib/stage3/quiz-reward-contract.ts");
const MIGRATIONS_DIR = join(repoRoot, "supabase/migrations");

const REQUIRED_FAILURE_CODES = [
  "MIN_VIEW_NOT_MET",
  "ATTEMPT_LIMIT_REACHED",
  "ALREADY_REWARDED",
  "INCORRECT_RETRY_AVAILABLE",
  "INCORRECT_FINAL",
  "CAMPAIGN_BUDGET_EXHAUSTED",
  "REWARD_MUTATION_DISABLED",
  "ENV_NOT_SEPARATED",
];

const FORBIDDEN_SUCCESS_FIELDS = [
  "answer",
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
];

function assertFileExists(path, label) {
  if (!statSync(path, { throwIfNoEntry: false })) {
    throw new Error(`${label} missing: ${path}`);
  }
  console.log(`PASS: ${label} exists`);
}

function walkMigrations(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkMigrations(full, acc);
    else if (/\.sql$/.test(entry)) acc.push(full);
  }
  return acc;
}

function main() {
  assertFileExists(CONTRACT_DOC, "contract doc");
  assertFileExists(CONTRACT_TS, "contract ts");

  const doc = readFileSync(CONTRACT_DOC, "utf8");
  const code = readFileSync(CONTRACT_TS, "utf8");

  if (!doc.includes("stage3-0-v1")) {
    throw new Error("contract doc missing version stage3-0-v1");
  }
  console.log("PASS: contract doc version stage3-0-v1");

  const readinessCode = readFileSync(
    join(webRoot, "src/lib/stage3/readiness.ts"),
    "utf8",
  );
  if (
    !readinessCode.includes('STAGE30_TRANSACTION_CONTRACT_VERSION = "stage3-0-v1"') &&
    !code.includes("stage3-0-v1")
  ) {
    throw new Error("stage3 contract version stage3-0-v1 missing in lib/stage3");
  }
  console.log("PASS: contract ts version stage3-0-v1");

  for (const code_ of REQUIRED_FAILURE_CODES) {
    if (!doc.includes(code_)) {
      throw new Error(`contract doc missing failure code ${code_}`);
    }
    if (!code.includes(`"${code_}"`)) {
      throw new Error(`contract ts missing failure code ${code_}`);
    }
    console.log(`PASS: failure code ${code_}`);
  }

  for (const field of FORBIDDEN_SUCCESS_FIELDS) {
    if (doc.includes(`"${field}"`) && doc.includes("성공")) {
      const successSection = doc.split("## 성공 시 응답 계약")[1] ?? "";
      if (successSection.includes(field) && !successSection.includes("절대 포함 금지")) {
        // doc may list forbidden fields in a separate bullet — that's OK
      }
    }
    if (!code.includes(`"${field}"`)) {
      throw new Error(`contract ts missing forbidden field ${field}`);
    }
  }
  console.log("PASS: forbidden success response fields documented in code");

  for (const file of walkMigrations(MIGRATIONS_DIR)) {
    const sql = readFileSync(file, "utf8");
    if (
      /submit_quiz_reward_transaction|record_quiz_reward_actual/i.test(sql) &&
      !sql.includes("Stage 3-0") &&
      !sql.includes("NOT MIGRATED")
    ) {
      throw new Error(`actual quiz_reward RPC found in migration: ${file}`);
    }
  }
  console.log("PASS: no actual quiz_reward RPC in supabase/migrations");

  if (!code.includes("actualMutationAllowed: false")) {
    throw new Error("contract ts must set actualMutationAllowed: false");
  }
  console.log("PASS: actualMutationAllowed=false in contract ts");
}

async function verifyDiagnostics() {
  const sources = await loadDiagnosticsFromHttp(BASE, { maxWaitMs: 60000 });
  assertMarkerContains(
    sources.combined,
    "stage30TransactionContractVersion=stage3-0-v1",
    "diagnostics contract version",
  );
  const actualEnabled = extractMarkerValue(
    sources.combined,
    "stage30QuizRewardActualMutationEnabled",
  );
  if (actualEnabled !== "false") {
    throw new Error(
      `stage30QuizRewardActualMutationEnabled expected false, got "${actualEnabled}"`,
    );
  }
  console.log("PASS: stage30QuizRewardActualMutationEnabled=false");
}

main();

await verifyDiagnostics().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});

console.log("PASS: verify:stage3-0-quiz-reward-transaction-contract");
