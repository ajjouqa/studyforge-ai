// Deterministic quiz grading (no AI). Objective types use normalized matching;
// short answers use lenient key-term overlap.

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalizeAnswer(s)
    .split(" ")
    .filter((t) => t.length > 2);
}

export function isAnswerCorrect(
  type: string,
  userAnswer: string,
  correctAnswer: string
): boolean {
  const u = normalizeAnswer(userAnswer);
  const c = normalizeAnswer(correctAnswer);
  if (!u) return false;

  if (type === "mcq" || type === "truefalse") {
    return u === c;
  }
  if (type === "fillblank") {
    return u === c || c.includes(u) || u.includes(c);
  }
  // short answer: lenient — at least 60% of the model answer's key terms present.
  const keyTerms = [...new Set(tokens(correctAnswer))];
  if (keyTerms.length === 0) return u === c;
  const userTerms = new Set(tokens(userAnswer));
  const hits = keyTerms.filter((t) => userTerms.has(t)).length;
  return hits / keyTerms.length >= 0.6;
}
