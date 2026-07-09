/**
 * Stage 3-E-Controlled-Open-Approval — PII/OAuth redaction guard.
 * Never prints raw secrets, authorization codes, tokens, raw callback payloads, or full emails.
 */
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { assertContains, assertNotContains, readText } from "./utils/stage3e-helpers.mjs";
import {
  REPO_ROOT,
  verifyApprovalSourceContract,
} from "./utils/stage3e-controlled-open-approval-helpers.mjs";
import { join } from "node:path";

const BASE = resolveProductionE2eBaseUrl();

const REDACTION_MARKERS = [
  "stage3EControlledAllowlistRawExposed=false",
  "stage3EQuizAnswerExposed=false",
  "stage3EAnswerHintExposed=false",
  "stage3EOAuthCodeTokenExposed=false",
  "stage3ESecretRawPartialHashDigestRecorded=false",
  "stage3EServiceRoleExposed=false",
  "stage3ERlsRelaxed=false",
];

function verifyDocsRedactionContract() {
  const approvalDoc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-e-controlled-open-approval.md"),
  );
  const runbookDoc = readText(
    join(REPO_ROOT, "docs/adme/stage-3-e-controlled-open-runbook.md"),
  );
  const combined = `${approvalDoc}\n${runbookDoc}`;

  assertContains(combined, "ra***@kakao.com", "masked Kakao attestation email");
  assertContains(
    combined,
    "<OPERATOR_APPROVED_CONSUMER_USER_ID_1>",
    "allowlist placeholder only",
  );
  assertContains(
    combined,
    "<OPERATOR_APPROVED_CAMPAIGN_ID>",
    "campaign placeholder only",
  );
  assertNotContains(combined, "raw callback payload:", "no raw callback payload");
  assertNotContains(combined, "access_token=", "no access token assignment");
  assertNotContains(combined, "refresh_token=", "no refresh token assignment");
  assertNotContains(combined, "client_secret=", "no client secret assignment");
}

async function main() {
  verifyApprovalSourceContract();
  verifyDocsRedactionContract();
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, REDACTION_MARKERS, "redaction markers");
  console.log("RESULT: quizAnswerExposure=false");
  console.log("RESULT: answerHintExposure=false");
  console.log("RESULT: oauthSecretCodeTokenExposure=false");
  console.log("RESULT: serviceRoleClientExposure=false");
  console.log("PASS: verify:stage3e-controlled-open-redaction");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
