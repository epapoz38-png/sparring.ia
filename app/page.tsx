import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥊</span>
          <span className="font-bold text-lg tracking-tight text-[var(--color-text)]">
            Sparring AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors px-4 py-2"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          IA entraîneur conversationnel
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--color-text)] max-w-3xl leading-tight mb-6">
          Entraînez-vous aux{" "}
          <span className="text-[var(--color-accent)]">conversations</span>{" "}
          difficiles
        </h1>

        <p className="text-lg text-[var(--color-muted)] max-w-xl leading-relaxed mb-10">
          Négociation salariale, rupture, conflit au travail, limites familiales.
          Sparring AI joue l&apos;autre personne de façon réaliste — pour que vous
          soyez prêt(e) quand ça compte vraiment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/signup"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            Lancer une session gratuite
          </Link>
          <Link
            href="#scenarios"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] px-8 py-3.5 text-base transition-colors"
          >
            Voir les scénarios →
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[var(--color-text)] mb-12">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choisissez un scénario",
                desc: "Sélectionnez le type de conversation difficile que vous voulez pratiquer.",
              },
              {
                step: "02",
                title: "Décrivez votre situation",
                desc: "Donnez le contexte réel : qui est l'autre personne, quel est l'enjeu.",
              },
              {
                step: "03",
                title: "Sparring & feedback",
                desc: "L'IA joue l'autre personne. Après la session, recevez un feedback détaillé.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col gap-3 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <span className="text-xs font-mono text-[var(--color-accent)] font-bold">
                  {item.step}
                </span>
                <h3 className="font-semibold text-[var(--color-text)]">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios preview */}
      <section
        id="scenarios"
        className="px-6 py-20 border-t border-[var(--color-border)]"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[var(--color-text)] mb-4">
            Scénarios disponibles
          </h2>
          <p className="text-center text-[var(--color-muted)] mb-12">
            Chaque scénario est calibré pour être réaliste et challengeant.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: "💼", title: "Négociation salariale", diff: "Difficile" },
              { icon: "💔", title: "Rupture difficile", diff: "Très difficile" },
              { icon: "⚡", title: "Conflit avec un collègue", diff: "Difficile" },
              { icon: "🏠", title: "Limites en famille", diff: "Très difficile" },
              { icon: "🛒", title: "Client mécontent", diff: "Intermédiaire" },
              { icon: "🤝", title: "Confronter un ami", diff: "Intermédiaire" },
            ].map((s) => (
              <div
                key={s.title}
                className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {s.title}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">{s.diff}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/signup"
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors inline-block"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[var(--color-border)] text-center">
        <p className="text-xs text-[var(--color-muted)]">
          © 2026 Sparring AI. Entraînez-vous, progressez, gagnez en confiance.
        </p>
      </footer>
    </div>
  );
}
