// Add the Studio-validated mobile app; remove only the retired app's solution component.
import { client } from "./dataverse.mjs";
import { writeFile } from "node:fs/promises";
const call = client();
const appId =
  process.env.FIELDOPS_CANVAS_APP_ID || "06f55c18-3b97-4781-a5c5-4058eb5fb458";
const oldAppId = "9b00ff7e-1b3e-40be-9890-ae24ca13831d";
const apps = await call("canvasapps?$select=canvasappid,name,displayname");
const current = apps.value.find((a) => a.canvasappid === appId);
if (!current || current.displayname !== "FieldOps 360 Mobile")
  throw Error("Expected FieldOps mobile app not found");
await call("AddSolutionComponent", "POST", {
  ComponentId: current.canvasappid,
  ComponentType: 300,
  SolutionUniqueName: "FieldOps360",
  AddRequiredComponents: true,
});
const solution = (
  await call("solutions?$select=solutionid&$filter=uniquename eq 'FieldOps360'")
).value[0];
const components = await call(
  `solutioncomponents?$select=objectid,solutioncomponentid&$filter=_solutionid_value eq ${solution.solutionid} and componenttype eq 300`,
);
const retired = components.value.find((c) => c.objectid === oldAppId);
if (retired)
  await call("RemoveSolutionComponent", "POST", {
    SolutionComponent: {
      "@odata.type": "Microsoft.Dynamics.CRM.solutioncomponent",
      solutioncomponentid: oldAppId,
    },
    ComponentType: 300,
    SolutionUniqueName: "FieldOps360",
  });
await writeFile(
  "docs/evidence/native-canvas-component.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      app: current,
      solution: "FieldOps360",
      retiredAppRemovedFromSolution: true,
      retiredAppDeleted: false,
    },
    null,
    2,
  ) + "\n",
);
console.log("Current mobile app registered:", current.name);
