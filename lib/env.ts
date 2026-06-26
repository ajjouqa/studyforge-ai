// Centralised, lazily-read environment access. We avoid throwing at import time
// so the app can boot (and show helpful UI) even before keys are configured.

export const env = {
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "file:./dev.db";
  },
  get openRouterApiKey() {
    return process.env.OPENROUTER_API_KEY ?? "";
  },
  get openRouterModel() {
    return process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.7-sonnet";
  },
  // Optional per-task model overrides; fall back to the main model.
  get summaryModel() {
    return process.env.OPENROUTER_MODEL_SUMMARY ?? this.openRouterModel;
  },
  get cardsModel() {
    return process.env.OPENROUTER_MODEL_CARDS ?? this.openRouterModel;
  },
  get appUrl() {
    return process.env.APP_URL ?? "http://localhost:3000";
  },
  get appPassword() {
    return process.env.APP_PASSWORD ?? "";
  },
  get authSecret() {
    return process.env.AUTH_SECRET ?? "studyforge-dev-secret-change-me";
  },
  get storageDir() {
    return process.env.STORAGE_DIR ?? "./storage/uploads";
  },
  get whisperModel() {
    return process.env.WHISPER_MODEL ?? "whisper-1";
  },
  get transcriptionConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },
};

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}
