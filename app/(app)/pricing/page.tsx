import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plan,
  PLAN_FEATURES,
  PLAN_LABELS,
  PLAN_PRICES,
  FREE_SESSION_LIMIT,
} from "@/lib/plans";
import { Subscription } from "@/lib/types";

export default async function PricingPage(props: {
  searchParams: Promise<{ limit?: string; canceled?: string; success?: string; error?: string; details?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const limitReached = searchParams.limit === "true";
  const canceled = searchParams.canceled === "true";
  const stripeError = searchParams.error === "stripe" || searchParams.error === "config";
  const stripeErrorDetails = searchParams.details ?? null;

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("plan, status, stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  const sub = subscriptionData as Subscription | null;
  const isActive =
    sub?.status === "active" || sub?.status === "trialing";
  const currentPlan: Plan = isActive ? (sub!.plan as Plan) : "starter";
  const hasStripeSubscription = !!sub?.stripe_subscription_id;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors mb-8"
      >
        ← Tableau de bord
      </Link>

      {/* Limit reached banner */}
      {limitReached && (
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <span className="text-xl shrink-0">⚡</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">
              Limite mensuelle atteinte
            </p>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              Vous avez utilisé vos {FREE_SESSION_LIMIT} sessions gratuites ce
              mois-ci. Passez à Pro pour pratiquer sans limites.
            </p>
          </div>
        </div>
      )}

      {/* Stripe error banner */}
      {stripeError && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-400">
              Erreur Stripe
            </p>
            {stripeErrorDetails ? (
              <p className="text-xs text-[var(--color-muted)] mt-1 font-mono break-all">
                {stripeErrorDetails}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)] mt-0.5">
                La session de paiement n&apos;a pas pu être créée. Vérifiez les clés API et les Price IDs Stripe.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {canceled && (
        <div className="mb-8 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted)]">
            Paiement annulé. Vous n&apos;avez pas été débité.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-3">
          Choisissez votre plan
        </h1>
        <p className="text-[var(--color-muted)] text-base max-w-xl mx-auto">
          Des tarifs simples et transparents pour progresser à votre rythme.
          Annulez à tout moment.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Starter */}
        <PlanCard
          plan="starter"
          currentPlan={currentPlan}
          hasStripeSubscription={hasStripeSubscription}
        />

        {/* Pro — featured */}
        <PlanCard
          plan="pro"
          currentPlan={currentPlan}
          hasStripeSubscription={hasStripeSubscription}
          featured
        />

        {/* Expert */}
        <PlanCard
          plan="expert"
          currentPlan={currentPlan}
          hasStripeSubscription={hasStripeSubscription}
        />
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-[var(--color-muted)] mt-10">
        Paiement sécurisé par Stripe · Annulation en 1 clic · Aucune surprise
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlan,
  hasStripeSubscription,
  featured = false,
}: {
  plan: Plan;
  currentPlan: Plan;
  hasStripeSubscription: boolean;
  featured?: boolean;
}) {
  const isCurrentPlan = plan === currentPlan;
  const features = PLAN_FEATURES[plan];
  const price = plan === "starter" ? 0 : PLAN_PRICES[plan as "pro" | "expert"];

  const cardClass = featured
    ? "relative p-6 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 flex flex-col gap-5"
    : "relative p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-5";

  return (
    <div className={cardClass}>
      {/* Most popular badge */}
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[var(--color-accent)] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
            ⭐ Le plus populaire
          </span>
        </div>
      )}

      {/* Plan name + current badge */}
      <div className="flex items-center gap-2 mt-1">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {PLAN_LABELS[plan]}
        </h2>
        {isCurrentPlan && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
            Plan actuel
          </span>
        )}
      </div>

      {/* Price */}
      <div>
        {price === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-[var(--color-text)]">
              Gratuit
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-[var(--color-text)]">
              ${price}
            </span>
            <span className="text-sm text-[var(--color-muted)]">/mois</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)]" />

      {/* Features */}
      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
            <span className="text-[var(--color-text)]">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <PlanCTA
        plan={plan}
        currentPlan={currentPlan}
        hasStripeSubscription={hasStripeSubscription}
        featured={featured}
      />
    </div>
  );
}

function PlanCTA({
  plan,
  currentPlan,
  hasStripeSubscription,
  featured,
}: {
  plan: Plan;
  currentPlan: Plan;
  hasStripeSubscription: boolean;
  featured: boolean;
}) {
  const isCurrentPlan = plan === currentPlan;

  // Starter plan
  if (plan === "starter") {
    if (isCurrentPlan) {
      return (
        <Link
          href="/session/new"
          className="block text-center px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors"
        >
          Commencer gratuitement
        </Link>
      );
    }
    // Downgrade (currently on paid plan)
    if (hasStripeSubscription) {
      return (
        <Link
          href="/api/stripe/portal"
          className="block text-center px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Rétrograder au Starter
        </Link>
      );
    }
    return (
      <Link
        href="/session/new"
        className="block text-center px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors"
      >
        Commencer gratuitement
      </Link>
    );
  }

  // Paid plans
  if (isCurrentPlan) {
    return (
      <Link
        href="/api/stripe/portal"
        className="block text-center px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        Gérer l&apos;abonnement →
      </Link>
    );
  }

  if (hasStripeSubscription) {
    // Upgrade/downgrade via portal
    return (
      <Link
        href="/api/stripe/portal"
        className={`block text-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          featured
            ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
            : "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]/60"
        }`}
      >
        Changer de plan →
      </Link>
    );
  }

  // New subscription
  return (
    <Link
      href={`/api/stripe/checkout?plan=${plan}`}
      className={`block text-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        featured
          ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
          : "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]/60 hover:text-[var(--color-accent)]"
      }`}
    >
      Choisir {PLAN_LABELS[plan]} →
    </Link>
  );
}
