import { serviceRequest } from "./power-services.mjs";
import { writeFile } from "node:fs/promises";
const env = process.env.POWER_PLATFORM_ENVIRONMENT_ID;
const r = await serviceRequest(
  `https://api.powerapps.com/providers/Microsoft.PowerApps/apps?api-version=2016-11-01&$filter=environment%20eq%20'${env}'`,
  "https://service.powerapps.com/",
);
const apps = (r.value || [])
  .filter((a) => a.properties?.displayName === "FieldOps 360")
  .map((a) => ({
    id: a.name,
    name: a.properties.displayName,
    appVersion: a.properties.appVersion,
    databaseReferences: Object.keys(a.properties.databaseReferences || {}),
  }));
const report = {
  environment: env,
  checkedAt: new Date().toISOString(),
  apps,
  registered: apps.length === 1,
  studioValidated: false,
};
console.log(JSON.stringify(report, null, 2));
await writeFile(
  "docs/evidence/native-app-registry.json",
  JSON.stringify(report, null, 2),
);
if (!report.registered) throw Error("Registered native app not found");
