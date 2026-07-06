import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type SessionSnapshot = {
  sessionStatus: "anonymous" | "authenticated";
  authUserPresent: boolean;
  maskedEmail: string | null;
};

export function maskEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export async function getSessionSnapshot(): Promise<{
  user: User | null;
  snapshot: SessionSnapshot;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      user: null,
      snapshot: {
        sessionStatus: "anonymous",
        authUserPresent: false,
        maskedEmail: null,
      },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      snapshot: {
        sessionStatus: "anonymous",
        authUserPresent: false,
        maskedEmail: null,
      },
    };
  }

  return {
    user,
    snapshot: {
      sessionStatus: "authenticated",
      authUserPresent: true,
      maskedEmail: maskEmail(user.email),
    },
  };
}
