import { CheckCircle2, Languages, XCircle } from "lucide-react";
import { aiConfigured, env } from "@/lib/env";
import { authEnabled } from "@/lib/auth";
import { getLanguage } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { setLanguage } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

const LANGUAGES = [
  "English",
  "Deutsch",
  "Français",
  "Español",
  "Italiano",
  "Nederlands",
  "Português",
  "العربية",
  "Türkçe",
];

export default async function SettingsPage() {
  const ai = aiConfigured();
  const language = await getLanguage();
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Most configuration is read from your .env.local file."
      />
      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-medium">
            <Languages size={16} /> AI response language
          </h2>
          <p className="mb-3 text-sm text-muted">
            Summaries, flashcards, chat, tutor, quizzes, plans, reports and mind
            maps will be generated in this language.
          </p>
          <form action={setLanguage} className="flex flex-wrap items-end gap-2">
            <select
              name="language"
              defaultValue={language}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <SubmitButton pendingText="Saving…" size="sm">
              Save language
            </SubmitButton>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-medium">AI (OpenRouter)</h2>
          <Row label="API key" ok={ai} okText="configured" badText="missing — add OPENROUTER_API_KEY to .env.local" />
          <Row label="Model" value={env.openRouterModel} />
          <Row label="Summary model" value={env.summaryModel} />
          <Row label="Flashcard model" value={env.cardsModel} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-medium">Audio transcription</h2>
          <Row
            label="Provider key (OPENAI_API_KEY)"
            ok={env.transcriptionConfigured}
            okText="configured"
            badText="not set — audio uploads disabled"
            neutral
          />
          <Row label="Whisper model" value={env.whisperModel} />
          <p className="mt-2 text-xs text-muted">
            OpenRouter has no transcription endpoint, so audio uses an
            OpenAI-compatible Whisper API (set OPENAI_BASE_URL for Groq, etc.).
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-medium">App</h2>
          <Row label="App URL" value={env.appUrl} />
          <Row
            label="Login gate"
            ok={authEnabled()}
            okText="enabled (APP_PASSWORD set)"
            badText="disabled (open access)"
            neutral
          />
          <Row label="Storage dir" value={env.storageDir} />
        </Card>

        <p className="text-sm text-muted">
          Tip: run <code className="rounded bg-background px-1.5 py-0.5">npm run test:ai</code>{" "}
          to verify your OpenRouter key and model from the terminal.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  ok,
  okText,
  badText,
  neutral,
}: {
  label: string;
  value?: string;
  ok?: boolean;
  okText?: string;
  badText?: string;
  neutral?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      {value !== undefined ? (
        <span className="font-mono text-sm">{value}</span>
      ) : ok ? (
        <span className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 size={15} /> {okText}
        </span>
      ) : (
        <span
          className={
            neutral
              ? "flex items-center gap-1.5 text-sm text-muted"
              : "flex items-center gap-1.5 text-sm text-red-600"
          }
        >
          <XCircle size={15} /> {badText}
        </span>
      )}
    </div>
  );
}
