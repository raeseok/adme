/** Production E2E base URL — ignores accidental localhost ADME_E2E_BASE_URL. */
export const PRODUCTION_E2E_BASE_URL = "https://web-ashen-xi-52.vercel.app";

function isLocalE2eUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * Resolve base URL for Production verification/smoke scripts.
 * Explicit non-local ADME_E2E_BASE_URL overrides; localhost is ignored.
 */
export function resolveProductionE2eBaseUrl() {
  const explicit = process.env.ADME_E2E_BASE_URL?.trim();
  if (explicit) {
    if (isLocalE2eUrl(explicit)) {
      console.log(
        `INFO: ADME_E2E_BASE_URL=${explicit} ignored for Production verification — using ${PRODUCTION_E2E_BASE_URL}`,
      );
      return PRODUCTION_E2E_BASE_URL;
    }
    return explicit.replace(/\/$/, "");
  }
  return PRODUCTION_E2E_BASE_URL;
}
