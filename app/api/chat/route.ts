import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getScenario, buildPersonaSystemPrompt } from "@/lib/scenarios";
import { decodeSession } from "@/lib/sessions";
import { Session } from "@/lib/types";

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

  // Build system prompt: persona-based (new) or scenario-based (legacy)
  let systemPrompt: string;
  if (persona) {
    systemPrompt = buildPersonaSystemPrompt(subject, persona);
  } else {
    const scenario = getScenario(session.scenario_id);
    if (!scenario) return new Response("Scénario introuvable", { status: 404 });
    systemPrompt = scenario.systemPrompt(subject);
  }

  // Persist user message
  const userMessage = messages[messages.length - 1];
  await supabase.from("messages").insert({
    session_id: sessionId,
    role: "user",
    content: userMessage.content,
  });

  const anthropicMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  let fullContent = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 512,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullContent += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        controller.close();

        await supabase.from("messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: fullContent,
        });
      } catch (err) {
        console.error("Chat stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
