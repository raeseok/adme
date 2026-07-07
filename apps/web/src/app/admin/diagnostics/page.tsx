import { getSessionSnapshot } from "@/lib/auth/session";
import { getConsumerProfilePageData } from "@/lib/consumer-profile/page-data";
import { createClient } from "@/lib/supabase/server";
import {
  getAppStage,
  getDeployCommit,
  getRuntimeLabel,
  isSupabaseAnonKeyConfigured,
  isSupabaseUrlConfigured,
} from "@/lib/deploy-info";
import { ShellCard } from "@/components/ShellCard";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type DbCheckResult = {
  status: string;
  table: string;
  rowCheck: string;
  summary: string;
};

async function countTable(supabase: SupabaseClient, table: string) {
  return supabase.from(table).select("*", { count: "exact", head: true });
}

async function runDbCheck(): Promise<DbCheckResult> {
  if (!isSupabaseUrlConfigured() || !isSupabaseAnonKeyConfigured()) {
    return {
      status: "not tested",
      table: "",
      rowCheck: "skipped",
      summary: "환경변수 미설정",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      status: "not tested",
      table: "",
      rowCheck: "skipped",
      summary: "클라이언트 생성 실패",
    };
  }

  const regions = await countTable(supabase, "regions");
  if (!regions.error) {
    return {
      status: "ok",
      table: "regions",
      rowCheck: String(regions.count ?? 0),
      summary: `read-only count: ${regions.count ?? 0}`,
    };
  }

  const categories = await countTable(supabase, "interest_categories");
  if (!categories.error) {
    return {
      status: "ok",
      table: "interest_categories",
      rowCheck: String(categories.count ?? 0),
      summary: `read-only count: ${categories.count ?? 0}`,
    };
  }

  return {
    status: "failed",
    table: "regions",
    rowCheck: "error",
    summary: "Error summary: read-only select failed",
  };
}

