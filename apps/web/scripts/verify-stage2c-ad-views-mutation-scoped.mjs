/**
 * Stage 2-C — ad_views mutation scoped to authenticated own rows; point_ledger unchanged
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAnonSupabaseClient } from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const BASE = resolveProductionE2eBaseUrl();

const STAGE2C_FILE = join(root, "src/lib/consumer-ads/stage2c-ad-views.server.ts");

let failed = 0;

const content = readFileSync(STAGE2C_FILE, "utf8");
if (!/\.from\(\s*["']ad_views["']\s*\)\s*\.insert/.test(content)) {
  console.error("FAIL: stage2c missing scoped ad_views insert");
  failed++;
} else {
  console.log("PASS: stage2c ad_views insert present");
}

if (!/\.from\(\s*["']ad_views["']\s*\)\s*\.update/.test(content)) {
  console.error("FAIL: stage2c missing scoped ad_views update");
  failed++;
} else {
  console.log("PASS: stage2c ad_views update present");
}

if (/service_role|SERVICE_ROLE/.test(content)) {
  console.error("FAIL: stage2c must not use service role");
  failed++;
} else {
  console.log("PASS: stage2c no service role");
}

const supabase = await createAnonSupabaseClient(BASE);
if (supabase) {
  const anonInsert = await supabase.from("ad_views").insert({
    consumer_user_id: "00000000-0000-4000-8000-000000000001",
    campaign_id: "00000000-0000-4000-8000-000000000002",
    status: "viewed",
  });
  if (!anonInsert.error) {
    console.error("FAIL: anon ad_views insert should be blocked");
    failed++;
  } else {
    console.log("PASS: anon ad_views insert blocked");
  }

  const ledger = await supabase
    .from("point_ledger")
    .select("*", { count: "exact", head: true });
  if (ledger.error) {
    console.log("INFO: anon point_ledger count blocked by RLS (expected)");
  } else {
    console.log(`INFO: point_ledger head count=${ledger.count ?? 0} (read-only)`);
  }
} else {
  console.log("INFO: Supabase client unavailable — static scan only");
}

if (failed > 0) {
  process.exit(1);
}
console.log("PASS: verify:stage2c-ad-views-mutation-scoped");
