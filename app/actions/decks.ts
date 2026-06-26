"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// Note: AI flashcard generation lives in the route handler
// app/api/decks/generate/route.ts (route handlers run in the main server
// process and avoid the long-running-server-action dev worker crash).

export async function addManualCard(formData: FormData) {
  const deckId = String(formData.get("deckId"));
  const courseId = String(formData.get("courseId"));
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;
  await prisma.flashcard.create({
    data: { deckId, question, answer, source: "manual" },
  });
  revalidatePath(`/courses/${courseId}/decks/${deckId}`);
}

export async function setCardConfidence(cardId: string, confidence: number) {
  await prisma.flashcard.update({
    where: { id: cardId },
    data: { confidence: Math.max(1, Math.min(5, confidence)) },
  });
}

export async function deleteCard(formData: FormData) {
  const id = String(formData.get("id"));
  const deckId = String(formData.get("deckId"));
  const courseId = String(formData.get("courseId"));
  await prisma.flashcard.delete({ where: { id } });
  revalidatePath(`/courses/${courseId}/decks/${deckId}`);
}

export async function deleteDeck(formData: FormData) {
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  await prisma.deck.delete({ where: { id } });
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}
