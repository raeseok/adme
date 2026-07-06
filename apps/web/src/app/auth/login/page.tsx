import { ShellCard } from "@/components/ShellCard";
import { getSessionSnapshot } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { snapshot } = await getSessionSnapshot();
  const params = await searchParams;
  const initialError =
    params.error === "callback_failed"
      ? "로그인 callback 처리에 실패했습니다. 다시 시도해 주세요."
      : params.error === "missing_code"
        ? "로그인 callback code가 없습니다."
        : null;

  return (
    <ShellCard title="AdMe 로그인">
      <LoginForm session={snapshot} initialError={initialError} />
    </ShellCard>
  );
}
