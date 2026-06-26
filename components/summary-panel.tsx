"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "./ui";
import { Markdown } from "./markdown";
import { cn } from "@/lib/ui";

type Length = "brief" | "standard" | "detailed";

const LENGTHS: { id: Length; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "standard", label: "Standard" },
  { id: "detailed", label: "Detailed" },
];

export function SummaryPanel({
  materialId,
  initial,
  aiEnabled,
}: {
  materialId: string;
  initial: string | null;
  aiEnabled: boolean;
}) {
  const [content, setContent] = useState(initial ?? "");
  const [length, setLength] = useState<Length>("brief");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setStreaming(true);
    setError(null);
    setContent("");
    try {
      const res = await fetch("/api/summaries/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, length }),
      });
      if (!res.ok || !res.body) {
        setError(await res.text());
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setContent(acc);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Streaming failed");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">AI summary</h3>
        <Button
          variant={content ? "secondary" : "primary"}
          size="sm"
          onClick={run}
          disabled={streaming || !aiEnabled}
          title={aiEnabled ? undefined : "Set OPENROUTER_API_KEY to enable AI"}
        >
          {content ? <RefreshCw size={15} /> : <Sparkles size={15} />}
          {streaming ? "Summarizing…" : content ? "Regenerate" : "Summarize"}
        </Button>
      </div>

      {/* Length selector */}
      <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
        {LENGTHS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLength(l.id)}
            disabled={streaming}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors disabled:opacity-50",
              length === l.id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        {length === "brief"
          ? "A short résumé — overview + a few key points."
          : length === "standard"
            ? "Overview + key concepts."
            : "Full study notes with details and a checklist."}
      </p>

      {!aiEnabled && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          Add <code>OPENROUTER_API_KEY</code> to <code>.env.local</code> to enable
          AI summaries.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {error}
        </p>
      )}

      {content ? (
        <Markdown>{content}</Markdown>
      ) : (
        !streaming && (
          <p className="text-sm text-muted">
            No summary yet. Pick a length and click “Summarize”.
          </p>
        )
      )}
      {streaming && !content && (
        <p className="animate-pulse text-sm text-muted">Thinking…</p>
      )}
    </div>
  );
}
