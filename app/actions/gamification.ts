"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function setGoals(formData: FormData) {
  const dailyGoal = Math.max(1, Number(formData.get("dailyGoal")) || 20);
  const weeklyGoal = Math.max(1, Number(formData.get("weeklyGoal")) || 150);
  await prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", dailyGoal, weeklyGoal },
    update: { dailyGoal, weeklyGoal },
  });
  revalidatePath("/progress");
}
