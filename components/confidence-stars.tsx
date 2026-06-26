"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { setCardConfidence } from "@/app/actions/decks";
import { cn } from "@/lib/ui";

export function ConfidenceStars({
  cardId,
  initial,
}: {
  cardId: string;
  initial: number | null;
}) {
  const [value, setValue] = useState(initial ?? 0);
  const [, startTransition] = useTransition();

  function set(n: number) {
    setValue(n);
    startTransition(() => setCardConfidence(cardId, n));
  }

  return (
    <div className="flex items-center gap-0.5" title="Your confidence">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => set(n)}
          aria-label={`Confidence ${n}`}
          className="p-0.5"
        >
          <Star
            size={14}
            className={cn(
              n <= value ? "fill-amber-400 text-amber-400" : "text-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}
