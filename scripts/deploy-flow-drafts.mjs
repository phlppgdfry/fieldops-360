// Creates INACTIVE Dataverse modern-flow drafts after platform admin resolves schema/connection setup.
import { client } from "./dataverse.mjs";
import { readFile, readdir } from "node:fs/promises";
const call = client();
const solution = process.env.SOLUTION_NAME || "FieldOps360";
if (process.env.ALLOW_FLOW_DRAFTS !== "1")
  throw Error(
    "Controleer tenant, schema en connectorbinding; zet ALLOW_FLOW_DRAFTS=1 voor expliciete draft-installatie.",
  );
for (const file of await readdir("power-platform/flows")) {
  if (!file.endsWith(".json")) continue;
  const source = JSON.parse(await readFile("power-platform/flows/" + file));
  const existing = await call(
    `workflows?$filter=name eq '${source.name}'&$select=workflowid`,
  );
  if (existing.value.length) {
    console.log("Existing draft retained:", source.name);
    continue;
  }
  const row = await call(
    "workflows",
    "POST",
    {
      name: source.name,
      category: 5,
      type: 1,
      primaryentity: "none",
      clientdata: JSON.stringify(source.properties),
    },
    { Prefer: "return=representation", "MSCRM.SolutionUniqueName": solution },
  );
  await call("AddSolutionComponent", "POST", {
    ComponentId: row.workflowid,
    ComponentType: 29,
    SolutionUniqueName: solution,
    AddRequiredComponents: false,
  });
  console.log("Inactive draft created:", source.name);
}
console.log(
  "No flow was activated. Validate and bind every connector in the designer.",
);
