import { prisma } from "./db";
import { countWords, normalizeText } from "./chunk/normalize";
import { chunkText } from "./chunk/chunk";

// Normalize extracted text, persist a Material (+ chunks), set READY/FAILED.
export async function createProcessedMaterial(input: {
  courseId: string;
  type: "FILE" | "LINK" | "AUDIO" | "TEXT";
  title: string;
  rawText: string;
  filePath?: string | null;
  mimeType?: string | null;
  sourceUrl?: string | null;
  emptyError?: string;
}) {
  const text = normalizeText(input.rawText);
  const ok = text.length > 0;

  const material = await prisma.material.create({
    data: {
      courseId: input.courseId,
      type: input.type,
      title: input.title,
      filePath: input.filePath ?? null,
      mimeType: input.mimeType ?? null,
      sourceUrl: input.sourceUrl ?? null,
      extractedText: ok ? text : null,
      wordCount: ok ? countWords(text) : null,
      status: ok ? "READY" : "FAILED",
      error: ok ? null : input.emptyError ?? "No extractable text found.",
    },
  });

  if (ok) {
    const chunks = chunkText(text);
    if (chunks.length) {
      await prisma.chunk.createMany({
        data: chunks.map((c) => ({
          materialId: material.id,
          index: c.index,
          text: c.text,
          tokenCount: c.tokenCount,
        })),
      });
    }
  }

  return material;
}
