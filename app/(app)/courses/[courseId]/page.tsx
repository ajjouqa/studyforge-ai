import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  Layers,
  Trash2,
  GraduationCap,
  ChevronRight,
  MessageSquare,
  ListChecks,
  CalendarClock,
  Network,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { aiConfigured, env } from "@/lib/env";
import { Card, EmptyState, PageHeader, StatusPill, buttonClass } from "@/components/ui";
import { AddMaterial } from "@/components/add-material";
import { GenerateQuiz } from "@/components/generate-quiz";
import { StudyPlanForm } from "@/components/study-plan-form";
import { GenerateMindMap } from "@/components/generate-mindmap";
import { deleteCourse } from "@/app/actions/courses";
import { createTutorSession } from "@/app/actions/chat";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      materials: { orderBy: { createdAt: "desc" } },
      decks: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { flashcards: true } } },
      },
      quizzes: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { questions: true, attempts: true } } },
      },
      studyPlans: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { tasks: true } } },
      },
      mindMaps: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={course.title}
        description={course.description ?? undefined}
        action={
          <div className="flex gap-2">
            <Link
              href={`/courses/${course.id}/chat`}
              className={buttonClass("primary", "sm")}
            >
              <MessageSquare size={15} /> Chat with AI
            </Link>
            <form action={deleteCourse}>
              <input type="hidden" name="id" value={course.id} />
              <button className={buttonClass("danger", "sm")}>
                <Trash2 size={15} /> Delete
              </button>
            </form>
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <FileText size={15} /> Materials
        </h2>
        <AddMaterial courseId={course.id} audioEnabled={env.transcriptionConfigured} />
        {course.materials.length === 0 ? (
          <p className="px-1 text-sm text-muted">
            No materials yet. Add one above to summarize it and generate cards.
          </p>
        ) : (
          <div className="space-y-2">
            {course.materials.map((m) => (
              <Link key={m.id} href={`/courses/${course.id}/materials/${m.id}`}>
                <Card className="flex items-center justify-between p-3 transition-colors hover:border-accent/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{m.title}</span>
                      <StatusPill status={m.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {m.type.toLowerCase()} ·{" "}
                      {m.wordCount ? `${m.wordCount} words` : "—"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <Layers size={15} /> Flashcard decks
        </h2>
        {course.decks.length === 0 ? (
          <EmptyState
            icon={<Layers size={24} />}
            title="No decks yet"
            description="Open a material and click “Generate flashcards” to create one."
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {course.decks.map((d) => (
              <Card key={d.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <Link
                    href={`/courses/${course.id}/decks/${d.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {d._count.flashcards} cards
                  </p>
                </div>
                <Link
                  href={`/courses/${course.id}/decks/${d.id}/study`}
                  className={buttonClass("secondary", "sm")}
                >
                  <GraduationCap size={15} /> Study
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <ListChecks size={15} /> Quizzes
        </h2>
        <Card className="p-4">
          <p className="mb-2 text-sm text-muted">
            Generate a quiz from everything in this course.
          </p>
          <GenerateQuiz
            courseId={course.id}
            aiEnabled={aiConfigured()}
            label="Generate course quiz"
          />
        </Card>
        {course.quizzes.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {course.quizzes.map((q) => (
              <Card key={q.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <Link
                    href={`/courses/${course.id}/quizzes/${q.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {q.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {q._count.questions} questions · {q._count.attempts} attempts
                  </p>
                </div>
                <Link
                  href={`/courses/${course.id}/quizzes/${q.id}`}
                  className={buttonClass("secondary", "sm")}
                >
                  Take
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <CalendarClock size={15} /> Study plan
        </h2>
        <Card className="p-4">
          <p className="mb-3 text-sm text-muted">
            Generate a schedule from your exam date — it prioritizes weak topics
            and adds review &amp; spaced-repetition sessions.
          </p>
          <StudyPlanForm courseId={course.id} aiEnabled={aiConfigured()} />
        </Card>
        {course.studyPlans.length > 0 && (
          <div className="space-y-1">
            {course.studyPlans.map((p) => (
              <Link
                key={p.id}
                href={`/courses/${course.id}/plan/${p.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-background hover:text-foreground"
              >
                <span>Plan · exam {p.examDate.toLocaleDateString()}</span>
                <span className="text-xs">{p._count.tasks} tasks</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <Network size={15} /> Mind map
        </h2>
        <Card className="p-4">
          <p className="mb-3 text-sm text-muted">
            Generate an interactive concept map from this course&apos;s summaries
            and materials.
          </p>
          <GenerateMindMap courseId={course.id} aiEnabled={aiConfigured()} />
        </Card>
        {course.mindMaps.length > 0 && (
          <div className="space-y-1">
            {course.mindMaps.map((m) => (
              <Link
                key={m.id}
                href={`/courses/${course.id}/mindmap/${m.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-background hover:text-foreground"
              >
                <span className="truncate">{m.title}</span>
                <span className="text-xs">{m.createdAt.toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <GraduationCap size={15} /> AI Tutor
        </h2>
        <Card className="p-4">
          <p className="mb-3 text-sm text-muted">
            Start an interactive, step-by-step tutoring session that adapts to your
            answers and quizzes you as you go.
          </p>
          <form action={createTutorSession} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="courseId" value={course.id} />
            <label className="text-sm">
              <span className="mb-1 block text-muted">Level</span>
              <select
                name="level"
                defaultValue="intermediate"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <button className={buttonClass("primary", "md")}>
              <GraduationCap size={15} /> Start tutor
            </button>
          </form>
        </Card>
      </section>
    </div>
  );
}
