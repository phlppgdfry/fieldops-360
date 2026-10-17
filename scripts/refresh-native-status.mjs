import { client } from "./dataverse.mjs";
import { serviceRequest } from "./power-services.mjs";
import { writeFile } from "node:fs/promises";
const c = client(),
  env = process.env.POWER_PLATFORM_ENVIRONMENT_ID;
const flows = await c(
  "workflows?$filter=startswith(uniquename,'fo_')&$select=workflowid,name,uniquename,statecode",
);
const report = {
  environment: env,
  url: process.env.DATAVERSE_URL,
  checkedAt: new Date().toISOString(),
  flows: [],
};
for (const f of flows.value) {
  const runs = await serviceRequest(
    `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${env}/flows/${f.workflowid}/runs?api-version=2016-11-01&$top=5`,
    "https://service.flow.microsoft.com/",
  );
  report.flows.push({
    id: f.workflowid,
    name: f.name,
    logicalName: f.uniquename,
    enabled: f.statecode === 1,
    runs: runs.value?.map((x) => ({
      id: x.name,
      status: x.properties?.status,
      start: x.properties?.startTime,
    })),
  });
}
for (const entity of ["fo_delivery", "fo_integrationjob"]) {
  const keys = await c(
    `EntityDefinitions(LogicalName='${entity}')/Keys?$select=SchemaName,EntityKeyIndexStatus`,
  );
  (report.keys ??= []).push({ entity, keys: keys.value });
}
await writeFile(
  "docs/evidence/native-flow-runs.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
