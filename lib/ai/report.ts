import { z } from "zod";
import { getAI } from "./client";
import { env } from "../env";
import { getAnalytics } from "../analytics";
import { getLanguage, languageDirective } from "../settings";

const ReportSchema = z.object({
  readiness: z.number().int().min(0).max(100).catch(50),
  report: z.string().min(1),
});

export async function generateWeeklyReport(): Promise<{
  content: string;
  readiness: number;
}> {
  const a = await getAnalytics();
  const ai = getAI();
  const dir = languageDirective(await getLanguage());

  const res = await ai.chat.completions.create({
    model: env.summaryModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a study coach. Given the student's weekly study stats, write an honest, encouraging weekly report.
Return ONLY JSON: {"readiness": 0-100, "report": "# Markdown report ..."}
The report MUST cover, in Markdown sections:
- **What you learned / practiced** this week
- **Progress made**
- **Weak areas** to focus on
- **Recommendations** for next week (concrete, actionable)
- **Estimated exam readiness** with a one-line justification
Reference the actual numbers. Be specific and concise.${dir}`,
      },
      { role: "user", content: JSON.stringify(a) },
    ],
  });

  const raw = (res.choices[0]?.message?.content ?? "{}")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The AI returned an unreadable report. Try again.");
  }
  const result = ReportSchema.safeParse(parsed);
  if (!result.success) throw new Error("Could not generate the report. Try again.");
  return { content: result.data.report, readiness: result.data.readiness };
}
