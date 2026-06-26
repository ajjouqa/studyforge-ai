"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function setLanguage(formData: FormData) {
  const language = String(formData.get("language") || "English").trim() || "English";
  await prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", language },
    update: { language },
  });
  revalidatePath("/settings");
}
