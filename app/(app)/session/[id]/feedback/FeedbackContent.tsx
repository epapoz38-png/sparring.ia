"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Feedback } from "@/lib/types";

type FeedbackData = {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  key_moments: string[];
  advice: string[];
};

type Props = { sessionId: string };

const POLL_INTERVAL = 2000;
const TIMEOUT_MS = 90000;

export default function FeedbackContent({ sessionId }: Props) {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const startTime = Date.now();

    const poll = async () => {
      const { data, error: dbError } = await supabase
        .from("feedback")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (dbError && dbError.code !== "PGRST116") {
        setError("Erreur lors du chargement du feedback.");
        return;
      }

      if (data) {
        const fb = data as Feedback;
        try {
          const raw = typeof fb.content === "string" ? fb.content : JSON.stringify(fb.content);
          const parsed: FeedbackData = JSON.parse(raw);
          if (parsed.score !== undefined) {
            // Normalise legacy cave_ins field
            if (!parsed.key_moments && (parsed as unknown as { cave_ins?: string[] }).cave_ins) {
              parsed.key_moments = (parsed as unknown as { cave_ins: string[] }).cave_ins;
            }
            parsed.key_moments ??= [];
            setFeedbackData(parsed);
            return;
          }
        } catch {
          setFeedbackData({
            score: 0,
            summary: typeof fb.content === "string" ? fb.content : "",
            strengths: [],
            weaknesses: [],
            key_moments: [],
            advice: [],
          });
          return;
        }
      }

      const now = Date.now();
      setElapsed(now - startTime);
      if (now - startTime >= TIMEOUT_MS) {
        setError("La génération du feedback a pris trop de temps. Réessayez.");
        return;
      }
      setTimeout(poll, POLL_INTERVAL);
    };

    poll();
  }, [sessionId]);

  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="p-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
        <div className="flex justify-center gap-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Analyse de votre session en cours…
        </p>
        {elapsed > 10000 && (
          <p className="text-xs text-[var(--color-muted)] mt-2 opacity-60">
            Cela peut prendre jusqu&apos;à 30 secondes.
          </p>
        )}
      </div>
    );
  }

  const { score, summary, strengths, weaknesses, key_moments, advice } = feedbackData;

  const scoreConfig =
    score >= 8
      ? { color: "text-emerald-400", bar: "bg-emerald-500", label: "Excellent", labelCss: "bg-emerald-500/20 text-emerald-400" }
      : score >= 6
      ? { color: "text-yellow-400", bar: "bg-yellow-500", label: "Bien", labelCss: "bg-yellow-500/20 text-yellow-400" }
      : score >= 4
      ? { color: "text-orange-400", bar: "bg-orange-500", label: "À améliorer", labelCss: "bg-orange-500/20 text-orange-400" }
      : { color: "text-red-400", bar: "bg-red-500", label: "Insuffisant", labelCss: "bg-red-500/20 text-red-400" };

  return (
    <div className="flex flex-col gap-6">

      {/* Score */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-1">
            <span className={`text-6xl font-black leading-none ${scoreConfig.color}`}>{score}</span>
            <span className="text-xl text-[var(--color-muted)] font-medium">/10</span>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${scoreConfig.labelCss}`}>
            {scoreConfig.label}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className={`h-full rounded-full ${scoreConfig.bar}`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>

      {/* Résumé */}
      {summary && (
        <div className="px-5 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <SectionLabel label="Bilan" />
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Points forts */}
      {strengths.length > 0 && (
        <section>
          <SectionLabel label="Points forts" count={strengths.length} />
          <div className="flex flex-col gap-2">
            {strengths.map((item, i) => (
              <ItemCard key={i} icon="✅" text={item}
                css="bg-emerald-500/8 border-emerald-500/25 text-emerald-100" />
            ))}
          </div>
        </section>
      )}

      {/* Points à améliorer */}
      {weaknesses.length > 0 && (
        <section>
          <SectionLabel label="Points à améliorer" count={weaknesses.length} />
          <div className="flex flex-col gap-2">
            {weaknesses.map((item, i) => (
              <ItemCard key={i} icon="⚠️" text={item}
                css="bg-orange-500/8 border-orange-500/25 text-orange-100" />
            ))}
          </div>
        </section>
      )}

      {/* Moments clés */}
      {key_moments.length > 0 && (
        <section>
          <SectionLabel label="Moments clés" count={key_moments.length} />
          <div className="flex flex-col gap-2">
            {key_moments.map((item, i) => (
              <ItemCard key={i} icon="🔑" text={item}
                css="bg-yellow-500/8 border-yellow-500/25 text-yellow-100" />
            ))}
          </div>
        </section>
      )}

      {/* Conseils */}
      {advice.length > 0 && (
        <section>
          <SectionLabel label="Conseils concrets" count={advice.length} />
          <div className="flex flex-col gap-2">
            {advice.map((item, i) => (
              <ItemCard key={i} icon="🎯" text={item}
                css="bg-violet-500/8 border-violet-500/25 text-violet-100" />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)] font-medium">
          {count}
        </span>
      )}
    </div>
  );
}

function ItemCard({ icon, text, css }: { icon: string; text: string; css: string }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${css}`}>
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
