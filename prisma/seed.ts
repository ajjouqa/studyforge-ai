import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { prisma } from "../lib/db";
import { countWords, normalizeText } from "../lib/chunk/normalize";
import { chunkText } from "../lib/chunk/chunk";

const SAMPLE = `The cell is the basic structural and functional unit of all living
organisms. Cells were first observed by Robert Hooke in 1665. There are two
broad categories: prokaryotic cells, which lack a membrane-bound nucleus, and
eukaryotic cells, which contain a nucleus and membrane-bound organelles.

The plasma membrane is a phospholipid bilayer that controls what enters and
leaves the cell. The nucleus stores genetic information as DNA. Mitochondria are
the site of cellular respiration and produce ATP, the energy currency of the
cell. Ribosomes synthesize proteins by translating messenger RNA.

The endoplasmic reticulum comes in two forms: rough ER, studded with ribosomes,
and smooth ER, which synthesizes lipids. The Golgi apparatus modifies, sorts,
and packages proteins for secretion. Lysosomes contain digestive enzymes that
break down waste materials and cellular debris.`;

async function main() {
  const course = await prisma.course.create({
    data: {
      title: "Sample: Cell Biology",
      description: "A seeded demo course to try summaries and flashcards.",
    },
  });

  const text = normalizeText(SAMPLE);
  const material = await prisma.material.create({
    data: {
      courseId: course.id,
      type: "TEXT",
      title: "Introduction to the Cell",
      rawInput: SAMPLE,
      extractedText: text,
      wordCount: countWords(text),
      status: "READY",
    },
  });

  const chunks = chunkText(text);
  await prisma.chunk.createMany({
    data: chunks.map((c) => ({
      materialId: material.id,
      index: c.index,
      text: c.text,
      tokenCount: c.tokenCount,
    })),
  });

  console.log(`✓ Seeded course "${course.title}" (${course.id})`);
  console.log(`  Material: "${material.title}" with ${chunks.length} chunk(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
