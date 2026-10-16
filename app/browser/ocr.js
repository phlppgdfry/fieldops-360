import { extractFields } from "../../shared/document-fields.mjs";
export async function recognizeDocument(file, onProgress = () => {}) {
  if (file.size > 5 * 1024 * 1024) throw Error("Maximaal 5 MB per document.");
  if (file.type === "text/plain")
    return {
      ...extractFields(await file.text()),
      provider: "text-parser (geen AI)",
    };
  if (!["image/png", "image/jpeg"].includes(file.type))
    throw Error(
      "De browserdemo leest PNG en JPEG. PDF vereist de lokale/cloudvariant.",
    );
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (
    (file.type === "image/png" &&
      ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) ||
    (file.type === "image/jpeg" &&
      (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255))
  )
    throw Error("Ongeldig afbeeldingsbestand.");
  const { createWorker } = await import("tesseract.js");
  const base = new URL(import.meta.env.BASE_URL, location.origin);
  const assets = new URL("ocr/", base).href;
  let worker;
  try {
    worker = await createWorker("eng", 1, {
      workerPath: assets + "worker.min.js",
      corePath: assets,
      langPath: assets.replace(/\/$/, ""),
      workerBlobURL: false,
      logger: (m) => onProgress(m.status, m.progress || 0),
    });
    const { data } = await worker.recognize(file);
    return {
      ...extractFields(data.text, data.confidence / 100),
      provider: "Tesseract.js · echte OCR op dit toestel",
    };
  } finally {
    if (worker) await worker.terminate();
  }
}
