"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// Adding materials (text/file/link/audio) is handled by route handlers under
// app/api/materials/* so processing runs reliably in the main server process.

export async function deleteMaterial(formData: FormData) {
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  await prisma.material.delete({ where: { id } });
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}
