export type Plan = 'starter' | 'pro' | 'expert';

export const FREE_SESSION_LIMIT = 4;

export const PLAN_LABELS: Record<Plan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  expert: 'Expert',
};

export const PLAN_BADGE_STYLES: Record<Plan, string> = {
  starter: 'bg-[var(--color-border)] text-[var(--color-muted)]',
  pro: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  expert: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

type PaidPlan = 'pro' | 'expert';

export const PLAN_PRICES: Record<PaidPlan, number> = {
  pro: 7.99,
  expert: 14.99,
};

export const PLAN_FEATURES: Record<Plan, string[]> = {
  starter: [
    '4 sessions par mois',
    'Scénarios de base',
    'Feedback standard',
  ],
  pro: [
    'Sessions illimitées',
    'Feedback détaillé avec score',
    'Tous les scénarios',
    'Badge Pro sur le tableau de bord',
  ],
  expert: [
    'Tout le plan Pro',
    'Mode vocal (bientôt)',
    'Rapport PDF téléchargeable (bientôt)',
    'Badge Expert sur le tableau de bord',
  ],
};

export function getPriceId(plan: PaidPlan): string {
  if (plan === 'pro') return process.env.STRIPE_PRO_PRICE_ID!;
  return process.env.STRIPE_EXPERT_PRICE_ID!;
}

export function planFromPriceId(priceId: string): Plan {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_EXPERT_PRICE_ID) return 'expert';
  return 'starter';
}
