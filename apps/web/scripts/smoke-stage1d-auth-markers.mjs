import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "src/app/auth/login/LoginForm.tsx",
  "src/app/auth/login/actions.ts",
  "src/app/auth/callback/route.ts",
  "src/app/consumer/profile/ConsumerProfileForm.tsx",
  "src/lib/auth/oauth.ts",
];

const requiredLiterals = [
  "stage-1-d-auth-social-login",
  "stage1DAuthLoginRoute=/auth/login",
  "stage1DAuthEmailEnabled=true",
  "stage1DAuthGoogleEnabled=true",
  "stage1DAuthKakaoEnabled=true",
  "stage1DAuthProviders=email,google,kakao",
  "stage1DGoogleLoginButtonVisible=true",
  "stage1DKakaoLoginButtonVisible=true",
  "stage1DEmailLoginFormVisible=true",
  "stage1DOAuthLastProvider=",
  "stage1DOAuthStartStatus=",
  "stage1DOAuthErrorCode=",
  "stage1DCallbackSupportsOAuth=true",
  "stage1DCallbackRedirectTarget=/consumer/profile",
  "stage1DCallbackServiceRoleUsed=false",
  "stage1DServiceRoleUsed=false",
  "stage1DPointLedgerMutation=false",
  "stage1DQuizAnswerAccess=false",
  "stage1DSocialProviderAuthenticated=",
  "stage1DSocialProfileSaveStatus=",
  "stage1DSocialLogoutStatus=",
  "signInWithOAuth",
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
console.log("Stage 1-D Auth marker smoke: all checks passed");
