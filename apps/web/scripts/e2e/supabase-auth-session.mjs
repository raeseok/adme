import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./diagnostics-helpers.mjs";
import {
  PRODUCTION_E2E_BASE_URL,
  resolveProductionE2eBaseUrl,
} from "./e2e-base-url.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

/** Historical single-project ref — dev after Stage 3-1 split. */
export const KNOWN_DEV_SUPABASE_REF = "ogncvdxrrsjnwsuvgoyh";

/** Production Supabase ref after Stage 3-1 split. */
export const KNOWN_PROD_SUPABASE_REF = "vupsalteyltjqumppltc";

let cachedProductionSupabaseEnv = null;
let cachedProductionSupabaseRef = null;

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

function isProductionE2eBaseUrl(baseUrl) {
  if (!baseUrl) return false;
  try {
    const normalized = baseUrl.replace(/\/$/, "");
    const production = resolveProductionE2eBaseUrl().replace(/\/$/, "");
    return normalized === production || normalized === PRODUCTION_E2E_BASE_URL;
  } catch {
    return false;
  }
}

async function loadSupabaseEnvFromCli(projectRef) {
  const { execSync } = await import("node:child_process");
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${projectRef} -o json`,
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find(
    (k) => k.id === "anon" && typeof k.api_key === "string" && k.api_key.startsWith("eyJ"),
  );
  if (!anon?.api_key) {
    throw new Error(`anon key not found via supabase CLI for ref ${projectRef}`);
  }
  return {
    url: `https://${projectRef}.supabase.co`,
    key: anon.api_key,
    projectRef,
  };
}

async function resolveProductionSupabaseRef(baseUrl) {
  if (cachedProductionSupabaseRef) {
    return cachedProductionSupabaseRef;
  }

  const sources = await loadDiagnosticsFromHttp(baseUrl.replace(/\/$/, ""), {
    maxWaitMs: 90000,
  });
  const currentRef = extractMarkerValue(
    sources.combined,
    "stage30CurrentSupabaseProjectRef",
  );
  const expectedProdRef = extractMarkerValue(
    sources.combined,
    "stage30ExpectedProdSupabaseRef",
  );

  const ref =
    (currentRef && currentRef !== "unknown" ? currentRef : "") ||
    (expectedProdRef && expectedProdRef !== "unconfigured"
      ? expectedProdRef
      : "");

  if (!ref) {
    throw new Error(
      "unable to resolve production Supabase project-ref from /admin/diagnostics",
    );
  }

  cachedProductionSupabaseRef = ref;
  console.log(`INFO: production E2E Supabase project-ref=${ref}`);
  return ref;
}

async function loadProductionSupabaseEnv(baseUrl) {
  if (cachedProductionSupabaseEnv) return cachedProductionSupabaseEnv;

  const projectRef = await resolveProductionSupabaseRef(baseUrl);
  cachedProductionSupabaseEnv = await loadSupabaseEnvFromCli(projectRef);
  return cachedProductionSupabaseEnv;
}

export function loadSupabaseEnv() {
  loadEnvFile(join(WEB_ROOT, ".env.local"));
  loadEnvFile(join(WEB_ROOT, ".env.production.local"));
}

export async function createAnonSupabaseClient(baseUrl) {
  if (isProductionE2eBaseUrl(baseUrl)) {
    const production = await loadProductionSupabaseEnv(baseUrl);
    process.env.NEXT_PUBLIC_SUPABASE_URL = production.url;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = production.key;
    return createClient(production.url, production.key);
  }

  loadSupabaseEnv();
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!url || !key) && baseUrl) {
    try {
      const production = await loadProductionSupabaseEnv(baseUrl);
      url = production.url;
      key = production.key;
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
    } catch {
      return null;
    }
  }

  if (!url || !key) return null;
  return createClient(url, key);
}

export function getSupabaseProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match?.[1]) return match[1];
  return KNOWN_DEV_SUPABASE_REF;
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
