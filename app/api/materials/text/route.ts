import { createProcessedMaterial } from "@/lib/materials";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    courseId?: string;
    title?: string;
    text?: string;
  } | null;
  const courseId = body?.courseId;
  const text = body?.text ?? "";
  if (!courseId) return Response.json({ error: "courseId required" }, { status: 400 });
  if (!text.trim()) return Response.json({ error: "Text is required." }, { status: 400 });

  const material = await createProcessedMaterial({
    courseId,
    type: "TEXT",
    title: (body?.title ?? "").trim() || "Untitled note",
    rawText: text,
  });

  return Response.json({
    materialId: material.id,
    courseId,
    status: material.status,
  });
}
