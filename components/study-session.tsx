"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { gradeCard } from "@/app/actions/reviews";
import { GRADES } from "@/lib/srs/sm2";
import { Button, Card, buttonClass } from "./ui";

export type StudyCard = {
  id: string;
  question: string;
  answer: string;
  hint: string | null;
};

const GRADE_BUTTONS = [
  { key: "again", label: "Again", grade: GRADES.AGAIN, cls: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300" },
  { key: "hard", label: "Hard", grade: GRADES.HARD, cls: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300" },
  { key: "good", label: "Good", grade: GRADES.GOOD, cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300" },
  { key: "easy", label: "Easy", grade: GRADES.EASY, cls: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/50 dark:text-blue-300" },
] as const;

export function StudySession({
  cards,
  backHref,
}: {
  cards: StudyCard[];
  backHref: string;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [pending, startTransition] = useTransition();

  const card = cards[index];
  const done = index >= cards.length;

  const grade = useCallback(
    (g: number) => {
      if (!card || pending) return;
      startTransition(async () => {
        await gradeCard(card.id, g);
        setReviewed((n) => n + 1);
        setRevealed(false);
        setIndex((i) => i + 1);
      });
    },
    [card, pending]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (!revealed && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && e.key >= "1" && e.key <= "4") {
        grade(GRADE_BUTTONS[Number(e.key) - 1].grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, done, grade]);

  if (cards.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <CheckCircle2 className="text-emerald-500" size={32} />
        <p className="font-medium">Nothing due right now</p>
        <p className="text-sm text-muted">Come back later for your next review.</p>
        <Link href={backHref} className={buttonClass("secondary", "sm")}>
          Back
        </Link>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <CheckCircle2 className="text-emerald-500" size={32} />
        <p className="font-medium">Session complete</p>
        <p className="text-sm text-muted">You reviewed {reviewed} cards.</p>
        <Link href={backHref} className={buttonClass("primary", "sm")}>
          Done
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <Link href={backHref} className="hover:text-foreground">
          Exit
        </Link>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(index / cards.length) * 100}%` }}
        />
      </div>

      <Card className="min-h-[16rem] p-6">
        <p className="text-lg font-medium">{card.question}</p>
        {revealed ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="whitespace-pre-wrap text-foreground/90">{card.answer}</p>
            {card.hint && (
              <p className="mt-2 text-sm text-muted">Hint: {card.hint}</p>
            )}
          </div>
        ) : (
          card.hint && (
            <p className="mt-4 text-sm text-muted">Hint: {card.hint}</p>
          )
        )}
      </Card>

      {!revealed ? (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          Show answer{" "}
          <span className="ml-1 text-xs opacity-70">(space)</span>
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {GRADE_BUTTONS.map((b, i) => (
            <button
              key={b.key}
              disabled={pending}
              onClick={() => grade(b.grade)}
              className={`flex flex-col items-center rounded-lg px-2 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${b.cls}`}
            >
              {b.label}
              <span className="text-xs opacity-70">{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1 text-xs text-muted">
        <RotateCcw size={12} /> Spaced repetition (SM-2): grading sets the next due
        date.
      </p>
    </div>
  );
}
