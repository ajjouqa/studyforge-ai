import { createProcessedMaterial } from "@/lib/materials";
import { extractWebArticle } from "@/lib/extract/web";
import { extractYoutube, isYoutubeUrl } from "@/lib/extract/youtube";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    courseId?: string;
    url?: string;
  } | null;
  const courseId = body?.courseId;
  const url = body?.url?.trim();
  if (!courseId) return Response.json({ error: "courseId required" }, { status: 400 });
  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
  }

  const youtube = isYoutubeUrl(url);
  let result: { title: string; text: string };
  try {
    result = youtube ? await extractYoutube(url) : await extractWebArticle(url);
  } catch (e) {
    return Response.json(
      {
        error: youtube
          ? "Could not get a transcript (captions may be disabled or unavailable). You can paste the transcript manually."
          : `Could not read this page: ${
              e instanceof Error ? e.message : "extraction error"
            }`,
      },
      { status: 422 }
    );
  }

  const material = await createProcessedMaterial({
    courseId,
    type: "LINK",
    title: result.title,
    rawText: result.text,
    sourceUrl: url,
    emptyError: youtube
      ? "No transcript text found for this video."
      : "Could not extract readable text from this page.",
  });

  return Response.json({
    materialId: material.id,
    courseId,
    status: material.status,
    error: material.error,
  });
}
