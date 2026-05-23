import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Session, Subscription } from "@/lib/types";
import { getScenario } from "@/lib/scenarios";
import { decodeSession } from "@/lib/sessions";
import {
  Plan,
  PLAN_LABELS,
  PLAN_BADGE_STYLES,
  FREE_SESSION_LIMIT,
} from "@/lib/plans";

export default async function DashboardPage(props: {
  searchParams: Promise<{ success?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const searchParams = await props.searchParams;
  const upgraded = searchParams.success === "true";

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentSessions = (sessions as Session[] | null) ?? [];

  // Subscription
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("plan, status, stripe_subscription_id")
    .eq("user_id", user!.id)
    .single();

  const sub = subscriptionData as Subscription | null;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const currentPlan: Plan = isActive ? (sub!.plan as Plan) : "starter";

  // Monthly session count (for starter plan display)
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();
  const { count: monthlyCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("created_at", startOfMonth);
  const sessionsThisMonth = monthlyCount ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Upgrade success banner */}
      {upgraded && (
        <div className="mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <p className="text-sm font-semibold text-emerald-400">
            Bienvenue sur le plan {PLAN_LABELS[currentPlan]} ! Profitez de toutes
            les fonctionnalités premium.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              Tableau de bord
            </h1>
            {currentPlan !== "starter" && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${PLAN_BADGE_STYLES[currentPlan]}`}
              >
                {PLAN_LABELS[currentPlan]}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Pratiquez, progressez, gagnez en confiance.
          </p>
        </div>
        <Link
          href="/session/new"
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          + Nouvelle session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-3xl font-bold text-[var(--color-text)]">
            {recentSessions.length}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Sessions totales
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-3xl font-bold text-[var(--color-text)]">
            {recentSessions.filter((s) => s.status === "completed").length}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Complétées
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
          <p className="text-3xl font-bold text-[var(--color-accent)]">
            {recentSessions.filter((s) => s.status === "active").length}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">En cours</p>
        </div>

        {/* Plan card */}
        {currentPlan === "starter" ? (
          <Link
            href="/pricing"
            className="p-5 rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-accent)]/40 hover:border-[var(--color-accent)] transition-colors group"
          >
            <p className="text-lg font-bold text-[var(--color-text)] tabular-nums">
              {Math.min(sessionsThisMonth, FREE_SESSION_LIMIT)}/{FREE_SESSION_LIMIT}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Sessions ce mois
            </p>
            <p className="text-xs text-[var(--color-accent)] mt-2 font-medium group-hover:underline">
              Upgrade →
            </p>
          </Link>
        ) : (
          <Link
            href="/api/stripe/portal"
            className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors"
          >
            <p className="text-lg font-bold text-[var(--color-text)]">∞</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Sessions illimitées
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-2 hover:text-[var(--color-text)] transition-colors">
              Gérer l&apos;abonnement →
            </p>
          </Link>
        )}
      </div>

      {/* Recent sessions */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
          Sessions récentes
        </h2>

        {recentSessions.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--color-border)]">
            <span className="text-5xl mb-4 block">🥊</span>
            <p className="text-[var(--color-muted)] mb-6">
              Aucune session pour l&apos;instant.
              <br />
              Lancez votre premier entraînement !
            </p>
            <Link
              href="/session/new"
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors inline-block"
            >
              Commencer
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSessions.map((session) => {
              const scenario = getScenario(session.scenario_id);
              const { subject, persona } = decodeSession(session.situation);
              const displayTitle = persona
                ? `${subject} · avec ${persona.firstName}`
                : scenario?.title ?? session.scenario_id;
              return (
                <Link
                  key={session.id}
                  href={
                    session.status === "completed"
                      ? `/session/${session.id}/feedback`
                      : `/session/${session.id}`
                  }
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {session.scenario_id === "custom"
                        ? "✏️"
                        : scenario?.icon ?? "💬"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                        {displayTitle}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        {new Date(session.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        session.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      }`}
                    >
                      {session.status === "completed" ? "Terminée" : "En cours"}
                    </span>
                    <span className="text-[var(--color-muted)] text-sm">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
