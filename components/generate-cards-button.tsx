"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button, inputClass } from "./ui";

// Calls the deck-generation route handler (not a server action) to avoid the
// long-running-server-action worker crash, and navigates to the new deck.
export function GenerateCardsButton({
  materialId,
  aiEnabled,
}: {
  materialId: string;
  aiEnabled: boolean;
}) {
  const [count, setCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/decks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, count }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      router.push(`/courses/${data.courseId}/decks/${data.deckId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Number of cards</span>
          <input
            type="number"
            min={3}
            max={40}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={`${inputClass} w-28`}
          />
        </label>
        <Button onClick={run} disabled={loading || !aiEnabled}>
          <Sparkles size={15} />
          {loading ? "Generating…" : "Generate flashcards"}
        </Button>
      </div>
      {loading && (
        <p className="text-sm text-muted">
          Reading the material and writing cards — this can take 10–30s…
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!aiEnabled && (
        <p className="text-sm text-amber-600">
          Set OPENROUTER_API_KEY to enable flashcard generation.
        </p>
      )}
    </div>
  );
}
