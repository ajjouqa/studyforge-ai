// Clears all data (cascades through materials, decks, summaries, cards).
// Pair with `npm run db:seed` — or use `npm run db:reset` which does both.
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { prisma } from "../lib/db";

async function main() {
  const { count } = await prisma.course.deleteMany({});
  console.log(`✓ Cleared ${count} course(s) and all related data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
