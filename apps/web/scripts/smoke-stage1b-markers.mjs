import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const formPath = join(root, "src/app/consumer/profile/ConsumerProfileForm.tsx");
const actionsPath = join(root, "src/app/consumer/profile/actions.ts");
const formSource = readFileSync(formPath, "utf8");
const actionsSource = readFileSync(actionsPath, "utf8");

const requiredLiterals = [
  "stage-1-b-consumer-profile-ui",
  "stage1BActivityMax=2",
  "stage1BPointLedgerMutation=",
  "stage1BQuizAnswerAccess=",
  "stage1BServiceRoleUsed=",
  "stage1BAuthSeparatedTo=Stage 1-C",
  "stage1BWriteContract=auth-gated-server-action",
  "stage1BRegionsEmpty=",
  "stage1BCategoriesEmpty=",
  "AUTH_REQUIRED",
  "noValidate",
];

let failed = 0;
for (const literal of requiredLiterals) {
  if (!formSource.includes(literal)) {
    console.error(`FAIL: missing literal in ConsumerProfileForm.tsx: ${literal}`);
    failed++;
  } else {
    console.log(`PASS: ${literal}`);
  }
}

const authGateIndex = actionsSource.indexOf("if (!user)");
const validateCallIndex = actionsSource.indexOf("const validationError = validateInput");
if (authGateIndex === -1 || validateCallIndex === -1 || authGateIndex >= validateCallIndex) {
  console.error("FAIL: auth gate must run before validateInput call in actions.ts");
  failed++;
} else {
  console.log("PASS: auth gate before validateInput in actions.ts");
}

if (failed > 0) {
  process.exit(1);
}

console.log("Stage 1-B marker smoke: all checks passed");
