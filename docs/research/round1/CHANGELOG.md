# Round 1 changelog — Asih older-adult copy and guardrail changes

This file lists every change made in round one, why it was made, the guideline and reference it follows, and the simulated reviewer(s) who raised it. Guidelines and reference numbers refer to `../older-adults-chatbot-guidelines.md`. Personas and reviews refer to `personas.md` and `reviews.md`.

**Scope kept:** `store: false` is unchanged. No features were added. All runs used `MOCK_MODE=1`; no live calls were made. The `META_API_KEY` environment variable was never read or printed; the persona runner deletes it before loading any agent code.

## Baseline (before round-one changes)

The repository already followed most of the guidelines: no pet names or exclamation marks, formal Spanish "usted", one-at-a-time confirmation, read-aloud and speech-rate controls, honest AI/not-doctor intro, no medical advice, no safe/scam verdict, fixed scam wording that points to a trusted person, and no automatic sending. The changes below close specific gaps found by the guidelines and then by the five simulated reviews.

## Changes

### 1. Expanded the live system prompt (`src/lib/agent/tools.ts`, `langInstructions`)

**What changed.** Added explicit rules: one idea at a time and mostly two short sentences; no baby talk, flattery, praise for obedience, or "just/simply"; no idioms, jargon, or unexplained abbreviations; never rush or use urgency; ask before acting and let the person decide every step; say when unsure; do not claim feelings, a body, memories, or a human life; Spanish uses natural Spanish and must not force English date/place formats into Spanish.

**Why.** The original prompt said "short, plain sentences" and "no pet names", but it did not prohibit the rest of the elderspeak package, did not set a length target, and did not require stating uncertainty. The reviews of P1, P2, and P5 all valued the honesty; P1 and P4 asked for less abrupt, less long output.

**Guideline / reference.** G1, G2, G3, G4, G6, G7, G9, G11; references [1], [2], [3], [4], [6], [7], [10], [13], [14].

**Reviewer.** P1 Maggie, P2 Daniel, P4 Budi, P5 Helen.

### 2. Rewrote the fixed safe reply (`src/lib/safety/outputGuard.ts`, `src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** The reply now says it cannot help, states "I'm an AI helper, not a doctor", gives the Get help / trusted-person options, and ends with "You decide what to do next." Spanish mirrors this with "un programa de inteligencia artificial, no un médico" and "Usted decide qué hacer."

**Why.** The old reply was shorter but did not restate the AI/not-doctor limit and did not return the decision to the person. P2 and P5 both said they trusted the app more when it named its limits.

**Guideline / reference.** G6, G7, G9; references [6], [7], [10].

**Reviewer.** P2 Daniel, P5 Helen.

### 3. Opening copy now names fallibility (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** English: "Hello, I'm Asih, an AI helper. I'm not a person or a doctor. I can make mistakes. You decide every step." Spanish: "Hola, soy Asih, un programa de inteligencia artificial. No soy una persona ni un médico. Puedo cometer errores. Usted decide cada paso." The Spanish version also avoids the gendered "una asistente" TODO.

**Why.** Older adults in the HCI literature personify voice assistants and may over-trust them [7]; trust should be calibrated to actual capability [6]. Saying "I can make mistakes" is a short, concrete honesty cue. P1 and P5 both cited this as a reason to trust the app.

**Guideline / reference.** G6, G7, G11; references [6], [7], [14].

**Reviewer.** P1 Maggie, P3 Rosa, P5 Helen.

### 4. Home subtitle corrected and made honest (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** "Four kinds of help. No chat." became "A few kinds of help. No open chat." Spanish: "Varios tipos de ayuda. Sin chat abierto."

**Why.** The home screen shows five main actions, not four, so the old count was wrong. "No open chat" is not a limitation hidden from the person; it is stated plainly so the person does not expect an open conversation.

**Guideline / reference.** G4, G6; references [4], [6].

**Reviewer.** P5 Helen.

### 5. Honest "no open conversation" reply (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** The unknown-intent reply now says: "I can't have an open conversation. I can help with visits, groups, and ads. Which one would you like?" Spanish: "No puedo tener una conversación abierta. Puedo ayudarle con visitas, grupos y anuncios. ¿Cuál prefiere?"

**Why.** P1, P4, and P5 asked for company or help with several questions. The old reply ("I can help with visits, groups and ads.") was honest but did not say why it could not talk, and did not hand the choice back. The new reply states the limit and offers choices without pretending to be a friend.

**Guideline / reference.** G6, G7, G9; references [6], [7], [10].

