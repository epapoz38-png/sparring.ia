"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Message, ScenarioMeta, Session } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Props = {
  session: Session;
  scenario: ScenarioMeta;
  initialMessages: Message[];
};

export default function ChatInterface({
  session,
  scenario,
  initialMessages,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      session_id: session.id,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Erreur de réponse");
      }

      const assistantId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantId,
        session_id: session.id,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          session_id: session.id,
          role: "assistant",
          content: "Une erreur est survenue. Réessayez.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function endSession() {
    if (endingSession) return;
    setEndingSession(true);

    const supabase = createClient();
    await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", session.id);

    // Fire-and-forget: feedback page will poll until result is ready
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    router.push(`/session/${session.id}/feedback`);
  }

  const canEnd = messages.length >= 2 && !streaming;

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Session header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">{scenario.icon}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {scenario.title}
            </p>
            <p className="text-xs text-[var(--color-muted)] truncate max-w-xs">
              Avec {scenario.aiPersona}
            </p>
          </div>
        </div>
        <button
          onClick={endSession}
          disabled={!canEnd || endingSession}
          className="text-xs px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {endingSession ? "Analyse en cours…" : "Terminer & voir le feedback"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Intro message */}
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
              <span className="text-3xl block mb-3">{scenario.icon}</span>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-2">
                La session commence
              </p>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-1">
                Vous parlez avec{" "}
                <span className="font-medium text-[var(--color-text)]">
                  {scenario.aiPersona}
                </span>
                .
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                Lancez la conversation comme vous le feriez dans la vraie vie.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex max-w-2xl mx-auto ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center text-sm shrink-0 mr-3 mt-1">
                {scenario.icon}
              </div>
            )}
            <div
              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
                message.role === "user"
                  ? "bg-[var(--color-accent)] text-white rounded-br-sm"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-sm"
              }`}
            >
              {message.content || (
                <span className="flex gap-1 items-center py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <form
          onSubmit={sendMessage}
          className="max-w-2xl mx-auto flex items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Votre réponse… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
            rows={1}
            disabled={streaming}
            className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-sm leading-relaxed resize-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="shrink-0 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl font-semibold transition-colors flex items-center justify-center"
            aria-label="Envoyer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-center text-[var(--color-muted)] mt-2">
          {messages.length} message{messages.length !== 1 ? "s" : ""} •{" "}
          {canEnd
            ? "Vous pouvez terminer la session quand vous le souhaitez"
            : "Envoyez au moins 1 message pour terminer"}
        </p>
      </div>
    </div>
  );
}
