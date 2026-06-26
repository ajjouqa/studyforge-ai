import { z } from "zod";
import { getAI } from "./client";
import { env } from "../env";
import { getLanguage, languageDirective } from "../settings";

const TaskSchema = z.object({
  day: z.string(),
  title: z.string().min(1).max(200),
  kind: z.enum(["study", "review", "quiz", "spaced-repetition"]).catch("study"),
  minutes: z.number().int().min(5).max(240).catch(30),
});
const PlanSchema = z.object({ tasks: z.array(TaskSchema) });
export type PlanTask = z.infer<typeof TaskSchema>;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Available study dates between tomorrow and the exam on the chosen weekdays.
export function availableDates(
  examDate: Date,
  studyDays: number[],
  from = new Date()
): string[] {
  const dates: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  const allowed = new Set(studyDays);
  let guard = 0;
  while (cursor <= examDate && guard < 200) {
    guard += 1;
    if (allowed.has(cursor.getDay())) dates.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates.slice(0, 60);
}

export async function generateStudyPlan(input: {
  examDate: Date;
  hoursPerDay: number;
  studyDays: number[];
  topics: string[];
  weakTopics: string[];
}): Promise<PlanTask[]> {
  const dates = availableDates(input.examDate, input.studyDays);
  if (!dates.length) return [];

  const ai = getAI();
  const dailyMinutes = Math.round(input.hoursPerDay * 60);
  const dir = languageDirective(await getLanguage());

  const res = await ai.chat.completions.create({
    model: env.openRouterModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a study planner. Produce a schedule as JSON:
{"tasks":[{"day":"YYYY-MM-DD","title":"...","kind":"study|review|quiz|spaced-repetition","minutes":30}]}
Rules:
- Only use the provided available dates.
- Each day's tasks should total about ${dailyMinutes} minutes.
- Prioritize WEAK topics: schedule them earlier and revisit them more often.
- Include "review" and "spaced-repetition" sessions, especially in the last days before the exam.
- Add a "quiz" session near the end to self-test.
No markdown, no commentary.${dir}`,
      },
      {
        role: "user",
        content: `Exam date: ${dayKey(input.examDate)}
Available dates: ${dates.join(", ")}
Topics: ${input.topics.join(", ") || "(general course material)"}
Weak topics (prioritize): ${input.weakTopics.join(", ") || "(none yet)"}`,
      },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  const result = PlanSchema.safeParse(parsed);
  const tasks = result.success ? result.data.tasks : [];
  const valid = new Set(dates);
  return tasks.filter((t) => valid.has(t.day));
}