**Reviewer.** P1 Maggie, P4 Budi, P5 Helen.

### 6. Ad hand-off now states it cannot verify identity (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** The phone-ad reply now says: "I can't check who is behind an ad. To check the ad, open Check an ad and add a photo or the ad text." Spanish: "No puedo comprobar quién está detrás de un anuncio. Para revisar el anuncio, abra Revisar un anuncio y agregue una foto o el texto del anuncio."

**Why.** P2 asked whether the person in the ad was actually a doctor. The old reply only explained how to open the ad check, which did not answer the question. The new copy is honest about the limit without claiming to verify credentials.

**Guideline / reference.** G6, G7, G8; references [6], [8], [9].

**Reviewer.** P2 Daniel.

### 7. Plain-language flow name (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** The Flow C screen and submit button changed from "Health-scam and ad check" / "Revisión de anuncios y estafas de salud" to "Check an ad" / "Revisar un anuncio". The voice entry point now says "Check an ad" / "Revisar un anuncio" too.

**Why.** The old title was long and technical. It also differed from the home button ("Check an ad"), so the person had to recognize two names for the same thing. P1 and P3 both preferred the plain wording.

**Guideline / reference.** G4; references [4], [5].

**Reviewer.** P1 Maggie, P3 Rosa.

### 8. Shorter Flow C headings and a clearer limits statement (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** "Please read this" became "Important" / "Importante". "Here is what I can see in this ad." became "Here is what I can and cannot tell you." / "Esto es lo que puedo y no puedo decirle."

**Why.** "Please read this" is a command and adds little. The old intro did not state the limit; the new one does. P5 and P1 wanted to know what the app could and could not do before relying on the ad result.

**Guideline / reference.** G2, G6, G7; references [3], [6], [7].

**Reviewer.** P1 Maggie, P5 Helen.

### 9. Plain cue label (`src/i18n/en.ts`)

**What changed.** English cue label "Hurry pressure" became "Pressure to act quickly".

**Why.** "Hurry pressure" is awkward English and less concrete. The new label says what the ad is doing. Spanish already used "Presión para actuar rápido."

**Guideline / reference.** G4; references [4], [5].

**Reviewer.** P1 Maggie.

### 10. Loading copy sets a realistic expectation (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** "Working on it." became "Working on it. This can take a moment." / "Estoy trabajando. Esto puede tomar un momento."

**Why.** The agent loop can take several tool steps. A one-word spinner can feel like nothing is happening, especially for a person with hearing or vision limits. The new copy is still short and does not add urgency. Spanish also switched from "Estamos" (we) to "Estoy" (I), which matches a single AI helper.

**Guideline / reference.** G2, G6; references [3], [6].

**Reviewer.** P1 Maggie, P5 Helen.

### 11. Do not invent an advertiser for a pasted ad (`src/lib/agent/runFlow.ts`)

**What changed.** In mock mode, the example advertiser "EverFlex Labs" is now used only for the synthetic example ad. A pasted or photographed ad with no extracted advertiser stays "unknown" and the UI uses "this advertiser" / "este anunciante".

**Why.** The old mock fallback replaced an unknown advertiser with the example advertiser, which could make a real pasted ad look as if it came from EverFlex Labs. That is a fabricated fact and a trust/safety problem. P2 and P4 both noticed the app said "this advertiser" (after the fix) and preferred that honesty.

**Guideline / reference.** G7, G8; references [6], [8], [9].

**Reviewer.** P2 Daniel, P4 Budi.

### 12. Quote the sentence, not the whole paragraph (`src/lib/agent/tools.ts`, `quoteEvidence`)

**What changed.** For a short line (80 characters or fewer), `quoteEvidence` still returns the whole line, preserving the exact fixture quotes. For a longer pasted paragraph, it now returns only the sentence around the match.

**Why.** P2, P3, and P4 saw the same whole paragraph repeated as evidence for every warning sign. That made it impossible to tell which words triggered which warning. The new behavior gives evidence such as "Only 2 left." and "Message us on WhatsApp." instead of the whole ad.

**Guideline / reference.** G4, G7; references [4], [5], [6].

**Reviewer.** P2 Daniel, P3 Rosa, P4 Budi.

### 13. Clearer confirmation heading (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** "I read this. Is it right?" became "Is this information right?"; "Leí esto. ¿Es correcto?" became "¿Es correcto este dato?"

**Why.** The first-person "I read this" was ambiguous: it could sound as if the person had missed a step. P1, P3, and P5 all flagged it. The new heading asks about the information, not about who read it.

