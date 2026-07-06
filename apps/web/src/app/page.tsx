import { NavLinks, ShellCard } from "@/components/ShellCard";
import { getDeployCommit } from "@/lib/deploy-info";

export default function HomePage() {
  return (
    <ShellCard title="AdMe" showHomeLink={false}>
      <p>지역 밀착형 검증 광고 플랫폼</p>
      <p className="font-medium text-zinc-900">
        광고가 아니라, 내가 요청한 소비 정보
      </p>
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
        Stage 0.5 Vercel Shell
      </p>
      <p className="text-sm text-zinc-600">
        deploy commit: {getDeployCommit()}
      </p>
      <NavLinks />
    </ShellCard>
  );
}
