import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { extractDocx } from "../lib/extract/docx";
import { extractPptx } from "../lib/extract/pptx";

async function buildDocx(text: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

async function buildPptx(slides: string[]): Promise<Buffer> {
  const zip = new JSZip();
  slides.forEach((t, i) =>
    zip.file(
      `ppt/slides/slide${i + 1}.xml`,
      `<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${t}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`
    )
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("extractDocx", () => {
  it("extracts paragraph text from a docx", async () => {
    const buf = await buildDocx("Photosynthesis converts light into chemical energy.");
    const text = await extractDocx(buf);
    expect(text).toContain("Photosynthesis converts light");
  });
});

describe("extractPptx", () => {
  it("extracts text from all slides in order", async () => {
    const buf = await buildPptx(["First slide about evaporation", "Second slide about condensation"]);
    const text = await extractPptx(buf);
    expect(text).toContain("First slide about evaporation");
    expect(text).toContain("Second slide about condensation");
  });
});
