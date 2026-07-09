const OAUTH_SECRET_QUERY_KEYS = new Set([
  "code",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "provider_token",
  "provider_refresh_token",
  "client_secret",
  "authorization_code",
]);

const SAFE_ERROR_CODES = new Set([
  "server_error",
  "access_denied",
  "invalid_request",
  "unauthorized_client",
  "unsupported_response_type",
  "invalid_scope",
  "temporarily_unavailable",
  "unexpected_failure",
  "validation_failed",
  "provider_disabled",
  "oauth_provider_not_supported",
  "bad_oauth_callback",
  "bad_oauth_state",
  "email_address_not_provided",
]);

export type OAuthErrorDetails = {
  error: string | null;
  errorCode: string | null;
  /** Never a raw provider description — only a short safe summary key. */
  errorSummary: string | null;
};

export function parseOAuthErrorFromSearchParams(
  searchParams: URLSearchParams,
): OAuthErrorDetails {
  const rawDescription =
    searchParams.get("error_description") ??
    searchParams.get("oauth_error_description") ??
    null;
  const summaryFromParam = sanitizeOAuthSummaryValue(
    searchParams.get("oauth_error_summary"),
  );

  return {
    error: sanitizeOAuthErrorCode(searchParams.get("error") ?? searchParams.get("oauth_error")),
    errorCode: sanitizeOAuthErrorCode(
      searchParams.get("error_code") ?? searchParams.get("oauth_error_code"),
    ),
    errorSummary: summaryFromParam ?? summarizeOAuthErrorDescription(rawDescription),
  };
}

export function parseOAuthErrorFromHash(hash: string): OAuthErrorDetails {
  if (!hash || hash === "#") {
    return { error: null, errorCode: null, errorSummary: null };
  }
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return parseOAuthErrorFromSearchParams(params);
}

export function hasOAuthError(details: OAuthErrorDetails): boolean {
  return Boolean(details.error || details.errorCode || details.errorSummary);
}

export function buildOAuthErrorLoginSearchParams(
  details: OAuthErrorDetails,
  options?: { callbackCodeMissing?: boolean },
): URLSearchParams {
  const params = new URLSearchParams();
  if (details.error) {
    params.set("oauth_error", details.error);
  }
  if (details.errorCode) {
    params.set("oauth_error_code", details.errorCode);
  }
  if (details.errorSummary) {
    params.set("oauth_error_summary", details.errorSummary);
  }
  if (options?.callbackCodeMissing) {
    params.set("callback_code_missing", "true");
  }
  return params;
}

export function getOAuthUserMessage(details: OAuthErrorDetails): string {
  if (hasOAuthError(details)) {
    return "소셜 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "로그인 callback code가 없습니다.";
}

export function formatOAuthDiagnosticLines(
  details: OAuthErrorDetails,
  options?: { callbackCodeMissing?: boolean },
): string[] {
  const lines: string[] = [];
  if (details.error) {
    lines.push(`oauthError=${details.error}`);
  }
  if (details.errorCode) {
    lines.push(`oauthErrorCode=${details.errorCode}`);
  }
  if (details.errorSummary) {
    lines.push(`oauthErrorSummary=${details.errorSummary}`);
  }
  if (options?.callbackCodeMissing) {
    lines.push("callbackCodeMissing=true");
  }
  return lines;
}

/** Maps raw provider/auth descriptions to a short safe summary. Never returns secrets. */
export function summarizeOAuthErrorDescription(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const lowered = value.toLowerCase();

  if (
    lowered.includes("unable to exchange external code") ||
    lowered.includes("exchange external code") ||
    lowered.includes("external code")
  ) {
    return "external_code_exchange_failed";
  }
  if (
    lowered.includes("invalid_client") ||
    lowered.includes("bad client credentials") ||
    lowered.includes("client credentials")
  ) {
    return "invalid_client_credentials";
  }
  if (
    lowered.includes("email") &&
    (lowered.includes("not provided") ||
      lowered.includes("missing") ||
      lowered.includes("from external provider"))
  ) {
    return "email_not_provided";
  }
  if (lowered.includes("provider is not enabled") || lowered.includes("unsupported provider")) {
    return "provider_not_enabled";
  }
  if (lowered.includes("database") || lowered.includes("saving new user")) {
    return "database_user_save_failed";
  }
  if (containsSecretMaterial(value)) {
    return "oauth_provider_error_redacted";
  }
  return "oauth_provider_error";
}

function sanitizeOAuthErrorCode(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 64) {
    return null;
  }
  if (containsSecretMaterial(trimmed)) {
    return null;
  }
  if (!/^[a-z0-9_.-]+$/.test(trimmed)) {
    return null;
  }
  if (SAFE_ERROR_CODES.has(trimmed) || trimmed.length <= 40) {
    return trimmed;
  }
  return null;
}

function sanitizeOAuthSummaryValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 64) {
    return null;
  }
  if (containsSecretMaterial(trimmed)) {
    return null;
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function containsSecretMaterial(value: string): boolean {
  const lowered = value.toLowerCase();
  if (
    /(?:^|[^\w])(?:access_token|refresh_token|id_token|provider_token|provider_refresh_token|client_secret|authorization_code)\s*[=:]/i.test(
      value,
    )
  ) {
    return true;
  }
  if (/\bcode\s*[=:]\s*[A-Za-z0-9_-]{8,}/i.test(value)) {
    return true;
  }
  if (/unable to exchange external code\s*:\s*\S+/i.test(value)) {
    return true;
  }
  if (/external code\s*:\s*\S+/i.test(value)) {
    return true;
  }
  // Opaque token-like runs (exclude lowercase snake_case summary keys)
  const opaqueRuns = value.match(/[A-Za-z0-9_-]{24,}/g) ?? [];
  if (opaqueRuns.some((run) => !/^[a-z0-9_]+$/.test(run))) {
    return true;
  }
  if (
    lowered.includes("access_token") ||
    lowered.includes("refresh_token") ||
    lowered.includes("client_secret") ||
    lowered.includes("authorization_code")
  ) {
    return true;
  }
  return false;
}

export function isSafeOAuthLoginQueryKey(key: string): boolean {
  if (OAUTH_SECRET_QUERY_KEYS.has(key)) {
    return false;
  }
  return (
    key === "error" ||
    key === "oauth_error" ||
    key === "oauth_error_code" ||
    key === "oauth_error_summary" ||
    key === "callback_code_missing"
  );
}

export function pickOAuthErrorFromLoginSearchParams(
  params: Record<string, string | string[] | undefined>,
): OAuthErrorDetails & { callbackCodeMissing: boolean } {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : null;
  };

  const fromOAuthParams: OAuthErrorDetails = {
    error: sanitizeOAuthErrorCode(get("oauth_error")),
    errorCode: sanitizeOAuthErrorCode(get("oauth_error_code")),
    errorSummary: sanitizeOAuthSummaryValue(get("oauth_error_summary")),
  };

  // Never trust oauth_error_description for display — only derive a safe summary if needed.
  if (!fromOAuthParams.errorSummary) {
    fromOAuthParams.errorSummary = summarizeOAuthErrorDescription(
      get("oauth_error_description"),
    );
  }

  if (hasOAuthError(fromOAuthParams)) {
    return {
      ...fromOAuthParams,
      callbackCodeMissing: get("callback_code_missing") === "true",
    };
  }

  const legacyError = get("error");
  if (legacyError === "missing_code" || legacyError === "callback_failed") {
    return {
      error: null,
      errorCode: null,
      errorSummary: null,
      callbackCodeMissing: legacyError === "missing_code",
    };
  }

  return {
    error: sanitizeOAuthErrorCode(legacyError),
    errorCode: null,
    errorSummary: null,
    callbackCodeMissing: get("callback_code_missing") === "true",
  };
}
