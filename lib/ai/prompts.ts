export type SummaryLength = "brief" | "standard" | "detailed";

export const SUMMARY_LENGTHS: SummaryLength[] = ["brief", "standard", "detailed"];

export function isSummaryLength(v: unknown): v is SummaryLength {
  return v === "brief" || v === "standard" || v === "detailed";
}

const FORMAT: Record<SummaryLength, string> = {
  brief: `Produce a CONCISE résumé in Markdown: a 2-3 sentence **Overview**, then 3-6 short **Key points** as bullets. It MUST be shorter than the source. No tables, no checklist.`,
  standard: `Produce a focused Markdown summary: a 2-3 sentence **Overview**, then **Key concepts** as bullets (each a term followed by a short explanation).`,
  detailed: `Produce structured Markdown study notes:
- **Overview** (2-3 sentences).
- **Key concepts** as bullets, each a term with a concise explanation.
- **Important details** (formulas, dates, terms worth memorizing).
- A short **Study checklist** of the most testable points.`,
};

export function summarySystem(length: SummaryLength, isReduce = false): string {
  const role = isReduce
    ? "You are combining several partial summaries of one piece of course material into a single coherent result."
    : "You are a study-notes generator for a student.";
  return `${role} Be accurate and grounded strictly in the source; do NOT invent facts.\n\n${FORMAT[length]}`;
}

export function summaryUser(title: string, text: string): string {
  return `Course material titled "${title}":\n\n${text}`;
}

export const CARDS_SYSTEM = `You generate spaced-repetition flashcards from course material.
Rules:
- Each card tests ONE atomic fact.
- The question must be answerable on its own, without seeing the source.
- Avoid yes/no questions; prefer "what/why/how/define".
- Keep answers concise (a sentence or two).
- Add a short "hint", a "difficulty" (easy|medium|hard), 1-3 topic "tags", and up to 4 "relatedConcepts".
Return ONLY valid JSON of the form:
{"cards":[{"question":"...","answer":"...","hint":"...","difficulty":"medium","tags":["..."],"relatedConcepts":["..."]}]}
No markdown, no commentary.`;

export function cardsUser(title: string, text: string, count: number): string {
  return `Create up to ${count} flashcards from this material titled "${title}".\n\n${text}`;
}
