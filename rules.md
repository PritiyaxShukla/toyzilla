# Project Rules

Rules that must be followed when working on this project.

## AI image generation (Runware)

When generating images with the Runware API, these rules are **strict** and
must not be violated:

1. **Check the price first.** Always verify the model's actual cost from the
   Runware API (the `cost` field in the `imageInference` response, with
   `includeCost: true`) before generating a batch. Do not assume or guess.

2. **Cost must be under $0.009 per image.** Only use models whose per-image
   cost is **strictly less than 0.009 USD**. Reject anything at or above.

3. **Single-step models only.** The model must produce a usable image in
   **exactly 1 step** — not 3, not 4. Set `steps: 1`. Do not use models that
   require multiple steps to denoise.

### Verified working config (meets all rules)

| Setting     | Value                          |
| ----------- | ------------------------------ |
| Model       | `civitai:215478@242797` (SDXL Turbo) |
| Scheduler   | `TCDScheduler`                 |
| Steps       | `1`                            |
| CFGScale    | `1`                            |
| Cost        | **$0.0006 / image**            |

Notes learned while finding this:
- Most "turbo" checkpoints produce pure noise at 1 step — they actually need
  4-6 steps. They do **not** satisfy rule 3.
- At 1 step, the **scheduler** is decisive: `EulerAncestral` / `Euler` / `LCM`
  gave noise or blur; **`TCDScheduler`** gave sharp, clean results.
- Generate images once via `scripts/generate-images.mjs` and commit them as
  static files in `public/generated/`. Never call the paid API on every page
  view.
- `RUNWARE_API_KEY` lives in `.env.local` only (gitignored). It is **not**
  needed on Vercel for serving — only for re-generating images locally.
