"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  scenarios,
  difficultyLabel,
  difficultyColor,
  PERSONALITY_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/lib/scenarios";
import { PersonaDetails } from "@/lib/types";
import { encodeSession } from "@/lib/sessions";
import { FREE_SESSION_LIMIT } from "@/lib/plans";

type SubjectChoice =
  | { type: "scenario"; id: string; label: string; icon: string }
  | { type: "custom"; text: string };

const EMPTY_PERSONA: PersonaDetails = {
  firstName: "",
  personalities: [],
  relationship: "",
  userStake: "",
  context: "",
};

export default function NewSessionPage() {
  const router = useRouter();

  // Step 1
  const [step, setStep] = useState<1 | 2>(1);
  const [subject, setSubject] = useState<SubjectChoice | null>(null);
  const [freeText, setFreeText] = useState("");

  // Step 2
  const [persona, setPersona] = useState<PersonaDetails>(EMPTY_PERSONA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 helpers ─────────────────────────────────────────
  function selectScenario(id: string, label: string, icon: string) {
    setSubject({ type: "scenario", id, label, icon });
    setStep(2);
  }

  function submitFreeText() {
    const text = freeText.trim();
    if (!text) return;
    setSubject({ type: "custom", text });
    setStep(2);
  }

  // ── Step 2 helpers ─────────────────────────────────────────
  function togglePersonality(p: string) {
    setPersona((prev) => ({
      ...prev,
      personalities: prev.personalities.includes(p)
        ? prev.personalities.filter((x) => x !== p)
        : [...prev.personalities, p],
    }));
  }

  function selectRelationship(r: string) {
    setPersona((prev) => ({ ...prev, relationship: r }));
  }

  const step2Valid =
    persona.firstName.trim() &&
    persona.relationship &&
    persona.userStake.trim();

  // ── Submit ─────────────────────────────────────────────────
  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !step2Valid) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée. Rechargez la page.");
      setLoading(false);
      return;
    }

    // Check free plan session limit
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single();

    const isActivePaidPlan =
      (sub?.status === "active" || sub?.status === "trialing") &&
      (sub?.plan === "pro" || sub?.plan === "expert");

    if (!isActivePaidPlan) {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();
      const { count } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth);

      if ((count ?? 0) >= FREE_SESSION_LIMIT) {
        router.push("/pricing?limit=true");
        return;
      }
    }

    const scenarioId =
      subject.type === "scenario" ? subject.id : "custom";
    const subjectText =
      subject.type === "scenario" ? subject.label : subject.text;

    // Encode subject + persona into the situation field (no extra column needed)
    const situation = encodeSession(subjectText, persona);

    const { data, error: insertError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        scenario_id: scenarioId,
        situation,
        status: "active",
      })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Impossible de créer la session. Réessayez.");
      setLoading(false);
      return;
    }

    router.push(`/session/${data.id}`);
  }

  // ── UI ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Progress header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { if (step === 2) { setStep(1); setPersona(EMPTY_PERSONA); } }}
          className="flex items-center gap-3 group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step >= 1 ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-muted)]"}`}>
            {step > 1 ? "✓" : "1"}
          </div>
          <span className={`text-sm font-medium transition-colors ${step === 1 ? "text-[var(--color-text)]" : "text-[var(--color-muted)] group-hover:text-[var(--color-text)]"}`}>
            Choisir le sujet
          </span>
        </button>
        <div className={`h-px flex-1 transition-colors ${step >= 2 ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step >= 2 ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-muted)]"}`}>
            2
          </div>
          <span className={`text-sm font-medium ${step === 2 ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"}`}>
            Décrire l&apos;autre personne
          </span>
        </div>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Quel sujet voulez-vous pratiquer ?
          </h1>
          <p className="text-sm text-[var(--color-muted)] mb-8">
            Choisissez un scénario prédéfini ou décrivez librement votre situation.
          </p>

          {/* Fixed scenarios */}
          <section className="mb-6">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
              Scénarios prédéfinis
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectScenario(s.id, s.title, s.icon)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/5 text-left transition-all group"
                >
                  <span className="text-2xl shrink-0 mt-0.5">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                        {s.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[s.difficulty]}`}>
                        {difficultyLabel[s.difficulty]}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Free subject */}
          <section>
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
              Ou décrivez votre propre situation
            </p>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">
                ✏️ Sujet libre
              </p>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Ex : négocier avec mon propriétaire pour baisser le loyer, convaincre mes parents d'accepter mon choix de carrière, parler à mon médecin d'un traitement qui ne me convient pas…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm leading-relaxed resize-none"
              />
              <button
                type="button"
                onClick={submitFreeText}
                disabled={!freeText.trim()}
                className="mt-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Continuer →
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && subject && (
        <form onSubmit={handleStart}>
          {/* Subject recap */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mb-8">
            {subject.type === "scenario" ? (
              <>
                <span className="text-xl">{subject.icon}</span>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Scénario choisi</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{subject.label}</p>
                </div>
              </>
            ) : (
              <>
                <span className="text-xl">✏️</span>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Sujet libre</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{subject.text}</p>
                </div>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Décrivez l&apos;autre personne
          </h1>
          <p className="text-sm text-[var(--color-muted)] mb-8">
            Plus vous êtes précis(e), plus l&apos;IA jouera le rôle de façon réaliste.
          </p>

          <div className="flex flex-col gap-7">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Prénom <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                required
                value={persona.firstName}
                onChange={(e) => setPersona((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Ex : Thomas, Marie, Sophie…"
                className="w-full sm:w-64 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
              />
            </div>

            {/* Personnalité */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                Personnalité
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                Sélectionnez tout ce qui correspond (plusieurs choix possibles).
              </p>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_OPTIONS.map((p) => {
                  const active = persona.personalities.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePersonality(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/60 hover:text-[var(--color-text)]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Relation */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                Relation <span className="text-[var(--color-danger)]">*</span>
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-3">
                Quel est votre lien avec cette personne ?
              </p>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_OPTIONS.map((r) => {
                  const active = persona.relationship === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => selectRelationship(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/60 hover:text-[var(--color-text)]"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enjeu */}
            <div>
              <label
                htmlFor="stake"
                className="block text-sm font-semibold text-[var(--color-text)] mb-1"
              >
                Ce que vous voulez obtenir <span className="text-[var(--color-danger)]">*</span>
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-2">
                Quel est l&apos;objectif de cette conversation pour vous ?
              </p>
              <textarea
                id="stake"
                required
                value={persona.userStake}
                onChange={(e) => setPersona((p) => ({ ...p, userStake: e.target.value }))}
                placeholder="Ex : obtenir une augmentation de 10 %, qu'il arrête de s'immiscer dans mes décisions, récupérer mon dépôt de garantie…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm leading-relaxed resize-none"
              />
            </div>

            {/* Contexte optionnel */}
            <div>
              <label
                htmlFor="context"
                className="block text-sm font-semibold text-[var(--color-text)] mb-1"
              >
                Contexte supplémentaire{" "}
                <span className="text-xs font-normal text-[var(--color-muted)]">(optionnel)</span>
              </label>
              <p className="text-xs text-[var(--color-muted)] mb-2">
                Détails utiles : historique de la relation, événements récents, tensions existantes…
              </p>
              <textarea
                id="context"
                value={persona.context}
                onChange={(e) => setPersona((p) => ({ ...p, context: e.target.value }))}
                placeholder="Ex : on a déjà eu cette discussion il y a 6 mois et ça s'était mal terminé. Il/elle est actuellement sous pression au travail..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm leading-relaxed resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl px-4 py-3 mt-6">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!step2Valid || loading}
            className="mt-8 w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            {loading
              ? "Démarrage…"
              : `Lancer le sparring avec ${persona.firstName || "…"} →`}
          </button>
        </form>
      )}
    </div>
  );
}
