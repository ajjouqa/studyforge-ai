import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { generateWeeklyReport } from "@/lib/ai/report";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  if (!aiConfigured()) {
    return Response.json({ error: "AI is not configured." }, { status: 400 });
  }
  try {
    const { content, readiness } = await generateWeeklyReport();
    const report = await prisma.weeklyReport.create({
      data: { content, readiness },
    });
    return Response.json({ reportId: report.id });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Generation failed." },
      { status: 500 }
    );
  }
}
