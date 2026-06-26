import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { QuizRunner, type RunnerQuestion } from "@/components/quiz-runner";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      attempts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!quiz || quiz.courseId !== courseId) notFound();

  // Sanitize: never send correct answers / explanations to the client.
  const questions: RunnerQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
    difficulty: q.difficulty,
  }));

  return (
    <div className="space-y-5">
      <Link
        href={`/courses/${courseId}`}
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to course
      </Link>
      <PageHeader
        title={quiz.title}
        description={`${quiz.questions.length} questions`}
      />

      {quiz.attempts.length > 0 && (
        <Card className="p-3 text-sm">
          <p className="mb-1 font-medium">Past attempts</p>
          <div className="flex flex-wrap gap-2">
            {quiz.attempts.map((a) => (
              <span
                key={a.id}
                className="rounded-full bg-background px-2 py-0.5 text-xs text-muted"
              >
                {a.score}% ({a.correct}/{a.total}) ·{" "}
                {a.createdAt.toLocaleDateString()}
              </span>
            ))}
          </div>
        </Card>
      )}

      <QuizRunner quizId={quiz.id} questions={questions} />
    </div>
  );
}
