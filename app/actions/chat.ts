"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createChatSession(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const session = await prisma.chatSession.create({ data: { courseId } });
  redirect(`/courses/${courseId}/chat?session=${session.id}`);
}

export async function createTutorSession(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const level = String(formData.get("level") || "intermediate");
  const session = await prisma.chatSession.create({
    data: { courseId, mode: "tutor", level, title: `Tutor (${level})` },
  });
  redirect(`/courses/${courseId}/chat?session=${session.id}`);
}

export async function deleteChatSession(formData: FormData) {
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  await prisma.chatSession.delete({ where: { id } });
  redirect(`/courses/${courseId}/chat`);
}
