import { z } from "zod";
import { getAI } from "./client";
import { env } from "../env";
import { chunkText } from "../chunk/chunk";
import { getLanguage, languageDirective } from "../settings";

export const QUESTION_TYPES = ["mcq", "truefalse", "fillblank", "short"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QuizQuestionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  question: z.string().min(1).max(2000),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1).max(2000),
  explanation: z.string().max(2000).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).catch("medium"),
  source: z.string().max(500).optional(),
});
export const QuizSchema = z.object({ questions: z.array(QuizQuestionSchema) });
export type GeneratedQuestion = z.infer<typeof QuizQuestionSchema>;

function parseQuestions(raw: string): GeneratedQuestion[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return [];
  }
  const arr = Array.isArray(data)
    ? data
    : (data as { questions?: unknown })?.questions;
  if (!Array.isArray(arr)) return [];
  const out: GeneratedQuestion[] = [];
  for (const item of arr) {
    const q = QuizQuestionSchema.safeParse(item);
    if (!q.success) continue;
    // mcq must have >=2 options that include the correct answer
    if (q.data.type === "mcq") {
      if (!q.data.options || q.data.options.length < 2) continue;
      if (!q.data.options.includes(q.data.correctAnswer)) continue;
    }
    out.push(q.data);
  }
  return out;
}

const SYSTEM = `You generate quiz questions from course material. Return ONLY valid JSON:
{"questions":[{"type":"mcq|truefalse|fillblank|short","question":"...","options":["..."],"correctAnswer":"...","explanation":"...","difficulty":"easy|medium|hard","source":"short quote or location"}]}
Rules:
- Mix the requested question types.
- For "mcq": provide exactly 4 plausible "options" and set "correctAnswer" to the EXACT text of the correct option.
- For "truefalse": "correctAnswer" is "True" or "False"; no options.
- For "fillblank": put a ____ blank in the question; "correctAnswer" is the missing word/phrase.
- For "short": "correctAnswer" is a concise model answer.
- Always include an "explanation" and a "source" grounded in the material. Do not invent facts.
No markdown, no commentary.`;

export async function generateQuiz(input: {
  title: string;
  text: string;
  count?: number;
  types?: QuestionType[];
}): Promise<GeneratedQuestion[]> {
  const ai = getAI();
  const count = input.count ?? 8;
  const types = input.types?.length ? input.types : [...QUESTION_TYPES];
  const dir = languageDirective(await getLanguage());
  const allChunks = chunkText(input.text);
  // Bound cost for large (course-wide) inputs.
  const chunks = allChunks.slice(0, 4);
  const perChunk = Math.max(2, Math.ceil(count / chunks.length));

  const all: GeneratedQuestion[] = [];
  for (const ch of chunks) {
    const res = await ai.chat.completions.create({
      model: env.cardsModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM + dir },
        {
          role: "user",
          content: `Create up to ${perChunk} quiz questions (types: ${types.join(
            ", "
          )}) from this material titled "${input.title}".\n\n${ch.text}`,
        },
      ],
    });
    all.push(...parseQuestions(res.choices[0]?.message?.content ?? ""));
  }

  // Dedupe by question text and cap.
  const seen = new Set<string>();
  const deduped = all.filter((q) => {
    const k = q.question.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return deduped.slice(0, count);
}
