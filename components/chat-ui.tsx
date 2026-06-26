"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
import { Markdown } from "./markdown";
import { Button, inputClass } from "./ui";
import { cn } from "@/lib/ui";

type Source = { materialId: string; title: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

export function ChatUI({
  courseId,
  sessionId,
  initialMessages,
  aiEnabled,
  hasMaterials,
}: {
  courseId: string;
  sessionId: string;
  initialMessages: Message[];
  aiEnabled: boolean;
  hasMaterials: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setSending(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok || !res.body) {
        setError((await res.text()) || "Request failed.");
        setMessages((m) => m.slice(0, -1)); // drop empty assistant bubble
        return;
      }
      let sources: Source[] = [];
      try {
        const raw = res.headers.get("X-Sources");
        if (raw) sources = JSON.parse(atob(raw));
      } catch {
        /* ignore */
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc, sources };
          return copy;
        });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            Ask anything about this course. The assistant answers only from your
            uploaded materials, summaries, and transcripts.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-accent text-accent-fg"
                  : "border border-border bg-surface"
              )}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <span className="animate-pulse text-muted">Thinking…</span>
                )
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                  {m.sources.map((s, j) => (
                    <Link
                      key={s.materialId}
                      href={`/courses/${courseId}/materials/${s.materialId}`}
                      className="rounded-full bg-background px-2 py-0.5 text-xs text-muted hover:text-foreground"
                    >
                      {j + 1}. {s.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!hasMaterials && (
        <p className="mt-2 text-sm text-amber-600">
          This course has no readable materials yet — add some so the assistant
          has something to answer from.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={aiEnabled ? "Ask a question…" : "Set OPENROUTER_API_KEY to chat"}
          disabled={!aiEnabled || sending}
          className={cn(inputClass, "max-h-32 resize-none")}
        />
        <Button type="submit" disabled={!aiEnabled || sending || !input.trim()}>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
