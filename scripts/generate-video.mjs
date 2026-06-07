// Generate the hero animation video with Runware PixVerse V5.6.
// Balanced price/quality: 720p, 5s, image-to-video from our existing hero.jpg.
// Video is async — submit, then poll getResponse until ready.
//
// Run: node scripts/generate-video.mjs
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

const ENDPOINT = "https://api.runware.ai/v1";
async function call(tasks) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(tasks),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

// 1) Upload the local hero frame so the model has a stable input.
async function uploadFrame() {
  const b64 = readFileSync(join(OUT, "hero.jpg")).toString("base64");
  const json = await call([
    {
      taskType: "imageUpload",
      taskUUID: randomUUID(),
      image: `data:image/jpeg;base64,${b64}`,
    },
  ]);
  if (json.errors) throw new Error("upload: " + JSON.stringify(json.errors));
  const uuid = json.data?.[0]?.imageUUID;
  if (!uuid) throw new Error("upload: no imageUUID in " + JSON.stringify(json));
  return uuid;
}

const PROMPT =
  "The red and white rally car drifts fast across the dusty desert track, " +
  "wheels spinning and kicking up a huge billowing cloud of golden dust, " +
  "warm low sunlight flaring, the camera slowly pushes in with a subtle handheld " +
  "feel, cinematic motion, high detail, smooth realistic movement";

async function submit(frameUUID) {
  const taskUUID = randomUUID();
  const json = await call([
    {
      taskType: "videoInference",
      taskUUID,
      model: "pixverse:1@7", // PixVerse V5.6
      positivePrompt: PROMPT,
      duration: 5,
      resolution: "720p",
      includeCost: true,
      deliveryMethod: "async",
      inputs: { frameImages: [{ image: frameUUID, frame: "first" }] },
    },
  ]);
  if (json.errors) throw new Error("submit: " + JSON.stringify(json.errors));
  return taskUUID;
}

async function poll(taskUUID) {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const json = await call([{ taskType: "getResponse", taskUUID }]);
    if (json.errors) {
      // transient — keep polling unless it's clearly fatal
      console.log(`  poll ${i}: ${JSON.stringify(json.errors).slice(0, 120)}`);
      continue;
    }
    const r = json.data?.[0];
    const status = r?.status;
    const url = r?.videoURL || r?.outputs?.files?.[0]?.url;
    console.log(`  poll ${i}: status=${status || "?"}${url ? " (ready)" : ""}`);
    if (url) return { url, cost: r?.cost };
    if (status === "error" || status === "failed")
      throw new Error("generation failed: " + JSON.stringify(r));
  }
  throw new Error("timed out waiting for video");
}

(async () => {
  console.log("Uploading hero frame...");
  const frameUUID = await uploadFrame();
  console.log("  frame uuid:", frameUUID);
  console.log("Submitting PixVerse V5.6 (720p, 5s, image-to-video)...");
  const taskUUID = await submit(frameUUID);
  console.log("  task uuid:", taskUUID, "— polling...");
  const { url, cost } = await poll(taskUUID);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(join(OUT, "hero.mp4"), buf);
  console.log(`\nDONE  cost=$${cost}  -> public/generated/hero.mp4  (${(buf.length / 1e6).toFixed(2)} MB)`);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
