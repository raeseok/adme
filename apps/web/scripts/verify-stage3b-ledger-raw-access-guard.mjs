/**
 * Stage 3-B — advertiser/partner raw point_ledger access must be blocked
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  KNOWN_DEV_SUPABASE_REF,
} from "./e2e/supabase-auth-session.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DEV_REF = KNOWN_DEV_SUPABASE_REF;

function loadAnonEnv(projectRef) {
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
    throw new Error(`anon key not found for ref ${projectRef}`);
  }
  return { url: `https://${projectRef}.supabase.co`, key: anon.api_key };
}

async function createRoleClient(env, role) {
  const supabase = createClient(env.url, env.key);
  const email = `stage3b-ledger-${role}-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = randomBytes(16).toString("base64url");
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (signUp.error && !signUp.error.message.toLowerCase().includes("registered")) {
    throw new Error(`${role} signup failed: ${signUp.error.message}`);
  }
  let session = signUp.data.session;
  if (!session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.session) {
      throw new Error(`${role} sign-in failed`);
    }
    session = signIn.data.session;
  }
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  console.log(`INFO: ${role} ${maskEmail(email)}`);
  return { supabase, session };
}

async function assertSelectBlocked(client, role, consumerUserId) {
  const res = await client
    .from("point_ledger")
    .select("id, user_id, amount, entry_type, metadata")
    .eq("user_id", consumerUserId)
    .eq("account_type", "consumer");
  if (!res.error && (res.data?.length ?? 0) > 0) {
    throw new Error(`${role} must not read consumer raw point_ledger rows`);
  }
  console.log(`PASS: ${role} raw point_ledger SELECT blocked`);
}

async function assertWriteBlocked(client, role, consumerUserId) {
  const insert = await client.from("point_ledger").insert({
    account_type: "consumer",
    user_id: consumerUserId,
    entry_type: "quiz_reward",
    amount: 10,
    description: `stage3b-${role}-should-fail`,
  });
  if (!insert.error) {
    throw new Error(`${role} point_ledger INSERT should be blocked`);
  }
  console.log(`PASS: ${role} raw point_ledger INSERT blocked`);

  const fakeId = "00000000-0000-4000-8000-000000009999";
  const upd = await client
    .from("point_ledger")
    .update({ description: "mutate" })
    .eq("id", fakeId);
  if (!upd.error) {
    const { data: check } = await client
      .from("point_ledger")
      .select("description")
      .eq("id", fakeId)
      .maybeSingle();
    if (check?.description === "mutate") {
      throw new Error(`${role} point_ledger UPDATE should not succeed`);
    }
  }
  console.log(`PASS: ${role} raw point_ledger UPDATE blocked`);

  const del = await client.from("point_ledger").delete().eq("id", fakeId);
  if (!del.error) {
    const { data: still } = await client
      .from("point_ledger")
      .select("id")
      .eq("id", fakeId)
      .maybeSingle();
    if (still) {
      throw new Error(`${role} point_ledger DELETE should not succeed`);
    }
  }
  console.log(`PASS: ${role} raw point_ledger DELETE blocked`);
}

async function main() {
  const env = loadAnonEnv(DEV_REF);
  const consumer = await createRoleClient(env, "consumer");
  const advertiser = await createRoleClient(env, "advertiser");
  const partner = await createRoleClient(env, "partner");

  const consumerUserId = consumer.session.user.id;

  await assertSelectBlocked(advertiser.supabase, "advertiser", consumerUserId);
  await assertWriteBlocked(advertiser.supabase, "advertiser", consumerUserId);

  await assertSelectBlocked(partner.supabase, "partner", consumerUserId);
  await assertWriteBlocked(partner.supabase, "partner", consumerUserId);

  console.log("PASS: verify:stage3b-ledger-raw-access-guard");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
