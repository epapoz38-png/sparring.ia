import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col">
      <nav className="flex items-center px-6 py-4 border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🥊</span>
          <span className="font-bold text-lg tracking-tight text-[var(--color-text)]">
            Sparring AI
          </span>
        </Link>
      </nav>
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </div>
    </div>
  );
}
