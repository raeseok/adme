import type { User } from "@supabase/supabase-js";

export const OAUTH_PROVIDERS = ["google", "kakao"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const PRODUCTION_SITE_URL = "https://web-ashen-xi-52.vercel.app";

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export function getSocialAuthProvider(user: User): OAuthProvider | null {
  for (const identity of user.identities ?? []) {
    if (identity.provider === "google" || identity.provider === "kakao") {
      return identity.provider;
    }
  }
  return null;
}

export function resolveOAuthCallbackOrigin(requestOrigin: string | null): string {
  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    return requestOrigin;
  }
  return PRODUCTION_SITE_URL;
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }
    if (url.hostname.endsWith(".vercel.app")) {
      return true;
    }
    if (origin === PRODUCTION_SITE_URL) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function buildOAuthCallbackUrl(origin: string): string {
  return `${origin}/auth/callback`;
}

export function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/consumer/profile";
}
