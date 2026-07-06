import { createServerClient } from "@/lib/supabase/server";
import {
  getAppStage,
  getDeployCommit,
  getRuntimeLabel,
  isSupabaseAnonKeyConfigured,
  isSupabaseUrlConfigured,
} from "@/lib/deploy-info";
import { ShellCard } from "@/components/ShellCard";

export const dynamic = "force-dynamic";

type DbCheckResult = {
  status: string;
  table: string;
  rowCheck: string;
  summary: string;
};

async function countTable(
  supabase: NonNullable<ReturnType<typeof createServerClient>>,
  table: string,
) {
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

  const supabase = createServerClient();
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
          <dd className="font-mono font-medium">{getDeployCommit()}</dd>
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
    </ShellCard>
  );
}
