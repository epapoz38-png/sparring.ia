import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plan, PLAN_LABELS, PLAN_FEATURES } from "@/lib/plans";
import { Subscription } from "@/lib/types";

export default async function SuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Webhook may have already fired — try to read the plan
  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const sub = subscriptionData as Subscription | null;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const plan: Plan = isActive ? (sub!.plan as Plan) : "pro"; // default to pro label if webhook not yet fired

  const planLabel = PLAN_LABELS[plan];
  const features = PLAN_FEATURES[isActive ? plan : "pro"];

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      {/* Checkmark */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-8">
        <span className="text-4xl">✓</span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-[var(--color-text)] mb-3">
        Bienvenue sur le plan{" "}
        <span className="text-[var(--color-accent)]">{planLabel}</span>&nbsp;!
      </h1>
      <p className="text-[var(--color-muted)] mb-10 leading-relaxed">
        Votre paiement a été confirmé. Votre abonnement est maintenant actif —
        profitez de toutes les fonctionnalités premium.
      </p>

      {/* Feature recap */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-10 text-left">
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
          Ce qui est inclus dans votre plan
        </p>
        <ul className="flex flex-col gap-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
              <span className="text-[var(--color-text)]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/session/new"
          className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
        >
          Lancer une session →
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 px-6 py-3.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] font-medium text-sm transition-colors"
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