**Guideline / reference.** G4, G5, G9; references [3], [4], [5], [10].

**Reviewer.** P1 Maggie, P3 Rosa, P5 Helen.

### 14. Split long ad instructions (`src/i18n/en.ts`, `src/i18n/es.ts`)

**What changed.** "Tap the three dots on the ad, then tap 'Why am I seeing this ad?' to see what the advertiser targeted." became three short sentences. "To report an ad: tap the three dots on the ad, then tap Report ad." became two short sentences. Spanish mirrors the change.

**Why.** P1, P2, P4, and P5 all said the ad steps were long and hard to follow. One idea per sentence follows the chunking guidance and helps working memory.

**Guideline / reference.** G2, G4; references [3], [4], [5].

**Reviewer.** P1 Maggie, P2 Daniel, P4 Budi, P5 Helen.

### 15. Spanish invitation no longer mixes English dates into Spanish grammar (`src/i18n/es.ts`)

**What changed.** The Spanish invitation template became: "Hola{names}. Le invito a {event}. Fecha: {date}. Hora: {time}. Lugar: {place}. Avíseme si le gustaría venir." It keeps formal address and no pressure, but uses labelled fields instead of forcing an English date into "el {date} a las {time}".

**Why.** P3 saw "el Saturday, November 7, 2026 a las 9:00 AM", which is mixed-language and grammatically wrong. Labelled fields are clearer and remain correct even while the mock fixture values are still English.

**Guideline / reference.** G3, G11; references [10], [13], [14].

**Reviewer.** P3 Rosa.

### 16. Test updates and additions

- `src/i18n/parity.test.ts`: asserts the new non-patronizing/honesty prompt rules and the fallback/opening/no-chat identity copy.
- `src/lib/safety/outputGuard.test.ts`: asserts the fixed reply names AI limits and returns the decision to the person.
- `src/lib/agent/flows.test.ts`: adds a custom-advertiser honesty test, checks sentence-level evidence for a one-paragraph ad, and updates the Spanish invitation assertion.
- `e2e/smoke.mjs`: updates the exact opening-copy assertion.

### Independent review fixes

- `quoteEvidence` now finds sentence boundaries without splitting on abbreviations such as "Mr.", "Dr.", or "Mrs." or on decimals such as "9.99", and still returns the whole line when there is no terminal punctuation.
- Flow C mock image uploads again fall back to `EXAMPLE_AD_TEXT` when the extracted text is empty. The advertiser stays unknown except for the synthetic example, so pasted text still gets no invented advertiser.
- The Spanish invitation now says "Le invito al grupo {event}" and renders names correctly as "Hola Ana, Luis." (tests cover both the group wording and the names).
- Flow C keeps the heading "Check an ad" / "Revisar un anuncio" and now uses the submit label "Check this ad" / "Revisar este anuncio" (updates item 7).
- The Wear intro now names fallibility ("I can make mistakes") and uses gender-neutral Spanish ("un programa de inteligencia artificial ... Puedo cometer errores"), matching the phone copy.

## Issues raised but deliberately not fixed

| Issue | Reviewer | Why not fixed |
|---|---|---|
| "EXAMPLE (synthetic data)" is jargon | P1 | The project spec and README require this exact label on every synthetic fixture. Changing it is a product/spec decision. A plain-language explanation next to the label is the next step. |
| Spanish screens show English fixture values (dates, places, "photo ID") | P3 | The mock fixtures are English-only and translated dates would affect calendar parsing. Needs localized fixtures or live extraction plus a fluent-speaker check. |
| No Indonesian language support | P4 | Indonesian is explicitly deferred in the README. Adding a language is a feature, not a copy edit. |
| Example group is always a walking group, even for "music" | P5 | This is a deterministic mock-fixture limitation; live mode uses the shared listing. Replacing it would require new fixtures, not a copy fix. |
| "No open conversation" does not triage three questions | P5 | Adding a suggested order of steps would be a new interaction feature. The honest limit and the three choices were the in-scope improvement. |
| Spanish fluent-speaker check | P3 | Still needed; this round used formal "usted" and natural phrasing but cannot replace a native review. |

## Verification

- `npx tsc --noEmit` — pass.
- `npx eslint .` — pass.
- `npx vitest run` — pass (see final summary for counts).
- Persona transcripts regenerated with `node docs/research/round1/run-personas.mjs` in `MOCK_MODE=1`; baseline copies are in `transcripts/baseline/`, after-revision copies in `transcripts/`.
