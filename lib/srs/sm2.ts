// SM-2 spaced-repetition algorithm (Anki-style). Pure & unit-tested.

export interface SrsState {
  easeFactor: number; // EF, min 1.3
  intervalDays: number;
  repetitions: number; // consecutive correct answers
}

export interface SrsResult extends SrsState {
  dueDate: Date;
}

// UI grades map to SM-2 quality (q):
//   Again = 2 (fail), Hard = 3, Good = 4, Easy = 5
export const GRADES = {
  AGAIN: 2,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
} as const;

export function sm2(state: SrsState, grade: number, now: Date = new Date()): SrsResult {
  let { easeFactor, intervalDays, repetitions } = state;

  if (grade < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  }

  // EF update (clamped to a 1.3 floor).
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  );

  const dueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { easeFactor, intervalDays, repetitions, dueDate };
}

export function nextCardState(repetitions: number): "NEW" | "LEARNING" | "REVIEW" {
  if (repetitions === 0) return "LEARNING";
  return "REVIEW";
}
