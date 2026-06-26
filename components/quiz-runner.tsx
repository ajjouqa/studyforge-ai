"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button, Card, inputClass } from "./ui";
import { cn } from "@/lib/ui";

export type RunnerQuestion = {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  difficulty: string;
};

type Result = {
  questionId: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
  source: string | null;
};

export function QuizRunner({
  quizId,
  questions,
}: {
  quizId: string;
  questions: RunnerQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Result[] | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const resultFor = (id: string) => results?.find((r) => r.questionId === id);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Grading failed.");
        return;
      }
      setResults(data.results);
      setScore({ correct: data.correct, total: data.total, score: data.score });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    setAnswers({});
    setResults(null);
    setScore(null);
  }

  const graded = results !== null;

  return (
    <div className="space-y-4">
      {score && (
        <Card
          className={cn(
            "p-4 text-center",
            score.score >= 70 ? "border-emerald-300" : "border-amber-300"
          )}
        >
          <p className="text-2xl font-semibold">{score.score}%</p>
          <p className="text-sm text-muted">
            {score.correct} / {score.total} correct
          </p>
        </Card>
      )}

      {questions.map((q, i) => {
        const r = resultFor(q.id);
        return (
          <Card key={q.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-medium">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {q.question}
              </p>
              <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                {q.difficulty}
              </span>
            </div>

            {/* Answer input by type */}
            {q.type === "mcq" && q.options && (
              <div className="space-y-1.5">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      disabled={graded}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "truefalse" && (
              <div className="flex gap-4">
                {["True", "False"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      disabled={graded}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "fillblank" && (
              <input
                className={inputClass}
                placeholder="Your answer"
                value={answers[q.id] ?? ""}
                disabled={graded}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            )}
            {q.type === "short" && (
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Your answer"
                value={answers[q.id] ?? ""}
                disabled={graded}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            )}

            {/* Result */}
            {r && (
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                <p
                  className={cn(
                    "flex items-center gap-1.5 font-medium",
                    r.correct ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {r.correct ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  {r.correct ? "Correct" : "Incorrect"}
                </p>
                {!r.correct && (
                  <p>
                    <span className="text-muted">Answer:</span> {r.correctAnswer}
                  </p>
                )}
                {r.explanation && (
                  <p className="text-muted">{r.explanation}</p>
                )}
                {r.source && (
                  <p className="text-xs text-muted">Source: {r.source}</p>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!graded ? (
        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Grading…" : "Submit answers"}
        </Button>
      ) : (
        <Button variant="secondary" onClick={retake} className="w-full">
          Retake
        </Button>
      )}
    </div>
  );
}
