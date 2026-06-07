// Generate an interactive 3D RC car: clean product image -> Tripo v3.1 image-to-3D -> GLB.
// Run: node scripts/generate-3d.mjs
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
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
}

// 1) Clean, single-object product shot — best input for image-to-3D.
async function makeInputImage() {
  const json = await call([
    {
      taskType: "imageInference",
      taskUUID: randomUUID(),
      positivePrompt:
        "a glossy red remote control sports car toy, complete vehicle, centered, " +
        "three-quarter front view, plain solid white background, soft even studio " +
        "lighting, product photo, sharp focus, high detail",
      model: "civitai:215478@242797",
      width: 768,
      height: 768,
      steps: 1,
      CFGScale: 1,
      scheduler: "TCDScheduler",
      outputType: "URL",
      outputFormat: "JPG",
      includeCost: true,
    },
  ]);
  if (json.errors) throw new Error("image: " + JSON.stringify(json.errors));
  const r = json.data[0];
  // Save a copy for reference + upload it for the 3D step.
  const buf = Buffer.from(await (await fetch(r.imageURL)).arrayBuffer());
  writeFileSync(join(OUT, "rc-car-source.jpg"), buf);
  const up = await call([
    {
      taskType: "imageUpload",
      taskUUID: randomUUID(),
      image: `data:image/jpeg;base64,${buf.toString("base64")}`,
    },
  ]);
  if (up.errors) throw new Error("upload: " + JSON.stringify(up.errors));
  return { uuid: up.data[0].imageUUID, imgCost: r.cost };
}

async function submit3d(imageUUID) {
  const taskUUID = randomUUID();
  const json = await call([
    {
      taskType: "3dInference",
      taskUUID,
      model: "tripo:v3.1@0",
      includeCost: true,
      deliveryMethod: "async",
      settings: {
        imageAutoFix: true,
        orientation: "align_image",
        geometryQuality: "detailed",
        texture: true,
        textureQuality: "detailed",
        pbr: true,
        compress: "meshopt",
      },
      inputs: { images: [imageUUID] },
    },
  ]);
  if (json.errors) throw new Error("submit3d: " + JSON.stringify(json.errors));
  // Some setups return the result immediately.
  const immediate = json.data?.[0]?.outputs?.files?.[0]?.url;
  if (immediate) return { url: immediate, cost: json.data[0].cost };
  return { taskUUID };
}

async function poll(taskUUID) {
  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const json = await call([{ taskType: "getResponse", taskUUID }]);
    if (json.errors) {
      console.log(`  poll ${i}: ${JSON.stringify(json.errors).slice(0, 120)}`);
      continue;
    }
    const r = json.data?.[0];
    const url = r?.outputs?.files?.[0]?.url || r?.modelURL;
    console.log(`  poll ${i}: status=${r?.status || "?"}${url ? " (ready)" : ""}`);
    if (url) return { url, cost: r?.cost };
    if (r?.status === "error" || r?.status === "failed")
      throw new Error("3d failed: " + JSON.stringify(r));
  }
  throw new Error("timed out waiting for 3D model");
}

(async () => {
  console.log("Generating clean RC car product image...");
  const { uuid, imgCost } = await makeInputImage();
  console.log("  input image uuid:", uuid, `(img $${imgCost})`);
  console.log("Submitting Tripo v3.1 image-to-3D...");
  const sub = await submit3d(uuid);
  let result;
  if (sub.url) result = sub;
  else {
    console.log("  task uuid:", sub.taskUUID, "— polling...");
    result = await poll(sub.taskUUID);
  }
  const buf = Buffer.from(await (await fetch(result.url)).arrayBuffer());
  writeFileSync(join(OUT, "rc-car.glb"), buf);
  console.log(
    `\nDONE  3d cost=$${result.cost}  -> public/generated/rc-car.glb  (${(buf.length / 1e6).toFixed(2)} MB)`
  );
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
