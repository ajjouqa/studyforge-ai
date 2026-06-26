# StudyForge

A personal **AI course-learning & management** web app. Organize your courses,
let AI **summarize** ("resume") your material into study notes, and auto-generate
**flashcards** you review with spaced repetition (SM-2).

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Prisma 7 / SQLite · OpenRouter** (OpenAI-compatible, one key for Claude/GPT/etc.).

## Status

- **Courses** with materials from **four sources**: pasted text, **file upload
  (PDF/DOCX/PPTX)**, **links (web articles + YouTube)**, and **audio recordings**.
- **AI summaries** (Brief/Standard/Detailed, streamed) and **rich AI flashcards**
  (difficulty, tags, related concepts, confidence rating).
- **SM-2 spaced-repetition** study sessions.
- **AI course chat (RAG)** — answers only from your materials, BM25 retrieval
  (`lib/rag/`), inline source citations.
- **AI Tutor mode** — Socratic, step-by-step, adapts to your level (beginner/
  intermediate/advanced).
- **Quiz generator** — MC / true-false / fill-blank / short-answer, with
  grading, explanations, sources, and attempt history.
- **Smart search** — global ranked search across materials, summaries,
  flashcards, and quizzes with highlighted matches.
- **AI study planner** — schedule from your exam date that prioritizes weak
  topics and adds review + spaced-repetition sessions.
- **Learning analytics** — streak, retention, study time, due cards, strong/weak
  topics, quiz scores, with charts.
- **Weekly AI report** — progress, weak areas, recommendations, exam readiness.
- **Mind maps** — interactive concept maps generated from your content.
- **Gamification** — XP, levels, streaks, daily/weekly goals, badges.

All ingestion + AI runs in **route handlers** (`app/api/...`) in the main server
process — no separate worker. Text extraction (`unpdf`, `mammoth`, `jszip`,
Readability/`jsdom`, `youtube-transcript`) happens inline on upload/import.

**Audio note:** OpenRouter has no transcription endpoint, so audio uses an
OpenAI-compatible Whisper API. Set `OPENAI_API_KEY` (and optionally
`OPENAI_BASE_URL` for e.g. Groq) in `.env.local` to enable it.

## Setup

```bash
npm install
cp .env.example .env.local        # then edit .env.local
npx prisma migrate dev            # create the SQLite database
npm run db:seed                   # optional: a sample course
npm run dev                       # http://localhost:3000
```

Add your OpenRouter key to `.env.local` to enable AI features:

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3.7-sonnet   # see https://openrouter.ai/models
```

Verify the key/model from the terminal (no UI needed):

```bash
npm run test:ai      # prints a reply + token usage, or a clear error
```

> Leave `APP_PASSWORD` empty for open local access; set it to enable a login gate.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the app (http://localhost:3000) |
| `npm run build` / `start` | Production build / serve |
| `npm test` | Unit tests (SM-2, chunking, flashcard parsing) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:studio` | Browse the database (Prisma Studio) |
| `npm run db:migrate` | Create/apply a migration |
| `npm run db:seed` | Seed a sample course |
| `npm run test:ai` | Check the OpenRouter key/model |

## How it works

- **Content** → normalized & token-chunked (`lib/chunk/`).
- **Summaries** stream token-by-token from `app/api/summaries/stream` using a
  map-reduce over chunks for long material (`lib/ai/summarize.ts`).
- **Flashcards** are generated as validated JSON (Zod) and deduped
  (`lib/ai/flashcards.ts`), then stored as a deck.
- **Spaced repetition** uses SM-2 (`lib/srs/sm2.ts`); grading a card sets its
  next due date and logs the review.

## Project layout

```
app/(app)/        pages: courses, course detail, material, deck, study, settings
app/login/        login (only used when APP_PASSWORD is set)
app/actions/      server actions (courses, materials, decks, reviews, auth)
app/api/          route handlers (streamed summaries)
components/       UI kit + client components (summary panel, study session, …)
lib/              db, ai, chunk, srs, env, auth
prisma/           schema, migrations, seed
generated/prisma/ generated Prisma client (gitignored)
```
