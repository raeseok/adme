/**
 * Stage 3-C-K2 — read-only Kakao OAuth diagnosis (no secrets logged).
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEV_REF = "ogncvdxrrsjnwsuvgoyh";
const PROD_REF = "vupsalteyltjqumppltc";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PS = join(dirname(fileURLToPath(import.meta.url)), "utils", "read-supabase-cli-token.ps1");

function readAccessToken() {
  const token = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${PS}"`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (!token || token.length < 20) {
    throw new Error("Supabase CLI access token not available");
  }
  return token;
}

function summarizeKakao(config, ref) {
  const allowList = String(config.uri_allow_list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    ref,
    external_kakao_enabled: config.external_kakao_enabled === true,
    kakaoClientIdPresent: Boolean(config.external_kakao_client_id?.length),
    kakaoClientSecretPresent: Boolean(config.external_kakao_secret?.length),
    external_kakao_email_optional: config.external_kakao_email_optional === true,
    site_url: config.site_url ?? null,
    redirectIncludesAppCallback: allowList.some((u) => u.includes("/auth/callback")),
    redirectAllowListCount: allowList.length,
  };
}

async function getAuthConfig(token, ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GET auth config ${ref} failed: ${res.status}`);
  }
  return res.json();
}

async function fetchAuthLogs(token, ref, hoursBack = 24) {
  const end = new Date();
  const start = new Date(end.getTime() - hoursBack * 60 * 60 * 1000);

  async function runQuery(sql) {
    const query = new URLSearchParams({
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
      sql,
    });
    const url = `https://api.supabase.com/v1/projects/${ref}/analytics/endpoints/logs.all?${query}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, status: res.status, summary: text.slice(0, 200), rows: [] };
    }
    const data = await res.json();
    return { ok: true, rows: data?.result ?? data ?? [] };
  }

  const authSql = [
    "select timestamp, event_message, metadata",
    "from auth_logs",
    "where event_message ilike '%error%'",
    "   or event_message ilike '%unexpected%'",
    "   or event_message ilike '%callback%'",
    "   or event_message ilike '%token%'",
    "   or event_message ilike '%database%'",
    "order by timestamp desc",
    "limit 30",
  ].join(" ");
  const authResult = await runQuery(authSql);
  if (authResult.rows.length > 0) {
    return authResult;
  }

  const edgeSql = [
    "select timestamp, event_message, metadata",
    "from edge_logs",
    "where metadata.request.path like '%/auth/v1/%'",
    "order by timestamp desc",
    "limit 30",
  ].join(" ");
  const edgeResult = await runQuery(edgeSql);
  if (edgeResult.rows.length > 0) {
    return edgeResult;
  }

  const postgresSql = [
    "select timestamp, event_message, metadata",
    "from postgres_logs",
    "where event_message ilike '%handle_new_user%'",
    "   or event_message ilike '%profiles%'",
    "   or event_message ilike '%auth.users%'",
    "   or event_message ilike '%error%'",
    "order by timestamp desc",
    "limit 20",
  ].join(" ");
  return runQuery(postgresSql);
}

function sanitizeLogRow(row) {
  const rawMsg = String(row?.event_message ?? row?.message ?? "");
  let parsed = null;
  try {
    parsed = JSON.parse(rawMsg);
  } catch {
    parsed = null;
  }
  const msg = parsed ? JSON.stringify(parsed) : rawMsg;
  const path = parsed?.path ?? row?.metadata?.request?.path ?? row?.metadata?.path ?? row?.path ?? null;
  const status = parsed?.status ?? row?.metadata?.response?.status_code ?? row?.status ?? null;
  const level = parsed?.level ?? null;
  const errorCode = parsed?.error ?? parsed?.error_code ?? null;
  const lowered = msg.toLowerCase();
  return {
    timestamp: row?.timestamp ?? row?.time ?? null,
    path,
    status,
    level,
    errorCode,
    messageSummary: msg
      .replace(/[A-Za-z0-9_-]{20,}/g, "[REDACTED]")
      .slice(0, 400),
    indicatesDatabaseError:
      lowered.includes("database error") ||
      lowered.includes("saving new user") ||
      lowered.includes("duplicate key") ||
      lowered.includes("violates") ||
      lowered.includes("constraint"),
    indicatesTokenExchangeError:
      lowered.includes("token") ||
      lowered.includes("invalid_client") ||
      lowered.includes("client secret"),
    indicatesEmailMissing:
      lowered.includes("email") &&
      (lowered.includes("null") || lowered.includes("missing") || lowered.includes("required")),
  };
}

async function queryProdTriggers(token) {
  const sql = `
    select tgname, tgenabled::text as tgenabled
    from pg_trigger
    where tgrelid = 'auth.users'::regclass and not tgisinternal;
  `;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROD_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  return { ok: true, rows: await res.json() };
}

async function queryProdProfilesNullability(token) {
  const sql = `
    select column_name, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name in ('email', 'display_name', 'role')
    order by column_name;
  `;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROD_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  return { ok: true, rows: await res.json() };
}

async function queryProdFunction(token) {
  const sql = `
    select pg_get_functiondef(p.oid) as function_def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
    limit 1;
  `;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROD_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const rows = await res.json();
  const def = String(rows?.[0]?.function_def ?? "");
  return {
    ok: true,
    emailUsesNewEmail: def.includes("NEW.email"),
    displayNameUsesMetadata: def.includes("display_name"),
    hasNicknameFallback: def.includes("nickname") || def.includes("full_name"),
    defLength: def.length,
  };
}

async function queryProdConstraints(token) {
  const sql = `
    select conname, pg_get_constraintdef(oid) as constraint_def
    from pg_constraint
    where conrelid = 'public.profiles'::regclass;
  `;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROD_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  return { ok: true, rows: await res.json() };
}

async function testAuthorize(ref, provider) {
  const out = execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find((k) => k.id === "anon")?.api_key;
  const url = `https://${ref}.supabase.co/auth/v1/authorize?provider=${provider}&redirect_to=https%3A%2F%2Fweb-ashen-xi-52.vercel.app%2Fauth%2Fcallback`;
  const res = await fetch(url, {
    redirect: "manual",
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const body = await res.text();
  const location = res.headers.get("location") ?? "";
  return {
    provider,
    status: res.status,
    isKakao: location.includes("kauth.kakao.com"),
    isGoogle: location.includes("accounts.google.com"),
    isProviderDisabled: body.includes("provider is not enabled"),
  };
}

async function main() {
  const token = readAccessToken();
  console.log("INFO: tokenPresent=true secretLogged=false");

  const dev = await getAuthConfig(token, DEV_REF);
  const prod = await getAuthConfig(token, PROD_REF);
  console.log("KAKAO_CONFIG dev", JSON.stringify(summarizeKakao(dev, DEV_REF)));
  console.log("KAKAO_CONFIG prod", JSON.stringify(summarizeKakao(prod, PROD_REF)));

  const prodKakao = await testAuthorize(PROD_REF, "kakao");
  const prodGoogle = await testAuthorize(PROD_REF, "google");
  console.log("AUTHORIZE prod kakao", JSON.stringify(prodKakao));
  console.log("AUTHORIZE prod google", JSON.stringify(prodGoogle));

  const logs = await fetchAuthLogs(token, PROD_REF);
  if (!logs.ok) {
    console.log("AUTH_LOGS fetchFailed", JSON.stringify({ status: logs.status, summary: logs.summary }));
  } else {
    const rows = Array.isArray(logs.rows) ? logs.rows : [];
    console.log("AUTH_LOGS count", rows.length);
    for (const row of rows.slice(0, 5).map(sanitizeLogRow)) {
      console.log("AUTH_LOG_ROW", JSON.stringify(row));
    }
  }

  const triggers = await queryProdTriggers(token);
  console.log("DB_TRIGGERS", JSON.stringify(triggers));

  const constraints = await queryProdConstraints(token);
  console.log("DB_CONSTRAINTS profiles", JSON.stringify(constraints));

  const fn = await queryProdFunction(token);
  console.log("DB_FUNCTION handle_new_user", JSON.stringify(fn));

  const nullability = await queryProdProfilesNullability(token);
  console.log("DB_PROFILES_NULLABILITY", JSON.stringify(nullability));
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
