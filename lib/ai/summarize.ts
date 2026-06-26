import { getAI } from "./client";
import { env } from "../env";
import { chunkText } from "../chunk/chunk";
import { getLanguage, languageDirective } from "../settings";
import { summarySystem, summaryUser, type SummaryLength } from "./prompts";

// Streams a Markdown summary at the chosen length. For long material we first
// summarize each chunk (map), then stream a combined summary (reduce).
export async function* streamSummary(input: {
  title: string;
  text: string;
  length?: SummaryLength;
}): AsyncGenerator<string> {
  const ai = getAI();
  const model = env.summaryModel;
  const length = input.length ?? "standard";
  const dir = languageDirective(await getLanguage());
  const chunks = chunkText(input.text);

  let source = input.text;
  let isReduce = false;

  if (chunks.length > 1) {
    // Map: summarize each chunk at "standard" depth to preserve information.
    const partials: string[] = [];
    for (const ch of chunks) {
      const res = await ai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: summarySystem("standard") + dir },
          { role: "user", content: summaryUser(input.title, ch.text) },
        ],
      });
      partials.push(res.choices[0]?.message?.content ?? "");
    }
    source = partials.join("\n\n---\n\n");
    isReduce = true;
  }

  const stream = await ai.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: summarySystem(length, isReduce) + dir },
      { role: "user", content: summaryUser(input.title, source) },
    ],
  });

  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
