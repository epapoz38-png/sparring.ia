"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="w-full max-w-sm text-center">
      <div className="text-5xl mb-6">✉️</div>

      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
        Vérifiez votre boîte mail
      </h1>

      <p className="text-sm text-[var(--color-muted)] mb-8 leading-relaxed">
        Nous vous avons envoyé un lien de confirmation
        {email && (
          <>
            {" "}à{" "}
            <span className="text-[var(--color-text)] font-medium">{email}</span>
          </>
        )}
        . Cliquez dessus pour activer votre compte.
      </p>

      {status === "sent" && (
        <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 mb-4">
          Email renvoyé avec succès.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg px-4 py-2.5 mb-4">
          Impossible de renvoyer l&apos;email. Réessayez.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleResend}
          disabled={status === "sending" || status === "sent"}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {status === "sending" ? "Envoi…" : "Renvoyer l'email"}
        </button>

        <Link
          href="/login"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
