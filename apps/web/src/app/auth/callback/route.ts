import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

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

  return NextResponse.redirect(
    `${origin}/auth/login?error=missing_code&stage1CCallbackError=missing_code&stage1DCallbackError=missing_code`,
  );
}
