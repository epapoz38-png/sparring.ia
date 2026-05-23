"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-muted)]"
    >
      Déconnexion
    </button>
  );
}
