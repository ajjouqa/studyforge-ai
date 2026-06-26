import { Award, Flame, Lock, Trophy } from "lucide-react";
import { getProgress } from "@/lib/gamification";
import { Card, PageHeader, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { setGoals } from "@/app/actions/gamification";
import { cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function ProgressPage() {
  const p = await getProgress();

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="Level up by studying every day." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Trophy size={15} />
            <span className="text-xs uppercase tracking-wide">Level</span>
          </div>
          <p className="mt-1 text-3xl font-semibold">{p.level}</p>
          <div className="mt-2">
            <Bar value={p.xpIntoLevel} max={p.xpForLevel} />
            <p className="mt-1 text-xs text-muted">
              {p.xpIntoLevel}/{p.xpForLevel} XP to level {p.level + 1} · {p.xp} total
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Flame size={15} />
            <span className="text-xs uppercase tracking-wide">Streak</span>
          </div>
          <p className="mt-1 text-3xl font-semibold">{p.streak}d</p>
          <p className="text-xs text-muted">longest {p.longestStreak}d</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Award size={15} />
            <span className="text-xs uppercase tracking-wide">Badges</span>
          </div>
          <p className="mt-1 text-3xl font-semibold">
            {p.badges.filter((b) => b.earned).length}/{p.badges.length}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-sm font-medium">Daily goal</p>
          <Bar value={p.reviewsToday} max={p.dailyGoal} />
          <p className="mt-1 text-xs text-muted">
            {p.reviewsToday}/{p.dailyGoal} cards today
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-sm font-medium">Weekly goal</p>
          <Bar value={p.reviews7d} max={p.weeklyGoal} />
          <p className="mt-1 text-xs text-muted">
            {p.reviews7d}/{p.weeklyGoal} cards this week
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <p className="mb-3 text-sm font-medium">Badges</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {p.badges.map((b) => (
            <div
              key={b.key}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-2.5",
                b.earned
                  ? "border-accent/40 bg-accent/5"
                  : "border-border opacity-60"
              )}
            >
              {b.earned ? (
                <Trophy size={16} className="mt-0.5 shrink-0 text-amber-500" />
              ) : (
                <Lock size={16} className="mt-0.5 shrink-0 text-muted" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-xs text-muted">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-sm font-medium">Goals</p>
        <form action={setGoals} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Daily (cards)</span>
            <input
              name="dailyGoal"
              type="number"
              min={1}
              defaultValue={p.dailyGoal}
              className={`${inputClass} w-28`}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Weekly (cards)</span>
            <input
              name="weeklyGoal"
              type="number"
              min={1}
              defaultValue={p.weeklyGoal}
              className={`${inputClass} w-28`}
            />
          </label>
          <SubmitButton pendingText="Saving…" size="sm">
            Save goals
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
