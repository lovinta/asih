# Asih

An agent for older adults' needs and quality of life. It is not a chatbot: it has no open-ended chat mode. The demo shows three fixed flows that end with an action the person chooses:

## Persona: Asih

Asih is a plain-spoken AI helper. Asih is honest about being an AI, not a person or doctor. The person decides every step. Use short, plain sentences, with care and patience. Do not use pet names or exclamation marks. In Spanish, use formal “usted.”

The Asih mark (`public/asih-avatar.svg`, also the watch launcher icon) is hand-drawn and abstract: a calm ring with a small spark that signals AI, with no face. TODO: a Muse Image (`muse-image-1.0`) version could replace it later, once the app has a Meta API key.

- **Appointment help:** read an example letter, confirm each extracted item, then save the visit or download a calendar file.
- **Find a group:** review an example community event, confirm when and where it meets, plan transportation, and edit an invitation.
- **Check an ad:** review quoted warning cues, learn how to inspect ad settings and find the advertiser in Meta's Ad Library, then choose whether to share a note.
- **Voice note:** record or upload audio, read the transcript, then edit a reply before opening WhatsApp or asking Asih about it.
- **My activity notes:** save a private participation note on this phone and optionally edit a caption to share.

All offline example content is synthetic and labeled **EXAMPLE (synthetic data)**.

## Safety design

- No medical advice. A red-flag pre-screen redirects urgent phrases to the Get help screen before an agent runs. The app never calls emergency services by itself.
- Scam wording is fixed in code. The agent can list cues with exact ad text evidence but cannot give an ad a safe/scam verdict.
- Dates, times, places, and names must be confirmed one at a time before they can be saved, exported, or used in a draft.
- Before the first photo, voice note, or message is sent, the app displays and reads aloud this notice and requires acknowledgment:

  > Your saved items stay on this phone. To read a photo or voice note, it is sent to Meta's AI service. Meta says it does not use it to train its AI. This app tells Meta not to store its answers. Meta may still keep what is sent as needed to run the service, follow the law, and check for misuse and safety; it does not say for how many days. Delete everything removes what is saved on this phone. It cannot remove what Meta may have kept.

- An output guard checks content before it is shown. Live calls have a $10/day spend guard.

## Models and tools

The live agent loop uses `muse-spark-1.3` through the Responses API for tool use, vision, and an output-guard check. `muse-wonder-1.0` gets one retry for unreadable images only. Voice transcription uses `muse-voice-transcribe-1.0` at `/v1/asr/transcribe`.

