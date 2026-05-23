import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getScenario } from "@/lib/scenarios";
import { decodeSession } from "@/lib/sessions";
import { Message, ScenarioMeta, Session } from "@/lib/types";
import ChatInterface from "./ChatInterface";

export default async function SessionPage(props: PageProps<"/session/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const s = session as Session;

  if (s.status === "completed") {
    redirect(`/session/${id}/feedback`);
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const { subject, persona } = decodeSession(s.situation);

  // Build ScenarioMeta: use a real scenario or synthesize one for custom subjects
  let scenarioMeta: ScenarioMeta;
  const fullScenario = getScenario(s.scenario_id);
  if (fullScenario) {
    const { systemPrompt: _, ...rest } = fullScenario;
    scenarioMeta = rest;
  } else {
    // Custom subject — build a synthetic meta from persona details
    scenarioMeta = {
      id: "custom",
      title: subject,
      description: "",
      icon: "✏️",
      difficulty: "hard",
      tags: [],
      aiPersona: persona?.firstName ?? "votre interlocuteur",
    };
  }

  return (
    <ChatInterface
      session={s}
      scenario={scenarioMeta}
      initialMessages={(messages as Message[]) ?? []}
    />
  );
}
