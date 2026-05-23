"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }

    setStatus("done");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (status === "done") {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
          Mot de passe mis à jour
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Redirection vers le tableau de bord…
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-2.5">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="mt-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {status === "saving" ? "Enregistrement…" : "Enregistrer le mot de passe"}
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
