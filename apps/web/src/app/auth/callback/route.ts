import { NextResponse } from "next/server";
import {
  buildOAuthErrorLoginSearchParams,
  parseOAuthErrorFromSearchParams,
  hasOAuthError,
  summarizeOAuthErrorDescription,
} from "@/lib/auth/oauth-error";
import { safeNextPath } from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/server";

function buildHashCaptureHtml(origin: string, nextPath: string): string {
  const loginBase = `${origin}/auth/login`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>로그인 처리 중…</title>
</head>
<body>
  <p>로그인 처리 중…</p>
  <script>
    (function () {
      var loginBase = ${JSON.stringify(loginBase)};
      var nextPath = ${JSON.stringify(nextPath)};
      var hash = window.location.hash || "";
      var query = window.location.search || "";
      var target = new URL(loginBase);

      function summarizeDescription(value) {
        if (!value) return null;
        var lowered = String(value).toLowerCase();
        if (
          lowered.indexOf("unable to exchange external code") !== -1 ||
          lowered.indexOf("exchange external code") !== -1 ||
          lowered.indexOf("external code") !== -1
        ) {
          return "external_code_exchange_failed";
        }
        if (
          lowered.indexOf("invalid_client") !== -1 ||
          lowered.indexOf("bad client credentials") !== -1 ||
          lowered.indexOf("client credentials") !== -1
        ) {
          return "invalid_client_credentials";
        }
        if (
          lowered.indexOf("email") !== -1 &&
          (lowered.indexOf("not provided") !== -1 ||
            lowered.indexOf("missing") !== -1 ||
            lowered.indexOf("from external provider") !== -1)
        ) {
          return "email_not_provided";
        }
        if (
          lowered.indexOf("provider is not enabled") !== -1 ||
          lowered.indexOf("unsupported provider") !== -1
        ) {
          return "provider_not_enabled";
        }
        if (lowered.indexOf("database") !== -1 || lowered.indexOf("saving new user") !== -1) {
          return "database_user_save_failed";
        }
        if (/[A-Za-z0-9_-]{24,}/.test(String(value))) {
          return "oauth_provider_error_redacted";
        }
        return "oauth_provider_error";
      }

      function applySafeParams(source) {
        var error = source.get("error");
        var errorCode = source.get("error_code");
        var description = source.get("error_description");
        if (error && /^[A-Za-z0-9_.-]{1,64}$/.test(error) && error.length < 24) {
          target.searchParams.set("oauth_error", error.toLowerCase());
        }
        if (errorCode && /^[A-Za-z0-9_.-]{1,64}$/.test(errorCode) && errorCode.length < 40) {
          target.searchParams.set("oauth_error_code", errorCode.toLowerCase());
        }
        var summary = summarizeDescription(description);
        if (summary) {
          target.searchParams.set("oauth_error_summary", summary);
        }
      }

      if (hash.length > 1) {
        applySafeParams(new URLSearchParams(hash.slice(1)));
      }
      if (!target.searchParams.get("oauth_error") && query.length > 1) {
        applySafeParams(new URLSearchParams(query.slice(1)));
      }
      target.searchParams.set("callback_code_missing", "true");
      if (nextPath && nextPath !== "/consumer/profile") {
        target.searchParams.set("next", nextPath);
      }
      window.location.replace(target.toString());
    })();
  </script>
</body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthError = parseOAuthErrorFromSearchParams(searchParams);

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    return NextResponse.redirect(
      `${origin}/auth/login?error=callback_failed&stage1CCallbackError=callback_failed&stage1DCallbackError=callback_failed`,
    );
  }

  if (hasOAuthError(oauthError)) {
    const params = buildOAuthErrorLoginSearchParams(
      {
        error: oauthError.error,
        errorCode: oauthError.errorCode,
        errorSummary:
          oauthError.errorSummary ??
          summarizeOAuthErrorDescription(searchParams.get("error_description")),
      },
      { callbackCodeMissing: true },
    );
    return NextResponse.redirect(`${origin}/auth/login?${params.toString()}`);
  }

  return new NextResponse(buildHashCaptureHtml(origin, next), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
