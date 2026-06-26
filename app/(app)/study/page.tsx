import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { StudySession } from "@/components/study-session";

export const dynamic = "force-dynamic";

export default async function GlobalStudyPage() {
  const cards = await prisma.flashcard.findMany({
    where: { dueDate: { lte: new Date() } },
    orderBy: { dueDate: "asc" },
    take: 100,
    select: { id: true, question: true, answer: true, hint: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Due today"
        description="Review all cards due across your courses."
      />
      <StudySession cards={cards} backHref="/courses" />
    </div>
  );
}
