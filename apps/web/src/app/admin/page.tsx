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
        <Link
          href="/admin/kyc-tax-terms-implementation-approval"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-N KYC / Tax / Terms implementation approval →
        </Link>
        <Link
          href="/admin/dev-kyc-tax-terms-schema-foundation"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-P dev KYC / Tax / Terms schema foundation →
        </Link>
        <Link
          href="/admin/cash-redemption-demo"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-Q cash redemption demo operations →
        </Link>
        <Link
          href="/admin/campaign-review"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 4-A advertiser campaign review demo →
        </Link>
        <Link
          href="/advertiser"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 4-A advertiser console →
        </Link>
        <Link
          href="/admin/partner-settlements"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 4-B partner settlement review demo →
        </Link>
        <Link
          href="/partner"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 4-B partner dashboard →
        </Link>
      </div>
    </ShellCard>
  );
}
