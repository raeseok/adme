/**
 * Stage 3-C-K — sync Kakao auth provider from dev to prod via Management API.
 * Never logs client_id, secret, or access token.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEV_REF = "ogncvdxrrsjnwsuvgoyh";
const PROD_REF = "vupsalteyltjqumppltc";
const PS = join(dirname(fileURLToPath(import.meta.url)), "read-supabase-cli-token.ps1");

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

async function getAuthConfig(token, ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GET auth config ${ref} failed: ${res.status}`);
  }
  return res.json();
}

function summarizeKakao(config, ref) {
  return {
    ref,
    external_kakao_enabled: config.external_kakao_enabled === true,
    kakaoClientIdPresent: Boolean(config.external_kakao_client_id?.length),
    kakaoClientSecretPresent: Boolean(config.external_kakao_secret?.length),
    external_kakao_email_optional: config.external_kakao_email_optional === true,
  };
}

async function patchProdKakao(token, devConfig) {
  const body = {
    external_kakao_enabled: true,
    external_kakao_client_id: devConfig.external_kakao_client_id,
    external_kakao_email_optional: devConfig.external_kakao_email_optional ?? false,
  };
  if (devConfig.external_kakao_secret) {
    body.external_kakao_secret = devConfig.external_kakao_secret;
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROD_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH prod auth failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function testAuthorize(ref) {
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${ref} -o json`,
    { cwd: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".."), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find((k) => k.id === "anon")?.api_key;
  const url = `https://${ref}.supabase.co/auth/v1/authorize?provider=kakao&redirect_to=https%3A%2F%2Fweb-ashen-xi-52.vercel.app%2Fauth%2Fcallback`;
  const res = await fetch(url, {
    redirect: "manual",
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  return {
    status: res.status,
    location: res.headers.get("location")?.slice(0, 60) ?? null,
    isKakao: (res.headers.get("location") ?? "").includes("kauth.kakao.com"),
    isProviderDisabled: (await res.text()).includes("provider is not enabled"),
  };
}

async function main() {
  const token = readAccessToken();
  console.log("INFO: Supabase Management API token present=true secretValueLogged=false");

  const devBefore = await getAuthConfig(token, DEV_REF);
  const prodBefore = await getAuthConfig(token, PROD_REF);
  console.log("BEFORE dev", JSON.stringify(summarizeKakao(devBefore, DEV_REF)));
  console.log("BEFORE prod", JSON.stringify(summarizeKakao(prodBefore, PROD_REF)));

  if (!devBefore.external_kakao_enabled || !devBefore.external_kakao_client_id) {
    throw new Error("dev Kakao provider not configured — cannot sync");
  }

  await patchProdKakao(token, devBefore);
  console.log("PASS: prod Kakao auth config patched from dev (secrets not logged)");

  await new Promise((r) => setTimeout(r, 3000));

  const prodAfter = await getAuthConfig(token, PROD_REF);
  console.log("AFTER prod", JSON.stringify(summarizeKakao(prodAfter, PROD_REF)));

  const prodTest = await testAuthorize(PROD_REF);
  console.log("AUTHORIZE prod", JSON.stringify(prodTest));
  if (prodTest.isProviderDisabled || !prodTest.isKakao) {
    throw new Error("prod authorize still blocked after patch");
  }
  console.log("PASS: prod Kakao authorize redirects to kauth.kakao.com");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
