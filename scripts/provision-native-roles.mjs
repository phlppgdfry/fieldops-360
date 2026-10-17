import { client } from "./dataverse.mjs";
import { writeFile } from "node:fs/promises";
const c = client(),
  who = await c("WhoAmI"),
  report = {
    environment: process.env.POWER_PLATFORM_ENVIRONMENT_ID,
    checkedAt: new Date().toISOString(),
    roles: [],
    assignedToHumans: false,
  };
const specs = [
  [
    "FieldOps Chauffeur",
    {
      fo_site: ["Read"],
      fo_delivery: ["Create", "Read", "Write", "Append", "AppendTo"],
      fo_document: ["Create", "Read", "Write", "Append", "AppendTo"],
      fo_employee: ["Read"],
    },
  ],
  [
    "FieldOps Werfleider",
    {
      fo_site: ["Read"],
      fo_employee: ["Read"],
      fo_delivery: ["Read", "Write", "Append", "AppendTo"],
      fo_document: ["Read", "Append", "AppendTo"],
      fo_auditevent: ["Read"],
      fo_integrationjob: ["Read"],
    },
  ],
];
for (const [name, tables] of specs) {
  let r = (await c(`roles?$filter=name eq '${name}'&$select=roleid`)).value[0];
  if (!r)
    r = await c(
      "roles",
      "POST",
      {
        name,
        "businessunitid@odata.bind": `/businessunits(${who.BusinessUnitId})`,
      },
      { Prefer: "return=representation" },
    );
  const privileges = [];
  for (const [entity, actions] of Object.entries(tables)) {
    const m = await c(
      `EntityDefinitions(LogicalName='${entity}')?$select=Privileges`,
    );
    for (const p of m.Privileges || [])
      if (actions.includes(p.PrivilegeType))
        privileges.push({
          PrivilegeId: p.PrivilegeId,
          Depth:
            name === "FieldOps Chauffeur" && entity !== "fo_site"
              ? "Basic"
              : "Global",
        });
  }
  await c(
    `roles(${r.roleid})/Microsoft.Dynamics.CRM.AddPrivilegesRole`,
    "POST",
    { Privileges: privileges },
  );
  await c("AddSolutionComponent", "POST", {
    ComponentId: r.roleid,
    ComponentType: 20,
    SolutionUniqueName: "FieldOps360",
    AddRequiredComponents: false,
  });
  report.roles.push({
    name,
    id: r.roleid,
    privileges: privileges.length,
    scope:
      name === "FieldOps Chauffeur"
        ? "Own deliveries and documents; site lookup read"
        : "All FieldOps sites; operational reviewer role; decisions remain controlled by flow",
  });
  console.log("Native role ready:", name);
}
// Exactly one integration job per delivery key, including after webhook redelivery.
const keys = await c(
  "EntityDefinitions(LogicalName='fo_integrationjob')/Keys?$select=SchemaName",
);
if (!keys.value.some((x) => x.SchemaName === "fo_integrationjob_idempotency"))
  await c(
    "EntityDefinitions(LogicalName='fo_integrationjob')/Keys",
    "POST",
    {
      SchemaName: "fo_integrationjob_idempotency",
      DisplayName: {
        LocalizedLabels: [
          { Label: "Unieke integratiesleutel", LanguageCode: 1033 },
        ],
      },
      KeyAttributes: ["fo_idempotencykey"],
    },
    { "MSCRM.SolutionUniqueName": "FieldOps360" },
  );
await writeFile(
  "docs/evidence/native-security-roles.json",
  JSON.stringify(report, null, 2),
);
