import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ConfidenceStars } from "@/components/confidence-stars";
import { addManualCard, deleteCard, deleteDeck } from "@/app/actions/decks";

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ courseId: string; deckId: string }>;
}) {
  const { courseId, deckId } = await params;
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { flashcards: { orderBy: { createdAt: "asc" } } },
  });
  if (!deck || deck.courseId !== courseId) notFound();

  const now = new Date();
  const dueCount = deck.flashcards.filter((c) => c.dueDate <= now).length;

  return (
    <div className="space-y-6">
      <Link
        href={`/courses/${courseId}`}
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to course
      </Link>

      <PageHeader
        title={deck.title}
        description={`${deck.flashcards.length} cards · ${dueCount} due now`}
        action={
          <div className="flex gap-2">
            <Link
              href={`/courses/${courseId}/decks/${deckId}/study`}
              className={buttonClass("primary", "md")}
            >
              <GraduationCap size={16} /> Study
            </Link>
            <form action={deleteDeck}>
              <input type="hidden" name="id" value={deck.id} />
              <input type="hidden" name="courseId" value={courseId} />
              <button className={buttonClass("danger", "md")}>
                <Trash2 size={15} />
              </button>
            </form>
          </div>
        }
      />

      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-medium">
          <Plus size={16} /> Add a card
        </h3>
        <form action={addManualCard} className="space-y-2">
          <input type="hidden" name="deckId" value={deck.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <input name="question" required placeholder="Question" className={inputClass} />
          <textarea name="answer" required rows={2} placeholder="Answer" className={inputClass} />
          <SubmitButton pendingText="Adding…" size="sm">Add card</SubmitButton>
        </form>
      </Card>

      <div className="space-y-2">
        {deck.flashcards.length === 0 ? (
          <p className="text-sm text-muted">No cards in this deck yet.</p>
        ) : (
          deck.flashcards.map((c, i) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="mr-2 text-muted">{i + 1}.</span>
                    {c.question}
                  </p>
                  <p className="mt-1 text-sm text-muted">{c.answer}</p>
                  {c.hint && (
                    <p className="mt-1 text-xs text-muted">Hint: {c.hint}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                    {c.difficulty && (
                      <span className="rounded-full bg-background px-2 py-0.5 text-muted">
                        {c.difficulty}
                      </span>
                    )}
                    {(JSON.parse(c.tags ?? "[]") as string[]).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-accent"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  {c.relatedConcepts && (
                    <p className="mt-1 text-xs text-muted">
                      Related:{" "}
                      {(JSON.parse(c.relatedConcepts) as string[]).join(", ")}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <ConfidenceStars cardId={c.id} initial={c.confidence} />
                    <p className="text-xs text-muted">
                      {c.state.toLowerCase()} · due{" "}
                      {c.dueDate.toLocaleDateString()} · EF{" "}
                      {c.easeFactor.toFixed(2)} · {c.repetitions} reps
                    </p>
                  </div>
                </div>
                <form action={deleteCard}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="deckId" value={deck.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <button className={buttonClass("ghost", "sm")} aria-label="Delete card">
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
