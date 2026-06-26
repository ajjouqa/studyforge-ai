import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function extractWebArticle(
  url: string
): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; StudyForgeBot/1.0; +https://github.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Could not fetch page (HTTP ${res.status}).`);

  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Readability extracts the main article and strips nav/ads.
  const article = new Readability(doc).parse();
  if (article?.textContent && article.textContent.trim().length > 50) {
    return { title: article.title || url, text: article.textContent };
  }

  // Fallback: raw body text.
  const body = doc.body?.textContent ?? "";
  return { title: doc.title || url, text: body };
}
