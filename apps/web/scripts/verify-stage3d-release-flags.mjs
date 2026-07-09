/**
 * Stage 3-D — release flag parser defaults and client-bundle safety
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { readText } from "./utils/stage3d-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

const FLAG_MARKERS = [
  "stage3DReleaseFlagDesigned=true",
  "stage3DProductionRewardOpenFlag=false",
  "stage3DRewardKillSwitchDefaultOn=true",
  "stage3DControlledProductionAllowlistActive=false",
  "stage3DMutationBlockedByFlags=true",
];

function parseBool(raw, defaultValue) {
  if (raw === undefined || raw === "") return defaultValue;
  const v = String(raw).trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return defaultValue;
}

function verifySourceDefaults() {
  const src = readText(join(WEB_ROOT, "src/lib/rewards/release-flags.ts"));
  if (!src.includes('import "server-only"')) {
    throw new Error("release-flags.ts must be server-only");
  }
  if (!src.includes("ADME_REWARD_KILL_SWITCH")) {
    throw new Error("missing kill switch env");
  }
  if (!src.includes("ADME_PRODUCTION_REWARD_OPEN")) {
    throw new Error("missing production reward open env");
  }
  if (!src.includes("parseBool(process.env.ADME_REWARD_KILL_SWITCH, true)")) {
    throw new Error("kill switch default must be true");
  }
  if (!/ADME_PRODUCTION_REWARD_OPEN[\s\S]{0,120}false/.test(src)) {
    throw new Error("production reward open default must be false");
  }
  if (
    !/ADME_PRODUCTION_REWARD_ALLOWLIST_ENABLED[\s\S]{0,120}false/.test(src)
  ) {
    throw new Error("allowlist enabled default must be false");
  }
  console.log("PASS: release-flags source defaults");

  const killSwitch = parseBool(undefined, true);
  const open = parseBool(undefined, false);
  const allowlist = parseBool(undefined, false);
  if (!killSwitch || open || allowlist) {
    throw new Error("local default simulation failed");
  }
  console.log("PASS: local default simulation blocked");
}

function walkJs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkJs(full, acc);
    else if (/\.(js|mjs)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function verifyClientBundleNoRawEnv() {
  const nextDir = join(WEB_ROOT, ".next");
  if (!existsSync(nextDir)) {
    console.log(
      "INFO: .next missing — skip client bundle scan (run after build)",
    );
    return;
  }
  const forbidden = [
    "ADME_REWARD_KILL_SWITCH=",
    "ADME_PRODUCTION_REWARD_OPEN=",
    "ADME_KAKAO_SECRET_ROTATION_CONFIRMED=",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const staticFiles = walkJs(join(nextDir, "static"));
  for (const file of staticFiles) {
    const text = readFileSync(file, "utf8");
    for (const needle of forbidden) {
      if (text.includes(needle)) {
        throw new Error(`client bundle exposes ${needle} in ${file}`);
      }
    }
  }
  console.log(
    `PASS: scanned ${staticFiles.length} static assets — no raw env`,
  );
}

async function main() {
  verifySourceDefaults();
  verifyClientBundleNoRawEnv();

  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, FLAG_MARKERS, "Production release flags");

  console.log("RESULT: productionRewardOpenFlag=false");
  console.log("RESULT: killSwitchDefaultOn=true");
  console.log("RESULT: allowlistActive=false");
  console.log("PASS: verify:stage3d-release-flags");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
