"use server";

import { redirect } from "next/navigation";
import { getSocialAuthProvider } from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createClient();
  let redirectUrl = "/consumer/profile";
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const socialProvider = user ? getSocialAuthProvider(user) : null;
    await supabase.auth.signOut();
    if (socialProvider) {
      redirectUrl = "/consumer/profile?stage1DSocialLogout=signed_out";
    }
  }
  redirect(redirectUrl);
}
