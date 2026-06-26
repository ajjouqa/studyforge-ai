import OpenAI from "openai";
import { env } from "../env";

// OpenRouter exposes an OpenAI-compatible API, so we use the OpenAI SDK pointed
// at OpenRouter's base URL. One key unlocks many models (Claude, GPT, etc.).
let _client: OpenAI | null = null;

export function getAI(): OpenAI {
  if (!env.openRouterApiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env.local to use AI features."
    );
  }
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.openRouterApiKey,
      defaultHeaders: {
        // Recommended by OpenRouter for attribution / rankings.
        "HTTP-Referer": env.appUrl,
        "X-Title": "StudyForge",
      },
    });
  }
  return _client;
}
