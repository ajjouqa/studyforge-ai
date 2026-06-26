import type OpenAI from "openai";
import { getAI } from "./client";
import { env } from "../env";
import { retrieveChunks, sampleChunks } from "../rag/retrieve";
import { buildContext, type BuiltContext } from "../rag/context";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM = `You are a study assistant for one specific course. Answer the student's question USING ONLY the course material context provided below.

Guidelines:
- If the answer is not in the context, say you couldn't find it in the course materials, and suggest what the student could add.
- Explain concepts clearly; simplify difficult topics; give concrete examples; compare related concepts when helpful.
- Cite the material you used with inline markers like [Source 1], [Source 2].
- Be accurate and grounded — do not invent facts beyond the provided context.
Format answers in Markdown.`;

function tutorSystem(level: string): string {
  return `You are an interactive AI tutor for this course, teaching at a ${level} level, using ONLY the provided course material context.
Teaching method:
- Teach step by step in small chunks — never dump everything at once.
- After each step, ask ONE short follow-up question to check understanding, then stop and wait for the student.
- Adapt to the student's answers: if they struggle, simplify and use an analogy; if they're confident, go deeper.
- Periodically quiz the student with a quick question.
- Use concrete examples and analogies appropriate for a ${level} learner.
- Cite material with [Source N]. Stay grounded; if something isn't in the context, say so.
Format in Markdown and keep each turn concise.`;
}

export async function buildChatContext(
  courseId: string,
  question: string
): Promise<BuiltContext> {
  let chunks = await retrieveChunks(courseId, question, 6);
  if (chunks.length === 0) chunks = await sampleChunks(courseId, 6);
  return buildContext(chunks, 3000);
}

export async function* streamChatAnswer(input: {
  question: string;
  context: string;
  history?: ChatTurn[];
  mode?: string;
  level?: string | null;
}): AsyncGenerator<string> {
  const ai = getAI();
  const system =
    input.mode === "tutor" ? tutorSystem(input.level ?? "intermediate") : SYSTEM;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    {
      role: "system",
      content: `Course material context:\n\n${
        input.context || "(no relevant material was found for this question)"
      }`,
    },
    ...(input.history ?? []).slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: input.question },
  ];

  const stream = await ai.chat.completions.create({
    model: env.openRouterModel,
    stream: true,
    messages,
  });

  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
