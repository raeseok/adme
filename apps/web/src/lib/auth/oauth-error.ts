const OAUTH_SECRET_QUERY_KEYS = new Set([
  "code",
  "token",
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
]);

export type OAuthErrorDetails = {
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

export function parseOAuthErrorFromSearchParams(
  searchParams: URLSearchParams,
): OAuthErrorDetails {
  return {
    error: sanitizeOAuthErrorValue(searchParams.get("error")),
    errorCode: sanitizeOAuthErrorValue(searchParams.get("error_code")),
    errorDescription: sanitizeOAuthErrorValue(searchParams.get("error_description")),
  };
}

export function parseOAuthErrorFromHash(hash: string): OAuthErrorDetails {
  if (!hash || hash === "#") {
    return { error: null, errorCode: null, errorDescription: null };
  }
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return parseOAuthErrorFromSearchParams(params);
}

export function hasOAuthError(details: OAuthErrorDetails): boolean {
  return Boolean(details.error || details.errorCode || details.errorDescription);
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
  if (details.errorDescription) {
    params.set("oauth_error_description", details.errorDescription);
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
  if (details.errorDescription) {
    lines.push(`oauthErrorDescription=${details.errorDescription}`);
  }
  if (options?.callbackCodeMissing) {
    lines.push("callbackCodeMissing=true");
  }
  return lines;
}

function sanitizeOAuthErrorValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) {
    return null;
  }
  if (/[A-Za-z0-9_-]{32,}/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isSafeOAuthLoginQueryKey(key: string): boolean {
  if (OAUTH_SECRET_QUERY_KEYS.has(key)) {
    return false;
  }
  return (
    key === "error" ||
    key === "oauth_error" ||
    key === "oauth_error_code" ||
    key === "oauth_error_description" ||
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
    error: sanitizeOAuthErrorValue(get("oauth_error")),
    errorCode: sanitizeOAuthErrorValue(get("oauth_error_code")),
    errorDescription: sanitizeOAuthErrorValue(get("oauth_error_description")),
  };

  if (hasOAuthError(fromOAuthParams)) {
    return {
      ...fromOAuthParams,
      callbackCodeMissing: get("callback_code_missing") === "true",
    };
  }

  return {
    error: get("error") === "missing_code" || get("error") === "callback_failed"
      ? null
      : sanitizeOAuthErrorValue(get("error")),
    errorCode: null,
    errorDescription: null,
    callbackCodeMissing:
      get("callback_code_missing") === "true" || get("error") === "missing_code",
  };
}
