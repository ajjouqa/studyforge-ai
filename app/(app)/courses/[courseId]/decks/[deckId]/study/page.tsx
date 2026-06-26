import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { StudySession } from "@/components/study-session";

export const dynamic = "force-dynamic";

export default async function DeckStudyPage({
  params,
}: {
  params: Promise<{ courseId: string; deckId: string }>;
}) {
  const { courseId, deckId } = await params;
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck || deck.courseId !== courseId) notFound();

  const cards = await prisma.flashcard.findMany({
    where: { deckId, dueDate: { lte: new Date() } },
    orderBy: { dueDate: "asc" },
    select: { id: true, question: true, answer: true, hint: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Study — ${deck.title}`} />
      <StudySession
        cards={cards}
        backHref={`/courses/${courseId}/decks/${deckId}`}
      />
    </div>
  );
}
