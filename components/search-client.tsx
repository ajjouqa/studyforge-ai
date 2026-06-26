"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Layers, ListChecks, Search, Sparkles } from "lucide-react";
import { Card, inputClass } from "./ui";

type Result = {
  type: "material" | "summary" | "flashcard" | "quiz";
  title: string;
  snippet: string;
  href: string;
  courseTitle: string;
};

const ICONS: Record<Result["type"], React.ReactNode> = {
  material: <FileText size={14} />,
  summary: <Sparkles size={14} />,
  flashcard: <Layers size={14} />,
  quiz: <ListChecks size={14} />,
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        terms.some((t) => t.toLowerCase() === p.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/30"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.current.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const terms = query.trim().toLowerCase().split(/\s+/).filter((t) => t.length > 1);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, summaries, flashcards, quizzes…"
          className={`${inputClass} pl-9`}
        />
      </div>

      {loading && <p className="text-sm text-muted">Searching…</p>}
      {!loading && searched && results.length === 0 && (
        <p className="text-sm text-muted">No matches found.</p>
      )}

      <div className="space-y-2">
        {results.map((r, i) => (
          <Link key={i} href={r.href}>
            <Card className="p-3 transition-colors hover:border-accent/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-muted">{ICONS[r.type]}</span>
                <span className="truncate">
                  <Highlighted text={r.title} terms={terms} />
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                  {r.type}
                </span>
              </div>
              {r.snippet && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  <Highlighted text={r.snippet} terms={terms} />
                </p>
              )}
              <p className="mt-1 text-xs text-muted">{r.courseTitle}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
