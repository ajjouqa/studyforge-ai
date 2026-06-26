import { YoutubeTranscript } from "youtube-transcript";

export function isYoutubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/i.test(url);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

async function fetchTitle(url: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (r.ok) {
      const j = (await r.json()) as { title?: string };
      return j.title ?? null;
    }
  } catch {
    /* best effort */
  }
  return null;
}

export async function extractYoutube(
  url: string
): Promise<{ title: string; text: string }> {
  const items = await YoutubeTranscript.fetchTranscript(url);
  const text = decodeEntities(items.map((i) => i.text).join(" "));
  const title = (await fetchTitle(url)) ?? "YouTube transcript";
  return { title, text };
}
