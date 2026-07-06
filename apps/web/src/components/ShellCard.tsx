import Link from "next/link";
import { getDeployCommit } from "@/lib/deploy-info";

export function ShellCard({
  title,
  children,
  showHomeLink = true,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  showHomeLink?: boolean;
  wide?: boolean;
}) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <div
        className={`w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 ${wide ? "max-w-2xl" : "max-w-lg"}`}
      >
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
        <div className="mt-4 space-y-3 text-base leading-relaxed text-zinc-700">
          {children}
        </div>
        <p className="mt-6 text-sm text-zinc-500">
          deploy commit: {getDeployCommit()}
        </p>
        {showHomeLink && (
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← 홈으로
          </Link>
        )}
      </div>
    </main>
  );
}

export function NavLinks() {
  const links = [
    { href: "/consumer", label: "소비자" },
    { href: "/advertiser", label: "광고주" },
    { href: "/partner", label: "파트너" },
    { href: "/admin", label: "관리자" },
    { href: "/admin/diagnostics", label: "진단" },
  ];

  return (
    <nav className="mt-6 grid gap-2 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800 transition hover:border-blue-300 hover:bg-blue-50"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
