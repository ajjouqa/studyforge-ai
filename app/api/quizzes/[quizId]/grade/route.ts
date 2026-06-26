import { prisma } from "@/lib/db";
import { isAnswerCorrect } from "@/lib/quiz/grade";
import { awardXp } from "@/lib/gamification";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  const body = (await req.json().catch(() => null)) as {
    answers?: Record<string, string>;
  } | null;
  const answers = body?.answers;
  if (!answers) return Response.json({ error: "answers required" }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) return Response.json({ error: "Quiz not found" }, { status: 404 });

  const results = quiz.questions.map((q) => {
    const userAnswer = answers[q.id] ?? "";
    const correct = isAnswerCorrect(q.type, userAnswer, q.correctAnswer);
    return {
      questionId: q.id,
      correct,
      userAnswer,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      source: q.source,
    };
  });

  const correct = results.filter((r) => r.correct).length;
  const total = quiz.questions.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  const stored: Record<string, { answer: string; correct: boolean }> = {};
  for (const r of results) stored[r.questionId] = { answer: r.userAnswer, correct: r.correct };

  await prisma.quizAttempt.create({
    data: { quizId, answers: JSON.stringify(stored), correct, total, score },
  });

  // Gamification: XP for taking a quiz, scaled by score.
  await awardXp(10 + Math.round((score / 100) * 20), { study: true });

  return Response.json({ score, correct, total, results });
}
