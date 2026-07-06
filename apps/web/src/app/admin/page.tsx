import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";

export default function AdminPage() {
  return (
    <ShellCard title="관리자 백오피스">
      <p>광고 심사 · 포인트 정합성 · 현금 전환 승인 준비 중</p>
      <Link
        href="/admin/diagnostics"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Supabase 진단 →
      </Link>
    </ShellCard>
  );
}
