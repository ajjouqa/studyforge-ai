import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { buildChatContext, streamChatAnswer, type ChatTurn } from "@/lib/ai/chat";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  if (!aiConfigured()) {
    return new Response("AI is not configured (set OPENROUTER_API_KEY).", {
      status: 400,
    });
  }
  const { courseId } = await params;
  const body = (await req.json().catch(() => null)) as {
    sessionId?: string;
    message?: string;
  } | null;
  const sessionId = body?.sessionId;
  const message = body?.message?.trim();
  if (!sessionId || !message) {
    return new Response("sessionId and message required", { status: 400 });
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || session.courseId !== courseId) {
    return new Response("Session not found", { status: 404 });
  }

  // History before this turn.
  const prior = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  const history: ChatTurn[] = prior.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  await prisma.chatMessage.create({
    data: { sessionId, role: "user", content: message },
  });
  if (session.title === "New chat" && prior.length === 0) {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: message.slice(0, 50) },
    });
  }

  const { context, sources } = await buildChatContext(courseId, message);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let acc = "";
      try {
        for await (const delta of streamChatAnswer({
          question: message,
          context,
          history,
          mode: session.mode,
          level: session.level,
        })) {
          acc += delta;
          controller.enqueue(encoder.encode(delta));
        }
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: "assistant",
            content: acc,
            sources: JSON.stringify(sources),
          },
        });
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        });
        controller.close();
      } catch (err) {
        if (acc) {
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: acc,
              sources: JSON.stringify(sources),
            },
          });
        }
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      // Citations for the client to render immediately (base64 JSON).
      "X-Sources": Buffer.from(JSON.stringify(sources)).toString("base64"),
    },
  });
}
