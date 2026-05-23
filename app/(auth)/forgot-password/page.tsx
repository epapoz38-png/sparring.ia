"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setStatus("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://sparring-ia.vercel.app/api/auth/callback?next=/reset-password`,
      });
      if (error) {
        setErrorMsg(error.message);
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
          Email envoyé
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-8 leading-relaxed">
          Si un compte existe pour{" "}
          <span className="text-[var(--color-text)] font-medium">{email}</span>,
          vous recevrez un lien pour réinitialiser votre mot de passe.
        </p>
        <Link
          href="/login"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
          />
        </div>

        {status === "error" && (
          <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-2.5">
            {errorMsg ?? "Une erreur est survenue. Réessayez."}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {status === "sending" ? "Envoi…" : "Envoyer le lien"}
        </button>

        <Link
          href="/login"
          className="text-sm text-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Retour à la connexion
        </Link>
      </form>
    </div>
  );
}
