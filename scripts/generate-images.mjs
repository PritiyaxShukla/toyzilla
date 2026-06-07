// Toyzilla — generate the full website image set with Runware.
//
// Locked config (verified): SDXL Turbo + TCD scheduler runs in EXACTLY 1 step
// and costs $0.0006/image — both within the strict rules (1 step, < $0.009).
//
// Run: node scripts/generate-images.mjs
// Output: public/generated/*.jpg
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

const KEY = (process.env.RUNWARE_API_KEY ||
  readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(
    /^RUNWARE_API_KEY=(.+)$/m
  )[1]).trim();

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "public", "generated");
mkdirSync(OUT, { recursive: true });

const MODEL = "civitai:215478@242797"; // SDXL Turbo base
const BASE = {
  model: MODEL,
  steps: 1, // STRICT: single step only
  CFGScale: 1, // turbo runs guidance-free
  scheduler: "TCDScheduler", // the scheduler that makes 1-step coherent
  outputType: "URL",
  outputFormat: "JPG",
  numberResults: 1,
  includeCost: true,
};

// Consistent art direction:
//  - heroes/lifestyle = cinematic outdoor action, golden hour
//  - category tiles   = dark studio + neon rim light (tiles read as a set)
const STYLE_STUDIO =
  ", on a dark studio background, dramatic neon rim lighting, glossy reflections, product photography, ultra detailed, sharp focus";
const STYLE_CINE =
  ", cinematic, dramatic warm lighting, shallow depth of field, ultra detailed photography, high quality";

const IMAGES = [
  // Hero (wide 16:9 — single subject reads cleanly at this ratio)
  {
    name: "hero",
    w: 1024,
    h: 576,
    prompt:
      "professional advertising photo of a red and white remote-control rally car drifting on a dusty off-road track at golden hour, huge dust cloud, dramatic low sun" +
      STYLE_CINE,
  },
  // Hero side promos (square-ish)
  {
    name: "promo-drone",
    w: 768,
    h: 768,
    prompt:
      "professional photo of a sleek white quadcopter camera drone hovering in a clear blue sky, vibrant" +
      STYLE_CINE,
  },
  {
    name: "promo-crawler",
    w: 768,
    h: 768,
    prompt:
      "professional action photo of a rugged remote-control 4x4 rock crawler truck climbing over rocks outdoors" +
      STYLE_CINE,
  },
  // Category tiles (768 native-ish to avoid duplication artifacts)
  {
    name: "cat-rc-cars",
    w: 768,
    h: 768,
    prompt: "a glossy red remote control sports car toy" + STYLE_STUDIO,
  },
  {
    name: "cat-drones",
    w: 768,
    h: 768,
    prompt: "a black quadcopter camera drone toy with blue neon light" + STYLE_STUDIO,
  },
  {
    name: "cat-planes",
    w: 768,
    h: 768,
    prompt: "a sleek remote control airplane toy with cyan neon light" + STYLE_STUDIO,
  },
  {
    name: "cat-helicopters",
    w: 768,
    h: 768,
    prompt: "a remote control helicopter toy with teal neon light" + STYLE_STUDIO,
  },
  {
    name: "cat-animals",
    w: 768,
    h: 768,
    prompt:
      "a futuristic robotic toy lizard with glowing eyes on a dark reflective surface, green and purple neon lighting, product photography, ultra detailed, sharp focus",
  },
  {
    name: "cat-boats",
    w: 768,
    h: 768,
    prompt: "a remote control speed boat toy with orange neon light" + STYLE_STUDIO,
  },
  {
    name: "cat-spares",
    w: 768,
    h: 768,
    prompt:
      "rechargeable lithium battery packs, rc car spare wheels and small tools neatly arranged with blue neon light" +
      STYLE_STUDIO,
  },
  // Lifestyle / trust band (Indian context)
  {
    name: "lifestyle",
    w: 1024,
    h: 576,
    prompt:
      "a happy indian boy flying a small white drone in a sunny green park, joyful, golden hour, bokeh" +
      STYLE_CINE,
  },
];

async function once(img) {
  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify([
      { taskType: "imageInference", taskUUID: randomUUID(), positivePrompt: img.prompt, width: img.w, height: img.h, ...BASE },
    ]),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "unknown error");
  const r = json.data?.[0];
  const buf = Buffer.from(await (await fetch(r.imageURL)).arrayBuffer());
  writeFileSync(join(OUT, `${img.name}.jpg`), buf);
  return r.cost;
}

async function gen(img) {
  // Cold model loads can time out; retry a few times.
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const cost = await once(img);
      return cost;
    } catch (e) {
      if (attempt === 4) throw e;
      process.stdout.write(` (retry ${attempt}: ${e.message.slice(0, 40)})`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

(async () => {
  let total = 0;
  for (const img of IMAGES) {
    process.stdout.write(`${img.name.padEnd(16)} ${img.w}x${img.h}`);
    try {
      const cost = await gen(img);
      total += cost || 0;
      console.log(`  cost=${cost}  OK`);
    } catch (e) {
      console.log(`  FAILED: ${e.message}`);
    }
  }
  console.log(`\nTotal images: ${IMAGES.length}`);
  console.log(`Total cost:   $${total.toFixed(4)}`);
  console.log(`Per image:    $${(total / IMAGES.length).toFixed(4)} (rule: < $0.009)`);
  console.log(`Saved to:     public/generated/`);
})();
