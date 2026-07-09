import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";

export default function AdminPage() {
  return (
    <ShellCard title="관리자 백오피스">
      <p>광고 심사 · 포인트 정합성 · 현금 전환 승인 준비 중</p>
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/diagnostics"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Supabase 진단 →
        </Link>
        <Link
          href="/admin/reward-preflight"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-D reward preflight →
        </Link>
        <Link
          href="/admin/partner-settlement-preflight"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-G partner settlement preflight →
        </Link>
        <Link
          href="/admin/kyc-tax-terms-db-migration-review"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-M KYC / Tax / Terms DB migration review →
        </Link>
      </div>
    </ShellCard>
  );
}
