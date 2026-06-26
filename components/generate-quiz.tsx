"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks } from "lucide-react";
import { Button, inputClass } from "./ui";

export function GenerateQuiz({
  courseId,
  materialId,
  aiEnabled,
  label = "Generate quiz",
}: {
  courseId: string;
  materialId?: string;
  aiEnabled: boolean;
  label?: string;
}) {
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, materialId, count }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.quizId) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      router.push(`/courses/${courseId}/quizzes/${data.quizId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Questions</span>
          <input
            type="number"
            min={3}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={`${inputClass} w-24`}
          />
        </label>
        <Button onClick={run} disabled={loading || !aiEnabled}>
          <ListChecks size={15} />
          {loading ? "Generating…" : label}
        </Button>
      </div>
      {loading && (
        <p className="text-sm text-muted">Writing questions — this can take a bit…</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!aiEnabled && (
        <p className="text-sm text-amber-600">Set OPENROUTER_API_KEY to enable quizzes.</p>
      )}
    </div>
  );
}
