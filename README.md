# Older adults' helper (working name)

An agent for older adults' needs and quality of life. It is not a chatbot: it has no open-ended chat mode. The demo shows three fixed flows that end with an action the person chooses:

- **Appointment help:** read an example letter, confirm each extracted item, then save the visit or download a calendar file.
- **Find a group:** review an example community event, confirm when and where it meets, plan transportation, and edit an invitation.
- **Check an ad:** review quoted warning cues, learn how to inspect ad settings and find the advertiser in Meta's Ad Library, then choose whether to share a note.

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
npm run build && npm run e2e
```

The browser test expects a production build to exist and system Chrome at `/usr/bin/google-chrome`. The smoke test runs against the deterministic mock mode and saves screenshots in `e2e/screenshots/`.

## Privacy

No model call asks the API to store its response (`store: false`). The app replays encrypted reasoning statelessly and never uses `previous_response_id` or a conversation. The data notice explains what Meta may still retain under Terms section 4.4. Saved visits, questions, and notice acknowledgment stay in this browser's localStorage; “Delete everything” clears this app's saved entries on this phone.

## Prior work disclosure

TODO (Vinta): state where the new work starts and any prior work

Repository created Oct 27, 2026 for the Meta Global AI Developer Hackathon.

## Known limits and TODOs

- Spanish needs a fluent-speaker check.
- Confirm the transit link provider (Google Maps) with Vinta.
- Voice-note flow and private participation note are not built in the UI yet.
- Indonesian support is deferred.
- An evaluation set is not built yet.
- There is no deployment.
- Choose the language before starting a flow: switching EN/ES while a result is on screen changes the app's own text, but text the agent already produced stays in the language it ran in.
- Live mode (with `META_API_KEY`) has not been run against the real Meta Model API yet; only mock mode is tested end to end.
- Not built yet from the plan: the evaluation set (about 70 cases), passcode, voice-note UI, private participation note, optional check-in and other stretch items.
- Muse Image is not used yet (the plan names no feature for it).

## License

MIT. See [LICENSE](LICENSE).
