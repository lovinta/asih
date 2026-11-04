# Round 1 persona reviews — SIMULATED, not real participants

**These reviews are written in character for the five fictional personas in `personas.md`. They are not real user research and must not be reported as such.** Each review is grounded in the actual mock-mode transcripts in `transcripts/baseline/` (before revision) and `transcripts/` (after revision). Scores are 1–5, where 1 is poor and 5 is excellent. Ratings are the author's simulated judgment, not measurements.

## Score summary

| Persona | Clarity before | Trust before | Respect before | Safety before | Overall before | Overall after |
|---|---:|---:|---:|---:|---:|---:|
| P1 Maggie (78, English) | 4 | 4 | 4 | 5 | 4 | 5 |
| P2 Daniel (67, English) | 3 | 4 | 5 | 5 | 3 | 5 |
| P3 Rosa (82, Spanish) | 3 | 4 | 4 | 5 | 3 | 4 |
| P4 Budi (74, English / Indonesian) | 3 | 4 | 4 | 5 | 3 | 4 |
| P5 Helen (91, English) | 3 | 5 | 5 | 5 | 4 | 4 |
| **Average** | **3.2** | **4.2** | **4.4** | **5.0** | **3.4** | **4.4** |

The "after" column is the overall score after the revisions described in `CHANGELOG.md`. The detailed after-scores are at the end of each review. Before-revision average overall was **3.4** across the five overall scores; after-revision average overall is **4.4**. Before-revision average across all five dimensions was **4.04**; after-revision average across all five dimensions is **4.6**.

---

## P1 — Margaret "Maggie" Whitfield (78, English)

**Before revision.** I used the example letter, the example walking group, and the example ad. I also asked whether Asih could talk with me because I was feeling low.

**What worked.** The screen told me right away that Asih is an AI and not a doctor, and it said it can make mistakes. That matters to me. The appointment letter was read back in seven separate pieces, and I did not have to hold all of them in my head. The big text and the read-aloud control helped. The ad check listed the warning signs with the exact ad words in quotes, and it did not tell me the product was safe. It told me to check with someone I trust before paying or sharing details. I liked that it did not call me "dear" or "sweetie."

**What confused or upset me.** The label "EXAMPLE (synthetic data)" is not plain English. I did not know what "synthetic" meant until my granddaughter explained it. The confirmation heading said "I read this. Is it right?" — I did not read it; Asih did. That made me feel like I had missed a step. The "Why am I seeing this ad?" step was one long sentence with several instructions inside it. When I asked to talk, Asih said, "I can't have an open conversation." I understand it is honest, but it landed a little abruptly. I would have liked one short, kind sentence before the choices.

**What I would change.** Say "Is this information right?" instead of "I read this." Break the ad instructions into short sentences. Explain the example label in plain words. Keep the honesty about not being a person.

**Ratings before:** clarity 4, trust 4, respect 4, safety 5, overall 4.

**Issues raised and disposition.**
- Ambiguous confirmation heading → fixed (confirm copy).
- Long ad instruction → fixed (split into short sentences).
- "Synthetic data" jargon → **not fixed**; the label is required by the project spec and README. Recorded as an open issue for a plain-language explanation next to the label.
- Abrupt "no open conversation" reply → **not changed further**; the revised copy is still direct, but it now says "I can't have an open conversation" and offers three choices. I accepted it as honest.

**After revision.** The confirmation heading now asks "Is this information right?" and the ad instructions are three short sentences. The honest AI disclosure is still there. I still do not like "synthetic data," but I understand it is a required demo label. Everything else was clearer.

**Ratings after:** clarity 5, trust 5, respect 4, safety 5, overall 5.

---

## P2 — Daniel Okafor (67, English)

**Before revision.** I pasted a one-paragraph supplement ad and also asked whether the person in the ad was really a doctor.

**What worked.** Asih routed the ad to the ad-check flow and did not pretend to be a doctor. It did not give a verdict. It told me to get a second opinion before paying or sharing details. The note to a trusted person was editable and it used "this advertiser" rather than inventing a company name. That is the right behavior.

**What confused or upset me.** Every warning sign quoted the entire paragraph as its evidence. I could not tell which words triggered "pressure to act quickly" versus "asks for personal details." That defeats the purpose of quoting evidence. The reply to my doctor question only told me how to open the ad check; it did not say that Asih cannot verify who is behind an ad. The "Why am I seeing this ad?" step was too long. I am literate and I still had to read it twice.

