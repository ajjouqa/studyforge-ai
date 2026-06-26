import { prisma } from "../db";

export interface RetrievedChunk {
  materialId: string;
  materialTitle: string;
  index: number;
  text: string;
  score: number;
}

// Small English stopword set for lexical retrieval.
const STOPWORDS = new Set(
  "the a an and or but of to in on at for with as is are was were be been being this that these those it its by from into about over under than then so such not no can will would should could may might do does did has have had you your we our they their he she his her i me my what which who when where how why".split(
    " "
  )
);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length > 2 && !STOPWORDS.has(t)
  );
}

// BM25 lexical retrieval over a course's READY material chunks. Clean interface
// so it can be swapped for embedding-based retrieval later.
export async function retrieveChunks(
  courseId: string,
  query: string,
  k = 6
): Promise<RetrievedChunk[]> {
  const queryTerms = [...new Set(tokenize(query))];
  if (!queryTerms.length) return [];

  const rows = await prisma.chunk.findMany({
    where: { material: { courseId, status: "READY" } },
    select: {
      materialId: true,
      index: true,
      text: true,
      material: { select: { title: true } },
    },
  });
  if (!rows.length) return [];

  const docs = rows.map((r) => ({ ...r, tokens: tokenize(r.text) }));
  const N = docs.length;
  const avgdl = docs.reduce((s, d) => s + d.tokens.length, 0) / N || 1;

  const df = new Map<string, number>();
  for (const d of docs) {
    for (const t of new Set(d.tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const k1 = 1.5;
  const b = 0.75;

  const scored = docs.map((d) => {
    const tf = new Map<string, number>();
    for (const t of d.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of queryTerms) {
      const f = tf.get(t);
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score +=
        (idf * (f * (k1 + 1))) /
        (f + k1 * (1 - b + (b * d.tokens.length) / avgdl));
    }
    return {
      materialId: d.materialId,
      materialTitle: d.material.title,
      index: d.index,
      text: d.text,
      score,
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Fallback when lexical retrieval finds nothing (e.g. generic/opening questions):
// seed context with the opening chunk of each course material.
export async function sampleChunks(
  courseId: string,
  k = 6
): Promise<RetrievedChunk[]> {
  const rows = await prisma.chunk.findMany({
    where: { material: { courseId, status: "READY" } },
    select: {
      materialId: true,
      index: true,
      text: true,
      material: { select: { title: true } },
    },
    orderBy: [{ materialId: "asc" }, { index: "asc" }],
    take: k,
  });
  return rows.map((r) => ({
    materialId: r.materialId,
    materialTitle: r.material.title,
    index: r.index,
    text: r.text,
    score: 0,
  }));
}
