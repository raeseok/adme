"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildOAuthCallbackUrl,
  isOAuthProvider,
  resolveOAuthCallbackOrigin,
  type OAuthProvider,
} from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  ok: boolean;
  message: string;
  authErrorCode: string;
  needsEmailConfirm?: boolean;
};

export async function loginAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase 환경변수가 설정되지 않았습니다.",
      authErrorCode: "config_error",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      ok: false,
      message: error.message,
      authErrorCode: error.name ?? "login_error",
    };
  }

  redirect("/consumer/profile");
}

export async function signupAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase 환경변수가 설정되지 않았습니다.",
      authErrorCode: "config_error",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "consumer" },
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
      authErrorCode: error.name ?? "signup_error",
    };
  }

  if (data.session) {
    redirect("/consumer/profile");
  }

  return {
    ok: true,
    message:
      "가입이 완료되었습니다. 이메일 확인이 필요할 수 있습니다. 확인 후 로그인해 주세요.",
    authErrorCode: "signup_email_confirm_maybe_required",
    needsEmailConfirm: true,
  };
}

export type OAuthSignInResult = {
  ok: boolean;
  message: string;
  authErrorCode: string;
  provider: OAuthProvider | "none";
  oauthStartStatus: "idle" | "redirecting" | "error";
};

export async function oauthSignInAction(
  providerInput: string,
): Promise<OAuthSignInResult> {
  if (!isOAuthProvider(providerInput)) {
    return {
      ok: false,
      message: "지원하지 않는 로그인 방식입니다.",
      authErrorCode: "invalid_provider",
      provider: "none",
      oauthStartStatus: "error",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase 환경변수가 설정되지 않았습니다.",
      authErrorCode: "config_error",
      provider: providerInput,
      oauthStartStatus: "error",
    };
  }

  const headersList = await headers();
  const origin = resolveOAuthCallbackOrigin(headersList.get("origin"));
  const redirectTo = buildOAuthCallbackUrl(origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: providerInput,
    options: {
      redirectTo,
      queryParams:
        providerInput === "kakao"
          ? { prompt: "login" }
          : { access_type: "online", prompt: "select_account" },
      scopes: providerInput === "google" ? "email profile" : undefined,
    },
  });

  if (error) {
    const isProviderConfigError =
      error.message.includes("provider") ||
      error.message.includes("OAuth") ||
      error.message.includes("not enabled");
    return {
      ok: false,
      message: isProviderConfigError
        ? `${providerInput === "google" ? "Google" : "카카오톡"} 로그인 provider 설정이 필요합니다. Supabase Dashboard에서 provider를 활성화해 주세요.`
        : error.message,
      authErrorCode: error.name ?? "oauth_start_error",
      provider: providerInput,
      oauthStartStatus: "error",
    };
  }

  if (!data.url) {
    return {
      ok: false,
      message: `${providerInput === "google" ? "Google" : "카카오톡"} OAuth redirect URL을 받지 못했습니다. provider 설정을 확인해 주세요.`,
      authErrorCode: "oauth_missing_url",
      provider: providerInput,
      oauthStartStatus: "error",
    };
  }

  redirect(data.url);
}
