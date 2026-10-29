# Submission checklist: Meta Global AI Developer Hackathon (Indie track)

Prepared Oct 29, 2026 from the sources below. Nothing has been submitted, pushed, deployed or claimed. Items marked **Vinta** need her decision or action.

**Deadline:** Nov 4, 2026, 9:00 PM ET.

## Sources

| Id | Source | Status |
| --- | --- | --- |
| R | Official Rules: "Hackathon Terms & Conditions ("Official Rules") and Event Waiver", on https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details (public text, read Oct 29). | Official |
| E | Event page https://dev.meta.ai/events/global-hackathon, "Key Dates". | Official |
| M1 | Host email, Oct 26: event details "including problem statements" are on the details page; Discord at https://cerebralvalley.ai/e/meta-ai-developer-hackathon/discord. | Official, to Vinta's inbox |
| M2 | Host email, Oct 26: "Claim your $150 in Meta Model API credits". | Official, to Vinta's inbox |
| K | "New from the kickoff" notes on the plan Page (Oct 26 livestream). | Our notes; not re-checked against a recording |

Not found in any public official source: required submission form fields, demo-video length, whether a public repository or a live link is required, and the problem-statement texts (the details page shows them only to signed-in participants). The submit form at https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit does not show its fields without signing in; it was not opened signed in.

## Checklist

| # | Requirement | Source quote | Status |
| --- | --- | --- | --- |
| 1 | Submit through the Cerebral Valley portal before the deadline. | R: "Participants will submit their project to Cerebral Valley's portal at https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit." E: "Nov 4 Project submissions due by 9:00 PM ET". | **Vinta** (sign in and submit). Not done. |
| 2 | Agree to the Official Rules (a contract). | R: "By participating, you agree to be bound by these Official Rules and represent that you satisfy all of the eligibility requirements." | **Vinta** reads and accepts. |
| 3 | One track only; Indie track, team of up to 4; the Representative names all members. | R: "a project submission may be entered in one (1) track only." "Indie Developer track. Open to individual builders and students, teams of up to four (4) ... The Representative shall identify all other team members in the project submission." | **Vinta** confirms Indie, solo (no other members). |
| 4 | Fit one of the problem statements. | R, Impact (30%): "whether it fits one of the problem statements". M1: problem statements are on the details page. | **Vinta**: read the problem statements while signed in and name the one Asih fits. Not verified by us. |
| 5 | Use Meta AI products. | R: "Participants build with Meta AI products, including Muse Spark, Glimmer, SAM 3, and any other Meta AI products identified on the Event page." Scoring: "Use of Meta AI Tooling (25%)". | Done in code: `muse-spark-1.3` (agent, vision, guard, intent), `muse-wonder-1.0` (image retry), `muse-voice-transcribe-1.0`; Muse Code used to build. **Live calls not yet run** (needs item 9). |
| 6 | Working demo that holds up live, and a demo video. | R, Demo (25%): "whether the Project has a working, impressive demo, whether the product holds up live, and the quality of the demo video." | Script ready: [DEMO_SCRIPT.md](DEMO_SCRIPT.md). **Vinta**: record the video, choose narration (her voice or captions), and upload it wherever the form asks. Length not stated officially (see note). |
| 7 | Original work, solely owned; open source allowed if licenses are followed. | R: Submission "(a) is their ... original work product; (b) is solely owned by the Participant ... Participants may contract with a third party for technical assistance, provided the Submission components remain the Participant's own work ... Participants may also include open source software or hardware, provided applicable open source licenses are followed". | Repo first commit Oct 27, 2026. Dependencies are open source (Next.js, React, OpenAI SDK, AndroidX, OkHttp). **Vinta**: confirm ownership, and decide how to disclose AI coding assistance. |
| 8 | Code open source; say where the new work starts. | K: "The code must be open source, and the submission must say where the new work starts." | MIT [LICENSE](../LICENSE) exists: "Copyright (c) 2026 Lovinta Atrinawati". README has a prior-work section with placeholders. **Vinta**: fill the placeholders; choose the GitHub account; create the public repo and push (not done; no remote exists). Re-check this rule on Discord, since it comes from our kickoff notes. |
| 9 | Meta Model API credits (needed for any live call). | M2: "Claim by Wed Nov 4 at 9:00 PM Eastern Time." "In order to use your credits & make an API call, a credit card must be applied to your account." "Each participant ... must claim their own credits individually." | **Vinta** only (form, card, key). Not done. Then set `META_API_KEY` locally to run live checks once. |
| 10 | Prize eligibility paperwork, if she wins. | R (payout): tax forms "(e.g., W-9 for U.S. residents, W-8BEN for non-U.S. residents)". | **Vinta**, later. |
| 11 | Bonus prizes (optional). | R: "additional prizes of up to $50,000 in the aggregate ... a community vote award, most viral project award, or other unique or notable project categories". K: "Most Viral, Best build on Meta open weights, Community Vote, Best Agentic Use-Case, Best Creative Build." | **Vinta** decides whether to aim for any (e.g., Best Agentic Use-Case). |
| 12 | Public demo link (if wanted). | Not stated in R. | Prepared, not deployed: [DEPLOY.md](DEPLOY.md). **Vinta**: choose the host (Vercel not chosen) and mock or live mode. The plan's passcode is not built. |

## Notes

- **Video length.** No official source we can read states a length. The plan Page assumed 3 minutes; a third-party repository (github.com/meta-ai-hackathon/meta-hack) says "3-minute demo video", which is not official. [DEMO_SCRIPT.md](DEMO_SCRIPT.md) runs 3:00 or less. **Vinta**: check the submit form or Discord and tell us if the limit differs.
- **Live behavior.** Only mock mode has been tested end to end. Judging asks "whether the product holds up live", so a live run before recording is needed (item 9).
- **Language check.** Spanish strings still need a fluent-speaker check before showing Spanish in the video.
- **Git identity.** Commits use `Lovinta Atrinawati <vinta@localhost.invalid>`. **Vinta**: decide whether to keep this or use a GitHub email before pushing.
