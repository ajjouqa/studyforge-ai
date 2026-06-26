"use server";

import { prisma } from "@/lib/db";

export async function toggleTask(taskId: string, done: boolean) {
  await prisma.studyTask.update({ where: { id: taskId }, data: { done } });
}
