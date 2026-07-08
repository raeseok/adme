/**
 * Stage 1-G-R — repo HEAD must match Production deploy commit
 */
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const STAGE1GR_MARKERS = [
  "stage1GRBuild=stage1g-r-profile-basic-optional-sections-production",
  "stage1GRProductionCommitMatchesRepoHead=true",
  "stage1GRBasicProfileFields=true",
  "stage1GROptionalProfileFields=true",
  "stage1GRBasicFields=birth_year,gender,residential_region",
  "stage1GROptionalFields=child_birth_years,pet_types,activity_regions,interest_categories",
  "stage1GROptionalCopyVisible=true",
  "stage1GROptionalCopyLocation=optional_profile_section",
  "stage1GRPointLedgerMutation=false",
  "stage1GRPublicMarkerExposed=false",
];

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

async function main() {
  const repoHead = execSync("git rev-parse HEAD", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
  const repoShort = repoHead.slice(0, 7);
  console.log(`INFO: repo HEAD=${repoShort}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const body = await page.locator("body").innerText();

    const deployMatch =
      body.match(/stage1GRDeployCommit=([a-f0-9]{7}|unknown)/) ??
      body.match(/stage1GDeployCommit=([a-f0-9]{7}|unknown)/);
    if (!deployMatch) {
      throw new Error("diagnostics: missing stage1GRDeployCommit/stage1GDeployCommit");
    }
    const productionDeploy = deployMatch[1];
    console.log(`INFO: Production deploy commit=${productionDeploy}`);

    if (productionDeploy === "unknown") {
      throw new Error("Production deploy commit is unknown");
    }

    if (productionDeploy !== repoShort) {
      throw new Error(
        `repo HEAD (${repoShort}) != Production deploy (${productionDeploy})`,
      );
    }
    console.log(`PASS: repo HEAD matches Production deploy commit (${repoShort})`);

    if (productionDeploy === "329e73f" && repoShort !== "329e73f") {
      throw new Error("Production still serving 329e73f while repo HEAD is newer");
    }

    for (const marker of STAGE1GR_MARKERS) {
      assertContains(body, marker, "diagnostics");
    }

    console.log("PASS: verify:stage1g-r-production-commit");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
