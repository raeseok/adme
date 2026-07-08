/**
 * Stage 3-C-K — Production Kakao OAuth authorize endpoint check (no secrets)
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { KNOWN_PROD_SUPABASE_REF } from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BASE = resolveProductionE2eBaseUrl();
const PROD_REF = KNOWN_PROD_SUPABASE_REF;

function loadProdAnonKey() {
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${PROD_REF} -o json`,
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find(
    (k) => k.id === "anon" && typeof k.api_key === "string" && k.api_key.startsWith("eyJ"),
  );
  if (!anon?.api_key) {
    throw new Error("prod anon key not found");
  }
  return anon.api_key;
}

async function verifyAuthorizeEndpoint(anonKey) {
  const url = `https://${PROD_REF}.supabase.co/auth/v1/authorize?provider=kakao&redirect_to=https%3A%2F%2Fweb-ashen-xi-52.vercel.app%2Fauth%2Fcallback`;
  const res = await fetch(url, {
    redirect: "manual",
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const body = await res.text();
  const location = res.headers.get("location") ?? "";
  const unsupported = body.includes("provider is not enabled");
  const redirectsToKakao =
    res.status === 302 &&
    (location.includes("kauth.kakao.com") || location.includes("accounts.kakao.com"));

  if (unsupported) {
    throw new Error("authorize endpoint still returns provider not enabled");
  }
  if (!redirectsToKakao) {
    throw new Error(`expected Kakao redirect, got status=${res.status}`);
  }
  console.log("PASS: prod authorize endpoint redirects to Kakao");
  return { unsupportedProviderError: false, authorizeRedirectsToKakao: true };
}

async function verifyProductionUiClick() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "카카오톡으로 계속하기" }).click();
    await page.waitForTimeout(5000);
    const url = page.url();
    const body = await page.locator("body").innerText();
    const reachedKakao =
      url.includes("kauth.kakao.com") || url.includes("accounts.kakao.com");
    const unsupported = body.includes("provider is not enabled");
    if (unsupported) {
      throw new Error("UI click still shows unsupported provider JSON");
    }
    if (!reachedKakao) {
      throw new Error(`UI click did not reach Kakao login screen: ${url}`);
    }
    console.log("PASS: Production UI Kakao button reaches Kakao login screen");
    return { reachedKakaoLoginScreen: true };
  } finally {
    await browser.close();
  }
}

async function main() {
  const anonKey = loadProdAnonKey();
  await verifyAuthorizeEndpoint(anonKey);
  await verifyProductionUiClick();
  console.log("RESULT: unsupportedProviderError=false");
  console.log("RESULT: authorizeRedirectsToKakao=true");
  console.log("RESULT: reachedKakaoLoginScreen=true");
  console.log("PASS: verify:prod-kakao-oauth-authorize");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
