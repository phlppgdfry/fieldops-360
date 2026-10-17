import { client } from "./dataverse.mjs";
import { nativeState } from "./native-state.mjs";
import { readFile, writeFile, readdir } from "node:fs/promises";
const call = client(),
  runtime = JSON.parse(
    await readFile(await nativeState("native-runtime"), "utf8"),
  );
const assemblyName = "FieldOps360.Validation",
  typeName = assemblyName + ".DeliveryGuard";
let assemblyPath =
  "power-platform/plugin/bin/Release/net462/FieldOps360.Validation.dll";
let bytes;
try {
  bytes = await readFile(assemblyPath);
} catch {
  const files = await readdir(
    "power-platform/native-solution/PluginAssemblies",
    { recursive: true },
  );
  const file = files.find((name) => name.endsWith("FieldOps360Validation.dll"));
  if (!file)
    throw Error("Build the plugin or import the provided native DLL first.");
  assemblyPath = "power-platform/native-solution/PluginAssemblies/" + file;
  bytes = await readFile(assemblyPath);
}
let row = (
  await call(
    `pluginassemblies?$filter=name eq '${assemblyName}'&$select=pluginassemblyid`,
  )
).value[0];
const body = {
  name: assemblyName,
  version: "1.0.0.0",
  culture: "neutral",
  publickeytoken: "bfe04f8d96418f62",
  isolationmode: 2,
  sourcetype: 0,
  content: bytes.toString("base64"),
  description: "FieldOps server validation. No external network calls.",
};
if (row)
  await call(`pluginassemblies(${row.pluginassemblyid})`, "PATCH", {
    content: body.content,
  });
else
  row = await call("pluginassemblies", "POST", body, {
    Prefer: "return=representation",
    "MSCRM.SolutionUniqueName": "FieldOps360",
  });
const assemblyId = row.pluginassemblyid;
let type = (
  await call(
    `plugintypes?$filter=typename eq '${typeName}'&$select=plugintypeid`,
  )
).value[0];
if (!type)
  type = await call(
    "plugintypes",
    "POST",
    {
      name: typeName,
      typename: typeName,
      friendlyname: "FieldOps Delivery Guard",
      "pluginassemblyid@odata.bind": `/pluginassemblies(${assemblyId})`,
    },
    { Prefer: "return=representation" },
  );
const report = {
  environment: process.env.POWER_PLATFORM_ENVIRONMENT_ID,
  assembly: assemblyName,
  checkedAt: new Date().toISOString(),
  steps: [],
};
for (const messageName of ["Create", "Update"]) {
  const message = (
    await call(
      `sdkmessages?$filter=name eq '${messageName}'&$select=sdkmessageid`,
    )
  ).value[0];
  const filter = (
    await call(
      `sdkmessagefilters?$filter=primaryobjecttypecode eq 'fo_delivery' and _sdkmessageid_value eq ${message.sdkmessageid}&$select=sdkmessagefilterid`,
    )
  ).value[0];
  if (!filter)
    throw Error("FieldOps delivery message filter missing: " + messageName);
  const stepName = "FieldOps Delivery Guard · " + messageName;
  let step = (
    await call(
      `sdkmessageprocessingsteps?$filter=name eq '${stepName}'&$select=sdkmessageprocessingstepid`,
    )
  ).value[0];
  const data = {
    name: stepName,
    stage: 20,
    mode: 0,
    rank: 1,
    supporteddeployment: 0,
    configuration: runtime.appUserId,
    ...(messageName === "Update"
      ? {
          filteringattributes:
            "fo_reference,fo_supplier,fo_quantity,fo_expected,fo_unit,fo_note,fo_status,fo_confirmed,fo_erp_id,fo_siteid",
        }
      : {}),
    "eventhandler_plugintype@odata.bind": `/plugintypes(${type.plugintypeid})`,
    "sdkmessageid@odata.bind": `/sdkmessages(${message.sdkmessageid})`,
    "sdkmessagefilterid@odata.bind": `/sdkmessagefilters(${filter.sdkmessagefilterid})`,
  };
  if (!step)
    step = await call("sdkmessageprocessingsteps", "POST", data, {
      Prefer: "return=representation",
    });
  else
    await call(
      `sdkmessageprocessingsteps(${step.sdkmessageprocessingstepid})`,
      "PATCH",
      {
        configuration: runtime.appUserId,
        ...(messageName === "Update"
          ? { filteringattributes: data.filteringattributes }
          : {}),
      },
    );
  if (messageName === "Update") {
    const images = await call(
      `sdkmessageprocessingstepimages?$filter=_sdkmessageprocessingstepid_value eq ${step.sdkmessageprocessingstepid}&$select=sdkmessageprocessingstepimageid`,
    );
    if (!images.value.length)
      await call("sdkmessageprocessingstepimages", "POST", {
        name: "Before",
        entityalias: "Before",
        imagetype: 0,
        messagepropertyname: "Target",
        attributes:
          "fo_reference,fo_supplier,fo_quantity,fo_expected,fo_unit,fo_note,fo_status,fo_confirmed,fo_erp_id,fo_siteid",
        "sdkmessageprocessingstepid@odata.bind": `/sdkmessageprocessingsteps(${step.sdkmessageprocessingstepid})`,
      });
  }
  await call("AddSolutionComponent", "POST", {
    ComponentId: step.sdkmessageprocessingstepid,
    ComponentType: 92,
    SolutionUniqueName: "FieldOps360",
    AddRequiredComponents: true,
  });
  report.steps.push({
    message: messageName,
    id: step.sdkmessageprocessingstepid,
    synchronous: true,
    stage: "PreOperation",
  });
  console.log("Server validation registered:", messageName);
}
await call("AddSolutionComponent", "POST", {
  ComponentId: assemblyId,
  ComponentType: 91,
  SolutionUniqueName: "FieldOps360",
  AddRequiredComponents: true,
});
const keys = await call(
  "EntityDefinitions(LogicalName='fo_delivery')/Keys?$select=SchemaName",
);
if (!keys.value.some((k) => k.SchemaName === "fo_delivery_reference"))
  await call(
    "EntityDefinitions(LogicalName='fo_delivery')/Keys",
    "POST",
    {
      SchemaName: "fo_delivery_reference",
      DisplayName: {
        LocalizedLabels: [{ Label: "Uniek bonnummer", LanguageCode: 1033 }],
      },
      KeyAttributes: ["fo_reference"],
    },
    { "MSCRM.SolutionUniqueName": "FieldOps360" },
  );
await writeFile(
  "docs/evidence/native-server-validation.json",
  JSON.stringify(report, null, 2),
);
console.log("Guard installed; integration tests still required.");
