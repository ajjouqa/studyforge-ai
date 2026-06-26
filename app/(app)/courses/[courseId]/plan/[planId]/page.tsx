import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { PlanTask } from "@/components/plan-task";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ courseId: string; planId: string }>;
}) {
  const { courseId, planId } = await params;
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    include: { tasks: { orderBy: [{ day: "asc" }, { order: "asc" }] } },
  });
  if (!plan || plan.courseId !== courseId) notFound();

  const byDay = new Map<string, typeof plan.tasks>();
  for (const t of plan.tasks) {
    const arr = byDay.get(t.day) ?? [];
    arr.push(t);
    byDay.set(t.day, arr);
  }
  const doneCount = plan.tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-5">
      <Link
        href={`/courses/${courseId}`}
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to course
      </Link>
      <PageHeader
        title="Study plan"
        description={`Exam ${plan.examDate.toLocaleDateString()} · ${plan.hoursPerDay}h/day · ${doneCount}/${plan.tasks.length} tasks done`}
      />

      <div className="space-y-3">
        {[...byDay.entries()].map(([day, tasks]) => {
          const total = tasks.reduce((s, t) => s + t.minutes, 0);
          return (
            <Card key={day} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-medium">
                  <CalendarClock size={15} className="text-accent" />
                  {new Date(day + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                <span className="text-xs text-muted">{total} min</span>
              </div>
              <div className="divide-y divide-border">
                {tasks.map((t) => (
                  <PlanTask
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    kind={t.kind}
                    minutes={t.minutes}
                    initialDone={t.done}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
