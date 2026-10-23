import { withRuntimeClient } from "./runtime-session.mjs";
import { readFile, writeFile } from "node:fs/promises";
const report = {
  checkedAt: new Date().toISOString(),
  environment: process.env.POWER_PLATFORM_ENVIRONMENT_ID,
  scope:
    "Real Dataverse document upload/download and full text round trip through the restricted runtime identity; not a Canvas UI or OCR execution test.",
  checks: [],
};
function check(name, ok) {
  report.checks.push({ name, ok });
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) throw Error(name);
}
try {
  await withRuntimeClient(async (call) => {
    const ref = "NATIVE-DOC-" + Date.now();
    const delivery = await call("fo_deliveries", "POST", {
      fo_name: ref,
      fo_reference: ref,
      fo_supplier: "Fictieve documentopslagtest",
      fo_quantity: 18,
      fo_expected: 24,
      fo_unit: "ton",
      fo_note: "Testafwijking van 6 ton",
      fo_status: "draft",
    });
    report.deliveryId = delivery.fo_deliveryid;
    const image = await readFile("samples/leveringsbon.png");
    const text =
      "LEVERINGSBON TEST — herkende tekst moet volledig blijven.\n".repeat(160);
    const document = await call("fo_documents", "POST", {
      fo_name: ref,
      fo_photo: image.toString("base64"),
      fo_ocrtext: text,
      fo_extracted: JSON.stringify({
        reviewRequired: true,
        characters: text.length,
      }),
      fo_provider: "Storage test fixture; no OCR executed",
      "fo_deliveryid@odata.bind": `/fo_deliveries(${delivery.fo_deliveryid})`,
    });
    report.documentId = document.fo_documentid;
    check(
      "Limited runtime can create a document linked to its delivery",
      !!document.fo_documentid,
    );
    const stored = await call(
      `fo_documents(${document.fo_documentid})?$select=fo_photo,fo_ocrtext,fo_extracted,_fo_deliveryid_value`,
    );
    check(
      "Document retains the delivery relationship",
      stored._fo_deliveryid_value === delivery.fo_deliveryid,
    );
    check(
      "Full recognition text survives beyond the old 4000-character limit",
      stored.fo_ocrtext === text && text.length > 4000,
    );
    check(
      "Human-review requirement survives as valid JSON",
      JSON.parse(stored.fo_extracted).reviewRequired === true,
    );
    check(
      "Dataverse generated an image thumbnail",
      !!stored.fo_photo && Buffer.from(stored.fo_photo, "base64").length > 100,
    );
    const full = await call(
      `fo_documents(${document.fo_documentid})/fo_photo/$value?size=full`,
    );
    report.originalImageBytes = image.length;
    report.downloadedImageBytes = full.bytes?.length;
    report.downloadContentType = full.contentType;
    const pngSignature =
      full.bytes &&
      Buffer.from(full.bytes.subarray(0, 8)).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
    check(
      "Full-size document image is downloadable",
      full.bytes?.length > 1000 && pngSignature,
    );
    const final = await call(
      `fo_deliveries(${delivery.fo_deliveryid})?$select=fo_status,fo_confirmed`,
    );
    check(
      "Uploading an image does not submit or confirm the delivery",
      final.fo_status === "draft" && !final.fo_confirmed,
    );
  });
} finally {
  await writeFile(
    "docs/evidence/native-document-tests.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
