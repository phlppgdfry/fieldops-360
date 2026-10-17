import { client } from "./dataverse.mjs";
import { writeFile, mkdir } from "node:fs/promises";
const call = client();
const label = (s) => ({ LocalizedLabels: [{ Label: s, LanguageCode: 1033 }] });
const str = (name, title, max = 150) => ({
  "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
  SchemaName: name,
  DisplayName: label(title),
  RequiredLevel: { Value: "None" },
  MaxLength: max,
  FormatName: { Value: "Text" },
});
const decimal = (name, title) => ({
  "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
  SchemaName: name,
  DisplayName: label(title),
  RequiredLevel: { Value: "ApplicationRequired" },
  MinValue: 0.001,
  MaxValue: 100000,
  Precision: 3,
});
const tables = [
  ["fo_site", "Werf", "Werven", [str("fo_location", "Locatie")]],
  [
    "fo_employee",
    "Medewerker",
    "Medewerkers",
    [str("fo_email", "Zakelijke e-mail"), str("fo_role", "Operationele rol")],
  ],
  [
    "fo_delivery",
    "Levering",
    "Leveringen",
    [
      str("fo_reference", "Bonnummer", 40),
      str("fo_supplier", "Leverancier"),
      decimal("fo_quantity", "Geleverd"),
      decimal("fo_expected", "Besteld"),
      str("fo_unit", "Eenheid", 10),
      str("fo_status", "Processtatus", 30),
      str("fo_note", "Afwijkingsreden", 2000),
      str("fo_erp_id", "ERP ontvangst", 100),
      {
        "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
        SchemaName: "fo_confirmed",
        DisplayName: label("Menselijk bevestigd"),
        DefaultValue: false,
        OptionSet: {
          TrueOption: { Value: 1, Label: label("Ja") },
          FalseOption: { Value: 0, Label: label("Nee") },
        },
      },
    ],
  ],
  [
    "fo_document",
    "Document",
    "Documenten",
    [
      str("fo_originalurl", "Origineel document URL", 1000),
      str("fo_extracted", "OCR resultaat JSON", 4000),
      str("fo_provider", "OCR provider", 100),
    ],
  ],
  [
    "fo_integrationjob",
    "Integratietaak",
    "Integratietaken",
    [
      str("fo_state", "Taakstatus"),
      str("fo_error", "Laatste fout", 2000),
      str("fo_idempotencykey", "Idempotentiesleutel", 100),
    ],
  ],
  [
    "fo_auditevent",
    "Auditgebeurtenis",
    "Auditgebeurtenissen",
    [str("fo_event", "Gebeurtenis"), str("fo_detail", "Detail", 4000)],
  ],
];
const schema = tables.map(([name, singular, plural, attrs]) => ({
  "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
  SchemaName: name,
  DisplayName: label(singular),
  DisplayCollectionName: label(plural),
  OwnershipType: "UserOwned",
  IsActivity: false,
  HasActivities: false,
  HasNotes: true,
  IsAuditEnabled: { Value: true },
  Attributes: [
    {
      ...str("fo_name", "Naam"),
      IsPrimaryName: true,
      RequiredLevel: { Value: "ApplicationRequired" },
    },
    ...attrs,
  ],
}));
await writeFile(
  "power-platform/dataverse/schema.json",
  JSON.stringify(schema, null, 2),
);
let pubs = await call(
  "publishers?$filter=uniquename eq 'FieldOps'&$select=publisherid",
);
let publisher = pubs.value[0]?.publisherid;
if (!publisher) {
  let p = await call(
    "publishers",
    "POST",
    {
      uniquename: "FieldOps",
      friendlyname: "FieldOps Portfolio",
      customizationprefix: "fo",
      customizationoptionvalueprefix: 29559,
    },
    { Prefer: "return=representation" },
  );
  publisher = p.publisherid;
}
let sols = await call(
  "solutions?$filter=uniquename eq 'FieldOps360'&$select=solutionid",
);
let solution = sols.value[0]?.solutionid;
if (!solution) {
  const s = await call(
    "solutions",
    "POST",
    {
      uniquename: "FieldOps360",
      friendlyname: "FieldOps 360",
      version: "1.0.0.0",
      "publisherid@odata.bind": `/publishers(${publisher})`,
    },
    { Prefer: "return=representation" },
  );
  solution = s.solutionid;
}
const report = {
  environment: process.env.POWER_PLATFORM_ENVIRONMENT_ID,
  url: process.env.DATAVERSE_URL,
  checkedAt: new Date().toISOString(),
  solution: "FieldOps360",
  tables: [],
  relationships: [],
};
for (const def of schema) {
  let e;
  try {
    e = await call(
      `EntityDefinitions(LogicalName='${def.SchemaName}')?$select=MetadataId,EntitySetName`,
    );
  } catch (err) {
    if (!err.message.includes("404")) throw err;
    e = await call("EntityDefinitions", "POST", def, {
      "MSCRM.SolutionUniqueName": "FieldOps360",
      Prefer: "return=representation",
    });
  }
  const metadataId = e.MetadataId || e.id?.match(/\(([a-f0-9-]+)\)/)?.[1];
  if (metadataId)
    await call("AddSolutionComponent", "POST", {
      ComponentId: metadataId,
      ComponentType: 1,
      SolutionUniqueName: "FieldOps360",
      AddRequiredComponents: false,
    });
  report.tables.push({
    name: def.SchemaName,
    id: metadataId,
    entitySet: e.EntitySetName,
  });
  console.log("Table ready:", def.SchemaName);
}
for (const [referenced, referencing, lookup] of [
  ["fo_site", "fo_delivery", "fo_siteid"],
  ["fo_employee", "fo_delivery", "fo_employeeid"],
  ["fo_delivery", "fo_document", "fo_deliveryid"],
  ["fo_delivery", "fo_integrationjob", "fo_deliveryid"],
  ["fo_delivery", "fo_auditevent", "fo_deliveryid"],
  ["fo_site", "fo_employee", "fo_siteid"],
]) {
  const name = `${referenced}_${referencing}_${lookup}`;
  try {
    await call(
      `RelationshipDefinitions?$filter=SchemaName eq '${name}'&$select=MetadataId`,
    ).then(async (r) => {
      if (!r.value.length)
        await call(
          "RelationshipDefinitions",
          "POST",
          {
            "@odata.type":
              "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata",
            SchemaName: name,
            ReferencedEntity: referenced,
            ReferencingEntity: referencing,
            Lookup: {
              SchemaName: lookup,
              DisplayName: label(referenced.replace("fo_", "")),
              RequiredLevel: { Value: "None" },
            },
            CascadeConfiguration: {
              Assign: "NoCascade",
              Delete: "Restrict",
              Merge: "NoCascade",
              Reparent: "NoCascade",
              Share: "NoCascade",
              Unshare: "NoCascade",
            },
          },
          { "MSCRM.SolutionUniqueName": "FieldOps360" },
        );
    });
    report.relationships.push(name);
  } catch (e) {
    console.error(name, e.message);
    throw e;
  }
}
await call("PublishAllXml", "POST", {});
await mkdir("docs/evidence", { recursive: true });
await writeFile(
  "docs/evidence/dataverse-deployment.json",
  JSON.stringify(report, null, 2),
);
console.log("Dataverse provisioned.");
