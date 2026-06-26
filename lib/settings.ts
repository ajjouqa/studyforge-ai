import { prisma } from "./db";

// AI output language preference (single-user singleton row).
export async function getLanguage(): Promise<string> {
  const s = await prisma.userStats.findUnique({
    where: { id: "singleton" },
    select: { language: true },
  });
  return s?.language ?? "English";
}

// Appended to AI system prompts so responses come back in the chosen language.
export function languageDirective(language: string): string {
  if (!language || language.toLowerCase() === "english") return "";
  return `\n\nIMPORTANT: Write your ENTIRE response in ${language}, including all headings, explanations, and generated text. Keep any JSON keys and source markers like [Source 1] unchanged.`;
}
