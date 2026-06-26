import { extractPdf } from "./pdf";
import { extractDocx } from "./docx";
import { extractPptx } from "./pptx";

export type FileKind = "pdf" | "docx" | "pptx";

export function detectKind(filename: string, mime?: string): FileKind | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (ext === "docx" || mime?.includes("wordprocessingml")) return "docx";
  if (ext === "pptx" || mime?.includes("presentationml")) return "pptx";
  return null;
}

export async function extractFile(kind: FileKind, buffer: Buffer): Promise<string> {
  switch (kind) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    case "pptx":
      return extractPptx(buffer);
  }
}
