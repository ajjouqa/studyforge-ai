import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { Card, StatusPill, buttonClass } from "@/components/ui";
import { SummaryPanel } from "@/components/summary-panel";
import { GenerateCardsButton } from "@/components/generate-cards-button";
import { GenerateQuiz } from "@/components/generate-quiz";
import { deleteMaterial } from "@/app/actions/materials";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ courseId: string; materialId: string }>;
}) {
  const { courseId, materialId } = await params;
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      summaries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!material || material.courseId !== courseId) notFound();

  const latestSummary = material.summaries[0];
  const aiEnabled = aiConfigured();
  const hasText = Boolean(material.extractedText);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} /> Back to course
        </Link>
        <form action={deleteMaterial}>
          <input type="hidden" name="id" value={material.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <button className={buttonClass("ghost", "sm")}>
            <Trash2 size={15} /> Delete
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {material.title}
        </h1>
        <StatusPill status={material.status} />
        <span className="text-xs text-muted">
          {material.type.toLowerCase()}
          {material.wordCount ? ` · ${material.wordCount} words` : ""}
        </span>
      </div>

      {material.sourceUrl && (
        <a
          href={material.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm text-accent hover:underline"
        >
          {material.sourceUrl}
        </a>
      )}

      {material.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {material.error}
        </p>
      )}

      {hasText ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-2 font-medium">Material text</h3>
              <div className="max-h-112 overflow-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-foreground/90">
                {material.extractedText}
              </div>
            </Card>

            <Card className="p-4">
              <SummaryPanel
                materialId={material.id}
                initial={latestSummary?.content ?? null}
                aiEnabled={aiEnabled}
              />
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h3 className="font-medium">Generate flashcards</h3>
            </div>
            <p className="mt-1 text-sm text-muted">
              Create a new deck of AI flashcards from this material.
            </p>
            <GenerateCardsButton materialId={material.id} aiEnabled={aiEnabled} />
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Generate quiz</h3>
            <p className="mb-3 mt-1 text-sm text-muted">
              Test yourself on this material (multiple choice, true/false, fill in
              the blank, short answer).
            </p>
            <GenerateQuiz
              courseId={courseId}
              materialId={material.id}
              aiEnabled={aiEnabled}
            />
          </Card>
        </>
      ) : (
        <Card className="p-6 text-sm text-muted">
          No text was extracted from this material, so summaries and flashcards
          aren’t available. Try a different source or paste the text manually.
        </Card>
      )}
    </div>
  );
}
