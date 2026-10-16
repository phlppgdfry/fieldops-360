import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
const run = promisify(execFile);
import { extractFields } from "../shared/document-fields.mjs";
export { extractFields } from "../shared/document-fields.mjs";
export async function readDocument(path, mime) {
  if (mime === "text/plain") {
    const { readFile } = await import("node:fs/promises");
    return {
      ...extractFields(await readFile(path, "utf8")),
      provider: "text-parser (geen AI)",
    };
  }
  if (process.env.AZURE_DOCUMENT_ENDPOINT && process.env.AZURE_DOCUMENT_KEY) {
    const { readFile } = await import("node:fs/promises");
    const endpoint = process.env.AZURE_DOCUMENT_ENDPOINT.replace(/\/$/, "");
    const response = await fetch(
      `${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_DOCUMENT_KEY,
          "Content-Type": mime,
        },
        body: await readFile(path),
      },
    );
    if (!response.ok) throw Error(`Azure OCR ${response.status}`);
    const location = response.headers.get("operation-location");
    if (!location || new URL(location).origin !== new URL(endpoint).origin)
      throw Error("Ongeldige OCR polling URL");
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const r = await fetch(location, {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_DOCUMENT_KEY,
        },
      });
      if (!r.ok) throw Error(`Azure OCR polling ${r.status}`);
      const data = await r.json();
      if (data.status === "failed") throw Error("Azure OCR mislukt");
      if (data.status === "succeeded")
        return {
          ...extractFields(data.analyzeResult.content),
          provider: "Azure AI Document Intelligence",
        };
    }
    throw Error("OCR timeout");
  }
  if (process.platform !== "darwin")
    throw Error(
      "Stel Azure Document Intelligence in voor beeld-OCR op dit platform.",
    );
  const { stdout } = await run(
    "swift",
    [fileURLToPath(new URL("../scripts/ocr.swift", import.meta.url)), path],
    { timeout: 90000, maxBuffer: 2e6 },
  );
  const lines = JSON.parse(stdout);
  return {
    ...extractFields(
      lines.map((x) => x.text).join("\n"),
      lines.length ? Math.min(...lines.map((x) => x.confidence)) : 0,
    ),
    provider: "Apple Vision OCR (on-device ML)",
  };
}
