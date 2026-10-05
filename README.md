# Sideman

An AI jazz piano teacher for the browser: upload a lead sheet, get the chords extracted, and practice voicings with a piano diagram and microphone chord recognition.

[![CI](https://github.com/sarpvulas/Sideman/actions/workflows/ci.yml/badge.svg)](https://github.com/sarpvulas/Sideman/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## TL;DR

Learning jazz comping means translating chord symbols into voicings and checking your own playing by ear. Sideman reads a lead sheet with Gemini Vision, turns each bar into a practice target, and listens through the microphone to tell you whether you played the chord. It is an early-stage prototype: the core flow runs end to end, but progress is not persisted.

> TODO(sarp): add screenshot after deploy

## What it does today

Verified in the code and by running the API routes locally:

- **Score analysis.** Upload a PDF, PNG or JPEG (max 4 MB). `POST /api/score/upload` sends it to Gemini (`gemini-2.5-pro`) and returns title, key, time signature and per-bar chord symbols, voicing notes and a suggested improvisation mode. Without an API key it serves a built-in sample lead sheet, flagged `isSample` in the response and labelled "Sample score" in the UI. With a key set, a failed analysis returns 502 ("Could not analyze this lead sheet...") instead of the sample.
- **Lessons.** Start a lesson from an analysis and step through the bars with a piano keyboard diagram.
- **Microphone chord recognition.** Runs in the browser: FFT, pitch detection and chord inference live in `src/lib/audio` and are unit tested. An attempt is judged correct when the detected chord matches the bar's chord and the voicing type is `shell`.
- **Voicing exercises.** `src/lib/exercises/voicing-generator.ts` builds shell, two rootless, drop-2 and full voicings for a chord symbol, with audio playback. `POST /api/exercise/generate` asks Gemini (`gemini-2.5-flash`) for exercises instead.
- **Coaching.** `POST /api/coaching` returns written feedback from Gemini (`gemini-2.5-pro`), or canned fallback feedback when no key is set.

## Tech stack

Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, Zod, Google Generative AI SDK, Vitest and React Testing Library.

## Quickstart

Requires Node 20 or newer.

```bash
npm ci
cp .env.example .env.local   # optionally add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run build
```

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For AI features | Server-side only. Without it, uploads return the labelled sample lead sheet, coaching uses fallback text, and exercise generation returns 503. |
| `RATE_LIMIT_PER_HOUR` | No | Max Gemini-backed requests per client IP per hour (only requests that reach Gemini count). Default 20. |

## Deploying to Vercel

1. Import the repository in Vercel (framework preset: Next.js, no build overrides).
2. Set `GEMINI_API_KEY` for Production (and Preview if wanted). Optionally set `RATE_LIMIT_PER_HOUR`.
3. Deploy, then upload a lead sheet and play a chord to check the full flow.

Set a budget alert on the Google AI Studio key. The built-in rate limit is in-memory and per instance, so it reduces abuse but is not a hard cap. It only holds behind a proxy that overwrites `x-forwarded-for` and `x-real-ip`, as Vercel does. On other hosts a client controls both headers, and one spoofed value bypasses the limit.

## Limitations

- Lessons and analyses are stored in server memory and capped at 200 per store. A lesson expires 1 hour after it starts (updating it does not extend that), and starting a lesson refreshes its analysis so the two expire together. Data is lost on restart and may not be shared between serverless instances. If a lesson is gone when its page loads, the page says "Your uploaded lead sheet is no longer available. Upload it again."; if it disappears while you are practicing, the next attempt or coaching request fails with "Lesson not found" rather than being scored against another score.
- The Gemini success paths (score analysis, exercises, coaching) are covered only by mocked tests; they were not run against the live API during the audit.
- The progress page shows static sample numbers; `/api/progress` returns hard-coded values and nothing is persisted.
- Attempts are always scored against the shell voicing.
- Chord extraction quality depends on Gemini and has not been benchmarked.
- Uploads are limited to 4 MB to fit Vercel's request body limit.
- The microphone chord recognizer has unit tests but has not been evaluated on recorded piano audio.
- `tests/integration` and `tests/e2e` do not exist; only unit tests are present.

## License and author

MIT, see [LICENSE](LICENSE). Built by Hüseyin Sarp Vulaş (Dubai; MSc Computational Finance, King's College London).
LinkedIn: <https://www.linkedin.com/in/sarpvulas/>
