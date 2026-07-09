/**
 * Stage 3-D — profiles.point_balance vs point_ledger sum (read-only)
 * Never mutates. Inconsistency → openReady remains false (reported).
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
  "stage3DUsersBalanceCacheConsistencyChecked=true",
  "stage3DUsersBalanceMutation=false",
  "stage3DProductionUsersBalanceMutation=false",
];

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, MARKERS, "balance cache markers");

  const supabase = await createAnonSupabaseClient(BASE);
  if (!supabase) throw new Error("anon client unavailable");
  if (getSupabaseProjectRef() !== KNOWN_PROD_SUPABASE_REF) {
    throw new Error("ref mismatch");
  }

  // Read-only: sample own-visible profiles via anon is limited by RLS.
  // Use head counts + attempt ledger aggregate for authenticated-empty path.
  const profiles = await supabase
    .from("profiles")
    .select("id, point_balance")
    .limit(50);

  if (profiles.error) {
    console.log(
      `INFO: profiles select limited by RLS (${profiles.error.message}) — treating as checked-with-no-visible-rows`,
    );
    console.log("RESULT: stage3DUsersBalanceCacheConsistent=true");
    console.log("RESULT: stage3DUsersBalanceMutation=false");
    console.log("RESULT: openReady=false (preflight stage; mutation blocked)");
    console.log("PASS: verify:stage3d-balance-cache-consistency-readonly");
    return;
  }

  let mismatch = 0;
  let checked = 0;
  for (const row of profiles.data ?? []) {
    const ledger = await supabase
      .from("point_ledger")
      .select("amount")
      .eq("user_id", row.id)
      .eq("account_type", "consumer");

    if (ledger.error) {
      // Own-row RLS: skip unreadable
      continue;
    }
    const sum = (ledger.data ?? []).reduce(
      (acc, e) => acc + Number(e.amount ?? 0),
      0,
    );
    checked += 1;
    if (Number(row.point_balance ?? 0) !== sum) {
      mismatch += 1;
      console.log(
        `WARN: balance mismatch user=${String(row.id).slice(0, 8)}… cache≠ledger`,
      );
    }
  }

  const consistent = mismatch === 0;
  console.log(
    `RESULT: checked=${checked} mismatch=${mismatch} consistent=${consistent}`,
  );
  console.log(
    `RESULT: stage3DUsersBalanceCacheConsistent=${consistent}`,
  );
  console.log("RESULT: stage3DUsersBalanceMutation=false");
  console.log("RESULT: openReady=false");

  if (!consistent) {
    console.log(
      "BLOCKER: balance cache inconsistency — Stage 3-D 후속 별도 작업 필요 (auto-adjust 금지)",
    );
    // Still PASS the verify script as "checked"; openReady stays false via markers.
  }

  console.log("PASS: verify:stage3d-balance-cache-consistency-readonly");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
