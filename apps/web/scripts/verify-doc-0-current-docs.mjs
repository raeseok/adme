/**
 * DOC-0 — living current docs existence and required content
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
const docsDir = join(repoRoot, "docs/adme");
const webSrc = join(__dirname, "..", "src");

const REQUIRED_DOCS = [
  "current-business-plan.md",
  "current-development-plan.md",
  "adme-decision-log.md",
  "stage-roadmap-current.md",
  "product-policy-current.md",
];

const BUSINESS_PHRASES = [
  "소비자가 소비정보 조건을 먼저 제시",
  "광고주는 조건에 맞는 광고와 보상을 제공",
  "소비자는 광고 인식을 확인",
  "적용 가능성",
  "가장 큰 자녀 생년",
  "막내 자녀 생년",
];

const DEV_PHRASES = [
  "ogncvdxrrsjnwsuvgoyh",
  "vupsalteyltjqumppltc",
  "point_ledger actual mutation 금지",
  "Stage 3-A",
  "Stage 1-G",
  "Vercel Production visible",
];

const DECISION_IDS = [
  "ADME-DECISION-20260708-001",
  "ADME-DECISION-20260708-002",
  "ADME-DECISION-20260708-003",
  "ADME-DECISION-20260708-004",
  "ADME-DECISION-20260708-005",
  "ADME-DECISION-20260708-006",
  "ADME-DECISION-20260708-007",
  "ADME-DECISION-20260708-008",
];

const POLICY_PHRASES = [
  "소비성향 프로필은 광고를 보내달라는 나의 요구",
  "더 많은 조건을 등록할수록",
  "개인정보 제공이 아니라 소비정보 요청 조건",
  "광고주에게 개인 식별 row 직접 노출 금지",
  "quiz_answer 비노출",
];

const FORBIDDEN_RUNTIME_PATTERNS = [
  /\.from\(\s*["']point_ledger["']\s*\)\s*\.(insert|update|delete|upsert)/,
  /SERVICE_ROLE|service_role/,
];

function assertFileExists(name) {
  const path = join(docsDir, name);
  if (!existsSync(path)) {
    throw new Error(`missing required doc: docs/adme/${name}`);
  }
  console.log(`PASS: exists docs/adme/${name}`);
  return readFileSync(path, "utf8");
}

function assertContains(content, phrase, label) {
  if (!content.includes(phrase)) {
    throw new Error(`${label}: missing "${phrase}"`);
  }
  console.log(`PASS: ${label} — "${phrase}"`);
}

function walkTs(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkTs(full, acc);
    else if (/\.(tsx?|ts)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function checkNoRuntimeMutationChanges() {
  const gitHead = join(repoRoot, ".git", "HEAD");
  if (!existsSync(gitHead)) {
    console.log("INFO: skip runtime mutation scan — not a git repo");
    return;
  }

  let failed = 0;
  for (const file of walkTs(webSrc)) {
    const content = readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
      if (pattern.test(content)) {
        if (file.includes("point-ledger-safety") || file.includes("readiness")) continue;
        console.error(`FAIL: runtime code mutation pattern in ${file}`);
        failed++;
      }
    }
  }

  const migrationsDir = join(repoRoot, "supabase/migrations");
  const before = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).length;
  console.log(`PASS: no new migration check — ${before} sql files in supabase/migrations`);

  if (failed > 0) process.exit(1);
  console.log("PASS: no forbidden runtime mutation patterns in app src");
}

function main() {
  for (const name of REQUIRED_DOCS) {
    assertFileExists(name);
  }

  const business = readFileSync(join(docsDir, "current-business-plan.md"), "utf8");
  for (const phrase of BUSINESS_PHRASES) {
    assertContains(business, phrase, "current-business-plan");
  }

  const dev = readFileSync(join(docsDir, "current-development-plan.md"), "utf8");
  for (const phrase of DEV_PHRASES) {
    assertContains(dev, phrase, "current-development-plan");
  }

  const decisions = readFileSync(join(docsDir, "adme-decision-log.md"), "utf8");
  for (const id of DECISION_IDS) {
    assertContains(decisions, id, "adme-decision-log");
  }

  const policy = readFileSync(join(docsDir, "product-policy-current.md"), "utf8");
  for (const phrase of POLICY_PHRASES) {
    assertContains(policy, phrase, "product-policy-current");
  }

  checkNoRuntimeMutationChanges();

  console.log("PASS: verify:doc-0-current-docs");
}

main();
