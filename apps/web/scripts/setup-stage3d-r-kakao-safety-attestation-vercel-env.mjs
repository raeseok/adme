/**
 * One-time Stage 3-D-R Vercel Production env — Kakao OAuth Secret Safety Attestation.
 * Sets operational confirmation booleans/dates only. Never sets Client Secret material.
 *
 * Usage: node scripts/setup-stage3d-r-kakao-safety-attestation-vercel-env.mjs
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const ATTESTED_AT = process.env.ADME_KAKAO_SECRET_ATTESTED_AT || "2026-07-09";

const ENVS = [
  ["ADME_KAKAO_SECRET_SAFETY_ATTESTATION_REQUIRED", "true"],
  ["ADME_KAKAO_SECRET_SAFETY_ATTESTATION_CONFIRMED", "true"],
  ["ADME_KAKAO_SECRET_ATTESTED_AT", ATTESTED_AT],
  ["ADME_KAKAO_SECRET_EXPOSURE_SUSPECTED", "false"],
  ["ADME_KAKAO_SECRET_RAW_RECORDED", "false"],
  ["ADME_KAKAO_SECRET_PARTIAL_HASH_DIGEST_RECORDED", "false"],
  ["ADME_KAKAO_SECRET_DEV_PROVIDER_CONFIGURED", "true"],
  ["ADME_KAKAO_SECRET_PROD_PROVIDER_CONFIGURED", "true"],
  ["ADME_KAKAO_OAUTH_DEV_AUTHORIZE_REVERIFIED", "true"],
  ["ADME_KAKAO_OAUTH_PROD_AUTHORIZE_REVERIFIED", "true"],
  ["ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED", "true"],
  ["ADME_KAKAO_SECRET_ROTATION_REQUIRED", "false"],
  ["ADME_KAKAO_SECRET_ROTATION_PERFORMED", "false"],
];

function setEnv(name, value, environment) {
  execSync(
    `npx vercel env add ${name} ${environment} --value ${JSON.stringify(value)} --force --yes`,
    { cwd: webRoot, stdio: ["pipe", "pipe", "pipe"] },
  );
  console.log(`PASS: set ${name}=${value} for ${environment}`);
}

for (const [name, value] of ENVS) {
  setEnv(name, value, "production");
}

console.log(
  "PASS: Stage 3-D-R Kakao OAuth Secret Safety Attestation env configured (production)",
);
console.log(`INFO: attestedAt=${ATTESTED_AT}`);
console.log(
  "INFO: No Client Secret / code / token values were written — booleans and date only",
);
