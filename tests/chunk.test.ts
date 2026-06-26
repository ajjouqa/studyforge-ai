import { describe, expect, it } from "vitest";
import { chunkText, countTokens } from "../lib/chunk/chunk";
import { normalizeText } from "../lib/chunk/normalize";

describe("countTokens", () => {
  it("returns a positive count for non-empty text", () => {
    expect(countTokens("hello world")).toBeGreaterThan(0);
  });
});

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("a short sentence");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
  });

  it("splits long text into multiple budget-respecting chunks", () => {
    const long = "word ".repeat(5000);
    const chunks = chunkText(long, { maxTokens: 500, overlapTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.tokenCount).toBeLessThanOrEqual(500);
    }
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });
});

describe("normalizeText", () => {
  it("de-hyphenates line-break splits and collapses whitespace", () => {
    const out = normalizeText("exam-\nple    text\r\n\n\n\nend");
    expect(out).toContain("example text");
    expect(out).not.toMatch(/\n{3,}/);
  });
});
