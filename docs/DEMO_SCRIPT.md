# Demo script (target 2:15–2:50, hard stop 3:00)

No official source we could read states a video length (see
[SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md), Notes). The plan Page assumed
3 minutes, so this script stays under 3:00. The recorded cut targets **2:28**.
If the submit form or Discord gives a different limit, cut from the bottom of
the "Cut order" list.

This script was checked against the current UI (`src/components`, `src/i18n`,
`src/fixtures`, `wear/screenshots`) on **November 4, 2026**. The earlier draft
said "I read this. Is it right?"; the UI now says **"Is this information
right?"**. The old draft also included a voice-note scene that is not in the
6-clip recorded cut; voice notes remain a backup scene below.

## Rules for the recording

- Synthetic data only. Every example screen shows **EXAMPLE (synthetic data)**
  (Spanish: **EJEMPLO (datos sintéticos)**).
- Asih is an AI, not a person or doctor. No medical advice on screen or in
  narration.
- Show the data notice and the fixed scam wording verbatim; do not paraphrase
  them in narration.
- The person sends every message herself. Never show the app sending, calling,
  or booking anything.
- Mock mode shows the "Offline demo mode: example data, no AI calls." banner.
  A live recording needs the API key and credits. Never present mock results as
  live model quality.
- Narration: calm English captions plus spoken lines. About 130–150 words per
  minute; each scene's narration fits its time.

## Recorded scenes (6 clips + title/end cards)

| Time | Clip | On screen (verified current UI) | Narration (recorded lines) |
| --- | --- | --- | --- |
| 0:00–0:03 | Title | "Asih — a calm AI companion for older adults. Built with Meta Muse models." | Title line: "Asih. A calm AI companion for older adults, built with Meta Muse models." |
| 0:03–0:21 | `01-intro` | Home: Asih mark, **"Hello, I'm Asih, an AI helper. I'm not a person or a doctor. I can make mistakes. You decide every step."** Large text, EN/ES toggle, **Get help — not medical advice**. Then **Read the data notice again** → **"Before you share"** and the full notice, ending **"I understand."** | What Asih is; it is software, not a person or doctor; every example is synthetic. |
| 0:21–0:49 | `02-letter` | **Appointment letter** → **"Use example letter"** → **"EXAMPLE (synthetic data)"** → **"Is this information right?"** with Date, Time, Place, Clinic, Who you will see, Phone, What to bring, one at a time; **Confirm** / **Change** → **"Visit saved on this phone."** → **"Download calendar file (.ics)"**. Questions stay editable and verbatim. | Asih reads the example letter, shows each detail large, and waits for one-at-a-time confirmation. Nothing is saved before confirmation. |
| 0:49–1:17 | `03-invite` | **Find a group and plan to show up** → paste a short synthetic walking-group listing → **"Find activities"** → **"Listing summary"** → confirm **Date**, **Time**, **Place** one at a time → **Continue** → **"Plan for showing up"** checklist, **"You arrange the ride. This app never books rides."** → **"Invite a small group"**, editable **"Open in WhatsApp"** draft. The demo intercepts `window.open` and shows the drafted `wa.me` link and text on screen. | She pastes a listing; Asih summarizes it; she confirms date/time/place; the app drafts an invitation and opens WhatsApp, but never sends it. |
| 1:17–1:43 | `04-scam` | **Check an ad** → **"Use example ad"** → **"Warning signs I can see"** with quoted ad text → **"Important"** and the fixed wording: **"I can see these warning signs. I can't tell whether this is real or whether the product works. Check with someone you trust before paying or sharing details."** → **"Why am I seeing this ad?"**, Accounts Center, report steps, Ad Library → **"Ask someone you trust"** draft. | Asih quotes warning signs in the ad's own words. It never says "this is a scam"; it says what it cannot know and lets the person decide. |
| 1:43–2:03 | `05-spanish` | EN → **ES**, then **Revisar un anuncio** → **"Usar anuncio de ejemplo"** → **"Señales de advertencia que puedo ver"** and the fixed Spanish wording: **"Puedo ver estas señales de advertencia. No puedo decir si esto es real o si el producto funciona. Consulte con alguien de su confianza antes de pagar o compartir datos."** Draft: **"¿Puede mirar este anuncio conmigo?"** | Spanish uses formal **usted**. The same fixed warning wording and the same "you decide" rule apply. |
| 2:03–2:25 | `06-wear` | Slideshow of committed JVM screenshots in `wear/screenshots/` (label them screenshots): notice EN, home EN, settings, notice ES, home ES, reply EN. Reply: **"Appointment help is on your phone."** / **"Open Asih and take a photo of the letter."** with **"You said: …"**. | Wear OS app: ask by voice; anything needing a photo stays on the phone. Voice Transcribe hears her; Muse Wonder gives one retry for hard-to-read images. |
| 2:25–2:28 | End | "github.com/lovinta/asih" and "MIT". | "Asih is open source under the MIT license." |

## Models and privacy lines to cover

Use these facts in narration or captions, without overclaiming:

- AI companion for older adults; a few fixed flows, not open chat.
- Built with Meta Muse models: `muse-spark-1.3` (agent, vision, output
  guard), `muse-wonder-1.0` (one retry for unreadable images),
  `muse-voice-transcribe-1.0` (voice notes and the watch).
- It is an AI, not a doctor; no diagnosis, dose, treatment, or medical advice.
- It never says "this is a scam" or "this is safe". It shows warning signs and
  lets the person decide.
- Calls use `store: false`; saved visits, questions, and notes stay in the
  browser's localStorage on the phone.
- If any clip ran in fallback mock mode, say so in that clip's narration:
  "This clip uses offline mock mode, so the reply is a fixed example, not live
  model output."

## Backup scene (not in the 2:28 cut)

**Voice note.** **Voice note** → **"Use example voice note"** →
**"Transcript (may contain mistakes)"** → **"Write a reply"** →
**"Open in WhatsApp"**. Then **Get help — not medical advice**: **"This app
never calls anyone by itself."** Use only if time allows or a clip fails.

## Recording notes

- Live clips: start `next start` without `MOCK_MODE`; inherit the API key from
  the environment. Never print or write the key.
- Record each scene separately so a failed take can be replaced.
- If a live flow errors, retry once, then fall back to `MOCK_MODE=1` for that
  clip and label it mock in the narration. Keep total live calls small.
- The watch scene needs a real Wear OS watch on HTTPS, or use the committed
  JVM screenshots as stills (as this cut does).
- The microphone works only on HTTPS or localhost.
- Spanish strings still need a fluent-speaker check before publishing.

## Cut order (if the limit is shorter)

1. Drop the title/end narration (keep the cards).
2. Shorten `06-wear` to three screenshots.
3. Shorten `02-letter` to the first three confirmed fields.
4. Shorten `05-spanish` to the fixed Spanish wording only.

## Open items for Vinta

- Video length limit (check the submit form or Discord).
- Narration: her voice or captions.
- Live or mock recording (live needs her key and credits).
- Real watch or screenshots for the watch scene.
- Spanish: show it only after a fluent-speaker check.
