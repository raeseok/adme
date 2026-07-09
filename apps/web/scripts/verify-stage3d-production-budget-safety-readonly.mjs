/**
 * Stage 3-D — campaign budget safety read-only (no mutation)
 * Uses reward_per_view as point_per_pass equivalent (Stage 3-B RPC).
 */
import {
  createAnonSupabaseClient,
  KNOWN_PROD_SUPABASE_REF,
  getSupabaseProjectRef,
} from "./e2e/supabase-auth-session.mjs";
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const MARKERS = [
  "stage3DCampaignBudgetSafetyCheckReady=true",
  "stage3DCampaignBudgetReadOnly=true",
  "stage3DProductionCampaignBudgetMutation=false",
];

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, MARKERS, "budget safety markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) throw new Error("anon client unavailable");
  if (getSupabaseProjectRef() !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error("ref mismatch");
  }

  const before = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, status, budget_total, budget_spent, reward_per_view")
    .eq("status", "active")
    .limit(100);

  if (error) {
    throw new Error(`campaigns read failed: ${error.message}`);
  }

  let negative = 0;
  let overspent = 0;
  let invalidReward = 0;
  let insufficient = 0;

  for (const c of data ?? []) {
    const total = Number(c.budget_total ?? 0);
    const spent = Number(c.budget_spent ?? 0);
    const reward = Number(c.reward_per_view ?? 0);
    const remaining = total - spent;

    if (total < 0 || spent < 0 || reward < 0 || remaining < 0) {
      negative += 1;
      console.log(`WARN: negative/invalid budget campaign=${String(c.id).slice(0, 8)}…`);
    }
    if (total < spent) {
      overspent += 1;
      console.log(`WARN: overspent campaign=${String(c.id).slice(0, 8)}…`);
    }
    if (!(reward > 0)) {
      invalidReward += 1;
      console.log(`WARN: reward_per_view<=0 campaign=${String(c.id).slice(0, 8)}…`);
    }
    if (remaining < reward) {
      insufficient += 1;
    }
  }

  const after = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });
  if ((after.count ?? 0) !== (before.count ?? 0)) {
    throw new Error("campaigns count changed during read-only check");
  }

  console.log(
    `RESULT: active=${(data ?? []).length} negative=${negative} overspent=${overspent} invalidReward=${invalidReward} insufficientRemaining=${insufficient}`,
  );
  console.log("RESULT: stage3DCampaignBudgetReadOnly=true");
  console.log("RESULT: stage3DProductionCampaignBudgetMutation=false");
  console.log(
    "RESULT: allowlistMutationEnabled=false (read-only inspection only)",
  );

  if (negative > 0 || overspent > 0 || invalidReward > 0) {
    console.log(
      "BLOCKER: budget safety issues — openReady must remain false; no auto-mutation",
    );
  }

  console.log("PASS: verify:stage3d-production-budget-safety-readonly");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
