import { search } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const results = await search(q);
  return Response.json({ results });
}
