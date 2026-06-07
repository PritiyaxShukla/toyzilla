// Regenerate the 7 category images as REALISTIC product photos.
// Per rules.md: image model is runware:400@4 (FLUX.2 [klein] 4B), 1024x1024, $0.0006.
// Clean light studio look — reads as real e-commerce photography, not CGI.
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

const STYLE =
  ", on a clean light grey studio background, soft realistic studio lighting, " +
  "subtle soft shadow, high detail, e-commerce product photograph, sharp focus, " +
  "photorealistic, 50mm lens";

const IMAGES = [
  { name: "cat-rc-cars", prompt: "a glossy red remote control sports car toy, three-quarter front view" + STYLE },
  { name: "cat-drones", prompt: "a black and white quadcopter camera drone toy with four rotors" + STYLE },
  { name: "cat-planes", prompt: "a blue and white remote control propeller airplane toy" + STYLE },
  { name: "cat-helicopters", prompt: "a red and black remote control helicopter toy" + STYLE },
  { name: "cat-animals", prompt: "a remote control robotic dinosaur toy, green and orange plastic, realistic" + STYLE },
  { name: "cat-boats", prompt: "a red and white remote control speed boat toy" + STYLE },
  { name: "cat-spares", prompt: "a neat set of RC car spare parts: rubber tyres, a battery pack and small tools" + STYLE },
];

async function once(img) {
  const json = await (
    await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify([
        {
          taskType: "imageInference",
          taskUUID: randomUUID(),
          positivePrompt: img.prompt,
          model: "runware:400@4", // FLUX.2 [klein] 4B (mandated)
          width: 1024,
          height: 1024,
          numberResults: 1,
          outputType: "URL",
          outputFormat: "JPG",
          includeCost: true,
        },
      ]),
    })
  ).json();
  if (json.errors) throw new Error(JSON.stringify(json.errors[0]));
  const r = json.data[0];
  const buf = Buffer.from(await (await fetch(r.imageURL)).arrayBuffer());
  writeFileSync(join(OUT, `${img.name}.jpg`), buf);
  return r.cost;
}

async function gen(img) {
  for (let a = 1; a <= 4; a++) {
    try {
      return await once(img);
    } catch (e) {
      if (a === 4) throw e;
      process.stdout.write(` (retry ${a})`);
      await new Promise((r) => setTimeout(r, 1500 * a));
    }
  }
}

let total = 0;
for (const img of IMAGES) {
  process.stdout.write(img.name.padEnd(16));
  try {
    const c = await gen(img);
    total += c || 0;
    console.log(`  cost=${c}  OK`);
  } catch (e) {
    console.log(`  FAILED: ${e.message}`);
  }
}
console.log(`\nTotal: $${total.toFixed(4)} for ${IMAGES.length} images -> public/generated/`);
