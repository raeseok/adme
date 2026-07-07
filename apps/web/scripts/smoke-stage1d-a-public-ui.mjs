import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const loginForm = readFileSync(
  join(root, "src/app/auth/login/LoginForm.tsx"),
  "utf8",
);
const profileForm = readFileSync(
  join(root, "src/app/consumer/profile/ConsumerProfileForm.tsx"),
  "utf8",
);
const diagnostics = readFileSync(
  join(root, "src/app/admin/diagnostics/page.tsx"),
  "utf8",
);

const forbiddenInLogin = [
  "stage1C",
  "stage1D",
  "Stage 1-C",
  "Stage 1-D",
  "stage-1-c-",
  "stage-1-d-",
  "DeployCommit",
  "ServiceRoleUsed",
  "PointLedgerMutation",
  "QuizAnswerAccess",
];

const forbiddenInProfile = [
  "stage1CProfileRoute",
  "stage1CSessionStatus",
  "stage1DSocialProvider",
  "Stage 1-C Authenticated",
  "stage-1-c-authenticated",
  "stage-1-d-",
  "stage1DServiceRoleUsed",
];

const requiredInDiagnostics = [
  "Stage 1-D-A Public UI Cleanup",
  "stage-1-d-a-public-ui-cleanup",
  "stage1DAPublicLoginClean=true",
  "stage1DAPublicProfileClean=true",
  "stage1DAAuthCompleted=true",
  "stage1DAGoogleOAuthE2E=pass",
  "stage1DAKakaoOAuthE2E=",
  "stage1DAServiceRoleUsed=false",
  "stage1DAPointLedgerMutation=false",
  "stage1DAQuizAnswerAccess=false",
  "stage1DAFullUserIdExposure=false",
  "stage1DAEmailMasked=true",
  "stage1DADeployCommit=",
];

let failed = 0;

for (const literal of forbiddenInLogin) {
  if (loginForm.includes(literal)) {
    console.error(`FAIL: LoginForm should not contain: ${literal}`);
    failed++;
  } else {
    console.log(`PASS: LoginForm clean — no ${literal}`);
  }
}

for (const literal of forbiddenInProfile) {
  if (profileForm.includes(literal)) {
    console.error(`FAIL: ConsumerProfileForm should not contain: ${literal}`);
    failed++;
  } else {
    console.log(`PASS: ConsumerProfileForm clean — no ${literal}`);
  }
}

for (const literal of requiredInDiagnostics) {
  if (!diagnostics.includes(literal)) {
    console.error(`FAIL: diagnostics missing: ${literal}`);
    failed++;
  } else {
    console.log(`PASS: diagnostics — ${literal}`);
  }
}

if (failed > 0) process.exit(1);
console.log("Stage 1-D-A public UI smoke: all checks passed");
