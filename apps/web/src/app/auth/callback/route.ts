import { NextResponse } from "next/server";
import {
  buildOAuthErrorLoginSearchParams,
  parseOAuthErrorFromSearchParams,
  hasOAuthError,
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
      if (hash.length > 1) {
        var hashParams = new URLSearchParams(hash.slice(1));
        ["error", "error_code", "error_description"].forEach(function (key) {
          var value = hashParams.get(key);
          if (!value) return;
          if (key === "error") target.searchParams.set("oauth_error", value);
          if (key === "error_code") target.searchParams.set("oauth_error_code", value);
          if (key === "error_description") target.searchParams.set("oauth_error_description", value);
        });
      }
      if (!target.searchParams.get("oauth_error") && query.length > 1) {
        var queryParams = new URLSearchParams(query.slice(1));
        ["error", "error_code", "error_description"].forEach(function (key) {
          var value = queryParams.get(key);
          if (!value) return;
          if (key === "error") target.searchParams.set("oauth_error", value);
          if (key === "error_code") target.searchParams.set("oauth_error_code", value);
          if (key === "error_description") target.searchParams.set("oauth_error_description", value);
        });
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
    const params = buildOAuthErrorLoginSearchParams(oauthError, {
      callbackCodeMissing: true,
    });
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
