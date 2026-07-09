/**
 * Stage 3-D-R — Kakao OAuth Secret Safety Attestation verify
 * Checks source contract + Production admin markers.
 * Never logs secrets, codes, or tokens.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { assertContains, readText } from "./utils/stage3d-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

const SAFETY_MARKERS = [
  "stage3DKakaoSecretSafetyAttestationRequired=true",
  "stage3DKakaoSecretSafetyAttestationConfirmed=true",
  "stage3DKakaoSecretExposureSuspected=false",
  "stage3DKakaoSecretRawRecorded=false",
  "stage3DKakaoSecretPartialHashDigestRecorded=false",
  "stage3DKakaoSecretDevProviderConfigured=true",
  "stage3DKakaoSecretProdProviderConfigured=true",
  "stage3DKakaoOauthDevAuthorizeReverified=true",
  "stage3DKakaoOauthProdAuthorizeReverified=true",
  "stage3DKakaoOauthProdE2EReverified=true",
  "stage3DKakaoSecretRotationRequired=false",
  "stage3DKakaoSecretRotationPerformed=false",
  "stage3DKakaoSecretRawExposed=false",
  "stage3DOAuthCodeTokenExposed=false",
  "stage3DProductionRewardOpenReady=false",
  "stage3DProductionRewardMutation=false",
  "stage3DRewardKillSwitch=true",
  "stage3DProductionRewardOpenFlag=false",
  "stage3DControlledProductionAllowlistActive=false",
];

function verifySourceContract() {
  const attestation = readText(
    join(WEB_ROOT, "src/lib/rewards/kakao-secret-attestation.ts"),
  );
  const diagnostics = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3d-diagnostics.ts"),
  );

  if (!attestation.includes('import "server-only"')) {
    throw new Error("kakao attestation must be server-only");
  }
  for (const required of [
    "ADME_KAKAO_SECRET_SAFETY_ATTESTATION_REQUIRED",
    "ADME_KAKAO_SECRET_SAFETY_ATTESTATION_CONFIRMED",
    "ADME_KAKAO_SECRET_ATTESTED_AT",
    "ADME_KAKAO_SECRET_EXPOSURE_SUSPECTED",
    "ADME_KAKAO_SECRET_RAW_RECORDED",
    "ADME_KAKAO_SECRET_PARTIAL_HASH_DIGEST_RECORDED",
    "ADME_KAKAO_SECRET_DEV_PROVIDER_CONFIGURED",
    "ADME_KAKAO_SECRET_PROD_PROVIDER_CONFIGURED",
    "ADME_KAKAO_OAUTH_DEV_AUTHORIZE_REVERIFIED",
    "ADME_KAKAO_OAUTH_PROD_AUTHORIZE_REVERIFIED",
    "ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED",
    "ADME_KAKAO_SECRET_ROTATION_REQUIRED",
    "ADME_KAKAO_SECRET_ROTATION_PERFORMED",
  ]) {
    assertContains(attestation, required, "attestation env");
  }

  for (const bad of [
    "createHash",
    "digest(",
    "client_secret",
    "CLIENT_SECRET",
    "access_token",
    "authorization_code",
  ]) {
    if (attestation.includes(bad)) {
      throw new Error(`attestation must not reference ${bad}`);
    }
  }

  // Default: rotation not required unless exposure suspected
  if (
    !/ADME_KAKAO_SECRET_ROTATION_REQUIRED[\s\S]{0,80}false/.test(attestation)
  ) {
    throw new Error("rotationRequired default must be false");
  }
  if (
    !/ADME_KAKAO_SECRET_EXPOSURE_SUSPECTED[\s\S]{0,80}false/.test(attestation)
  ) {
    throw new Error("exposureSuspected default must be false");
  }

  assertContains(
    diagnostics,
    "stage3DKakaoSecretSafetyAttestationConfirmed",
    "diagnostics field",
  );
  assertContains(
    diagnostics,
    "stage3DProductionRewardOpenReady: false",
    "openReady remains false",
  );

  console.log("PASS: safety attestation source contract");
}

async function verifyProductionMarkers() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(
    sources.combined,
    SAFETY_MARKERS,
    "Production Kakao OAuth Secret Safety Attestation",
  );

  if (!/stage3DKakaoSecretAttestedAt=\d{4}-\d{2}-\d{2}/.test(sources.combined)) {
    throw new Error(
      "stage3DKakaoSecretAttestedAt must be YYYY-MM-DD on Production",
    );
  }
  console.log("PASS: attestedAt date present on Production");
}

async function main() {
  verifySourceContract();
  await verifyProductionMarkers();
  console.log("RESULT: safetyAttestationConfirmed=true");
  console.log("RESULT: exposureSuspected=false");
  console.log("RESULT: rotationRequired=false");
  console.log("RESULT: rotationPerformed=false");
  console.log("RESULT: productionRewardOpenReady=false");
  console.log("PASS: verify:stage3d-kakao-oauth-secret-safety-attestation");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
