import { createServerClient } from "@/lib/supabase/client";
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
  summary: string;
};

async function runDbCheck(): Promise<DbCheckResult> {
  if (!isSupabaseUrlConfigured() || !isSupabaseAnonKeyConfigured()) {
    return {
      status: "not tested",
      table: "",
      summary: "환경변수 미설정",
    };
  }

  const supabase = createServerClient();
  if (!supabase) {
    return {
      status: "not tested",
      table: "",
      summary: "클라이언트 생성 실패",
    };
  }

  const { count, error } = await supabase
    .from("quizzes_public")
    .select("*", { count: "exact", head: true });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("permission") || msg.includes("policy") || error.code === "42501") {
      return {
        status: "connected",
        table: "quizzes_public",
        summary: "연결됨 (anon RLS 제한 — Stage 0 정상)",
      };
    }
    return {
      status: "query failed",
      table: "quizzes_public",
      summary: "조회 실패 (요약만 표시)",
    };
  }

  return {
    status: "ok",
    table: "quizzes_public",
    summary: `조회 성공 (count: ${count ?? 0})`,
  };
}

export default async function DiagnosticsPage() {
  const dbCheck = await runDbCheck();

  return (
    <ShellCard title="AdMe diagnostics">
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Supabase URL configured</dt>
          <dd className="font-mono font-medium">
            {isSupabaseUrlConfigured() ? "true" : "false"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Supabase anon key configured</dt>
          <dd className="font-mono font-medium">
            {isSupabaseAnonKeyConfigured() ? "true" : "false"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Runtime</dt>
          <dd className="font-mono font-medium">{getRuntimeLabel()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Deploy commit</dt>
          <dd className="font-mono font-medium">{getDeployCommit()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Stage marker</dt>
          <dd className="font-mono font-medium">{getAppStage()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">DB check status</dt>
          <dd className="font-mono font-medium">{dbCheck.status}</dd>
        </div>
        {dbCheck.table && (
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">조회 대상</dt>
            <dd className="font-mono font-medium">{dbCheck.table}</dd>
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
