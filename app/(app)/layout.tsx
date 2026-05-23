import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import { Plan, PLAN_BADGE_STYLES, PLAN_LABELS } from "@/lib/plans";
import { Subscription } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // Auth is guaranteed by proxy.ts — no redirect needed here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const sub = subscriptionData as Subscription | null;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const currentPlan: Plan = isActive ? (sub!.plan as Plan) : "starter";

  return (
    <div className="min-h-full flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🥊</span>
          <span className="font-bold text-base tracking-tight text-[var(--color-text)]">
            Sparring AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {currentPlan !== "starter" ? (
            <Link
              href="/pricing"
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PLAN_BADGE_STYLES[currentPlan]}`}
            >
              {PLAN_LABELS[currentPlan]}
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/20 transition-colors"
            >
              Upgrade ✦
            </Link>
          )}
          <span className="text-xs text-[var(--color-muted)] hidden sm:block">
            {user?.email}
          </span>
          <LogoutButton />
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
