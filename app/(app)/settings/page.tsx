import { CheckCircle2, XCircle } from "lucide-react";
import { aiConfigured, env } from "@/lib/env";
import { authEnabled } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const ai = aiConfigured();
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configuration is read from your .env.local file."
      />
      <div className="space-y-4">
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
