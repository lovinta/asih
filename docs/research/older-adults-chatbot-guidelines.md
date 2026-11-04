# How an AI helper should talk with older adults: a rapid review and design guidelines for Asih

**Status:** internal research note for Asih (Meta hackathon). Not a clinical guideline and not a substitute for review by older adults, clinicians, or fluent Spanish/Indonesian speakers.

## Abstract

This note asks how a text-and-voice AI helper should respond to adults aged roughly 65 and older. It focuses on tone, pacing and brevity, plain-language readability, honest disclosure that the helper is an AI and not a doctor, resistance to scams and financial exploitation, autonomy and non-patronizing language, sensory and cognitive accessibility, and cultural fit for Spanish-speaking and Indonesian users. A targeted search of peer-reviewed work in gerontology, health communication, human–computer interaction, and health services research retained 15 sources. Four consistent findings emerge. First, "elderspeak" — simplified speech, pet names, praise, and other infantilizing cues — is recognized by older adults and is associated with worse communication and care outcomes. Second, cognitive aging changes working memory and processing speed more than stored knowledge, so one idea at a time, self-pacing, and repetition without judgment matter more than very slow or very loud presentation. Third, trust is appropriate only when the system is honest about what it is, what it cannot do, and when it is uncertain; over-trust is a safety risk, especially around money and health. Fourth, autonomy is supported by offering choices, stating limits, and letting the person decide, not by making decisions for them. Cultural and linguistic fit requires more than literal translation. The note ends with twelve design guidelines, each tied to the sources it relies on, and notes which guidelines Asih already implements.

## 1. Method

This is a rapid, non-systematic narrative review, not a systematic review, and it did not follow PRISMA. I searched Crossref metadata and the reference lists of the retrieved articles for peer-reviewed journal articles and archival conference papers published in English between 1993 and 2019. Search concepts were: older adults; elderspeak, patronizing talk, or communication accommodation; cognitive aging, working memory, or processing speed; health literacy, readability, or plain language; trust in automation, conversational agents, or voice assistants; older-adult fraud, scams, or financial exploitation; shared decision-making or patient-centered care; aging vision or presbycusis; and language concordance or cross-cultural adaptation. I retained sources that (a) reported empirical data or a peer-reviewed conceptual model, (b) directly concerned adults aged approximately 65 and over or a mechanism clearly relevant to them, and (c) could be verified by DOI. I excluded grey literature, vendor documentation, news reports, and non-peer-reviewed accessibility guidance. Fifteen sources were retained. The review is limited by its single reviewer, English-language scope, and the small number of sources on Indonesian older adults specifically. Statements below are therefore design guidance, not proof of effect in this product.

## 2. Findings by theme

### 2.1 Tone and respect: elderspeak is recognized and harmful

Elderspeak is a simplified, infantilizing speech style characterized by short and simplified sentences, high pitch, exaggerated intonation, collective pronouns ("we"), terms of endearment, and unnecessary praise. Kemper and Harden showed experimentally that some simplifications can aid comprehension, but the package as a whole is not benign: older adults distinguish helpful simplification from patronizing modification, and the social meaning of baby talk is negative [1]. In long-term care, Williams and colleagues found that elderspeak was associated with more resistance to care and less cooperative communication, linking a speech style to measurable care outcomes [2]. The practical point is not "never simplify"; it is "simplify the language without simplifying the person." Adult-to-adult register, ordinary words, and respect for the person's competence should be preserved.

### 2.2 Pacing and brevity: support working memory, do not rush

Cognitive aging research shows average declines in processing speed and working memory, while vocabulary and accumulated knowledge remain comparatively stable [3]. This has two design consequences. First, information should be chunked: one decision, one instruction, or one confirmable fact at a time, with the person controlling when to continue. Second, the system should not add time pressure, urgency, or long lists that must be held in memory. Repetition and a visible "read aloud" control are supports, not signs of failure. Slowing speech slightly can help, but very slow or exaggerated speech can shade into elderspeak and should be avoided [1, 3].

