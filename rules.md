# Project Rules

Rules that must be followed when working on this project.

## AI image generation (Runware)

When generating images with the Runware API, these rules are **strict** and
must not be violated:

0. **Default model — ALWAYS use `runware:400@4` (FLUX.2 [klein] 4B).** This is
   the mandated image-generation model for this project. Do not substitute
   another model unless explicitly told to.
   - Model: **FLUX.2 [klein] 4B** · AIR id `runware:400@4` (Runware, 15 Jan 2026)
   - Resolution: **1024x1024** · Save ~40% · **$0.0006 / image**

1. **Check the price first.** Always verify the model's actual cost from the
   Runware API (the `cost` field in the `imageInference` response, with
   `includeCost: true`) before generating a batch. Do not assume or guess.

2. **Cost must be under $0.009 per image.** Only use models whose per-image
   cost is **strictly less than 0.009 USD**. Reject anything at or above.
   (`runware:400@4` at $0.0006 satisfies this.)

3. **Fewest steps the model needs.** Prefer fast/distilled models and the
   minimum step count for a clean image — never burn extra steps. Use the
   recommended step count for the mandated model.

### Mandated image config

| Setting     | Value                                    |
| ----------- | ---------------------------------------- |
| Model       | `runware:400@4` (FLUX.2 [klein] 4B)      |
| Resolution  | `1024x1024`                              |
| Cost        | **$0.0006 / image** (~40% savings)       |
| Added       | 15 Jan 2026                              |

### Previous config (superseded — keep only as fallback)

`civitai:215478@242797` (SDXL Turbo) + `TCDScheduler`, `steps: 1`, `CFGScale: 1`,
$0.0006/image. Used before FLUX.2 [klein] was mandated.

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

## AI 3D generation (Runware)

When generating 3D models from an image with the Runware API:

0. **Default model — ALWAYS use `microsoft:trellis-2@4b` (TRELLIS.2).** This is
   the mandated image-to-3D model for this project. Do not substitute another
   model unless explicitly told to.
   - Model: **TRELLIS.2** · AIR id `microsoft:trellis-2@4b` (Runware, 17 Dec 2025)
   - Input: **1024x1024** image · Save ~91% · **$0.0256 / model**
   - Use `taskType: "3dInference"`, output GLB.

1. **Check the price first** (same as image rules) via `includeCost: true`.

2. **Optimize before shipping.** Raw GLB output can be tens of MB — always run
   it through `gltf-transform` (meshopt + WebP textures @1024) and commit the
   compressed file to `public/generated/`. Never ship an unoptimized multi-MB
   model to the browser.

### Previous 3D config (superseded — keep only as fallback)

`tripo:v3.1@0` (Tripo v3.1) image-to-3D, ~$0.5/model. Used before TRELLIS.2
was mandated.
