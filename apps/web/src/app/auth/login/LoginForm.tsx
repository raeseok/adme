"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getDeployCommit } from "@/lib/deploy-info";
import type { SessionSnapshot } from "@/lib/auth/session";
import { loginAction, signupAction } from "./actions";

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
  const [isPending, startTransition] = useTransition();
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

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-lg bg-violet-50 px-3 py-3 text-sm text-violet-900">
        <p className="font-semibold">Stage 1-C Supabase Auth</p>
        <p className="font-mono text-xs">stage-1-c-supabase-auth</p>
        <p>소비 의향 프로필 저장을 위해 로그인이 필요합니다.</p>
      </section>

      {session.sessionStatus === "authenticated" ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          이미 로그인되어 있습니다.{" "}
          <Link href="/consumer/profile" className="font-medium underline">
            프로필로 이동
          </Link>
        </p>
      ) : null}

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
          disabled={isPending}
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

      <Link
        href="/consumer/profile"
        className="inline-block text-sm font-medium text-violet-700 hover:text-violet-900"
      >
        ← 소비 의향 프로필로
      </Link>
    </div>
  );
}
