import { z } from "zod";
import { getAI } from "./client";
import { env } from "../env";
import { chunkText } from "../chunk/chunk";
import { CARDS_SYSTEM, cardsUser } from "./prompts";

export const CardSchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(4000),
  hint: z.string().max(1000).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).catch("medium"),
  tags: z.array(z.string().max(40)).max(5).optional(),
  relatedConcepts: z.array(z.string().max(80)).max(6).optional(),
});
export const CardsSchema = z.object({ cards: z.array(CardSchema) });
export type GeneratedCard = z.infer<typeof CardSchema>;

// Strip ```json fences and parse + validate. Returns [] on unrecoverable output.
export function parseCards(raw: string): GeneratedCard[] {
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

  const full = CardsSchema.safeParse(data);
  if (full.success) return full.data.cards;

  // Salvage: maybe the model returned a bare array, or some cards are malformed.
  const arr = Array.isArray(data)
    ? data
    : (data as { cards?: unknown })?.cards;
  if (!Array.isArray(arr)) return [];
  const valid: GeneratedCard[] = [];
  for (const item of arr) {
    const c = CardSchema.safeParse(item);
    if (c.success) valid.push(c.data);
  }
  return valid;
}

function dedupe(cards: GeneratedCard[]): GeneratedCard[] {
  const seen = new Set<string>();
  const out: GeneratedCard[] = [];
  for (const c of cards) {
    const key = c.question.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export async function generateFlashcards(input: {
  title: string;
  text: string;
  count?: number;
}): Promise<GeneratedCard[]> {
  const ai = getAI();
  const model = env.cardsModel;
  const count = input.count ?? 12;
  const chunks = chunkText(input.text);
  const perChunk = Math.max(3, Math.ceil(count / chunks.length));

  const all: GeneratedCard[] = [];
  for (const ch of chunks) {
    const res = await ai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CARDS_SYSTEM },
        { role: "user", content: cardsUser(input.title, ch.text, perChunk) },
      ],
    });
    all.push(...parseCards(res.choices[0]?.message?.content ?? ""));
  }

  return dedupe(all).slice(0, count);
}
