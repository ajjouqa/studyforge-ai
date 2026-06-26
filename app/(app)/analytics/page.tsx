import {
  Flame,
  Clock,
  Layers,
  Target,
  TrendingUp,
  TrendingDown,
  ListChecks,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getAnalytics } from "@/lib/analytics";
import { Card, PageHeader, buttonClass } from "@/components/ui";
import { BarChart } from "@/components/bar-chart";

export const dynamic = "force-dynamic";

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export default async function AnalyticsPage() {
  const a = await getAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning analytics"
        description="Your study activity across all courses."
        action={
          <Link href="/reports" className={buttonClass("secondary", "sm")}>
            Weekly AI report →
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={<Flame size={15} />}
          label="Streak"
          value={`${a.streak}d`}
          sub="consecutive study days"
        />
        <Stat
          icon={<Clock size={15} />}
          label="Study time"
          value={`${a.estimatedStudyMinutes}m`}
          sub="estimated total"
        />
        <Stat
          icon={<Layers size={15} />}
          label="Cards reviewed"
          value={`${a.cardsReviewed}`}
          sub={`${a.cardsReviewed7d} in last 7 days`}
        />
        <Stat
          icon={<Target size={15} />}
          label="Due today"
          value={`${a.cardsDueToday}`}
          sub={`${a.totalCards} cards total`}
        />
        <Stat
          icon={<TrendingUp size={15} />}
          label="Retention"
          value={a.retentionRate === null ? "—" : `${a.retentionRate}%`}
          sub="answered correctly"
        />
        <Stat
          icon={<ListChecks size={15} />}
          label="Quizzes"
          value={`${a.quizzesTaken}`}
          sub={a.avgQuizScore === null ? "none yet" : `avg ${a.avgQuizScore}%`}
        />
        <Stat
          icon={<Sparkles size={15} />}
          label="Summaries"
          value={`${a.summariesGenerated}`}
          sub="generated"
        />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Reviews — last 14 days</h2>
        <BarChart
          data={a.reviewsByDay.map((d) => ({
            label: d.day.slice(8),
            value: d.count,
          }))}
        />
      </Card>

      {a.quizScores.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent quiz scores</h2>
          <BarChart
            data={a.quizScores.map((q, i) => ({ label: `${i + 1}`, value: q.score }))}
            unit="%"
          />
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp size={15} className="text-emerald-500" /> Strongest topics
          </h2>
          {a.strongestTopics.length === 0 ? (
            <p className="text-sm text-muted">Review some cards to see this.</p>
          ) : (
            a.strongestTopics.map((t) => (
              <Row key={t.topic} topic={t.topic} score={t.score} />
            ))
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <TrendingDown size={15} className="text-red-500" /> Weakest topics
          </h2>
          {a.weakestTopics.length === 0 ? (
            <p className="text-sm text-muted">Review some cards to see this.</p>
          ) : (
            a.weakestTopics.map((t) => (
              <Row key={t.topic} topic={t.topic} score={t.score} />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ topic, score }: { topic: string; score: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm last:border-0">
      <span className="min-w-0 truncate">{topic}</span>
      <span className="shrink-0 text-muted">{score}%</span>
    </div>
  );
}
