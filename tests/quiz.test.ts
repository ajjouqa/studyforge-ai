import { describe, expect, it } from "vitest";
import { isAnswerCorrect } from "../lib/quiz/grade";

describe("isAnswerCorrect", () => {
  it("matches MCQ case-insensitively", () => {
    expect(isAnswerCorrect("mcq", "Mitochondria", "mitochondria")).toBe(true);
    expect(isAnswerCorrect("mcq", "Nucleus", "Mitochondria")).toBe(false);
  });

  it("matches true/false", () => {
    expect(isAnswerCorrect("truefalse", "true", "True")).toBe(true);
    expect(isAnswerCorrect("truefalse", "False", "True")).toBe(false);
  });

  it("is lenient on fill-in-the-blank punctuation", () => {
    expect(isAnswerCorrect("fillblank", "ATP", "ATP.")).toBe(true);
    expect(isAnswerCorrect("fillblank", "the atp", "atp")).toBe(true);
  });

  it("grades short answers by key-term overlap", () => {
    expect(
      isAnswerCorrect(
        "short",
        "mitochondria produce atp via respiration",
        "Mitochondria produce ATP through cellular respiration"
      )
    ).toBe(true);
    expect(
      isAnswerCorrect(
        "short",
        "i don't know",
        "Mitochondria produce ATP through cellular respiration"
      )
    ).toBe(false);
  });
});
