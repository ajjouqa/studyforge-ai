"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Network } from "lucide-react";
import { Button } from "./ui";

export function GenerateMindMap({
  courseId,
  materialId,
  aiEnabled,
}: {
  courseId: string;
  materialId?: string;
  aiEnabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/mindmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.mapId) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      router.push(`/courses/${courseId}/mindmap/${data.mapId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={run} disabled={loading || !aiEnabled}>
        <Network size={15} />
        {loading ? "Mapping concepts…" : "Generate mind map"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!aiEnabled && (
        <p className="text-sm text-amber-600">Set OPENROUTER_API_KEY to enable mind maps.</p>
      )}
    </div>
  );
}