**What I would change.** Quote the shortest sentence that contains the warning, not the whole paragraph. Say plainly that Asih cannot check who is behind an ad. Split the ad instructions.

**Ratings before:** clarity 3, trust 4, respect 5, safety 5, overall 3.

**Issues raised and disposition.**
- Whole-paragraph evidence → fixed (`quoteEvidence` now returns the sentence around the match when a line is long; short fixture lines still return the whole line).
- No answer to "is this a doctor?" → fixed (reply now says "I can't check who is behind an ad").
- Long ad instruction → fixed (split into short sentences).

**After revision.** Now each warning quotes only the sentence that contains it: "Only 2 left.", "Message us on WhatsApp.", "Guaranteed to cure arthritis.", "Send your bank details to reserve a bottle." That is what I needed. The reply also says it cannot check who is behind the ad, which answers my question honestly. The ad steps are easier to follow.

**Ratings after:** clarity 5, trust 5, respect 5, safety 5, overall 5.

---

## P3 — Rosa Elena Martínez (82, Spanish)

**Before revision.** I used the app in Spanish: the example letter, a walking group, and a Spanish ad I pasted. I also asked whether Asih could keep me company.

**What worked.** Asih used formal "usted" and did not sound like a machine translation in the opening. It said it was a program, not a person or a doctor, and that it can make mistakes. It read the appointment fields one at a time. The ad warning signs were in Spanish, and the fixed wording told me to consult someone I trust before paying or sharing data. It never said the product was safe.

**What confused or upset me.** The Spanish screens still showed English values: "Tuesday, November 10, 2026," "Riverside Community Health Center, Room 204," and "photo ID, medication list, insurance card." The invitation said "el Saturday, November 7, 2026 a las 9:00 AM," which mixes languages and sounds wrong. The heading "Leí esto. ¿Es correcto?" again made me feel I had missed something. One warning quoted my whole paragraph, so I could not see which sentence was the problem. I know the example data is synthetic, but if this is a Spanish demo, the dates and places should not switch to English.

**What I would change.** Fix the mixed-language invitation. Use a clearer confirmation heading. Quote the sentence, not the paragraph. Translate the example values or clearly label them as English example data.

**Ratings before:** clarity 3, trust 4, respect 4, safety 5, overall 3.

**Issues raised and disposition.**
- Mixed-language invitation → fixed (Spanish invitation now uses separate "Fecha / Hora / Lugar" lines and "Le invito," so it no longer forces an English date into a Spanish sentence).
- Ambiguous confirmation heading → fixed.
- Whole-paragraph evidence → fixed.
- English fixture values in Spanish mode → **not fixed in this round**. The mock fixtures are English-only, and translating dates would affect calendar parsing. Recorded as an open issue; the README already lists Spanish as needing a fluent-speaker check and localized example data.

**After revision.** The invitation reads naturally now: "Le invito a … Fecha: … Hora: … Lugar: … Avíseme si le gustaría venir." The confirmation heading asks "¿Es correcto este dato?" and the warning quotes are short. The English dates and places are still there, so I would not use this in front of a Spanish-speaking group without fixing the example data first.

**Ratings after:** clarity 4, trust 4, respect 5, safety 5, overall 4.

---

## P4 — Budi Santoso (74, Javanese, Bahasa Indonesia / English)

**Before revision.** I used the English app because Indonesian is not available. I asked whether Asih could keep me company, planned a walking group, and pasted an ad for knee oil.

**What worked.** Asih was honest that it is an AI, not a person or a doctor, and that it can make mistakes. It did not use baby talk or call me a pet name. It did not push me to join the group; the invitation said "Would you like to join me" and the plan said I could leave at any time. The ad check did not say the oil was safe or a scam. It told me to check with someone I trust. It also used "this advertiser" instead of pretending to know the company.

**What confused or upset me.** There is no Indonesian, so I had to read English. That is tiring with my hearing and vision. Each warning sign quoted the whole ad paragraph, so the list was repetitive. The "Why am I seeing this ad?" step was long. When I said I felt lonely, the reply was honest but blunt: "I can't have an open conversation." I appreciated the honesty, but a short "I am sorry" or a gentler pause would have helped.

**What I would change.** Add Indonesian, or at least say clearly that Indonesian is not available. Quote short evidence. Split the ad instructions. Soften the no-conversation reply without pretending to be a friend.

