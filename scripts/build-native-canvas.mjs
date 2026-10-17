import { client } from "./dataverse.mjs";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const call = client();
const dest = "power-platform/canvas-native";
await cp("power-platform/canvas-legacy", dest, {
  recursive: true,
  force: false,
});
await mkdir(dest + "/DataSources", { recursive: true });
await mkdir(dest + "/pkgs/TableDefinitions", { recursive: true });
for (const logical of [
  "fo_delivery",
  "fo_site",
  "fo_document",
  "fo_employee",
]) {
  const entity = await call(
    `EntityDefinitions(LogicalName='${logical}')?$expand=Attributes,ManyToOneRelationships,OneToManyRelationships,ManyToManyRelationships`,
  );
  const display = entity.EntitySetName;
  const mappings = Object.fromEntries(
    entity.Attributes.map((a) => [
      a.LogicalName,
      a.DisplayName?.UserLocalizedLabel?.Label ||
        a.DisplayName?.LocalizedLabels?.[0]?.Label ||
        a.LogicalName,
    ]),
  );
  const ds = {
    CdsFCBContext: JSON.stringify({
      FileType: true,
      ImageExternalStorage: true,
    }),
    EntitySetName: entity.EntitySetName,
    IsHidden: false,
    IsSampleData: false,
    IsWritable: true,
    LogicalName: logical,
    Name: display,
    NativeCDSDataSourceInfoNameMapping: mappings,
    PreferredName: display,
    Type: "NativeCDSDataSourceInfo",
  };
  await writeFile(
    `${dest}/DataSources/${display}.json`,
    JSON.stringify([ds], null, 2),
  );
  const definition = {
    DatasetName: "default.cds",
    EntityName: display,
    InstanceUrl: process.env.DATAVERSE_URL.replace(/\/$/, "") + "/",
    LocalReferenceDSJson: {
      entitySetName: entity.EntitySetName,
      logicalName: logical,
    },
    state: "Configured",
    UnusedDataSources: {},
    webApiVersion: "v9.2",
    TableDefinition: {
      EntityMetadata: JSON.stringify({ value: [entity] }),
      TableName: logical,
      Views: JSON.stringify({ value: [] }),
      DefaultPublicView: JSON.stringify({ value: [] }),
      IconUrl: "",
    },
  };
  for (const [key, type] of [
    ["BooleanOptionSetAttribute", "BooleanAttributeMetadata"],
    ["EntityNameOptionSetAttribute", "EntityNameAttributeMetadata"],
    [
      "MultiSelectPicklistOptionSetAttribute",
      "MultiSelectPicklistAttributeMetadata",
    ],
    ["PicklistOptionSetAttribute", "PicklistAttributeMetadata"],
    ["StateOptionSetAttribute", "StateAttributeMetadata"],
    ["StatusOptionSetAttribute", "StatusAttributeMetadata"],
  ]) {
    const r = await call(
      `EntityDefinitions(LogicalName='${logical}')/Attributes/Microsoft.Dynamics.CRM.${type}?$expand=OptionSet`,
    );
    definition.TableDefinition[key] = JSON.stringify(r);
  }
  await writeFile(
    `${dest}/pkgs/TableDefinitions/${display}.json`,
    JSON.stringify(definition, null, 2),
  );
  console.log("Native canvas datasource:", display);
}
const manifest = JSON.parse(
  await readFile(dest + "/CanvasManifest.json", "utf8"),
);
manifest.Properties.LocalDatabaseReferences = JSON.stringify({
  "default.cds": {
    databaseDetails: {
      referenceType: "Environmental",
      environmentName: "default.cds",
      overrideValues: { status: "NotSpecified" },
    },
    dataSources: {
      fo_deliveries: {
        entitySetName: "fo_deliveries",
        logicalName: "fo_delivery",
      },
      fo_sites: { entitySetName: "fo_sites", logicalName: "fo_site" },
      fo_documents: {
        entitySetName: "fo_documents",
        logicalName: "fo_document",
      },
      fo_employees: {
        entitySetName: "fo_employees",
        logicalName: "fo_employee",
      },
    },
  },
});
manifest.Properties.Name = "FieldOps360Native.msapp";
manifest.Properties.AppDescription =
  "FieldOps 360 - Dataverse native mobile app";
