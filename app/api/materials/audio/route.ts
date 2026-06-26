import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { transcribeAudio, transcriptionConfigured } from "@/lib/extract/audio";
import { createProcessedMaterial } from "@/lib/materials";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 25 * 1024 * 1024; // Whisper API limit

export async function POST(req: Request) {
  if (!transcriptionConfigured()) {
    return Response.json(
      {
        error:
          "Audio transcription is not configured. Set OPENAI_API_KEY in .env.local (OpenRouter has no transcription endpoint).",
      },
      { status: 400 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid form data" }, { status: 400 });
  const courseId = String(form.get("courseId") ?? "");
  const file = form.get("file");
  if (!courseId) return Response.json({ error: "courseId required" }, { status: 400 });
  if (!(file instanceof File)) {
    return Response.json({ error: "file required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Audio file too large (max 25MB). Split it into shorter clips." },
      { status: 400 }
    );
  }

  // Persist the original audio.
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.resolve(env.storageDir);
  await mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relPath = `${randomUUID()}-${safeName}`;
  await writeFile(path.join(dir, relPath), buffer);

  let text = "";
  try {
    text = await transcribeAudio(file);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Transcription failed." },
      { status: 422 }
    );
  }

  const material = await createProcessedMaterial({
    courseId,
    type: "AUDIO",
    title: file.name,
    rawText: text,
    filePath: relPath,
    mimeType: file.type || null,
    emptyError: "Transcription returned no text.",
  });

  return Response.json({
    materialId: material.id,
    courseId,
    status: material.status,
    error: material.error,
  });
}
