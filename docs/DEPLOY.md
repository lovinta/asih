# Deploying Asih (prepared, not deployed)

Status: **no deployment exists.** This file prepares one. Choosing a host, creating any account, and setting a live key are Vinta's decisions. Nothing here has been run against a real host.

Verified locally on Oct 29, 2026 (Node 20.19.2): `npm run build && MOCK_MODE=1 npm start` serves `/`, `GET /api/mode` returns `{"mock":true}`, `POST /api/agent` answers from mock fixtures, and the security headers below are sent.

## Requirements

- Node.js `>=20.9.0` (the minimum for Next.js 16; set in `package.json` `engines`).
- `npm ci && npm run build`, then `npm start`. `next start` listens on `$PORT` (default 3000).
- HTTPS in front of the app. Browsers allow the microphone (voice note) only on HTTPS or `localhost`, and the Wear OS app only accepts an HTTPS server URL on a real watch.

## Environment variables

| Variable | Required | Effect |
| --- | --- | --- |
| `META_API_KEY` | No | Meta Model API key. **Secret.** Set it only in the host's secret settings, never in git. Without it the app runs in mock mode. |
| `MOCK_MODE` | No | `1` forces mock mode even if a key is set. Any other value, or unset, means live mode when a key exists. |
| `PORT` | No | Port for `npm start` (generic Node hosts). |

Both are read at request time (`src/lib/meta/mode.ts`; `/api/mode` calls `connection()`), so changing them needs a restart or redeploy but not a rebuild. `GET /api/mode` returns only `{ "mock": true|false }`, never the key.

## Mock mode

Mock mode is on when `MOCK_MODE=1` **or** `META_API_KEY` is empty. It makes no network calls and needs no key: agent, vision, guard and transcription all return deterministic fixtures, and the UI shows the offline-demo banner. All example content is labeled **EXAMPLE (synthetic data)**. This is the safe default for a public demo URL.

## Spend cap (live mode)

- `src/lib/meta/spend.ts` estimates cost from token usage (Spark $1.25/M input, $0.15/M cached input, $4.25/M output; Voice $0.18/hour) and refuses a new live call when today's estimate plus a $0.30 reservation would exceed **$10** (day = America/New_York date).
- Refused calls return HTTP **429** with a "Daily spend cap ..." message from `/api/agent` and `/api/transcribe`.
- **Limit:** the counter is in memory, per server process. It resets on restart or redeploy, and each process/instance has its own counter. On one long-running Node process it works as designed. On serverless hosts (including Vercel) several instances can each spend up to $10, and a cold start resets the count, so it is **not** a hard account limit there. The app has no login or rate limit, so anyone with a live URL can use the key's budget.
- Recommendation (Vinta decides): keep public URLs in mock mode; switch to live only while recording or judging, then remove the key.

## Checklist: generic Node host (VM, container, PaaS)

1. Node `>=20.9.0` installed; repository checked out.
2. `npm ci && npm run build`.
3. Set env vars in the host's secret store: `MOCK_MODE=1` for a public demo; `META_API_KEY` only if Vinta approves live mode.
4. Run `npm start` (one process keeps the spend counter meaningful), with `PORT` if needed, behind HTTPS.
5. Smoke test: open `/`, check `GET /api/mode`, run one flow, try the voice note over HTTPS.
6. Point the watch's **Server** setting at the HTTPS URL.

## Checklist: Vercel (not chosen yet)

1. Vinta decides on Vercel and creates or links the account and project (not done; no account was created).
2. Import the repository; Vercel detects Next.js. Build `npm run build`, default output.
3. Project Settings → Environment Variables: `MOCK_MODE=1` for the public demo; `META_API_KEY` only with Vinta's approval, ideally only for the recording window.
4. Read the spend-cap limit above: instances do not share the counter.
5. Request bodies over **4.5 MB** fail with 413 on Vercel Functions ([Vercel limits](https://vercel.com/docs/functions/limitations)). The app accepts WAV uploads up to 8 MB, so voice notes longer than about 2 minutes 20 seconds (16 kHz mono 16-bit) fail there. Images are resized to at most 1600 px JPEG before upload and stay well under the limit.
6. Smoke test as in step 5 above.

## Production config in the repo

- `next.config.ts`: `poweredByHeader: false`; headers `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self), camera=(self), geolocation=()`.
- `.env*` files are gitignored except `.env.example` (empty values).
- Server logs record token counts only, never prompts, images or transcripts.
