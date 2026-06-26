import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { generateQuiz, QUESTION_TYPES, type QuestionType } from "@/lib/ai/quiz";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!aiConfigured()) {
    return Response.json({ error: "AI is not configured." }, { status: 400 });
  }
  const body = (await req.json().catch(() => null)) as {
    courseId?: string;
    materialId?: string;
    count?: number;
    types?: string[];
  } | null;
  const courseId = body?.courseId;
  if (!courseId) return Response.json({ error: "courseId required" }, { status: 400 });
  const count = Math.min(20, Math.max(3, Number(body?.count) || 8));
  const types = Array.isArray(body?.types)
    ? (body.types.filter((t) => (QUESTION_TYPES as readonly string[]).includes(t)) as QuestionType[])
    : undefined;

  let title = "Course quiz";
  let text = "";
  let scope: "material" | "course" = "course";

  if (body?.materialId) {
    const m = await prisma.material.findUnique({ where: { id: body.materialId } });
    if (!m?.extractedText) {
      return Response.json({ error: "Material has no extracted text." }, { status: 400 });
    }
    title = m.title;
    text = m.extractedText;
    scope = "material";
  } else {
    const mats = await prisma.material.findMany({
      where: { courseId, status: "READY" },
      select: { title: true, extractedText: true },
    });
    if (!mats.length) {
      return Response.json({ error: "This course has no readable materials." }, { status: 400 });
    }
    text = mats.map((m) => `# ${m.title}\n${m.extractedText}`).join("\n\n");
  }

  try {
    const questions = await generateQuiz({ title, text, count, types });
    if (!questions.length) {
      return Response.json({ error: "No valid questions generated. Try again." }, { status: 422 });
    }
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title: scope === "material" ? `${title} — quiz` : "Course quiz",
        scope,
        materialId: body?.materialId ?? null,
        questions: {
          create: questions.map((q, i) => ({
            order: i,
            type: q.type,
            question: q.question,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? null,
            difficulty: q.difficulty,
            source: q.source ?? null,
          })),
        },
      },
    });
    return Response.json({ quizId: quiz.id, courseId, count: questions.length });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Generation failed." },
      { status: 500 }
    );
  }
}
