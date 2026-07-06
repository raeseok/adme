import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";

export default function ConsumerPage() {
  return (
    <ShellCard title="소비자 화면">
      <p>소비 의향 프로필을 입력하면 맞춤 광고 매칭에 활용됩니다.</p>
      <p>주거지역 · 주활동지역(최대 2개) · 관심분야 · 소비 규모</p>
      <Link
        href="/consumer/profile"
        className="mt-2 inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-100"
      >
        소비 의향 프로필 설정
      </Link>
      <Link
        href="/auth/login"
        className="ml-2 inline-block text-sm font-medium text-violet-700 hover:text-violet-900"
      >
        로그인 →
      </Link>
    </ShellCard>
  );
}
