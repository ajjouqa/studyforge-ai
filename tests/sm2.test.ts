import { describe, expect, it } from "vitest";
import { GRADES, sm2 } from "../lib/srs/sm2";

const NEW = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };
const NOW = new Date("2026-01-01T00:00:00Z");

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

describe("sm2", () => {
  it("first correct answer schedules 1 day out", () => {
    const r = sm2(NEW, GRADES.GOOD, NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.repetitions).toBe(1);
    expect(daysBetween(NOW, r.dueDate)).toBe(1);
  });

  it("second correct answer schedules 6 days out", () => {
    const r1 = sm2(NEW, GRADES.GOOD, NOW);
    const r2 = sm2(r1, GRADES.GOOD, NOW);
    expect(r2.intervalDays).toBe(6);
    expect(r2.repetitions).toBe(2);
  });

  it("third correct answer multiplies by ease factor", () => {
    let s = sm2(NEW, GRADES.GOOD, NOW);
    s = sm2(s, GRADES.GOOD, NOW);
    const r3 = sm2(s, GRADES.GOOD, NOW);
    expect(r3.intervalDays).toBe(Math.round(6 * r3.easeFactor));
    expect(r3.repetitions).toBe(3);
  });

  it("a failing grade resets repetitions and interval", () => {
    let s = sm2(NEW, GRADES.GOOD, NOW);
    s = sm2(s, GRADES.GOOD, NOW);
    const fail = sm2(s, GRADES.AGAIN, NOW);
    expect(fail.repetitions).toBe(0);
    expect(fail.intervalDays).toBe(1);
  });

  it("ease factor never drops below 1.3", () => {
    let s = NEW;
    for (let i = 0; i < 10; i++) s = sm2(s, GRADES.AGAIN, NOW);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("Good keeps EF stable at 2.5", () => {
    const r = sm2(NEW, GRADES.GOOD, NOW);
    expect(r.easeFactor).toBeCloseTo(2.5, 5);
  });
});
