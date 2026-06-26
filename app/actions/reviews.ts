"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { nextCardState, sm2 } from "@/lib/srs/sm2";
import { awardXp } from "@/lib/gamification";

// Called from the client study session with (cardId, grade).
export async function gradeCard(cardId: string, grade: number) {
  const card = await prisma.flashcard.findUniqueOrThrow({ where: { id: cardId } });
  const res = sm2(
    {
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
    },
    grade
  );

  await prisma.$transaction([
    prisma.flashcard.update({
      where: { id: cardId },
      data: {
        easeFactor: res.easeFactor,
        intervalDays: res.intervalDays,
        repetitions: res.repetitions,
        dueDate: res.dueDate,
        lastReviewed: new Date(),
        state: nextCardState(res.repetitions),
      },
    }),
    prisma.reviewLog.create({
      data: {
        flashcardId: cardId,
        grade,
        prevInterval: card.intervalDays,
        newInterval: res.intervalDays,
        prevEase: card.easeFactor,
        newEase: res.easeFactor,
      },
    }),
  ]);

  // Gamification: XP + streak for studying.
  await awardXp(grade >= 3 ? 10 : 5, { study: true });

  revalidatePath("/study");
  return { dueDate: res.dueDate, intervalDays: res.intervalDays };
}
