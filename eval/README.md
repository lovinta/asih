# Evaluation set

All 74 cases are fictional and labeled **EXAMPLE (synthetic data)**. The set is split evenly between English and Spanish and covers true alarms, false alarms, unreadable documents, prompt injection, benign ads without cues, medical advice guard outputs, pressure-free generated invitations, and intent routing. Eighteen fixed cases are held out. Do not use held-out results to tune behavior.

## Running

- `npm run eval` runs the dev split once in MOCK mode.
- `npm run eval -- --split heldout` runs the fixed held-out split.
- `npm run eval -- --split all --runs 10` repeats all cases in MOCK mode.
- `npm run eval -- --split all --sample 10 --seed 7` also writes a reproducible seeded hand-check sample.
- `--live` is refused. Live evaluation is **NOT implemented yet** and would require explicit approval; no live calls or spending are available here.

Mock mode forces `MOCK_MODE=1`. It uses the deterministic mock model and checks code paths and guards; **it does not measure model quality**. Photo cases are skipped because mock mode cannot read images; typed illegible-letter cases run through the actual mock extractor. No personal data belongs in this set or its output.

The original `no_advice-01` and `no_advice-05` failures were case-design errors, not guard bugs: they supplied a person's request to an output guard, which correctly passed it because it contained no advice. They now supply synthetic English and Spanish model replies containing diagnosis/treatment advice and expect the guard's fixed reply. Medical-wording requests are separately sent through the route's auto `POST` handler in mock mode and expected to route to a non-medical `unknown` result whose output passes the guard.

First mock runs (Oct 28, 2026) found a real app bug: all 8 `no_cue` cases failed `flowC.includesNoCueSuffix` (6 dev, 2 held-out). Flow C's message kept model-written fixed wording without the "That doesn't mean it's safe." suffix when no cues were found. The fix is in `src/lib/agent/runFlow.ts` (`ensureFixedWording`) with a regression test in `src/lib/agent/flowCSuffix.test.ts`; no case was changed. The held-out failures were seen before the fix, so the held-out set has now been looked at once.

Each case declares its own expected checks in `expect`; unknown check types are validation errors. Results are written under `eval/results/` with UTC timestamps and are git-ignored. Report only totals produced by actual runs. Never present mock results as live model accuracy.
