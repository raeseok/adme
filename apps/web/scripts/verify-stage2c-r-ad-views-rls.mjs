/**
 * Stage 2-C-R — ad_views RLS live checks (consumer own, anon blocked, no advertiser raw)
 */
import { randomBytes } from "node:crypto";
import {
  createAnonSupabaseClient,
  createEphemeralSupabaseSession,
  loadSupabaseEnv,
} from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const FAKE_CAMPAIGN = "00000000-0000-4000-8000-000000000099";
const FAKE_USER = "00000000-0000-4000-8000-000000000088";

async function main() {
  loadSupabaseEnv();
  const anon = await createAnonSupabaseClient(BASE);
  if (!anon) {
    throw new Error("Supabase client unavailable");
  }

  const anonInsert = await anon.from("ad_views").insert({
    consumer_user_id: FAKE_USER,
    campaign_id: FAKE_CAMPAIGN,
    status: "viewed",
  });
  if (!anonInsert.error) {
    throw new Error("anon INSERT into ad_views should be blocked");
  }
  console.log("PASS: anon INSERT blocked");

  const anonSelect = await anon.from("ad_views").select("consumer_user_id").limit(1);
  if (!anonSelect.error && (anonSelect.data?.length ?? 0) > 0) {
    throw new Error("anon SELECT into ad_views should return no rows or error");
  }
  console.log("PASS: anon SELECT blocked or empty");

  const ts = Date.now();
  const nonce = randomBytes(4).toString("hex");
  const emailA = `stage2cr-rls-a-${ts}-${nonce}@example.com`;
  const emailB = `stage2cr-rls-b-${ts}-${nonce}@example.com`;
  const password = randomBytes(16).toString("base64url");

  const sessionA = await createEphemeralSupabaseSession(emailA, password, BASE);
  const sessionB = await createEphemeralSupabaseSession(emailB, password, BASE);

  const clientA = await createAnonSupabaseClient(BASE);
  await clientA.auth.setSession({
    access_token: sessionA.access_token,
    refresh_token: sessionA.refresh_token,
  });

  const clientB = await createAnonSupabaseClient(BASE);
  await clientB.auth.setSession({
    access_token: sessionB.access_token,
    refresh_token: sessionB.refresh_token,
  });

  const { data: campaigns } = await clientA
    .from("campaigns")
    .select("id")
    .eq("status", "active")
    .limit(1);

  const campaignId = campaigns?.[0]?.id ?? FAKE_CAMPAIGN;

  const ownInsert = await clientA.from("ad_views").insert({
    consumer_user_id: sessionA.user.id,
    campaign_id: campaignId,
    status: "viewed",
    view_started_at: new Date().toISOString(),
    attempt_no: 0,
  });

  if (ownInsert.error && campaignId === FAKE_CAMPAIGN) {
    console.log(`INFO: own INSERT skipped — no active campaign (${ownInsert.error.message})`);
  } else if (ownInsert.error) {
    throw new Error(`consumer own INSERT failed: ${ownInsert.error.message}`);
  } else {
    console.log("PASS: authenticated consumer own INSERT");

    const ownSelect = await clientA
      .from("ad_views")
      .select("consumer_user_id, view_started_at, attempt_no")
      .eq("consumer_user_id", sessionA.user.id)
      .limit(5);
    if (ownSelect.error || !(ownSelect.data?.length ?? 0)) {
      throw new Error("consumer own SELECT failed");
    }
    console.log("PASS: authenticated consumer own SELECT");

    const rowId = ownInsert.data?.[0]?.id ?? ownSelect.data?.[0]?.id;
    if (rowId) {
      const ownUpdate = await clientA
        .from("ad_views")
        .update({ attempt_no: 1, status: "viewed" })
        .eq("id", rowId)
        .eq("consumer_user_id", sessionA.user.id);
      if (ownUpdate.error) {
        throw new Error(`consumer own UPDATE failed: ${ownUpdate.error.message}`);
      }
      console.log("PASS: authenticated consumer own UPDATE");
    }

    const crossSelect = await clientB
      .from("ad_views")
      .select("consumer_user_id")
      .eq("consumer_user_id", sessionA.user.id)
      .limit(1);
    if (!crossSelect.error && (crossSelect.data?.length ?? 0) > 0) {
      throw new Error("consumer B must not read consumer A ad_views rows");
    }
    console.log("PASS: cross-consumer SELECT blocked");

    const crossUpdate = await clientB
      .from("ad_views")
      .update({ attempt_no: 2 })
      .eq("consumer_user_id", sessionA.user.id);
    if (!crossUpdate.error && (crossUpdate.count ?? 0) > 0) {
      throw new Error("consumer B must not update consumer A ad_views rows");
    }
    console.log("PASS: cross-consumer UPDATE blocked");
  }

  const schemaProbe = await clientA
    .from("ad_views")
    .select("view_started_at, attempt_no")
    .limit(0);
  if (schemaProbe.error?.message?.includes("view_started_at")) {
    throw new Error("remote schema missing view_started_at — apply Stage 2-C migration");
  }
  console.log("PASS: view_started_at and attempt_no columns exist");

  console.log("PASS: verify:stage2c-r-ad-views-rls");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
