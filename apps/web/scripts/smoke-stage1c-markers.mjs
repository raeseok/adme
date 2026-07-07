import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "src/app/admin/diagnostics/page.tsx",
  "src/lib/supabase/server.ts",
  "src/middleware.ts",
  "src/app/consumer/profile/actions.ts",
];

const requiredLiterals = [
  "stage-1-c-supabase-auth",
  "stage1CLoginRoute=/auth/login",
  "stage1CProfileRoute=/consumer/profile",
  "stage1CServiceRoleUsed=false",
  "stage1CPointLedgerMutation=false",
  "stage1CQuizAnswerAccess=false",
  "stage1CResidenceMax=1",
  "stage1CActivityMax=2",
  "stage1CAuthMethod=email-password",
  "@supabase/ssr",
];

let failed = 0;
const combined = files
  .map((f) => readFileSync(join(root, f), "utf8"))
  .join("\n");

for (const literal of requiredLiterals) {
  if (!combined.includes(literal)) {
    console.error(`FAIL: missing literal: ${literal}`);
    failed++;
  } else {
    console.log(`PASS: ${literal}`);
  }
}

if (failed > 0) process.exit(1);
console.log("Stage 1-C marker smoke: all checks passed");
