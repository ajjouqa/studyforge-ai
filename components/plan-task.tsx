"use client";

import { useState, useTransition } from "react";
import { toggleTask } from "@/app/actions/planner";
import { cn } from "@/lib/ui";

const KIND_COLORS: Record<string, string> = {
  study: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  quiz: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  "spaced-repetition":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

export function PlanTask({
  id,
  title,
  kind,
  minutes,
  initialDone,
}: {
  id: string;
  title: string;
  kind: string;
  minutes: number;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [, start] = useTransition();

  function toggle() {
    const v = !done;
    setDone(v);
    start(() => toggleTask(id, v));
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 py-1.5 text-sm">
      <input type="checkbox" checked={done} onChange={toggle} />
      <span className={cn("min-w-0 flex-1 truncate", done && "text-muted line-through")}>
        {title}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs",
          KIND_COLORS[kind] ?? "bg-background text-muted"
        )}
      >
        {kind}
      </span>
      <span className="shrink-0 text-xs text-muted">{minutes}m</span>
    </label>
  );
}
