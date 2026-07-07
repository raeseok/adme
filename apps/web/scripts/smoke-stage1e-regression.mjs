import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const files = {
  selector: readFileSync(join(root, "src/components/RegionHierarchySelector.tsx"), "utf8"),
  profileForm: readFileSync(join(root, "src/app/consumer/profile/ConsumerProfileForm.tsx"), "utf8"),
  diagnostics: readFileSync(join(root, "src/app/admin/diagnostics/page.tsx"), "utf8"),
  regionAuth: readFileSync(join(root, "scripts/verify-stage1e-region-auth.mjs"), "utf8"),
  rlsAb: readFileSync(join(root, "scripts/verify-stage1e-rls-ab.mjs"), "utf8"),
  helpers: readFileSync(join(root, "scripts/e2e/region-hierarchy-helpers.mjs"), "utf8"),
  packageJson: readFileSync(join(root, "package.json"), "utf8"),
};

let failed = 0;

function check(label, source, required, forbidden = []) {
  for (const literal of required) {
    if (!source.includes(literal)) {
      console.error(`FAIL: ${label} missing: ${literal}`);
      failed++;
    } else {
      console.log(`PASS: ${label} — ${literal}`);
    }
  }
  for (const literal of forbidden) {
    if (source.includes(literal)) {
      console.error(`FAIL: ${label} should not contain: ${literal}`);
      failed++;
    } else {
      console.log(`PASS: ${label} clean — no ${literal}`);
    }
  }
}

check("RegionHierarchySelector", files.selector, [
  "data-testid",
  "testId",
  "-sido",
  "-sigungu",
  "-dong",
]);

check("ConsumerProfileForm", files.profileForm, [
  "region-selector-residence",
  "region-selector-activity-1",
  "region-selector-activity-2",
]);

check("diagnostics", files.diagnostics, [
  "Stage 1-F-R MOIS Region Source Alignment",
  "stage-1-f-r-mois-region-source-alignment",
  "stage1FCanonicalRegionSource=mois-admin-dong",
  "stage1FRegionSeedCoverage=",
  "Stage 1-E-R Region Auth Verification",
  "stage-1-e-r-region-auth-verification",
  "stage1ERRlsABSelectorUpdated=true",
  "Stage 1-E Region Hierarchical Selector",
  "stage-1-e-region-hierarchical-selector",
]);

check("region-auth verify", files.regionAuth, [
  "ADME_TEST_EMAIL_A",
  "resolveTestCredentials",
  "REGION_SELECTOR_IDS",
  "selectRegionHierarchy",
]);

check("rls-ab verify", files.rlsAb, [
  "ADME_TEST_EMAIL_A",
  "ADME_TEST_EMAIL_B",
  "resolveTestCredentials",
  "selectRegionHierarchy",
]);

check("helpers", files.helpers, [
  "selectRegionHierarchy",
  "getRegionHierarchyValues",
  "REGION_SELECTOR_IDS",
]);

check(
  "profileForm public",
  files.profileForm,
  [],
  ["stage1ERegionSelectorDepth=", "stage1ERAuthenticatedSaveReload="],
);

check("package.json", files.packageJson, [
  "verify:stage1e-region-auth",
  "verify:stage1e-rls-ab",
  "smoke:stage1e-regression",
  "verify:stage1f-region-seed-coverage",
  "smoke:stage1f-region-ui",
  "verify:stage1f-r-mois-source",
  "smoke:stage1f-r-region-ui",
]);

if (failed > 0) process.exit(1);
console.log("Stage 1-E-R regression smoke: all checks passed");
