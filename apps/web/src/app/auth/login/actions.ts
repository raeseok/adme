"use server";

import { redirect } from "next/navigation";
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
