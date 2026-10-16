import { execFileSync } from "node:child_process";
import {
  mkdir,
  copyFile,
  readdir,
  writeFile,
  readFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
const model = "vendor/ocr/eng.traineddata.gz";
const manifest = JSON.parse(await readFile("vendor/ocr/manifest.json", "utf8"));
const bytes = await readFile(model);
if (createHash("sha256").update(bytes).digest("hex") !== manifest.sha256)
  throw Error("OCR-taalmodel checksum komt niet overeen");
execFileSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--mode", "pages"],
  { stdio: "inherit" },
);
await mkdir("dist-pages/ocr", { recursive: true });
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  "dist-pages/ocr/worker.min.js",
);
for (const file of await readdir("node_modules/tesseract.js-core"))
  if (/\.wasm(?:\.js)?$/.test(file))
    await copyFile(
      join("node_modules/tesseract.js-core", file),
      join("dist-pages/ocr", file),
    );
await copyFile(model, "dist-pages/ocr/eng.traineddata.gz");
await mkdir("dist-pages/case/evidence", { recursive: true });
await copyFile("docs/index.html", "dist-pages/case/index.html");
for (const file of [
  "dashboard-desktop.png",
  "mobile-registration.png",
  "approved-synced.png",
  "demo.webm",
  "demo.nl.vtt",
])
  await copyFile("docs/evidence/" + file, "dist-pages/case/evidence/" + file);
await mkdir("dist-pages/samples", { recursive: true });
await copyFile(
  "samples/leveringsbon.png",
  "dist-pages/samples/leveringsbon.png",
);
await writeFile("dist-pages/.nojekyll", "");
await writeFile(
  "dist-pages/ocr/NOTICE.txt",
  "Tesseract.js and tesseract.js-core: Apache-2.0. English traineddata from the official Tesseract.js project data server, Apache-2.0. See repository THIRD-PARTY-NOTICES.md.",
);
console.log(
  "GitHub Pages bundle ready: browserdemo + self-hosted OCR + case/video. No backend credentials included.",
);
