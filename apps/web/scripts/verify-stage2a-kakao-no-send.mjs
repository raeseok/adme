/**
 * Stage 2-A — no Kakao actual send integration, SDK, env, or phone collection
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
const webRoot = join(__dirname, "..");

const CODE_SCAN_ROOTS = [
  join(webRoot, "src"),
  join(webRoot, "scripts"),
];

const FORBIDDEN_CODE_PATTERNS = [
  { pattern: /talk\/message/i, label: "Kakao talk/message API" },
  { pattern: /kakaotalk.*send|send.*kakaotalk/i, label: "kakaotalk send" },
  { pattern: /KAKAO_MESSAGE|KAKAO_BIZ|KAKAO_CHANNEL_SECRET/, label: "Kakao message env" },
  { pattern: /kakao.*business.*message.*api/i, label: "Kakao business message API endpoint" },
  { pattern: /notification.*send.*route/i, label: "notification send route" },
];

const PHONE_UI_PATTERNS = [
  /type\s*=\s*["']tel["']/,
  /phone_number/,
  /휴대전화|휴대폰\s*번호/,
];

function walk(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|ts|mjs|json|env.*)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function isDocFile(file) {
  return file.includes(`${join("docs", "")}`) || file.endsWith(".md");
}

let failed = 0;

for (const dir of CODE_SCAN_ROOTS) {
  for (const file of walk(dir)) {
    if (file.includes("verify-stage2a-kakao-no-send")) continue;
    if (file.includes("verify-stage2b-kakao-no-send")) continue;
    const content = readFileSync(file, "utf8");

    for (const { pattern, label } of FORBIDDEN_CODE_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`FAIL: ${file} — ${label}`);
        failed++;
      }
    }

    if (file.includes("src/app") || file.includes("src/components")) {
      for (const pattern of PHONE_UI_PATTERNS) {
        if (pattern.test(content) && !file.includes("verify-stage2a")) {
          console.error(`FAIL: ${file} — phone collection UI pattern`);
          failed++;
        }
      }
    }
  }
}

const pkg = JSON.parse(readFileSync(join(webRoot, "package.json"), "utf8"));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
for (const name of Object.keys(allDeps)) {
  if (/kakao/i.test(name) && !name.includes("@supabase")) {
    console.error(`FAIL: Kakao SDK dependency added: ${name}`);
    failed++;
  }
}

const envExample = join(webRoot, ".env.example");
if (statSync(envExample, { throwIfNoEntry: false })) {
  const envContent = readFileSync(envExample, "utf8");
  if (/KAKAO_(MESSAGE|BIZ|CHANNEL)/.test(envContent)) {
    console.error("FAIL: .env.example has Kakao send secrets");
    failed++;
  }
}

if (failed === 0) {
  console.log("PASS: no Kakao API/SDK/env/phone UI in Stage 2-A code");
  console.log("PASS: verify:stage2a-kakao-no-send");
} else {
  process.exit(1);
}