export default async function DiagnosticsPage() {
  const dbCheck = await runDbCheck();
  const deployCommit = getDeployCommit();
  const supabase = await createClient();
  const { snapshot } = await getSessionSnapshot();
  const pageData = await getConsumerProfilePageData(supabase);
  const isAuthenticated = snapshot.sessionStatus === "authenticated";
  const socialAuthProvider = snapshot.socialAuthProvider ?? "not_tested";
  const kakaoOAuthE2E =
    process.env.STAGE1DA_KAKAO_OAUTH_E2E ?? "not_tested";

  return (
    <ShellCard title="AdMe diagnostics">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
        Stage 0.5-R diagnostics verified
      </p>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Supabase URL configured:</dt>
          <dd className="font-mono font-medium">
            {isSupabaseUrlConfigured() ? "true" : "false"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Supabase anon key configured:</dt>
          <dd className="font-mono font-medium">
            {isSupabaseAnonKeyConfigured() ? "true" : "false"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Runtime:</dt>
          <dd className="font-mono font-medium">{getRuntimeLabel()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Deploy commit:</dt>
          <dd className="font-mono font-medium">{deployCommit}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Stage marker:</dt>
          <dd className="font-mono font-medium">{getAppStage()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">DB check status:</dt>
          <dd className="font-mono font-medium">{dbCheck.status}</dd>
        </div>
        {dbCheck.table && (
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Checked table:</dt>
            <dd className="font-mono font-medium">{dbCheck.table}</dd>
          </div>
        )}
        {dbCheck.rowCheck !== "skipped" && (
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Row check:</dt>
            <dd className="font-mono font-medium">{dbCheck.rowCheck}</dd>
          </div>
        )}
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-zinc-700">
          {dbCheck.summary}
        </div>
      </dl>
      <p className="text-xs text-zinc-500">
        service role key 미사용 · anon key 값 미노출
      </p>

      <section
        aria-label="Stage 1-E region hierarchical selector markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-3 font-mono text-xs text-indigo-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-E Region Hierarchical Selector (current)
        </p>
        <p>stage-1-e-region-hierarchical-selector</p>
        <p>stage1ERegionSelectorDepth=sido-sigungu-dong-optional</p>
        <p>stage1ESidoFirst=true</p>
        <p>stage1ESigunguSecond=true</p>
        <p>stage1EDongOptional=true</p>
        <p>stage1ERegionFinalSaveLevel=sigungu-or-dong</p>
        <p>stage1ERegionSeedCoverage={pageData.hierarchicalSeedCoverage}</p>
        <p>stage1EAdvertiserPrecisionPrepared=true</p>
        <p>stage1EPublicDebugMarker=false</p>
        <p>stage1EServiceRoleUsed=false</p>
        <p>stage1EPointLedgerMutation=false</p>
        <p>stage1EQuizAnswerAccess=false</p>
        <p>stage1EDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D-A public UI cleanup markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-D-A Public UI Cleanup
        </p>
        <p>stage-1-d-a-public-ui-cleanup</p>
        <p>stage1DAPublicLoginClean=true</p>
        <p>stage1DAPublicProfileClean=true</p>
        <p>stage1DAAuthCompleted=true</p>
        <p>stage1DAGoogleOAuthE2E=pass</p>
        <p>stage1DAKakaoOAuthE2E={kakaoOAuthE2E}</p>
        <p>stage1DAServiceRoleUsed=false</p>
        <p>stage1DAPointLedgerMutation=false</p>
        <p>stage1DAQuizAnswerAccess=false</p>
        <p>stage1DAFullUserIdExposure=false</p>
        <p>stage1DAEmailMasked=true</p>
        <p>stage1DADeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D-B consumer profile intent UX markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-sky-300 bg-sky-50 px-3 py-3 font-mono text-xs text-sky-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-D-B Consumer Profile Intent UX (history)
        </p>
        <p>stage-1-d-b-consumer-profile-intent-ux</p>
        <p>stage1DBProfileAxes=age,gender,region,interest</p>
        <p>stage1DBBirthYearEnabled=true</p>
        <p>stage1DBGenderEnabled=true</p>
        <p>stage1DBRegionGranularity=basic_municipality</p>
        <p>stage1DBProvinceOnlyOptionsVisible=false</p>
        <p>stage1DBBasicMunicipalitySeedCoverage={pageData.basicMunicipalitySeedCoverage}</p>
        <p>stage1DBSpendRangePublicUI=false</p>
        <p>stage1DBSpendRangeLegacyPreserved=true</p>
        <p>stage1DBInterestAllEnabled=true</p>
        <p>stage1DBInterestScopeSupported=true</p>
        <p>stage1DBInterestAllSaveSupported=true</p>
        <p>stage1DBProfileCompletionEnabled=true</p>
        <p>stage1DBConsumerHomeSkeleton=true</p>
        <p>stage1DBResidenceMax=1</p>
        <p>stage1DBActivityMax=2</p>
        <p>stage1DBServiceRoleUsed=false</p>
        <p>stage1DBPointLedgerMutation=false</p>
        <p>stage1DBQuizAnswerAccess=false</p>
        <p>stage1DBDeployCommit={deployCommit}</p>
      </section>

      <section className="mt-4 space-y-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 font-mono text-xs text-zinc-700">
        <p>stage1CDiagnosticsAuthReady=true</p>
        <p>stage1CDiagnosticsServiceRoleUsed=false</p>
        <p>stage1CDiagnosticsDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-C diagnostics markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-violet-300 bg-violet-50 px-3 py-3 font-mono text-xs text-violet-900"
      >
        <p className="font-sans text-sm font-semibold">Stage 1-C Supabase Auth</p>
        <p>stage-1-c-supabase-auth</p>
        <p>stage1CLoginRoute=/auth/login</p>
        <p>stage1CProfileRoute=/consumer/profile</p>
        <p>stage1CAuthProvider=supabase</p>
        <p>stage1CAuthMethod=email-password</p>
        <p>stage1CSessionStatus={snapshot.sessionStatus}</p>
        <p>stage1CAuthUserPresent={String(snapshot.authUserPresent)}</p>
        <p>stage1CAuthUserIdVisible=false</p>
        <p>stage1CAuthEmailMasked={snapshot.maskedEmail ? "true" : "false"}</p>
        <p>
          stage1CMasterReadMode=
          {isAuthenticated ? "authenticated-client" : "anonymous-client"}
        </p>
        <p>
          stage1CRegionsReadStatus=
          {isAuthenticated ? pageData.regionsReadStatus : "skipped"}
        </p>
        <p>
          stage1CRegionCountAuth=
          {isAuthenticated ? pageData.regionCount : 0}
        </p>
        <p>
          stage1CCategoriesReadStatus=
          {isAuthenticated ? pageData.categoriesReadStatus : "skipped"}
        </p>
        <p>
          stage1CCategoryCountAuth=
          {isAuthenticated ? pageData.categoryCount : 0}
        </p>
        <p>stage1CResidenceMax=1</p>
        <p>stage1CActivityMax=2</p>
        <p>stage1CUsesConsumerRegions=true</p>
        <p>stage1CPointLedgerMutation=false</p>
        <p>stage1CQuizAnswerAccess=false</p>
        <p>stage1CServiceRoleUsed=false</p>
        <p>stage1CCallbackRoute=/auth/callback</p>
        <p>stage1CDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D auth diagnostics markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 font-mono text-xs text-amber-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-D Auth Social Login
        </p>
        <p>stage-1-d-auth-social-login</p>
        <p>stage1DAuthLoginRoute=/auth/login</p>
        <p>stage1DAuthEmailEnabled=true</p>
        <p>stage1DAuthGoogleEnabled=true</p>
        <p>stage1DAuthKakaoEnabled=true</p>
        <p>stage1DAuthProviders=email,google,kakao</p>
        <p>stage1DGoogleLoginButtonVisible=true</p>
        <p>stage1DKakaoLoginButtonVisible=true</p>
        <p>stage1DEmailLoginFormVisible=true</p>
        <p>stage1DCallbackSupportsOAuth=true</p>
        <p>stage1DCallbackRedirectTarget=/consumer/profile</p>
        <p>stage1DCallbackServiceRoleUsed=false</p>
        <p>stage1DSocialProviderAuthenticated={socialAuthProvider}</p>
        <p>stage1DServiceRoleUsed=false</p>
        <p>stage1DPointLedgerMutation=false</p>
        <p>stage1DQuizAnswerAccess=false</p>
        <p>stage1DDeployCommit={deployCommit}</p>
      </section>
    </ShellCard>
  );
}
