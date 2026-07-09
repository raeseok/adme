"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { SessionSnapshot } from "@/lib/auth/session";
import {
  formatOAuthDiagnosticLines,
  getOAuthUserMessage,
  hasOAuthError,
  parseOAuthErrorFromHash,
  type OAuthErrorDetails,
} from "@/lib/auth/oauth-error";
import { loginAction, oauthSignInAction, signupAction } from "./actions";

function readHashOAuthError(): OAuthErrorDetails | null {
  if (typeof window === "undefined") {
    return null;
  }
  const parsed = parseOAuthErrorFromHash(window.location.hash);
  if (!hasOAuthError(parsed)) {
    return null;
  }
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url.toString());
  }
  return parsed;
}

function stripUnsafeOAuthQueryParams(): void {
  if (typeof window === "undefined" || !window.history.replaceState) {
    return;
  }
  const url = new URL(window.location.href);
  const unsafeKeys = [
    "oauth_error_description",
    "error_description",
    "code",
    "access_token",
    "refresh_token",
    "id_token",
    "provider_token",
    "provider_refresh_token",
    "client_secret",
  ];
  let changed = false;
  for (const key of unsafeKeys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(null, "", url.toString());
  }
}

export function LoginForm({
  session,
  initialError,
  oauthDiagnostic,
}: {
  session: SessionSnapshot;
  initialError: string | null;
  oauthDiagnostic?: OAuthErrorDetails & { callbackCodeMissing?: boolean };
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hashError] = useState(() => {
    stripUnsafeOAuthQueryParams();
    return readHashOAuthError();
  });
  const [message, setMessage] = useState<string | null>(() => {
    if (hashError) {
      return getOAuthUserMessage(hashError);
    }
    return initialError;
  });
  const [diagnosticLines] = useState<string[]>(() => {
    if (hashError) {
      return formatOAuthDiagnosticLines(hashError, { callbackCodeMissing: true });
    }
    if (oauthDiagnostic && hasOAuthError(oauthDiagnostic)) {
      return formatOAuthDiagnosticLines(oauthDiagnostic, {
        callbackCodeMissing: oauthDiagnostic.callbackCodeMissing,
      });
    }
    return [];
  });
  const [isPending, startTransition] = useTransition();
  const [oauthPending, startOAuthTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (mode === "signup") {
        const result = await signupAction(email, password);
        if (result.needsEmailConfirm) {
          setMessage(result.message);
          setMode("login");
          return;
        }
        if (!result.ok) {
          setMessage(result.message);
        }
        return;
      }

      const result = await loginAction(email, password);
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  function handleOAuthSignIn(provider: "google" | "kakao") {
    setMessage(null);
    startOAuthTransition(async () => {
      const result = await oauthSignInAction(provider);
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-700">
        소비 의향 프로필 저장을 위해 로그인이 필요합니다. Google, 카카오톡 또는
        이메일로 로그인할 수 있습니다.
      </p>

      {session.sessionStatus === "authenticated" ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          이미 로그인되어 있습니다.{" "}
          <Link href="/consumer/profile" className="font-medium underline">
            프로필로 이동
          </Link>
        </p>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          disabled={oauthPending || isPending}
          onClick={() => handleOAuthSignIn("google")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          Google로 계속하기
        </button>
        <button
          type="button"
          disabled={oauthPending || isPending}
          onClick={() => handleOAuthSignIn("kakao")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#FEE500] bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] hover:bg-[#f5dc00] disabled:opacity-60"
        >
          카카오톡으로 계속하기
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500">또는 이메일로</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-800">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || oauthPending}
          className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {isPending
            ? "처리 중…"
            : mode === "login"
              ? "로그인"
              : "회원가입"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-sm font-medium text-violet-700 hover:text-violet-900"
        >
          {mode === "login"
            ? "계정이 없으신가요? 회원가입"
            : "이미 계정이 있으신가요? 로그인"}
        </button>
      </form>

      {message ? (
        <div className="space-y-2">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
          {diagnosticLines.length > 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
              <p className="font-medium text-zinc-800">OAuth 진단</p>
              {diagnosticLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <Link
        href="/consumer/profile"
        className="inline-block text-sm font-medium text-violet-700 hover:text-violet-900"
      >
        ← 소비 의향 프로필로
      </Link>
    </div>
  );
}
