"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Button, inputClass } from "./ui";
import { cn } from "@/lib/ui";

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 0, label: "Sun" },
];

export function StudyPlanForm({
  courseId,
  aiEnabled,
}: {
  courseId: string;
  aiEnabled: boolean;
}) {
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [studyDays, setStudyDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleDay(n: number) {
    setStudyDays((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));
  }

  async function run() {
    if (!examDate) {
      setError("Pick an exam date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate, hoursPerDay, studyDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.planId) {
        setError(data.error ?? "Could not build the plan.");
        return;
      }
      router.push(`/courses/${courseId}/plan/${data.planId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Exam date</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Hours / day</span>
          <input
            type="number"
            min={0.5}
            max={12}
            step={0.5}
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className={`${inputClass} w-28`}
          />
        </label>
      </div>
      <div>
        <span className="mb-1 block text-sm text-muted">Study days</span>
        <div className="flex flex-wrap gap-1">
          {DAYS.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => toggleDay(d.n)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                studyDays.includes(d.n)
                  ? "bg-accent text-accent-fg"
                  : "border border-border text-muted hover:bg-background"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={run} disabled={loading || !aiEnabled}>
        <CalendarClock size={15} />
        {loading ? "Building plan…" : "Generate study plan"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!aiEnabled && (
        <p className="text-sm text-amber-600">Set OPENROUTER_API_KEY to enable the planner.</p>
      )}
    </div>
  );
}
