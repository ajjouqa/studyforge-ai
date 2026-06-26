import { prisma } from "@/lib/db";
import { generateFlashcards } from "@/lib/ai/flashcards";
import { aiConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

// Flashcard generation as a route handler (like the summary stream). Route
// handlers run in the main server process and avoid the dev server-action +
// revalidatePath path that crashes Next 16's static-path worker on dynamic routes.
export async function POST(req: Request) {
  if (!aiConfigured()) {
    return Response.json(
      { error: "AI is not configured (set OPENROUTER_API_KEY)." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    materialId?: string;
    count?: number;
  } | null;
  const materialId = body?.materialId;
  const count = Math.min(40, Math.max(3, Number(body?.count) || 12));
  if (!materialId) {
    return Response.json({ error: "materialId required" }, { status: 400 });
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material?.extractedText) {
    return Response.json(
      { error: "This material has no extracted text yet." },
      { status: 400 }
    );
  }

  try {
    const cards = await generateFlashcards({
      title: material.title,
      text: material.extractedText,
      count,
    });
    if (!cards.length) {
      return Response.json(
        { error: "The AI did not return any valid flashcards. Try again." },
        { status: 422 }
      );
    }

    const deck = await prisma.deck.create({
      data: {
        courseId: material.courseId,
        title: `${material.title} — cards`,
        flashcards: {
          create: cards.map((c) => ({
            question: c.question,
            answer: c.answer,
            hint: c.hint ?? null,
            materialId: material.id,
            source: "ai",
            difficulty: c.difficulty,
            tags: c.tags?.length ? JSON.stringify(c.tags) : null,
            relatedConcepts: c.relatedConcepts?.length
              ? JSON.stringify(c.relatedConcepts)
              : null,
          })),
        },
      },
    });

    return Response.json({
      deckId: deck.id,
      courseId: material.courseId,
      count: cards.length,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Generation failed." },
      { status: 500 }
    );
  }
}
