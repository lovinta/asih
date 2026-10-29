# Demo script (3:00 maximum)

**Length.** No official source we could read states a video length (see [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md), Notes). The plan Page set 3 minutes, so this script runs 3:00 or less. If the submit form or Discord gives a different limit, cut from the bottom of the "Cut order" list.

**Rules for the recording.**
- Synthetic data only. Every example screen shows **EXAMPLE (synthetic data)**.
- Asih is an AI, not a person or doctor. No medical advice on screen or in narration.
- The data notice and the fixed scam wording are shown verbatim; do not paraphrase them in narration.
- The person sends every message herself. Never show the app sending, calling or booking anything.
- No driving scene.
- Mock mode shows the "Offline demo mode" banner. A live recording needs Vinta's API key and credits first. Never present mock results as live model quality.
- Narration: Vinta's voice or captions plus the app's read-aloud voice (Vinta decides). About 130 words per minute; each scene's narration fits its time.

## Scenes

| Time | Scene (one synthetic older adult's week) | On screen (verified UI text) | Narration (draft) |
| --- | --- | --- | --- |
| 0:00–0:15 | Meet her: 72, lives alone, weak eyesight, family on WhatsApp. | Home: Asih mark, "Hello, I'm Asih, an AI helper. I'm not a person and not a doctor. You decide every step." Large text, EN/ES. | "She's seventy-two, lives alone, and her eyes are not what they were. Asih is an AI helper, not a chatbot. She decides every step." |
| 0:15–0:25 | First share: the data notice is read aloud. | "Before you share" notice, **Read aloud**, then "I understand". | (Let the app's voice read the first line of the notice; no narration over it.) |
| 0:25–1:00 | **Monday, find a group (core 1).** She pastes a walking-group listing. | **Find a group** → "Use example listing" → confirm when and where, one at a time → "Plan for showing up" (checklist, calendar file, "You arrange the ride. This app never books rides.") → "Invite a small group": she types two neighbors' names → "Open in WhatsApp". | "She wants to meet people. Asih reads the listing, and she confirms the day, time and place herself. Then a plan to show up, and an invitation she writes and sends herself on WhatsApp." |
| 1:00–1:40 | **Tuesday, appointment letter (core 2).** A hard-to-read letter. | **Appointment letter** → "Use example letter" → "I read this. Is it right?": items in large text, one at a time; she taps **Change** on one and corrects it, then **Confirm** → "Visit saved on this phone." → "Download calendar file (.ics)"; she adds her own question. | "A letter she can't read well. Asih reads it out and shows each detail large. One is wrong, so she changes it. Nothing is saved until she confirms." |
| 1:40–2:10 | **Thursday, a suspicious ad (core 3).** | **Check an ad** → "Use example ad" → "Warning signs I can see" with quoted ad text and the fixed wording → "Why am I seeing this ad?" steps, Accounts Center and Ad Library links → "Ask someone you trust" draft. | "An ad promises a miracle. Asih quotes the warning signs it can see, says what it can't tell, and shows Meta's own tools: why this ad, and the Ad Library. It never calls an ad safe." |
| 2:10–2:30 | **The watch.** At home, her phone is in the other room. | Watch: notice acknowledged → home → she speaks a request → reply: "Appointment help is on your phone. Open Asih and take a photo of the letter." with "You said: …". | "On her watch she just asks. Asih routes the request, and anything that needs a photo stays on her phone." |
| 2:30–2:40 | Voice note and safety. | **Voice note** → "Use example voice note" → "Transcript (may contain mistakes)" → "Write a reply" → "Open in WhatsApp". Then **Get help — not medical advice**: "This app never calls anyone by itself." | "A voice note becomes large text, and she replies. Get help is always one tap away, and Asih never calls by itself." |
| 2:40–3:00 | How it works, honestly. | "How the agent worked" trace; Muse Spark 1.3, Muse Wonder 1.0, Muse Voice Transcribe 1.0; evaluation totals from an actual run (see below). | "Under the hood: Muse Spark plans and calls tools, checks its own output, and Voice Transcribe hears her. Our evaluation found a real bug, which we fixed. Here are the numbers, failures included." |

## Evaluation numbers

Use only totals from an actual run, and label them. The latest **mock-mode** run (Oct 28, 2026; checks code paths and guards, not model quality) passed 70 of 74 cases with 0 failures and 4 skipped photo cases. If a live evaluation is run before recording, show those numbers instead and say which mode they come from. Mock numbers must be labeled "mock mode".

## Recording notes

- The watch scene needs a real Wear OS watch on an HTTPS server, or the committed JVM screenshots in `wear/screenshots/` shown as stills (label them "screenshots"). The emulator is not used on the build box.
- In mock mode the watch transcript is always the example voice note, so the reply is always the appointment message above.
- The microphone works only on HTTPS or localhost.
- Record each scene separately so a failed take can be replaced (backup clips).

## Cut order (if the limit is shorter)

1. Voice note half of 2:30–2:40 (keep Get help).
2. The data-notice read-aloud (keep the notice on screen for one second).
3. Shorten 2:40–3:00 to the trace and the model names.

## Open items for Vinta

- Video length limit (check the submit form or Discord).
- Narration: her voice or captions.
- Live or mock recording (live needs her key and credits).
- Real watch or screenshots for the watch scene.
- Spanish: show it only after a fluent-speaker check.
