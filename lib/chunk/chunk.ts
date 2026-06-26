import { encode, decode } from "gpt-tokenizer";

export interface TextChunk {
  index: number;
  text: string;
  tokenCount: number;
}

export function countTokens(text: string): number {
  try {
    return encode(text).length;
  } catch {
    // Fallback estimate (~4 chars/token) if tokenizer fails.
    return Math.ceil(text.length / 4);
  }
}

// Token-aware sliding-window chunking. Guarantees each chunk fits the budget and
// adds overlap so summaries/cards stay coherent across boundaries.
export function chunkText(
  text: string,
  opts: { maxTokens?: number; overlapTokens?: number } = {}
): TextChunk[] {
  const maxTokens = opts.maxTokens ?? 1800;
  const overlapTokens = opts.overlapTokens ?? 150;

  let tokens: number[];
  try {
    tokens = encode(text);
  } catch {
    return [{ index: 0, text, tokenCount: countTokens(text) }];
  }

  if (tokens.length <= maxTokens) {
    return [{ index: 0, text, tokenCount: tokens.length }];
  }

  const step = Math.max(1, maxTokens - overlapTokens);
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;
  while (start < tokens.length) {
    const slice = tokens.slice(start, start + maxTokens);
    chunks.push({ index: index++, text: decode(slice), tokenCount: slice.length });
    start += step;
  }
  return chunks;
}
