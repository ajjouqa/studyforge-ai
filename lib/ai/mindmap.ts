import { z } from "zod";
import { getAI } from "./client";
import { env } from "../env";
import { chunkText } from "../chunk/chunk";

const NodeSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  group: z.string().max(40).optional(),
});
const EdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().max(60).optional(),
});
export const MindMapSchema = z.object({
  nodes: z.array(NodeSchema).max(20),
  edges: z.array(EdgeSchema).max(40),
});
export type MindMapData = z.infer<typeof MindMapSchema>;

export async function generateMindMap(input: {
  title: string;
  text: string;
}): Promise<MindMapData> {
  const ai = getAI();
  const text = chunkText(input.text)
    .slice(0, 3)
    .map((c) => c.text)
    .join("\n\n");

  const res = await ai.chat.completions.create({
    model: env.summaryModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Build a concept map of the key concepts and how they relate.
Return ONLY JSON: {"nodes":[{"id":"c1","label":"Concept","group":"theme"}],"edges":[{"source":"c1","target":"c2","label":"relationship"}]}
- 8 to 15 nodes with short ids (c1, c2, …).
- Edges connect related concepts with a short relationship label.
- Ground everything in the material; do not invent concepts.
No markdown, no commentary.`,
      },
      { role: "user", content: `Material: "${input.title}"\n\n${text}` },
    ],
  });

  const raw = (res.choices[0]?.message?.content ?? "{}")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Could not build a mind map. Try again.");
  }
  const result = MindMapSchema.safeParse(parsed);
  if (!result.success || result.data.nodes.length === 0) {
    throw new Error("Could not build a mind map. Try again.");
  }
  const ids = new Set(result.data.nodes.map((n) => n.id));
  const edges = result.data.edges.filter(
    (e) => ids.has(e.source) && ids.has(e.target)
  );
  return { nodes: result.data.nodes, edges };
}
