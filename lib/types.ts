export type PersonaDetails = {
  firstName: string
  personalities: string[]
  relationship: string
  userStake: string
  context: string
}

export type Scenario = {
  id: string
  title: string
  description: string
  icon: string
  difficulty: 'medium' | 'hard' | 'very-hard'
  tags: string[]
  aiPersona: string
  systemPrompt: (situation: string) => string
}

// Subset safe to pass to Client Components (no functions)
export type ScenarioMeta = Omit<Scenario, 'systemPrompt'>

export type Session = {
  id: string
  user_id: string
  scenario_id: string
  situation: string  // plain text (old) OR JSON from encodeSession() (new)
  status: 'active' | 'completed'
  created_at: string
}

export type Message = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type Feedback = {
  id: string
  session_id: string
  content: string
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  plan: 'starter' | 'pro' | 'expert'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  current_period_end: string | null
  created_at: string
  updated_at: string
}
