/**
 * Stage 1-G — child/pet raw row not exposed to other consumers, advertisers, partners
 */
import { randomBytes } from "node:crypto";
import {
  createAnonSupabaseClient,
} from "./e2e/supabase-auth-session.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { maskEmail } from "./e2e/auth-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

async function createSessionWithRole(email, password, role) {
  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });

  if (signUp.error && !signUp.error.message.toLowerCase().includes("registered")) {
    throw new Error(`signup failed (${role}): ${signUp.error.message}`);
  }

  if (signUp.data.session) {
    return { session: signUp.data.session, client: supabase };
  }

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.session) {
    throw new Error(`sign-in failed (${role})`);
  }

  await supabase.auth.setSession({
    access_token: signIn.data.session.access_token,
    refresh_token: signIn.data.session.refresh_token,
  });

  return { session: signIn.data.session, client: supabase };
}

async function main() {
  const ts = Date.now();
  const nonce = randomBytes(4).toString("hex");
  const password = randomBytes(16).toString("base64url");

  const emailA = `stage1g-rls-a-${ts}-${nonce}@example.com`;
  const emailB = `stage1g-rls-b-${ts}-${nonce}@example.com`;
  const emailAdv = `stage1g-rls-adv-${ts}-${nonce}@example.com`;
  const emailPartner = `stage1g-rls-part-${ts}-${nonce}@example.com`;

  console.log(`INFO: consumer A ${maskEmail(emailA)}`);
  console.log(`INFO: consumer B ${maskEmail(emailB)}`);
  console.log(`INFO: advertiser ${maskEmail(emailAdv)}`);
  console.log(`INFO: partner ${maskEmail(emailPartner)}`);

  const consumerA = await createSessionWithRole(emailA, password, "consumer");
  const consumerB = await createSessionWithRole(emailB, password, "consumer");
  const advertiser = await createSessionWithRole(emailAdv, password, "advertiser");
  const partner = await createSessionWithRole(emailPartner, password, "partner");

  const { data: regions } = await consumerA.client
    .from("regions")
    .select("id")
    .eq("is_active", true)
    .eq("is_selectable", true)
    .limit(1);

  const regionId = regions?.[0]?.id;
  if (!regionId) {
    throw new Error("no selectable region for profile seed");
  }

  const upsertA = await consumerA.client.from("consumer_profiles").upsert(
    {
      user_id: consumerA.session.user.id,
      region_id: regionId,
      oldest_child_birth_year: 2010,
      youngest_child_birth_year: 2015,
      pet_types: ["dog", "cat"],
      interest_scope: "all",
    },
    { onConflict: "user_id" },
  );

  if (upsertA.error) {
    throw new Error(`consumer A profile seed failed: ${upsertA.error.message}`);
  }
  console.log("PASS: consumer A — child/pet profile saved");

  const ownRead = await consumerA.client
    .from("consumer_profiles")
    .select("oldest_child_birth_year, youngest_child_birth_year, pet_types")
    .eq("user_id", consumerA.session.user.id)
    .maybeSingle();

  if (ownRead.error || ownRead.data?.oldest_child_birth_year !== 2010) {
    throw new Error("consumer A own read failed");
  }
  console.log("PASS: consumer A — own child/pet read ok");

  const crossB = await consumerB.client
    .from("consumer_profiles")
    .select("oldest_child_birth_year, youngest_child_birth_year, pet_types, user_id")
    .eq("user_id", consumerA.session.user.id);

  if (!crossB.error && (crossB.data?.length ?? 0) > 0) {
    throw new Error("consumer B must not read consumer A child/pet raw row");
  }
  console.log("PASS: consumer B — cross-consumer read blocked");

  const advLeak = await advertiser.client
    .from("consumer_profiles")
    .select("oldest_child_birth_year, youngest_child_birth_year, pet_types, user_id")
    .eq("user_id", consumerA.session.user.id);

  if (!advLeak.error && (advLeak.data?.length ?? 0) > 0) {
    throw new Error("advertiser must not read consumer_profiles child/pet raw row");
  }
  console.log("PASS: advertiser — consumer_profiles raw read blocked");

  const partnerLeak = await partner.client
    .from("consumer_profiles")
    .select("oldest_child_birth_year, youngest_child_birth_year, pet_types, user_id")
    .eq("user_id", consumerA.session.user.id);

  if (!partnerLeak.error && (partnerLeak.data?.length ?? 0) > 0) {
    throw new Error("partner must not read consumer_profiles child/pet raw row");
  }
  console.log("PASS: partner — consumer_profiles raw read blocked");

  console.log("PASS: verify:stage1g-rls-family-pet");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
