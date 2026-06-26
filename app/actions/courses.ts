"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createCourse(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!title) return;
  const course = await prisma.course.create({ data: { title, description } });
  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function deleteCourse(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.course.delete({ where: { id } });
  revalidatePath("/courses");
  redirect("/courses");
}
