import { prisma } from "@/lib/db";
import { streamSummary } from "@/lib/ai/summarize";
import { isSummaryLength } from "@/lib/ai/prompts";
import { aiConfigured, env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!aiConfigured()) {
    return new Response("AI is not configured (set OPENROUTER_API_KEY).", {
      status: 400,
    });
  }

  const body = (await req.json().catch(() => null)) as {
    materialId?: string;
    length?: string;
  } | null;
  const materialId = body?.materialId;
  if (!materialId) return new Response("materialId required", { status: 400 });
  const length = isSummaryLength(body?.length) ? body.length : "standard";

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material?.extractedText) {
    return new Response("Material has no extracted text yet.", { status: 400 });
  }

  const summary = await prisma.summary.create({
    data: {
      courseId: material.courseId,
      materialId: material.id,
      scope: "material",
      status: "STREAMING",
      model: env.summaryModel,
    },
  });

  const encoder = new TextEncoder();
  const title = material.title;
  const text = material.extractedText;

  const stream = new ReadableStream({
    async start(controller) {
      let acc = "";
      try {
        for await (const delta of streamSummary({ title, text, length })) {
          acc += delta;
          controller.enqueue(encoder.encode(delta));
        }
        await prisma.summary.update({
          where: { id: summary.id },
          data: { content: acc, status: "READY" },
        });
        controller.close();
      } catch (err) {
        await prisma.summary.update({
          where: { id: summary.id },
          data: {
            status: "FAILED",
            content: acc,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
