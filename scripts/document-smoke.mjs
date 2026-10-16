import { readFile, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:3600";
const login = await fetch(base + "/api/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: "driver" }),
});
const cookie = login.headers.get("set-cookie").split(";")[0];
const r = await fetch(base + "/api/documents", {
  method: "POST",
  headers: { Cookie: cookie, "Content-Type": "image/png" },
  body: await readFile("samples/leveringsbon.png"),
});
const result = await r.json();
if (!r.ok) throw Error(JSON.stringify(result));
if (
  result.fields.reference !== "OCR-2026-001" ||
  result.fields.quantity !== 18 ||
  !result.requiresHumanReview
)
  throw Error("OCR assertion failed");
await writeFile(
  "docs/evidence/ocr-result.json",
  JSON.stringify(result, null, 2),
);
console.log("Real image OCR passed:", result.provider, result.fields);
