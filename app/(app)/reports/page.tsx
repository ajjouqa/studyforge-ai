import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { Card, PageHeader } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { GenerateReportButton } from "@/components/generate-report-button";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await prisma.weeklyReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const latest = reports[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Weekly report"
        description="An AI summary of your progress and exam readiness."
        action={<GenerateReportButton aiEnabled={aiConfigured()} />}
      />

      {!latest ? (
        <Card className="p-6 text-sm text-muted">
          No reports yet. Generate one to see your progress and recommendations.
        </Card>
      ) : (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-accent text-lg font-semibold">
              {latest.readiness ?? "—"}
            </div>
            <div>
              <p className="font-medium">Estimated exam readiness</p>
              <p className="text-xs text-muted">
                {latest.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
          <Markdown>{latest.content}</Markdown>
        </Card>
      )}

      {reports.length > 1 && (
        <div className="space-y-1 text-sm text-muted">
          <p className="font-medium text-foreground">Earlier reports</p>
          {reports.slice(1).map((r) => (
            <p key={r.id}>
              {r.createdAt.toLocaleDateString()} · readiness {r.readiness ?? "—"}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
