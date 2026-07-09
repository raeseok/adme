import "server-only";

/**
 * Stage 3-D-R — Kakao OAuth Secret Safety Attestation (booleans/dates only).
 * NEVER reads, validates, hashes, or displays Client Secret material.
 *
 * Rotation is NOT required unless exposure is suspected.
 * Safety attestation resolves the Stage 3-D-R blocker without reissuing secrets.
 */

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw === "") return defaultValue;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return defaultValue;
}

function parseDateOnly(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export type KakaoOauthSecretSafetyAttestation = {
  safetyAttestationRequired: boolean;
  safetyAttestationConfirmed: boolean;
  attestedAt: string | null;
  exposureSuspected: boolean;
  rawRecorded: boolean;
  partialHashDigestRecorded: boolean;
  devProviderConfigured: boolean;
  prodProviderConfigured: boolean;
  oauthDevAuthorizeReverified: boolean;
  oauthProdAuthorizeReverified: boolean;
  oauthProdE2EReverified: boolean;
  rotationRequired: boolean;
  rotationPerformed: boolean;
  /** Always false — attestation never carries secret material. */
  rawSecretExposed: false;
  /** Always false — attestation never carries OAuth code/token. */
  oauthCodeTokenExposed: false;
};

/** @deprecated Use KakaoOauthSecretSafetyAttestation */
export type KakaoSecretRotationAttestation = KakaoOauthSecretSafetyAttestation;

export function getKakaoOauthSecretSafetyAttestation(): KakaoOauthSecretSafetyAttestation {
  return {
    safetyAttestationRequired: parseBool(
      process.env.ADME_KAKAO_SECRET_SAFETY_ATTESTATION_REQUIRED,
      true,
    ),
    safetyAttestationConfirmed: parseBool(
      process.env.ADME_KAKAO_SECRET_SAFETY_ATTESTATION_CONFIRMED,
      false,
    ),
    attestedAt: parseDateOnly(process.env.ADME_KAKAO_SECRET_ATTESTED_AT),
    exposureSuspected: parseBool(
      process.env.ADME_KAKAO_SECRET_EXPOSURE_SUSPECTED,
      false,
    ),
    rawRecorded: parseBool(
      process.env.ADME_KAKAO_SECRET_RAW_RECORDED,
      false,
    ),
    partialHashDigestRecorded: parseBool(
      process.env.ADME_KAKAO_SECRET_PARTIAL_HASH_DIGEST_RECORDED,
      false,
    ),
    devProviderConfigured: parseBool(
      process.env.ADME_KAKAO_SECRET_DEV_PROVIDER_CONFIGURED,
      false,
    ),
    prodProviderConfigured: parseBool(
      process.env.ADME_KAKAO_SECRET_PROD_PROVIDER_CONFIGURED,
      false,
    ),
    oauthDevAuthorizeReverified: parseBool(
      process.env.ADME_KAKAO_OAUTH_DEV_AUTHORIZE_REVERIFIED,
      false,
    ),
    oauthProdAuthorizeReverified: parseBool(
      process.env.ADME_KAKAO_OAUTH_PROD_AUTHORIZE_REVERIFIED,
      false,
    ),
    oauthProdE2EReverified: parseBool(
      process.env.ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED,
      false,
    ),
    rotationRequired: parseBool(
      process.env.ADME_KAKAO_SECRET_ROTATION_REQUIRED,
      false,
    ),
    rotationPerformed: parseBool(
      process.env.ADME_KAKAO_SECRET_ROTATION_PERFORMED,
      false,
    ),
    rawSecretExposed: false,
    oauthCodeTokenExposed: false,
  };
}

/** @deprecated Use getKakaoOauthSecretSafetyAttestation */
export function getKakaoSecretRotationAttestation(): KakaoOauthSecretSafetyAttestation {
  return getKakaoOauthSecretSafetyAttestation();
}

export function isKakaoOauthSecretSafetyAttestationComplete(
  attestation: KakaoOauthSecretSafetyAttestation = getKakaoOauthSecretSafetyAttestation(),
): boolean {
  if (attestation.exposureSuspected) return false;
  if (attestation.rotationRequired) return false;
  if (attestation.rawRecorded || attestation.partialHashDigestRecorded) {
    return false;
  }
  if (!attestation.safetyAttestationRequired) return true;
  return (
    attestation.safetyAttestationConfirmed &&
    attestation.devProviderConfigured &&
    attestation.prodProviderConfigured &&
    attestation.oauthDevAuthorizeReverified &&
    attestation.oauthProdAuthorizeReverified &&
    attestation.oauthProdE2EReverified &&
    !attestation.rotationPerformed
  );
}

/** @deprecated Use isKakaoOauthSecretSafetyAttestationComplete */
export function isKakaoSecretRotationPreflightComplete(
  attestation: KakaoOauthSecretSafetyAttestation = getKakaoOauthSecretSafetyAttestation(),
): boolean {
  return isKakaoOauthSecretSafetyAttestationComplete(attestation);
}
