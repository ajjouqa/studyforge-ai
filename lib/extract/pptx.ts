import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

// PPTX is a zip of XML; slide text lives in <a:t> runs inside ppt/slides/slideN.xml.
const parser = new XMLParser({ ignoreAttributes: true, textNodeName: "#text" });

function collectText(node: unknown, out: string[]): void {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collectText(n, out);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "a:t") {
      if (typeof value === "string") out.push(value);
      else if (Array.isArray(value))
        value.forEach((v) => typeof v === "string" && out.push(v));
      else if (value && typeof value === "object" && "#text" in value)
        out.push(String((value as Record<string, unknown>)["#text"]));
    } else {
      collectText(value, out);
    }
  }
}

export async function extractPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0);
      return na - nb;
    });

  const slides: string[] = [];
  for (const p of slidePaths) {
    const xml = await zip.files[p].async("string");
    const out: string[] = [];
    collectText(parser.parse(xml), out);
    if (out.length) slides.push(out.join(" "));
  }
  return slides.join("\n\n");
}