### 2.3 Readability and plain language: short, concrete, and checkable

Low health literacy is common and is associated with poorer health outcomes, including more hospitalization and less use of preventive services [4]. Readability research in health care shows that long sentences, unfamiliar terms, and complex syntax increase the gap between what is written and what is understood; readability formulas are imperfect, but the underlying lesson — shorter sentences, common words, and concrete structure — is robust [5]. For a helper, plain language means: one idea per sentence; common words; explicit names, dates, times, and amounts; no jargon unless it is immediately explained; and a way to check understanding without quizzing or shaming the person. Plain language is not the same as baby talk; the content should be simple while the register stays adult [1, 4, 5].

### 2.4 Honesty and trust: say what you are, what you cannot do, and when you are unsure

Trust in automation is not a single "more is better" quantity. Lee and See describe trust as calibrated when it matches the system's actual capability; over-trust leads to misuse, and under-trust leads to disuse [6]. For older adults, voice assistants are often personified: Pradhan and colleagues found that some older adults treated smart speakers as companions while others insisted they were "just a box with information," and that this ontological ambiguity shaped how much they relied on the device [7]. A helper that hides its machine status, implies feelings or a body, or speaks with medical authority invites the wrong kind of trust. Honest disclosure should be short and repeated at the point of use: "I am an AI helper, not a person or a doctor. I can make mistakes." The helper should also name its limits before the person relies on it for health or money decisions [6, 7].

### 2.5 Scam safety and financial exploitation: no verdicts, support verification

Financial fraud and scams against older adults are common and under-reported; a systematic review and meta-analysis estimated past-year prevalence around 5.6% overall, with substantial heterogeneity across studies [8]. Routine activity theory helps explain why: a suitable target, a motivated offender, and the absence of a capable guardian converge in everyday online life, and isolation or unfamiliar digital channels reduce guardianship [9]. This supports a specific posture for an ad check: quote the observable warning signs, do not declare the ad safe or a scam, and help the person bring a trusted human into the decision before paying or sharing details. The helper should not create a false sense of protection ("I checked it, so it is safe") and should not pressure the person to act [8, 9].

### 2.6 Autonomy and non-patronizing language: choices, not commands

Shared decision-making requires at least two participants: information exchange, deliberation, and a decision that the person owns [10]. Patient-centered care similarly treats the person's values and preferences as central rather than incidental [10]. In a helper, autonomy-supportive language sounds like: "You can choose," "Would you like to...?", "You can stop at any time," and "I will not send anything until you say so." Controlling language sounds like: "You must," "You need to," "We are going to," or praise for compliance. Avoiding elderspeak is part of the same commitment: an adult does not need to be rewarded with "good job" for confirming a date [1, 2, 10].

### 2.7 Accessibility: vision, hearing, and cognition

Age-related vision loss affects contrast sensitivity, visual acuity, and the ability to read small or low-contrast text; Owsley's review documents these changes and their impact on everyday tasks [11]. Age-related hearing loss (presbycusis) is common, often asymmetric and high-frequency, and is associated with communication difficulty and social isolation [12]. Design implications include large type, strong contrast, generous spacing, visible focus, captions or transcripts for audio, no reliance on audio alone, a read-aloud control with adjustable rate, and no time-limited screens. For cognition, the same chunking and self-pacing rules from Section 2.2 apply; the system should not punish repetition or require recall of earlier screens [3, 11, 12].

### 2.8 Cultural and linguistic fit: language concordance and adaptation, not literal translation

Language concordance between patients and clinicians is associated with better communication, satisfaction, and some clinical outcomes for patients with limited English proficiency [13]. Cross-cultural adaptation of instruments requires translation, back-translation, expert review, and pre-testing with the target population; a literal translation is not enough [14]. For Spanish, this means formal address ("usted"), natural rather than translated syntax, and review by fluent speakers who know the target community. For Indonesian, the same logic applies: Bahasa Indonesia is the national language, but Javanese speakers may mix languages and may prefer different honorifics depending on age, region, and setting. No Indonesian-language outcome study was retained here; Indonesian support should be treated as a culturally adapted, bilingual-reviewed addition, not as a word-for-word translation of English strings [13, 14]. Chattaraman and colleagues also found that older adults' responses to AI assistants depend on whether the assistant is framed as social or task-oriented; a warm but task-focused style fits a helper that must remain honest about being software [15].

