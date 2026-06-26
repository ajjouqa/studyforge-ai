import { countTokens } from "../chunk/chunk";
import type { RetrievedChunk } from "./retrieve";

export interface ChatSource {
  materialId: string;
  title: string;
}

export interface BuiltContext {
  context: string;
  sources: ChatSource[];
}

// Packs the top retrieved chunks into a token-budgeted context string with
// numbered source headers for inline citation.
export function buildContext(
  chunks: RetrievedChunk[],
  maxTokens = 3000
): BuiltContext {
  const parts: string[] = [];
  const sources: ChatSource[] = [];
  const seen = new Set<string>();
  let total = 0;
  let n = 0;

  for (const c of chunks) {
    n += 1;
    const block = `[Source ${n}: ${c.materialTitle}]\n${c.text}`;
    const t = countTokens(block);
    if (total + t > maxTokens && parts.length) break;
    parts.push(block);
    total += t;
    if (!seen.has(c.materialId)) {
      seen.add(c.materialId);
      sources.push({ materialId: c.materialId, title: c.materialTitle });
    }
  }

  return { context: parts.join("\n\n"), sources };
}
