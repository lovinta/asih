# Evaluation set

All 72 cases are fictional and labeled **EXAMPLE (synthetic data)**. The set is split evenly between English and Spanish and covers true alarms, false alarms, unreadable photos, prompt injection, benign ads without cues, blocked medical advice, pressure-free invitations, and intent routing. Eighteen fixed cases are held out. Do not use held-out results to tune behavior.

## Running

- `npm run eval` runs the dev split once in MOCK mode.
- `npm run eval -- --split heldout` runs the fixed held-out split.
- `npm run eval -- --split all --runs 10` repeats all cases in MOCK mode.
- `npm run eval -- --sample 10 --seed 42` also writes a reproducible hand-check sample.
- Later, a live run requires `META_API_KEY` and explicit approval because it costs money. Use `npm run eval -- --live` only after that approval. The live path respects the app spend guard.

Mock mode forces `MOCK_MODE=1`. It uses the deterministic mock model and checks code paths and guards; **it does not measure model quality**. `liveOnly` photo cases are reported as skipped, not passed, because mock mode cannot read real images. No personal data belongs in this set or its output.

Results are written under `eval/results/` with UTC timestamps and are git-ignored. Each case reports pass, fail, or skip and failed check names; summaries group failures by category and language. A hand-check sample includes synthetic inputs and outputs with an empty Human verdict column. Review the sampled rows, enter a human verdict, and preserve the original blank template if retaining a copy.

Report only totals produced by actual runs. Never invent, extrapolate, or present mock results as live model accuracy.
