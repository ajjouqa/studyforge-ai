"use client";

import { useMemo, useState } from "react";

type Node = { id: string; label: string; group?: string };
type Edge = { source: string; target: string; label?: string };

const PALETTE = ["#4f46e5", "#0891b2", "#16a34a", "#d97706", "#db2777", "#7c3aed"];

export function MindMapView({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const W = 760;
  const H = 600;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 90;

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(1, nodes.length) - Math.PI / 2;
      m.set(n.id, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    });
    return m;
  }, [nodes, cx, cy, R]);

  const groups = useMemo(
    () => [...new Set(nodes.map((n) => n.group ?? "default"))],
    [nodes]
  );
  const colorFor = (g?: string) =>
    PALETTE[groups.indexOf(g ?? "default") % PALETTE.length];

  const nodeActive = (id: string) =>
    sel === null ||
    sel === id ||
    edges.some(
      (e) =>
        (e.source === sel && e.target === id) ||
        (e.target === sel && e.source === id)
    );
  const edgeActive = (e: Edge) => sel === null || e.source === sel || e.target === sel;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      {edges.map((e, i) => {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) return null;
        return (
          <g key={i} opacity={edgeActive(e) ? 0.9 : 0.1}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--border)"
              strokeWidth={1.5}
            />
            {e.label && edgeActive(e) && (
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2}
                fontSize={9}
                fill="var(--muted)"
                textAnchor="middle"
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const active = nodeActive(n.id);
        return (
          <g
            key={n.id}
            opacity={active ? 1 : 0.25}
            onClick={() => setSel(sel === n.id ? null : n.id)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={sel === n.id ? 9 : 6}
              fill={colorFor(n.group)}
            />
            <text
              x={p.x}
              y={p.y - 12}
              fontSize={11}
              fontWeight={sel === n.id ? 600 : 400}
              textAnchor="middle"
              fill="var(--foreground)"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
