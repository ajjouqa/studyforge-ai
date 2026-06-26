import { describe, expect, it } from "vitest";
import { parseCards } from "../lib/ai/flashcards";

describe("parseCards", () => {
  it("parses a well-formed cards object", () => {
    const raw = JSON.stringify({
      cards: [{ question: "What is ATP?", answer: "Energy currency of the cell." }],
    });
    expect(parseCards(raw)).toHaveLength(1);
  });

  it("strips ```json code fences", () => {
    const raw =
      '```json\n{"cards":[{"question":"Q","answer":"A","hint":"H"}]}\n```';
    const cards = parseCards(raw);
    expect(cards).toHaveLength(1);
    expect(cards[0].hint).toBe("H");
  });

  it("salvages a bare array", () => {
    const raw = '[{"question":"Q","answer":"A"}]';
    expect(parseCards(raw)).toHaveLength(1);
  });

  it("drops malformed cards but keeps valid ones", () => {
    const raw = JSON.stringify({
      cards: [
        { question: "Q1", answer: "A1" },
        { question: "", answer: "missing question" },
        { answer: "no question field" },
      ],
    });
    expect(parseCards(raw)).toHaveLength(1);
  });

  it("returns [] for non-JSON", () => {
    expect(parseCards("not json at all")).toEqual([]);
  });
});
