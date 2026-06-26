import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { generateStudyPlan } from "@/lib/ai/planner";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  if (!aiConfigured()) {
    return Response.json({ error: "AI is not configured." }, { status: 400 });
  }
  const { courseId } = await params;
  const body = (await req.json().catch(() => null)) as {
    examDate?: string;
    hoursPerDay?: number;
    studyDays?: number[];
  } | null;

  if (!body?.examDate) return Response.json({ error: "examDate required" }, { status: 400 });
  const examDate = new Date(body.examDate);
  if (Number.isNaN(examDate.getTime())) {
    return Response.json({ error: "Invalid exam date." }, { status: 400 });
  }
  const hoursPerDay = Math.min(12, Math.max(0.5, Number(body.hoursPerDay) || 2));
  const studyDays = Array.isArray(body.studyDays)
    ? body.studyDays.map(Number).filter((n) => n >= 0 && n <= 6)
    : [1, 2, 3, 4, 5];
  if (!studyDays.length) {
    return Response.json({ error: "Select at least one study day." }, { status: 400 });
  }

  const [materials, decks] = await Promise.all([
    prisma.material.findMany({ where: { courseId, status: "READY" }, select: { title: true } }),
    prisma.deck.findMany({ where: { courseId }, select: { title: true } }),
  ]);
  const topics = [
    ...new Set([...materials.map((m) => m.title), ...decks.map((d) => d.title)]),
  ].slice(0, 30);

  // Weak topics: this course's decks with <70% retention.
  const reviews = await prisma.reviewLog.findMany({
    where: { flashcard: { deck: { courseId } } },
    select: { grade: true, flashcard: { select: { deck: { select: { title: true } } } } },
  });
  const agg = new Map<string, { c: number; t: number }>();
  for (const r of reviews) {
    const k = r.flashcard.deck.title;
    const a = agg.get(k) ?? { c: 0, t: 0 };
    a.t += 1;
    if (r.grade >= 3) a.c += 1;
    agg.set(k, a);
  }
  const weakTopics = [...agg.entries()]
    .filter(([, v]) => v.t >= 2 && v.c / v.t < 0.7)
    .map(([k]) => k);

  try {
    const tasks = await generateStudyPlan({
      examDate,
      hoursPerDay,
      studyDays,
      topics,
      weakTopics,
    });
    if (!tasks.length) {
      return Response.json(
        { error: "Could not build a plan — check the exam date is in the future." },
        { status: 422 }
      );
    }
    const plan = await prisma.studyPlan.create({
      data: {
        courseId,
        examDate,
        hoursPerDay,
        studyDays: JSON.stringify(studyDays),
        tasks: {
          create: tasks.map((t, i) => ({
            day: t.day,
            order: i,
            title: t.title,
            kind: t.kind,
            minutes: t.minutes,
          })),
        },
      },
    });
    return Response.json({ planId: plan.id, courseId, count: tasks.length });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Generation failed." },
      { status: 500 }
    );
  }
}
