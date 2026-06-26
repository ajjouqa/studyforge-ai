import { prisma } from "./db";

const XP_PER_LEVEL = 100;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  check: (d: {
    reviews: number;
    quizzes: number;
    summaries: number;
    streak: number;
    level: number;
  }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-card", title: "First steps", description: "Reviewed your first flashcard.", check: (d) => d.reviews >= 1 },
  { key: "cards-50", title: "Warming up", description: "Reviewed 50 flashcards.", check: (d) => d.reviews >= 50 },
  { key: "cards-100", title: "Century", description: "Reviewed 100 flashcards.", check: (d) => d.reviews >= 100 },
  { key: "streak-3", title: "On a roll", description: "3-day study streak.", check: (d) => d.streak >= 3 },
  { key: "streak-7", title: "Dedicated", description: "7-day study streak.", check: (d) => d.streak >= 7 },
  { key: "streak-30", title: "Unstoppable", description: "30-day study streak.", check: (d) => d.streak >= 30 },
  { key: "first-quiz", title: "Quizzer", description: "Completed your first quiz.", check: (d) => d.quizzes >= 1 },
  { key: "first-summary", title: "Note taker", description: "Generated your first summary.", check: (d) => d.summaries >= 1 },
  { key: "level-5", title: "Scholar", description: "Reached level 5.", check: (d) => d.level >= 5 },
];

export async function getStats() {
  return prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
}

export async function checkAchievements(): Promise<void> {
  const [reviews, quizzes, summaries, s] = await Promise.all([
    prisma.reviewLog.count(),
    prisma.quizAttempt.count(),
    prisma.summary.count({ where: { status: "READY" } }),
    getStats(),
  ]);
  const data = { reviews, quizzes, summaries, streak: s.streak, level: levelFromXp(s.xp) };
  const earned = new Set(
    (await prisma.achievement.findMany({ select: { key: true } })).map((a) => a.key)
  );
  for (const def of ACHIEVEMENTS) {
    if (!earned.has(def.key) && def.check(data)) {
      try {
        await prisma.achievement.create({
          data: { key: def.key, title: def.title, description: def.description },
        });
      } catch {
        /* unique race — ignore */
      }
    }
  }
}

// Award XP; when opts.study, also advance the daily streak.
export async function awardXp(amount: number, opts: { study?: boolean } = {}) {
  const s = await getStats();
  let { streak, longestStreak, lastActiveDay } = s;
  if (opts.study) {
    const today = dayKey(new Date());
    if (lastActiveDay !== today) {
      const yesterday = dayKey(new Date(Date.now() - 86400000));
      streak = lastActiveDay === yesterday ? streak + 1 : 1;
      longestStreak = Math.max(longestStreak, streak);
      lastActiveDay = today;
    }
  }
  await prisma.userStats.update({
    where: { id: "singleton" },
    data: { xp: s.xp + amount, streak, longestStreak, lastActiveDay },
  });
  await checkAchievements();
}

export async function getProgress() {
  const s = await getStats();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const [reviewsToday, reviews7d, achievements] = await Promise.all([
    prisma.reviewLog.count({ where: { reviewedAt: { gte: start } } }),
    prisma.reviewLog.count({ where: { reviewedAt: { gte: weekStart } } }),
    prisma.achievement.findMany({ orderBy: { earnedAt: "desc" } }),
  ]);
  const earnedKeys = new Set(achievements.map((a) => a.key));
  return {
    xp: s.xp,
    level: levelFromXp(s.xp),
    xpIntoLevel: s.xp % XP_PER_LEVEL,
    xpForLevel: XP_PER_LEVEL,
    streak: s.streak,
    longestStreak: s.longestStreak,
    dailyGoal: s.dailyGoal,
    weeklyGoal: s.weeklyGoal,
    reviewsToday,
    reviews7d,
    badges: ACHIEVEMENTS.map((a) => ({
      key: a.key,
      title: a.title,
      description: a.description,
      earned: earnedKeys.has(a.key),
    })),
  };
}
