// Normalize extracted/pasted text into clean plain text for the AI.
export function normalizeText(input: string): string {
  let t = input.normalize("NFC");
  t = t.replace(/\r\n?/g, "\n"); // CRLF -> LF
  t = t.replace(/(\w)-\n(\w)/g, "$1$2"); // de-hyphenate line-break splits
  t = t.replace(/[ \t]+\n/g, "\n"); // trim trailing whitespace per line
  t = t.replace(/\n{3,}/g, "\n\n"); // collapse blank-line runs
  t = t.replace(/[ \t]{2,}/g, " "); // collapse repeated spaces
  return t.trim();
}

export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

// Heuristic: very little text usually means extraction failed (e.g. scanned PDF).
export function isLowYield(text: string): boolean {
  return countWords(text) < 20;
}
