"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getDeployCommit } from "@/lib/deploy-info";
import type { SessionSnapshot } from "@/lib/auth/session";
import { loginAction, oauthSignInAction, signupAction } from "./actions";

export function LoginForm({
  session,
  initialError,
}: {
  session: SessionSnapshot;
  initialError: string | null;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialError);
  const [authErrorCode, setAuthErrorCode] = useState(
    initialError ? "callback_or_init_error" : "none",
  );
  const [oauthLastProvider, setOauthLastProvider] = useState<
    "none" | "google" | "kakao"
  >("none");
  const [oauthStartStatus, setOauthStartStatus] = useState<
    "idle" | "redirecting" | "error"
  >("idle");
  const [oauthErrorCode, setOauthErrorCode] = useState("none");
  const [isPending, startTransition] = useTransition();
  const [oauthPending, startOAuthTransition] = useTransition();
  const deployCommit = getDeployCommit();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (mode === "signup") {
        const result = await signupAction(email, password);
        if (result.needsEmailConfirm) {
          setMessage(result.message);
          setAuthErrorCode(result.authErrorCode);
          setMode("login");
          return;
        }
        if (!result.ok) {
          setMessage(result.message);
          setAuthErrorCode(result.authErrorCode);
        }
        return;
      }

      const result = await loginAction(email, password);
      if (!result.ok) {
        setMessage(result.message);
        setAuthErrorCode(result.authErrorCode);
      }
    });
  }

  function handleOAuthSignIn(provider: "google" | "kakao") {
    setOauthLastProvider(provider);
    setOauthStartStatus("redirecting");
    setOauthErrorCode("none");
    setMessage(null);
    startOAuthTransition(async () => {
      const result = await oauthSignInAction(provider);
      setOauthStartStatus(result.oauthStartStatus);
      setOauthErrorCode(result.authErrorCode);
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-lg bg-violet-50 px-3 py-3 text-sm text-violet-900">
        <p className="font-semibold">Stage 1-C Supabase Auth</p>
        <p className="font-mono text-xs">stage-1-c-supabase-auth</p>
        <p>소비 의향 프로필 저장을 위해 로그인이 필요합니다.</p>
      </section>

      <section className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-950">
        <p className="font-semibold">Stage 1-D Auth Social Login</p>
        <p className="font-mono text-xs">stage-1-d-auth-social-login</p>
        <p>Google 또는 카카오톡으로도 로그인할 수 있습니다.</p>
      </section>

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
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}

      <section
        aria-label="Stage 1-C login markers"
        className="space-y-1 break-all rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 font-mono text-xs text-zinc-700"
      >
        <p>stage1CLoginRoute=/auth/login</p>
        <p>stage1CAuthProvider=supabase</p>
        <p>stage1CAuthMethod=email-password</p>
        <p>stage1CSessionStatus={session.sessionStatus}</p>
        <p>stage1CAuthErrorCode={authErrorCode}</p>
        <p>stage1CCallbackRoute=/auth/callback</p>
        <p>stage1CServiceRoleUsed=false</p>
        <p>stage1CDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D auth login markers"
        className="space-y-1 break-all rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 font-mono text-xs text-amber-950"
      >
        <p>stage1DAuthLoginRoute=/auth/login</p>
        <p>stage1DAuthEmailEnabled=true</p>
        <p>stage1DAuthGoogleEnabled=true</p>
        <p>stage1DAuthKakaoEnabled=true</p>
        <p>stage1DAuthProviders=email,google,kakao</p>
        <p>stage1DGoogleLoginButtonVisible=true</p>
        <p>stage1DKakaoLoginButtonVisible=true</p>
        <p>stage1DEmailLoginFormVisible=true</p>
        <p>stage1DOAuthLastProvider={oauthLastProvider}</p>
        <p>stage1DOAuthStartStatus={oauthStartStatus}</p>
        <p>stage1DOAuthErrorCode={oauthErrorCode}</p>
        <p>stage1DCallbackSupportsOAuth=true</p>
        <p>stage1DCallbackRedirectTarget=/consumer/profile</p>
        <p>stage1DCallbackServiceRoleUsed=false</p>
        <p>stage1DServiceRoleUsed=false</p>
        <p>stage1DPointLedgerMutation=false</p>
        <p>stage1DQuizAnswerAccess=false</p>
        <p>stage1DDeployCommit={deployCommit}</p>
      </section>

      <Link
        href="/consumer/profile"
        className="inline-block text-sm font-medium text-violet-700 hover:text-violet-900"
      >
        ← 소비 의향 프로필로
      </Link>
    </div>
  );
}
