import "server-only";

/**
 * Stage 3-D — Kakao Client Secret rotation attestation (booleans/dates only).
 * NEVER reads, validates, hashes, or displays Client Secret material.
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

export type KakaoSecretRotationAttestation = {
  rotationRequired: boolean;
  rotatedAt: string | null;
  rotationConfirmed: boolean;
  devReapplied: boolean;
  prodReapplied: boolean;
  oauthProdE2EReverified: boolean;
  /** Always false — attestation never carries secret material. */
  rawSecretExposed: false;
  /** Always false — attestation never carries OAuth code/token. */
  oauthCodeTokenExposed: false;
};

export function getKakaoSecretRotationAttestation(): KakaoSecretRotationAttestation {
  return {
    rotationRequired: parseBool(
      process.env.ADME_KAKAO_SECRET_ROTATION_REQUIRED,
      true,
    ),
    rotatedAt: parseDateOnly(process.env.ADME_KAKAO_SECRET_ROTATED_AT),
    rotationConfirmed: parseBool(
      process.env.ADME_KAKAO_SECRET_ROTATION_CONFIRMED,
      false,
    ),
    devReapplied: parseBool(
      process.env.ADME_KAKAO_SECRET_DEV_REAPPLIED,
      false,
    ),
    prodReapplied: parseBool(
      process.env.ADME_KAKAO_SECRET_PROD_REAPPLIED,
      false,
    ),
    oauthProdE2EReverified: parseBool(
      process.env.ADME_KAKAO_OAUTH_PROD_E2E_REVERIFIED,
      false,
    ),
    rawSecretExposed: false,
    oauthCodeTokenExposed: false,
  };
}

export function isKakaoSecretRotationPreflightComplete(
  attestation: KakaoSecretRotationAttestation = getKakaoSecretRotationAttestation(),
): boolean {
  if (!attestation.rotationRequired) return true;
  return (
    attestation.rotationConfirmed &&
    attestation.devReapplied &&
    attestation.prodReapplied &&
    attestation.oauthProdE2EReverified
  );
}
