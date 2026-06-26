import { prisma } from "./db";

export interface TopicScore {
  topic: string;
  score: number; // % correct
  reviews: number;
}

export interface Analytics {
  totalCards: number;
  cardsReviewed: number;
  cardsReviewed7d: number;
  cardsDueToday: number;
  retentionRate: number | null; // %
  streak: number;
  estimatedStudyMinutes: number;
  summariesGenerated: number;
  quizzesTaken: number;
  avgQuizScore: number | null;
  reviewsByDay: { day: string; count: number }[];
  quizScores: { date: string; score: number }[];
  strongestTopics: TopicScore[];
  weakestTopics: TopicScore[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function getAnalytics(now = new Date()): Promise<Analytics> {
  const [reviews, totalCards, cardsDueToday, summariesGenerated, attempts] =
    await Promise.all([
      prisma.reviewLog.findMany({
        select: {
          grade: true,
          reviewedAt: true,
          flashcard: { select: { deck: { select: { title: true } } } },
        },
        orderBy: { reviewedAt: "asc" },
      }),
      prisma.flashcard.count(),
      prisma.flashcard.count({ where: { dueDate: { lte: now } } }),
      prisma.summary.count({ where: { status: "READY" } }),
      prisma.quizAttempt.findMany({
        select: { score: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const cardsReviewed = reviews.length;
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const cardsReviewed7d = reviews.filter((r) => r.reviewedAt >= weekAgo).length;
  const correct = reviews.filter((r) => r.grade >= 3).length;
  const retentionRate = cardsReviewed
    ? Math.round((correct / cardsReviewed) * 100)
    : null;

  // Reviews per day (last 14 days).
  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    byDay.set(dayKey(new Date(now.getTime() - i * 86400000)), 0);
  }
  for (const r of reviews) {
    const k = dayKey(r.reviewedAt);
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const reviewsByDay = [...byDay.entries()].map(([day, count]) => ({ day, count }));

  // Streak: consecutive days (ending today or yesterday) with >=1 review.
  const reviewDays = new Set(reviews.map((r) => dayKey(r.reviewedAt)));
  let streak = 0;
  const cursor = new Date(now);
  if (!reviewDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (reviewDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Topics by deck.
  const topicAgg = new Map<string, { correct: number; total: number }>();
  for (const r of reviews) {
    const topic = r.flashcard.deck.title;
    const agg = topicAgg.get(topic) ?? { correct: 0, total: 0 };
    agg.total += 1;
    if (r.grade >= 3) agg.correct += 1;
    topicAgg.set(topic, agg);
  }
  const topics: TopicScore[] = [...topicAgg.entries()]
    .filter(([, v]) => v.total >= 2)
    .map(([topic, v]) => ({
      topic,
      score: Math.round((v.correct / v.total) * 100),
      reviews: v.total,
    }));
  const strongestTopics = [...topics].sort((a, b) => b.score - a.score).slice(0, 5);
  const weakestTopics = [...topics].sort((a, b) => a.score - b.score).slice(0, 5);

  const quizzesTaken = attempts.length;
  const avgQuizScore = quizzesTaken
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / quizzesTaken)
    : null;
  const quizScores = attempts.slice(-10).map((a) => ({
    date: dayKey(a.createdAt),
    score: a.score,
  }));

  const estimatedStudyMinutes = Math.round(
    cardsReviewed * 0.5 + summariesGenerated * 2 + quizzesTaken * 5
  );

  return {
    totalCards,
    cardsReviewed,
    cardsReviewed7d,
    cardsDueToday,
    retentionRate,
    streak,
    estimatedStudyMinutes,
    summariesGenerated,
    quizzesTaken,
    avgQuizScore,
    reviewsByDay,
    quizScores,
    strongestTopics,
    weakestTopics,
  };
}
