import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getScenario } from "@/lib/scenarios";
import { decodeSession } from "@/lib/sessions";
import { Message, Session } from "@/lib/types";
import FeedbackContent from "./FeedbackContent";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FeedbackPage(
  props: PageProps<"/session/[id]/feedback">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();
  const s = session as Session;
  if (s.status !== "completed") redirect(`/session/${id}`);

  const { data: messagesData } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const messages = (messagesData as Message[]) ?? [];
  const { subject, persona } = decodeSession(s.situation);
  const scenario = getScenario(s.scenario_id);

  const subjectLabel = persona
    ? `${subject} · avec ${persona.firstName}`
    : scenario?.title ?? subject;
  const iconDisplay = s.scenario_id === "custom" ? "✏️" : (scenario?.icon ?? "💬");
  const aiPersonaName = persona?.firstName ?? scenario?.aiPersona ?? "IA";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors mb-6"
      >
        ← Tableau de bord
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{iconDisplay}</span>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {subjectLabel}
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {formatDate(s.created_at)}
            </p>
          </div>
        </div>
        <Link
          href="/session/new"
          className="shrink-0 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Nouvelle session
        </Link>
      </div>

      {/* Session context */}
      {persona ? (
        <div className="mb-6 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
            Contexte de la session
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[var(--color-muted)] text-xs">Interlocuteur</span>
              <p className="text-[var(--color-text)] font-medium mt-0.5">
                {persona.firstName} · {persona.relationship}
              </p>
            </div>
            {persona.personalities.length > 0 && (
              <div>
                <span className="text-[var(--color-muted)] text-xs">Personnalité</span>
                <p className="text-[var(--color-text)] font-medium mt-0.5">
                  {persona.personalities.join(", ")}
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="text-[var(--color-muted)] text-xs">Votre objectif</span>
              <p className="text-[var(--color-text)] mt-0.5">{persona.userStake}</p>
            </div>
            {persona.context && (
              <div className="sm:col-span-2">
                <span className="text-[var(--color-muted)] text-xs">Contexte</span>
                <p className="text-[var(--color-text)] mt-0.5">{persona.context}</p>
              </div>
            )}
          </div>
        </div>
      ) : scenario?.description ? (
        <div className="mb-6 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
            Scénario
          </h2>
          <p className="text-sm text-[var(--color-text)]">{scenario.description}</p>
          {subject && (
            <p className="text-sm text-[var(--color-muted)] mt-2 italic">{subject}</p>
          )}
        </div>
      ) : null}

      {/* Feedback */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
          Analyse de performance
        </h2>
        <FeedbackContent sessionId={id} />
      </section>

      {/* Conversation replay */}
      {messages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
            Transcription de la conversation
          </h2>
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center text-xs shrink-0 mr-2 mt-1">
                    {iconDisplay}
                  </div>
                )}
                <div
                  className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed max-w-[80%] ${
                    message.role === "user"
                      ? "bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 text-[var(--color-text)]"
                      : "bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]"
                  }`}
                >
                  <span className="text-[10px] text-[var(--color-muted)] block mb-1 font-semibold uppercase tracking-wide">
                    {message.role === "user" ? "Vous" : aiPersonaName}
                  </span>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="flex-1 text-center px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors text-sm font-medium"
        >
          ← Tableau de bord
        </Link>
        <Link
          href="/session/new"
          className="flex-1 text-center bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Réessayer ce scénario
        </Link>
      </div>
    </div>
  );
}