Calls set `store: false` and request encrypted reasoning content. The app uses stateless encrypted reasoning replay: it resends its own input-item history, with no `previous_response_id` or conversation. These controls do not determine all service retention. Meta may still keep submitted content as needed to provide the service, comply with law, and detect abuse or safety issues under [Meta Model API Terms of Service, section 4.4](https://dev.meta.ai/legal/terms-of-service).

## Voice notes

The browser converts uploaded or recorded audio to mono 16-bit PCM WAV at 16 kHz and posts it to this app's `/api/transcribe` endpoint. In live mode, the server sends Meta Voice Transcribe a multipart request with a JSON `request` part (`model`, `mode`, `audioEncoding`, and `languageBias`) and an `audio` part containing the WAV. `store: false` is not used by this endpoint; the transcribe client does not send that field. The data notice applies before recording or upload. The transcript is shown before any other action.

## Private activity notes

Activity notes and optional share captions are kept in this browser's localStorage under the app's `oah.` key prefix. They do not make a network request. “Delete everything” removes them with the other app data.

The ad flow links to Meta's transparency tools: the "Why am I seeing this ad?" menu on each ad (walk-through steps in the app), [Accounts Center ad preferences](https://www.facebook.com/help/943858526073065), and [Ad Library](https://www.facebook.com/ads/library/). Invitations use WhatsApp click-to-chat (`https://wa.me/?text=...`); the person chooses recipients and sends. This project was built with Muse Code.

## Setup

```sh
npm install
cp .env.example .env.local
# Optionally set META_API_KEY in .env.local for live mode.
# Set MOCK_MODE=1 for the deterministic offline demo.
npm run dev
```

Run checks and the browser smoke test:

```sh
npm test
npm run build && E2E_PORT=3125 npm run e2e
```

The browser test expects a production build to exist and system Chrome at `/usr/bin/google-chrome`. The smoke test runs against the deterministic mock mode and saves screenshots in `e2e/screenshots/`.

## Deploy checklist

There is no deployment yet. Details, env vars and limits are in [docs/DEPLOY.md](docs/DEPLOY.md).

- [ ] Vinta chooses a host (generic Node host or Vercel; not chosen).
- [ ] `npm ci && npm run build && npm start` on Node `>=20.9.0`, behind HTTPS.
- [ ] Set `MOCK_MODE=1` for a public demo. Mock mode needs no key and makes no network calls.
- [ ] Set `META_API_KEY` in the host's secret settings only if Vinta approves live mode.
- [ ] Know the spend cap: $10/day per server process, in memory; not shared across serverless instances; resets on restart.
- [ ] Vercel only: request bodies over 4.5 MB fail, so long voice notes (over about 2 min 20 s) fail there.
- [ ] Smoke test `/`, `/api/mode`, one flow, and the voice note; set the watch's Server URL.

## Privacy

No model call asks the API to store its response (`store: false`). The app replays encrypted reasoning statelessly and never uses `previous_response_id` or a conversation. The data notice explains what Meta may still retain under Terms section 4.4. Saved visits, questions, and notice acknowledgment stay in this browser's localStorage; “Delete everything” clears this app's saved entries on this phone.

## Prior work disclosure

What the repository shows (checkable with `git log`):

- This repository was created for the Meta Global AI Developer Hackathon. The first commit is Oct 27, 2026, 18:06 ET ("Scaffold Next.js app, MIT license, build spec"); the event ran from Oct 26, 2026. All commits in it were made during the event.
- The web app (`src/`), Wear OS app (`wear/`), evaluation set (`eval/`), browser smoke test (`e2e/`) and synthetic example content (`src/fixtures/`) were written in this repository during the event. The starting point was the standard Next.js app template, as the first commit's name says.
- The build spec ([docs/SPEC.md](docs/SPEC.md)) is taken from Vinta's plan written for this hackathon (Oct 27, 2026).
- Open-source dependencies are used under their own licenses and are not claimed as our work: Next.js, React, the OpenAI JavaScript SDK (pointed at Meta's API), Vitest, Playwright, and on the watch AndroidX, Jetpack Compose for Wear OS, OkHttp, Robolectric and Roborazzi. See `package.json` and `wear/app/build.gradle.kts`.
- Model calls use Meta's Model API (Muse Spark 1.3, Muse Wonder 1.0, Muse Voice Transcribe 1.0).

Author's answers:

- **Prior code and designs:** none. All code and design is new work built for this hackathon.
- **Background research:** Asih's design draws on my own unpublished literature review on designing AI interfaces for older adults (Lovinta Atrinawati, 2026), a spreadsheet of article summaries and design implications that I wrote alone. That spreadsheet is not included in this repository. The round 1 research write-up and simulated persona study made during the hackathon are in [docs/research/](docs/research/).
- **AI coding help:** This project was built with Muse Code.
- **Team:** solo, Lovinta Atrinawati.

**Problem statement:** Build for Your World.

## Known limits and TODOs

- Confirm the transit link provider (Google Maps) with Vinta.
- Spanish needs a fluent-speaker check, including new voice-note and activity-note strings.
- Indonesian support is deferred.
- There is no deployment. See [docs/DEPLOY.md](docs/DEPLOY.md).
- Choose the language before starting a flow: switching EN/ES while a result is on screen changes the app's own text, but text the agent already produced stays in the language it ran in.
- Live mode (with `META_API_KEY`) has been run against the real Meta Model API with the opt-in runner `e2e/live.mjs`; run logs are in `e2e/live-results/`. Mock mode is the only mode tested end to end in CI.
- Not built yet from the plan: passcode, optional check-in and other stretch items. The evaluation set is in [`eval/`](eval/README.md).
- Muse Image is not used yet (the plan names no feature for it).

## License

MIT. See [LICENSE](LICENSE).

## Wear OS watch app

A native Wear OS companion app is in [`wear/`](wear/README.md). Real watches require an HTTPS server URL set in the watch's **Server** settings; HTTP is limited to emulator and local development hosts.
