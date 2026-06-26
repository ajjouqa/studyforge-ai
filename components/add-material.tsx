"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardType, FileUp, Link2, Mic } from "lucide-react";
import { Button, Card, inputClass } from "./ui";
import { cn } from "@/lib/ui";

type Tab = "paste" | "upload" | "link" | "audio";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "paste", label: "Paste", icon: <ClipboardType size={15} /> },
  { id: "upload", label: "Upload", icon: <FileUp size={15} /> },
  { id: "link", label: "Link", icon: <Link2 size={15} /> },
  { id: "audio", label: "Audio", icon: <Mic size={15} /> },
];

export function AddMaterial({
  courseId,
  audioEnabled,
}: {
  courseId: string;
  audioEnabled: boolean;
}) {
  const [tab, setTab] = useState<Tab>("paste");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function postForm(e: React.FormEvent<HTMLFormElement>, endpoint: string) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.append("courseId", courseId);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.materialId) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/courses/${courseId}/materials/${data.materialId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function postText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/materials/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: data.get("title"),
          text: data.get("text"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.materialId) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      router.push(`/courses/${courseId}/materials/${json.materialId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function postLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = String(new FormData(e.currentTarget).get("url") ?? "");
    try {
      const res = await fetch("/api/materials/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.materialId) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/courses/${courseId}/materials/${data.materialId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === t.id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:bg-background hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <form onSubmit={postText} className="space-y-3">
          <input
            name="title"
            placeholder="Title (e.g. Lecture 3 — Thermodynamics)"
            className={inputClass}
          />
          <textarea
            name="text"
            required
            rows={6}
            placeholder="Paste your notes or course text here…"
            className={inputClass}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Add material"}
          </Button>
        </form>
      )}

      {tab === "upload" && (
        <form
          onSubmit={(e) => postForm(e, "/api/materials/upload")}
          className="space-y-3"
        >
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.docx,.pptx"
            className={inputClass}
          />
          <p className="text-xs text-muted">PDF, DOCX, or PPTX. Text is extracted automatically.</p>
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading & extracting…" : "Upload & extract"}
          </Button>
        </form>
      )}

      {tab === "link" && (
        <form onSubmit={postLink} className="space-y-3">
          <input
            name="url"
            type="url"
            required
            placeholder="https://… (web article or YouTube video)"
            className={inputClass}
          />
          <p className="text-xs text-muted">
            Web articles are cleaned with Readability; YouTube uses the caption
            track (if available).
          </p>
          <Button type="submit" disabled={loading}>
            {loading ? "Importing…" : "Import link"}
          </Button>
        </form>
      )}

      {tab === "audio" && (
        <form
          onSubmit={(e) => postForm(e, "/api/materials/audio")}
          className="space-y-3"
        >
          <input
            type="file"
            name="file"
            required
            accept="audio/*,video/mp4,.m4a,.mp3,.wav,.webm"
            className={inputClass}
          />
          <p className="text-xs text-muted">
            Lecture/audio recordings (max 25MB) are transcribed, then summarized.
          </p>
          {!audioEnabled && (
            <p className="text-xs text-amber-600">
              Transcription needs OPENAI_API_KEY in .env.local (OpenRouter has no
              transcription endpoint). You can point OPENAI_BASE_URL at a
              compatible provider like Groq.
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Transcribing…" : "Upload & transcribe"}
          </Button>
        </form>
      )}

      {loading && tab !== "paste" && (
        <p className="mt-3 text-sm text-muted">
          Working… large files can take a little while.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