manifest.PublishInfo.AppName = "FieldOps 360 Native";
await writeFile(
  dest + "/CanvasManifest.json",
  JSON.stringify(manifest, null, 2),
);
await writeFile(
  dest + "/Src/App.fx.yaml",
  "App As appinfo:\n    OnStart: =Refresh(fo_deliveries); Refresh(fo_sites)\n",
);
let home = await readFile(dest + "/Src/Home.fx.yaml", "utf8");
home = home
  .replace(
    "Mobiele collectie-demo · fictieve gegevens",
    "Dataverse · leveringen op jouw omgeving",
  )
  .replace(
    "Filter(colDeliveries, IsBlank(SearchBon.Text) || StartsWith(Reference,SearchBon.Text) || StartsWith(Supplier,SearchBon.Text))",
    "Filter(fo_deliveries, IsBlank(SearchBon.Text) || StartsWith(Bonnummer,SearchBon.Text) || StartsWith(Leverancier,SearchBon.Text))",
  )
  .replace("ThisItem.Reference", "ThisItem.Bonnummer")
  .replace("ThisItem.Supplier", "ThisItem.Leverancier")
  .replace("ThisItem.Status", "ThisItem.Processtatus")
  .replace("ThisItem.Quantity", "ThisItem.Geleverd");
await writeFile(dest + "/Src/Home.fx.yaml", home);
let register = await readFile(dest + "/Src/Register.fx.yaml", "utf8");
register = register
  .replace(
    "Bonfoto en OCR: beschikbaar in de webdemo. Native mediabinding volgt na Studio-validatie.",
    "Registreer een gecontroleerde levering. Deze app schrijft rechtstreeks naar Dataverse.",
  )
  .replace(
    "LookUp(colDeliveries,Reference=Upper(Trim(RefInput.Text)))",
    "LookUp(fo_deliveries,Bonnummer=Upper(Trim(RefInput.Text)))",
  );
register = register.replace(
  'Collect(colDeliveries,{Reference:Upper(Trim(RefInput.Text)),Supplier:Trim(SupplierInput.Text),Quantity:Value(QuantityInput.Text),Expected:Value(ExpectedInput.Text),Note:NoteInput.Text,Status:"Ter controle",Confirmed:false,Photo:varPhoto})',
  'Patch(fo_deliveries,Defaults(fo_deliveries),{Levering:Upper(Trim(RefInput.Text)),Bonnummer:Upper(Trim(RefInput.Text)),Leverancier:Trim(SupplierInput.Text),Geleverd:Value(QuantityInput.Text),Besteld:Value(ExpectedInput.Text),Eenheid:"ton",Afwijkingsreden:NoteInput.Text,Processtatus:"draft"})',
);
register = register
  .replace("), Patch(fo_deliveries", "), IfError(Patch(fo_deliveries")
  .replace(
    "Navigate(Home))",
    'Navigate(Home), Notify("Opslaan mislukt. Probeer opnieuw of neem contact op met de beheerder.",NotificationType.Error)))',
  );
await writeFile(dest + "/Src/Register.fx.yaml", register);
let review = await readFile(dest + "/Src/Review.fx.yaml", "utf8");
for (const [a, b] of Object.entries({
  Reference: "Bonnummer",
  Supplier: "Leverancier",
  Quantity: "Geleverd",
  Expected: "Besteld",
  Note: "Afwijkingsreden",
  Status: "Processtatus",
}))
  review = review.replaceAll("varDelivery." + a, "varDelivery." + b);
review = review
  .replace("varDelivery.Photo", "Blank()")
  .replace(
    "Goedkeuring gebeurt door een onafhankelijke werfleider in de backend. Deze Canvas-collectie-demo verleent geen rechten en synchroniseert niet met Dataverse.",
    "Deze levering komt rechtstreeks uit Dataverse. Goedkeuring en ERP volgen de afzonderlijke native flows.",
  );
await writeFile(dest + "/Src/Review.fx.yaml", review);
await cp("power-platform/canvas-native-layout", dest + "/Src", {
  recursive: true,
});
execFileSync(
  "pac",
  [
    "canvas",
    "pack",
    "--sources",
    dest,
    "--msapp",
    "power-platform/FieldOps360Native.msapp",
    "--overwrite",
  ],
  { stdio: "inherit" },
);
console.log(
  "Native Dataverse-bound msapp packed; Studio/player validation still required.",
);
