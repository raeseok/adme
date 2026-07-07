import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value) continue;
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

let cachedProductionSupabaseEnv = null;

async function loadProductionSupabaseEnv(baseUrl) {
  if (cachedProductionSupabaseEnv) return cachedProductionSupabaseEnv;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/login`);
  if (!response.ok) {
    throw new Error(`unable to load production auth page (${response.status})`);
  }

  const html = await response.text();
  const urlMatch = html.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
  const keyMatch = html.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);

  if (!urlMatch?.[0] || !keyMatch?.[0]) {
    throw new Error("production Supabase env not found in auth page HTML");
  }

  cachedProductionSupabaseEnv = {
    url: urlMatch[0],
    key: keyMatch[0],
  };
  return cachedProductionSupabaseEnv;
}

export function loadSupabaseEnv() {
  loadEnvFile(join(WEB_ROOT, ".env.local"));
  loadEnvFile(join(WEB_ROOT, ".env.production.local"));
}

export async function createAnonSupabaseClient(baseUrl) {
  loadSupabaseEnv();
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!url || !key) && baseUrl) {
    try {
      const production = await loadProductionSupabaseEnv(baseUrl);
      url = production.url;
      key = production.key;
    } catch {
      return null;
    }
  }

  if (!url || !key) return null;
  return createClient(url, key);
}

export function getSupabaseProjectRef() {
  loadSupabaseEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? "";
}

export function encodeSupabaseAuthCookie(session) {
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });
  return `base64-${Buffer.from(payload, "utf8").toString("base64url")}`;
}

export async function createEphemeralSupabaseSession(email, password, baseUrl) {
  const supabase = await createAnonSupabaseClient(baseUrl);
  if (!supabase) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing for ephemeral auth");
  }

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "consumer" } },
  });

  if (signUp.error && !signUp.error.message.toLowerCase().includes("registered")) {
    throw new Error(`ephemeral signup failed: ${signUp.error.message}`);
  }

  if (signUp.data.session) {
    return signUp.data.session;
  }

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    throw new Error(`ephemeral sign-in failed: ${signIn.error.message}`);
  }
  if (!signIn.data.session) {
    throw new Error("ephemeral sign-in returned no session (email confirm may be required)");
  }

  return signIn.data.session;
}

export async function injectSupabaseSession(context, baseUrl, session) {
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) {
    throw new Error("unable to derive Supabase project ref for auth cookie");
  }

  const domain = new URL(baseUrl).hostname;
  await context.addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: encodeSupabaseAuthCookie(session),
      domain,
      path: "/",
      httpOnly: false,
      secure: baseUrl.startsWith("https"),
      sameSite: "Lax",
    },
  ]);
}