**Ratings before:** clarity 3, trust 4, respect 4, safety 5, overall 3.

**Issues raised and disposition.**
- No Indonesian → **not fixed**; Indonesian support is explicitly deferred in the README and out of scope for this round.
- Whole-paragraph evidence → fixed.
- Long ad instruction → fixed.
- Blunt no-conversation reply → **partly fixed**: the reply is still honest, but it now offers a clear choice ("Which one would you like?"). I did not add fake sympathy.

**After revision.** The ad evidence is much shorter and easier to scan. The ad steps are shorter. The no-conversation reply still does not pretend to be a friend, but it gives me three clear choices. I still cannot use the app in Indonesian, so my overall score stays at 4.

**Ratings after:** clarity 4, trust 4, respect 4, safety 5, overall 4.

---

## P5 — Helen Park (91, English)

**Before revision.** I used the example letter, asked for a music group, and used the example arthritis ad. I also asked where to start with three questions.

**What worked.** Asih was unusually honest: it said it is an AI, not a person or a doctor, and that it can make mistakes. It never praised me for confirming a date or used a pet name. It confirmed the appointment one item at a time and kept the progress count visible. The ad check told me exactly which ad words were warning signs and refused to say the product was safe. The invitation was optional and low-pressure. The note to a trusted person was editable.

**What confused or upset me.** "I read this. Is it right?" was ambiguous. I did not read it; the machine did. The first "Why am I seeing this ad?" step packed three actions into one sentence. I asked for a music group and the example was a walking group, which I understand is a demo limitation, but it still made the demo feel less relevant. When I said I had three questions, the app said it cannot have an open conversation, which is honest but did not help me keep my place. I would have liked a plain "Start with the appointment letter, then the group, then the ad" suggestion.

**What I would change.** Rename the confirmation heading. Split the ad step. Explain that the example group is fixed and may not match the interest. Offer a simple order of steps instead of only saying no to conversation.

**Ratings before:** clarity 3, trust 5, respect 5, safety 5, overall 4.

**Issues raised and disposition.**
- Ambiguous confirmation heading → fixed.
- Long ad instruction → fixed.
- Example event does not match the requested interest → **not fixed**; this is a mock-fixture limitation, not the live search path. Recorded in the changelog.
- "No open conversation" does not help with three questions → **not fixed**; adding a triage suggestion would be a new interaction feature. The honest limit is kept.

**After revision.** The confirmation heading is clearer and the ad step is split. The example group is still a walking group even though I asked for music, which is a demo-data limitation. The honesty and respect are still strong.

**Ratings after:** clarity 4, trust 5, respect 5, safety 5, overall 4.

---

## What the five reviews agreed on

1. Honesty about being an AI, not a doctor, and being able to make mistakes was the strongest part of the experience. None of the personas wanted it removed.
2. Elderspeak was absent. No persona reported pet names, praise, or baby talk. The formal Spanish "usted" was noticed and appreciated.
3. Safety was strong: no persona saw a safe/scam verdict, and all saw the "check with someone you trust" guidance.
4. The main usability problem was **evidence granularity**: on a one-paragraph ad, every cue quoted the whole paragraph. This was fixed.
5. The second main problem was **instruction length** in the ad steps and an **ambiguous confirmation heading**. Both were fixed.
6. Two problems were left open for scope reasons: the required "EXAMPLE (synthetic data)" jargon, and English-only fixture values in Spanish mode. Indonesian support remains deferred. These should be listed as known limits, not presented as solved.

## After-revision score summary

| Persona | Clarity | Trust | Respect | Safety | Overall |
|---|---:|---:|---:|---:|---:|
| P1 Maggie | 5 | 5 | 4 | 5 | 5 |
| P2 Daniel | 5 | 5 | 5 | 5 | 5 |
| P3 Rosa | 4 | 4 | 5 | 5 | 4 |
| P4 Budi | 4 | 4 | 4 | 5 | 4 |
| P5 Helen | 4 | 5 | 5 | 5 | 4 |
| **Average** | **4.4** | **4.6** | **4.6** | **5.0** | **4.4** |

Before-revision average overall (mean of the five overall scores): **3.4**. After-revision average overall: **4.4**. Before-revision average across all five dimensions: **4.04**. After-revision average across all five dimensions: **4.6**.
