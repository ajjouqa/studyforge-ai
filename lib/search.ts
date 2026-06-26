import { prisma } from "./db";

export interface SearchResult {
  type: "material" | "summary" | "flashcard" | "quiz";
  title: string;
  snippet: string;
  href: string;
  courseTitle: string;
  score: number;
}

function snippetAndScore(
  text: string | null | undefined,
  terms: string[],
  weight = 1
): { score: number; snippet: string } {
  if (!text) return { score: 0, snippet: "" };
  const lower = text.toLowerCase();
  let score = 0;
  let firstIdx = -1;
  for (const t of terms) {
    let from = 0;
    let count = 0;
    let idx: number;
    while ((idx = lower.indexOf(t, from)) >= 0 && count < 5) {
      if (firstIdx < 0 || idx < firstIdx) firstIdx = idx;
      count += 1;
      from = idx + t.length;
    }
    score += count * weight;
  }
  let snippet = "";
  if (firstIdx >= 0) {
    const start = Math.max(0, firstIdx - 60);
    snippet =
      (start > 0 ? "…" : "") +
      text.slice(start, start + 180).trim() +
      (start + 180 < text.length ? "…" : "");
  } else {
    snippet = text.slice(0, 160);
  }
  return { score, snippet };
}

// Global search across documents, summaries, flashcards, and quizzes.
export async function search(rawQuery: string): Promise<SearchResult[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  const orFields = (fields: string[]) => ({
    OR: fields.flatMap((f) => terms.map((t) => ({ [f]: { contains: t } }))),
  });

  const results: SearchResult[] = [];

  // Materials (documents + pasted notes + transcripts)
  const materials = await prisma.material.findMany({
    where: { AND: [{ status: "READY" }, orFields(["title", "extractedText"])] },
    select: {
      id: true,
      title: true,
      extractedText: true,
      courseId: true,
      course: { select: { title: true } },
    },
    take: 50,
  });
  for (const m of materials) {
    const t = snippetAndScore(m.title, terms, 3);
    const body = snippetAndScore(m.extractedText, terms, 1);
    results.push({
      type: "material",
      title: m.title,
      snippet: body.snippet || t.snippet,
      href: `/courses/${m.courseId}/materials/${m.id}`,
      courseTitle: m.course.title,
      score: t.score + body.score,
    });
  }

  // Summaries
  const summaries = await prisma.summary.findMany({
    where: { AND: [{ status: "READY" }, orFields(["content"])] },
    select: {
      id: true,
      content: true,
      courseId: true,
      materialId: true,
      course: { select: { title: true } },
    },
    take: 50,
  });
  for (const s of summaries) {
    const body = snippetAndScore(s.content, terms, 1);
    if (body.score === 0) continue;
    results.push({
      type: "summary",
      title: "Summary",
      snippet: body.snippet,
      href: s.materialId
        ? `/courses/${s.courseId}/materials/${s.materialId}`
        : `/courses/${s.courseId}`,
      courseTitle: s.course.title,
      score: body.score,
    });
  }

  // Flashcards
  const cards = await prisma.flashcard.findMany({
    where: orFields(["question", "answer"]),
    select: {
      id: true,
      question: true,
      answer: true,
      deckId: true,
      deck: { select: { courseId: true, course: { select: { title: true } } } },
    },
    take: 50,
  });
  for (const c of cards) {
    const t = snippetAndScore(c.question, terms, 3);
    const a = snippetAndScore(c.answer, terms, 1);
    results.push({
      type: "flashcard",
      title: c.question,
      snippet: a.snippet || c.answer,
      href: `/courses/${c.deck.courseId}/decks/${c.deckId}`,
      courseTitle: c.deck.course.title,
      score: t.score + a.score,
    });
  }

  // Quizzes (match on question text)
  const quizQs = await prisma.quizQuestion.findMany({
    where: orFields(["question"]),
    select: {
      question: true,
      quiz: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { title: true } },
        },
      },
    },
    take: 50,
  });
  const seenQuiz = new Set<string>();
  for (const qq of quizQs) {
    if (seenQuiz.has(qq.quiz.id)) continue;
    seenQuiz.add(qq.quiz.id);
    const body = snippetAndScore(qq.question, terms, 1);
    results.push({
      type: "quiz",
      title: qq.quiz.title,
      snippet: body.snippet,
      href: `/courses/${qq.quiz.courseId}/quizzes/${qq.quiz.id}`,
      courseTitle: qq.quiz.course.title,
      score: body.score,
    });
  }

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}
