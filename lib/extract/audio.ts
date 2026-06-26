import OpenAI from "openai";

// OpenRouter has NO transcription endpoint, so audio uses an OpenAI-compatible
// transcription API (OpenAI Whisper by default; point OPENAI_BASE_URL at e.g.
// Groq for a free option). Configured separately from the chat (OpenRouter) key.
export function transcriptionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function transcribeAudio(file: File): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Audio transcription is not configured. Set OPENAI_API_KEY in .env.local " +
        "(OpenRouter has no transcription endpoint), or point OPENAI_BASE_URL at a " +
        "compatible provider such as Groq."
    );
  }
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const model = process.env.WHISPER_MODEL || "whisper-1";
  const res = await client.audio.transcriptions.create({ file, model });
  return res.text;
}