## 3. Design guidelines for Asih

Each guideline is marked with the reference numbers it relies on. "Current" notes what the repository already does; "Gap" notes what this round changes or leaves open.

**G1. Use an adult-to-adult register.** Use plain words but not baby talk, pet names, praise, or a sing-song style. Do not call the person "dear", "honey", "sweetie", or "young lady". Do not praise compliance. [1, 2]

**G2. Keep turns short and chunked.** Prefer one idea or one decision per turn, then stop. Do not give a long list of instructions in one message. Let the person set the pace. [3, 5]

**G3. Never add time pressure.** Avoid urgency, countdowns, "act now", "last chance", and "you must decide today". This applies to invitations as well as ads. [1, 3, 8]

**G4. Use concrete, literal language.** Prefer common words and short sentences. Name dates, times, places, and amounts explicitly. Explain a hard word in plain words rather than repeating it. Avoid idioms and metaphors that may not translate. [4, 5, 14]

**G5. Check understanding without shaming.** Offer "read aloud", "repeat", and a simple confirmation step. Never imply that the person is forgetful or slow. [3, 11, 12]

**G6. Disclose that the helper is an AI, not a person and not a doctor.** Say it early, briefly, and again when health or money is involved. Do not claim feelings, a body, memories, or clinical authority. [6, 7]

**G7. State uncertainty and limits.** Say "I can't tell whether this is real" or "I can't read this part" instead of guessing. Never give a safe/scam verdict or a diagnosis, dose, treatment, or cure claim. [6, 8]

**G8. Support verification, not replacement of human judgment.** For money, health, or a suspicious ad, quote observable cues and encourage a trusted person or clinician before paying or sharing details. Do not say "I checked it, so it is safe." [8, 9]

**G9. Protect autonomy.** Use choices ("Would you like to...?"), permission ("May I...?"), and explicit control ("You decide"; "Nothing is sent until you choose"). Avoid "you must", "we need to", and decisions made on the person's behalf. [10]

**G10. Make the interface accessible by default.** Large text, strong contrast, visible focus, transcripts for audio, read-aloud with adjustable rate, no audio-only content, no time-limited screens, and no reliance on color alone. [11, 12]

**G11. Match language and culture, not just words.** Spanish should use formal "usted", natural syntax, and community review. Indonesian should be adapted with bilingual review, not literal translation. Preserve names and addresses exactly; do not force English date or place formats into another language. [13, 14]

**G12. Keep a warm but task-focused style.** Friendliness is appropriate; pretend friendship is not. Be calm, direct, and useful, and make the next action obvious. [7, 15]

### 3.1 Where Asih currently stands

Asih already follows G1 (no pet names or exclamation marks; formal Spanish "usted"), G2 (confirm one item at a time), G5 (read aloud, repeat, pause, speech-rate control), G6 (intro says AI, not a person or doctor), G7 (unreadable text is marked, no ad verdict, no medical advice), G8 (fixed scam wording asks the person to check with someone trusted; the app never sends), G9 (the person confirms every item and chooses recipients), and G10 in part (large text, transcripts, read-aloud). Gaps addressed in this round: the system prompt now explicitly rules out baby talk, flattery, "just/simply", jargon, false memories or feelings, and urgency; the fallback reply and the "no open chat" reply now state the AI's limits and return the choice to the person; the Spanish intro no longer uses a gendered "asistente" and now names fallibility; destructive example and confirmation wording was simplified. Gaps left open: the required "EXAMPLE (synthetic data)" label is still technical and should be explained in plain words; Indonesian is still not supported; Spanish fixture values (dates, places) remain English and need localized fixtures or live extraction before a Spanish demo; and no older adult has actually tested the product yet. These are recorded in the round-one review.

