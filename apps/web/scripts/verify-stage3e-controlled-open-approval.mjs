/**
 * Stage 3-E-Controlled-Open-Approval — approval-only marker verification.
 * Read-only/static + Production admin marker verification only.
 */
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3E_APPROVAL_REQUIRED_MARKERS,
  expectedDeployCommit,
  verifyApprovalSourceContract,
} from "./utils/stage3e-controlled-open-approval-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

async function verifyAdminPath(path) {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path,
  });
  assertMarkerList(
    sources.combined,
    STAGE3E_APPROVAL_REQUIRED_MARKERS,
    `${path} approval markers`,
  );
  const commit = extractMarkerValue(sources.combined, "stage3EDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3EDeployCommit=${commit}`);
}

async function main() {
  verifyApprovalSourceContract();
  await verifyAdminPath("/admin/reward-preflight");
  await verifyAdminPath("/admin/diagnostics");
  console.log("RESULT: stage3EControlledOpenApproval=true");
  console.log("RESULT: stage3EControlledOpenApprovalOnly=true");
  console.log("RESULT: stage3EActualOpenExecuted=false");
  console.log("PASS: verify:stage3e-controlled-open-approval");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
