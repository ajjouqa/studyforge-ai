import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { detectKind, extractFile } from "@/lib/extract/files";
import { createProcessedMaterial } from "@/lib/materials";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid form data" }, { status: 400 });

  const courseId = String(form.get("courseId") ?? "");
  const file = form.get("file");
  if (!courseId) return Response.json({ error: "courseId required" }, { status: 400 });
  if (!(file instanceof File)) {
    return Response.json({ error: "file required" }, { status: 400 });
  }

  const kind = detectKind(file.name, file.type);
  if (!kind) {
    return Response.json(
      { error: "Unsupported file type. Use PDF, DOCX, or PPTX." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Save the original file to local storage.
  const dir = path.resolve(env.storageDir);
  await mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relPath = `${randomUUID()}-${safeName}`;
  await writeFile(path.join(dir, relPath), buffer);

  let rawText = "";
  try {
    rawText = await extractFile(kind, buffer);
  } catch (e) {
    return Response.json(
      {
        error: `Could not read this ${kind.toUpperCase()} file: ${
          e instanceof Error ? e.message : "parse error"
        }`,
      },
      { status: 422 }
    );
  }

  const material = await createProcessedMaterial({
    courseId,
    type: "FILE",
    title: file.name,
    rawText,
    filePath: relPath,
    mimeType: file.type || null,
    emptyError:
      "No extractable text found. Scanned/image PDFs need OCR (a later phase).",
  });

  return Response.json({
    materialId: material.id,
    courseId,
    status: material.status,
    error: material.error,
  });
}
