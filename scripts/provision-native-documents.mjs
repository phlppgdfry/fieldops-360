import { client } from "./dataverse.mjs";
import { readFile, writeFile } from "node:fs/promises";
const call = client();
const attribute = {
  "@odata.type": "Microsoft.Dynamics.CRM.ImageAttributeMetadata",
  SchemaName: "fo_photo",
  DisplayName: { LocalizedLabels: [{ Label: "Bonfoto", LanguageCode: 1033 }] },
  RequiredLevel: { Value: "None" },
  CanStoreFullImage: true,
  IsPrimaryImage: true,
  MaxSizeInKB: 10240,
};
const textAttribute = {
  "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
  SchemaName: "fo_ocrtext",
  DisplayName: {
    LocalizedLabels: [{ Label: "Herkenningstekst", LanguageCode: 1033 }],
  },
  RequiredLevel: { Value: "None" },
  MaxLength: 100000,
  Format: "Text",
};
const attrs = await call(
  "EntityDefinitions(LogicalName='fo_document')/Attributes?$select=LogicalName,MetadataId",
);
if (!attrs.value.some((a) => a.LogicalName === "fo_photo")) {
  await call(
    "EntityDefinitions(LogicalName='fo_document')/Attributes",
    "POST",
    attribute,
  );
  console.log("Dataverse document image column created");
} else console.log("Dataverse document image column already present");
const imagePath =
  "EntityDefinitions(LogicalName='fo_document')/Attributes(LogicalName='fo_photo')";
const imageMetadata = await call(imagePath);
if (!imageMetadata.CanStoreFullImage) {
  delete imageMetadata["@odata.context"];
  imageMetadata.CanStoreFullImage = true;
  await call(imagePath, "PUT", imageMetadata);
  console.log("Full image storage enabled on the existing image column");
}
if (!attrs.value.some((a) => a.LogicalName === "fo_ocrtext")) {
  await call(
    "EntityDefinitions(LogicalName='fo_document')/Attributes",
    "POST",
    textAttribute,
  );
  console.log("Full OCR text column created");
}
await call("PublishXml", "POST", {
  ParameterXml:
    "<importexportxml><entities><entity>fo_document</entity></entities></importexportxml>",
});
const schema = JSON.parse(
  await readFile("power-platform/dataverse/schema.json", "utf8"),
);
const doc = schema.find((t) => t.SchemaName === "fo_document");
for (const a of [attribute, textAttribute])
  if (!doc.Attributes.some((x) => x.SchemaName === a.SchemaName))
    doc.Attributes.push(a);
await writeFile(
  "power-platform/dataverse/schema.json",
  JSON.stringify(schema, null, 2) + "\n",
);
await writeFile(
  "docs/evidence/native-document-storage.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      environment: process.env.POWER_PLATFORM_ENVIRONMENT_ID,
      table: "fo_document",
      imageColumn: "fo_photo",
      fullImage: true,
      maxSizeInKB: 10240,
      scope:
        "Storage metadata provisioning only; actual upload/download and Canvas OCR execution have separate test reports.",
    },
    null,
    2,
  ) + "\n",
);
