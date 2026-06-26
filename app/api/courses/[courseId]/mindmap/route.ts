import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { generateMindMap } from "@/lib/ai/mindmap";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  if (!aiConfigured()) {
    return Response.json({ error: "AI is not configured." }, { status: 400 });
  }
  const { courseId } = await params;
  const body = (await req.json().catch(() => null)) as {
    materialId?: string;
  } | null;

  let title = "Course concept map";
  let text = "";

  if (body?.materialId) {
    const m = await prisma.material.findUnique({ where: { id: body.materialId } });
    if (!m?.extractedText) {
      return Response.json({ error: "Material has no text." }, { status: 400 });
    }
    title = `${m.title} — map`;
    text = m.extractedText;
  } else {
    const [summaries, materials] = await Promise.all([
      prisma.summary.findMany({
        where: { courseId, status: "READY" },
        select: { content: true },
        take: 10,
      }),
      prisma.material.findMany({
        where: { courseId, status: "READY" },
        select: { extractedText: true },
        take: 10,
      }),
    ]);
    text =
      summaries.map((s) => s.content).join("\n\n") ||
      materials.map((m) => m.extractedText).join("\n\n");
    if (!text.trim()) {
      return Response.json({ error: "This course has no content yet." }, { status: 400 });
    }
  }

  try {
    const data = await generateMindMap({ title, text });
    const map = await prisma.mindMap.create({
      data: { courseId, title, data: JSON.stringify(data) },
    });
    return Response.json({ mapId: map.id, courseId });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Generation failed." },
      { status: 500 }
    );
  }
}
