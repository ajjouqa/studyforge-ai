"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "./ui";

export function GenerateReportButton({ aiEnabled }: { aiEnabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={run} disabled={loading || !aiEnabled}>
        <FileText size={15} />
        {loading ? "Writing report…" : "Generate weekly report"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!aiEnabled && (
        <p className="text-sm text-amber-600">Set OPENROUTER_API_KEY to enable reports.</p>
      )}
    </div>
  );
}
