import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getScenario } from "@/lib/scenarios";
import { decodeSession } from "@/lib/sessions";
import { Session } from "@/lib/types";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  const { sessionId, messages } = await request.json();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Non autorisé", { status: 401 });

  const { data: sessionData } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!sessionData) return new Response("Session introuvable", { status: 404 });

  const session = sessionData as Session;
  const { subject, persona } = decodeSession(session.situation);

  // Build context description for the feedback prompt
  let contextDescription: string;
  let aiPersonaName: string;

  if (persona) {
    const personalityDesc =
      persona.personalities.length > 0
        ? persona.personalities.join(", ")
        : "ordinaire";
    contextDescription = `
- Sujet : ${subject}
- Autre personne : ${persona.firstName} (${persona.relationship})
- Personnalité : ${personalityDesc}
- Ce que l'utilisateur voulait obtenir : ${persona.userStake}${persona.context ? `\n- Contexte : ${persona.context}` : ""}`;
    aiPersonaName = persona.firstName;
  } else {
    const scenario = getScenario(session.scenario_id);
    contextDescription = `
- Scénario : ${scenario?.title ?? session.scenario_id}
- Situation : ${subject}`;
    aiPersonaName = scenario?.aiPersona ?? "l'IA";
  }

  const conversationText = messages
    .map(
      (m: { role: string; content: string }) =>
        `${m.role === "user" ? "UTILISATEUR" : aiPersonaName.toUpperCase()}: ${m.content}`
    )
    .join("\n\n");

  const feedbackPrompt = `Tu es un coach en communication. Analyse UNIQUEMENT les répliques de l'UTILISATEUR dans cette conversation.

CONTEXTE :${contextDescription}

TRANSCRIPTION :
${conversationText}

Réponds UNIQUEMENT avec ce JSON valide. Règles strictes :
- Aucun markdown (pas de **, *, #, listes, backticks)
- Chaque string = 1 phrase courte et directe, max 20 mots
- Pas de phrases génériques, sois précis et concret

Format exact (ne change rien d'autre) :
{
  "score": <entier 1-10>,
  "summary": "<1 phrase de bilan global>",
  "strengths": ["<point fort 1>", "<point fort 2>"],
  "weaknesses": ["<point faible 1>", "<point faible 2>"],
  "key_moments": ["<moment précis où tu as perdu/gagné du terrain>"],
  "advice": ["<conseil 1 actionnable>", "<conseil 2 actionnable>"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: feedbackPrompt }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown fences Claude sometimes adds despite instructions
    const cleaned = raw
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/```\s*$/m, "")
      .trim();

    // Validate it's real JSON before storing
    JSON.parse(cleaned);

    await supabase.from("feedback").insert({
      session_id: sessionId,
      content: cleaned,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Feedback generation error:", err);
    return new Response(
      err instanceof Error ? err.message : "Erreur lors de la génération du feedback",
      { status: 500 }
    );
  }
}
