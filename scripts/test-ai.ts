// Isolated OpenRouter connectivity check. Run: npm run test:ai
// Verifies your OPENROUTER_API_KEY + OPENROUTER_MODEL work before touching the UI.
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // .env fallback

import OpenAI from "openai";

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.7-sonnet";
  if (!apiKey) {
    console.error("✗ OPENROUTER_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "StudyForge",
    },
  });

  console.log(`→ Calling ${model} via OpenRouter...`);
  const res = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: "Reply with exactly: pong" }],
    max_tokens: 16,
  });

  console.log("✓ Reply:", res.choices[0]?.message?.content);
  console.log("✓ Usage:", res.usage);
}

main().catch((err) => {
  console.error("✗ AI call failed:", err?.message ?? err);
  console.error(
    "  401 = bad key · 400/404 = wrong model id (check https://openrouter.ai/models)"
  );
  process.exit(1);
});