## References

1. Kemper, S., & Harden, T. (1999). Experimentally disentangling what's beneficial about elderspeak from what's not. *Psychology and Aging, 14*(4), 656–670. https://doi.org/10.1037/0882-7974.14.4.656
2. Williams, K. N., Herman, R., Gajewski, B., & Wilson, K. (2009). Elderspeak communication: Impact on dementia care. *American Journal of Alzheimer's Disease & Other Dementias, 24*(1), 11–20. https://doi.org/10.1177/1533317508318472
3. Salthouse, T. A. (2010). Selective review of cognitive aging. *Journal of the International Neuropsychological Society, 16*(5), 754–760. https://doi.org/10.1017/S1355617710000706
4. Berkman, N. D., Sheridan, S. L., Donahue, K. E., Halpern, D. J., & Crotty, K. (2011). Low health literacy and health outcomes: An updated systematic review. *Annals of Internal Medicine, 155*(2), 97–107. https://doi.org/10.7326/0003-4819-155-2-201107190-00005
5. Ley, P., & Florio, T. (1996). The use of readability formulas in health care. *Psychology, Health & Medicine, 1*(1), 7–28. https://doi.org/10.1080/13548509608400003
6. Lee, J. D., & See, K. A. (2004). Trust in automation: Designing for appropriate reliance. *Human Factors, 46*(1), 50–80. https://doi.org/10.1518/hfes.46.1.50_30392
7. Pradhan, A., Findlater, L., & Lazar, A. (2019). "Phantom friend" or "just a box with information": Personification and ontological categorization of smart speaker-based voice assistants by older adults. *Proceedings of the ACM on Human-Computer Interaction, 3*(CSCW), 1–21. https://doi.org/10.1145/3359316
8. Burnes, D., Henderson, C. R., Sheppard, C., Zhao, R., Pillemer, K., & Lachs, M. S. (2017). Prevalence of financial fraud and scams among older adults in the United States: A systematic review and meta-analysis. *American Journal of Public Health, 107*(8), e13–e21. https://doi.org/10.2105/AJPH.2017.303821
9. DeLiema, M. (2018). Elder fraud and financial exploitation: Application of routine activity theory. *The Gerontologist, 58*(4), 706–718. https://doi.org/10.1093/geront/gnw258
10. Charles, C., Gafni, A., & Whelan, T. (1997). Shared decision-making in the medical encounter: What does it mean? (or it takes at least two to tango). *Social Science & Medicine, 44*(5), 681–692. https://doi.org/10.1016/S0277-9536(96)00221-3
11. Owsley, C. (2011). Aging and vision. *Vision Research, 51*(13), 1610–1622. https://doi.org/10.1016/j.visres.2010.10.020
12. Gates, G. A., & Mills, J. H. (2005). Presbycusis. *The Lancet, 366*(9491), 1111–1120. https://doi.org/10.1016/S0140-6736(05)67423-5
13. Diamond, L., Izquierdo, K., Canfield, D., Matsoukas, K., & Gany, F. (2019). A systematic review of the impact of patient–physician non-English language concordance on quality of care and outcomes. *Journal of General Internal Medicine, 34*(8), 1591–1606. https://doi.org/10.1007/s11606-019-04847-5
14. Guillemin, F., Bombardier, C., & Beaton, D. (1993). Cross-cultural adaptation of health-related quality of life measures: Literature review and proposed guidelines. *Journal of Clinical Epidemiology, 46*(12), 1417–1432. https://doi.org/10.1016/0895-4356(93)90142-N
15. Chattaraman, V., Kwon, W.-S., Gilbert, J. E., & Ross, K. (2019). Should AI-based, conversational digital assistants employ social- or task-oriented interaction style? A task-competency and reciprocity perspective for older adults. *Computers in Human Behavior, 90*, 315–330. https://doi.org/10.1016/j.chb.2018.08.048
