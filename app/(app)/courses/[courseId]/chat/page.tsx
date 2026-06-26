import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { aiConfigured } from "@/lib/env";
import { Card, buttonClass } from "@/components/ui";
import { ChatUI } from "@/components/chat-ui";
import { createChatSession, deleteChatSession } from "@/app/actions/chat";
import { cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Source = { materialId: string; title: string };

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { courseId } = await params;
  const { session: sessionId } = await searchParams;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });
  if (!course) notFound();

  const [sessions, materialCount] = await Promise.all([
    prisma.chatSession.findMany({
      where: { courseId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.material.count({ where: { courseId, status: "READY" } }),
  ]);

  let active:
    | {
        id: string;
        mode: string;
        level: string | null;
        messages: { role: string; content: string; sources: string | null }[];
      }
    | null = null;
  if (sessionId) {
    const s = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (s && s.courseId === courseId) active = s;
  }

  const initialMessages =
    active?.messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
      sources: m.sources ? (JSON.parse(m.sources) as Source[]) : undefined,
    })) ?? [];

  return (
    <div className="space-y-4">
      <Link
        href={`/courses/${courseId}`}
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to course
      </Link>
      <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
        <MessageSquare size={20} className="text-accent" /> Chat — {course.title}
        {active?.mode === "tutor" && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Tutor · {active.level}
          </span>
        )}
      </h1>

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        {/* Sessions sidebar */}
        <div className="space-y-2">
          <form action={createChatSession}>
            <input type="hidden" name="courseId" value={courseId} />
            <button className={buttonClass("primary", "sm", "w-full")}>
              <Plus size={15} /> New chat
            </button>
          </form>
          <div className="space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm",
                  s.id === active?.id
                    ? "bg-accent/10 text-foreground"
                    : "text-muted hover:bg-background"
                )}
              >
                <Link
                  href={`/courses/${courseId}/chat?session=${s.id}`}
                  className="min-w-0 flex-1 truncate"
                >
                  {s.title}
                </Link>
                <form action={deleteChatSession}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <button
                    aria-label="Delete chat"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </form>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="px-2 text-xs text-muted">No chats yet.</p>
            )}
          </div>
        </div>

        {/* Active chat */}
        <Card className="p-4">
          {active ? (
            <ChatUI
              courseId={courseId}
              sessionId={active.id}
              initialMessages={initialMessages}
              aiEnabled={aiConfigured()}
              hasMaterials={materialCount > 0}
            />
          ) : (
            <div className="grid h-[calc(100vh-16rem)] place-items-center text-center">
              <div>
                <p className="font-medium">Start a conversation</p>
                <p className="mt-1 text-sm text-muted">
                  Click “New chat” to ask questions about this course.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
