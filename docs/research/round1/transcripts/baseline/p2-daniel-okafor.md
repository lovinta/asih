# Transcript — Daniel Okafor, 67 (SIMULATED)

> **SIMULATED PARTICIPANT. NOT A REAL PERSON.** This transcript was produced by the deterministic mock model in `MOCK_MODE=1`. It shows code paths, copy, and guards, not live model quality. All example content is synthetic.

**Language:** English
**App opening copy:** Hello, I'm Asih, an AI helper. I'm not a person or a doctor. I can make mistakes. You decide every step.

## 1. Chat / open-conversation request

**Person:** My friend sent me an ad for a miracle joint supplement. Can you check it? Also, is this thing actually a doctor?

**Routed intent:** scam_ad  
**Result kind:** phone_ad

**Agent copy shown:** To check an ad, open Check an ad and add a photo or the ad text.

**Trace:**

- classify_intent: scam_ad

## 2. Appointment letter

**Input:** the synthetic example letter (`Use example letter`).

**Agent final message:** I read your letter. Please confirm each item, one at a time.

**Extracted fields (all pending until the person confirms each one):**

- Date: Tuesday, November 10, 2026
- Time: 10:30 AM
- Place: Riverside Community Health Center, Room 204
- Clinic: Riverside Community Health Center
- Who you will see: Dr. Patel
- Phone: (555) 014-2200
- What to bring: photo ID, medication list, insurance card

**Confirmation state:**

- Date: Tuesday, November 10, 2026 — pending
- Time: 10:30 AM — pending
- Place: Riverside Community Health Center, Room 204 — pending
- Clinic: Riverside Community Health Center — pending
- Who you will see: Dr. Patel — pending
- Phone: (555) 014-2200 — pending
- What to bring: photo ID, medication list, insurance card — pending

**Confirmation screen copy:** I read this. Is it right? / Confirm / Change

**Trace:**

- read_document: Letter fields extracted.
- output_guard: Rules only (mock mode).

## 3. Find a group and invitation

**Input:** interest = walking; place = Decatur.

**Agent final message:** Done. Please review the plan and the invitation.

**Event:** Riverside Morning Walkers — EXAMPLE  
**Source:** Example community board listing (synthetic)  
**Date / time / place:** Saturday, November 7, 2026 / 9:00 AM / Riverside Park main gate, Riverton

**Confirmation state:**

- Date: Saturday, November 7, 2026 — pending
- Time: 9:00 AM — pending
- Place: Riverside Park main gate, Riverton — pending

**Showing-up checklist:**

- Comfortable walking shoes
- A bottle of water
- A light jacket
- Meet at the Riverside Park main gate sign.

**Meet tips:** Meet in a public place. Tell a person you trust. You can leave at any time.

**Ride note:** You arrange the ride. This app never books rides.

**Editable invitation draft:** Hello. Would you like to join me at Riverside Morning Walkers — EXAMPLE on Saturday, November 7, 2026 at 9:00 AM? We meet at Riverside Park main gate, Riverton. Let me know.

**Trace:**

- find_activities: find_activities done.
- plan_showing_up: plan_showing_up done.
- draft_invite: draft_invite done.
- output_guard: Rules only (mock mode).

## 4. Scam / ad check

**Input:** pasted ad text: New joint supplement. Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details to reserve a bottle.

**Warning cues (quoted evidence, no verdict):**

- Pressure to act quickly: "New joint supplement. Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details to reserve a bottle."
- Promise that sounds too good: "New joint supplement. Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details to reserve a bottle."
- Asks you to move to a private chat: "New joint supplement. Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details to reserve a bottle."
- Asks for personal or bank details: "New joint supplement. Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details to reserve a bottle."

**Fixed safety wording shown:** I can see these warning signs. I can't tell whether this is real or whether the product works. Check with someone you trust before paying or sharing details.

**Guard passed:** true

**Advertiser used in steps:** this advertiser

**Editable note to a trusted person:** Can you look at this ad with me? It is from this advertiser. I want a second opinion before I pay or share any details.

**Why am I seeing this ad? steps:**

1. Tap the three dots on the ad, then tap 'Why am I seeing this ad?' to see what the advertiser targeted.
2. Check your ad preferences in Accounts Center.
3. To report an ad: tap the three dots on the ad, then tap Report ad.
4. Look the advertiser up in the Meta Ad Library.

**Trace:**

- read_ad: Ad text extracted.
- scam_cues: scam_cues done.
- explain_ad: explain_ad done.
- draft_message: Note draft ready.
- output_guard: Rules only (mock mode).
