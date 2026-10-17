import { nativeState } from "./native-state.mjs";
// Dedicated runtime identity. No tenant-wide API permissions; only FieldOps table privileges.
import { client } from "./dataverse.mjs";
import { serviceToken } from "./power-services.mjs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const stateFile = await nativeState("native-runtime");
const environment = process.env.POWER_PLATFORM_ENVIRONMENT_ID,
  org = process.env.DATAVERSE_URL,
  tenant = process.env.AZURE_TENANT_ID;
if (!environment || !org || !tenant)
  throw Error("Omgeving, Dataverse URL en tenant-ID vereist");
if (process.argv[2] !== "--apply") {
  console.log(
    JSON.stringify(
      {
        name: "FieldOps 360 Runtime",
        scope:
          "New fo_ tables only; no Graph permissions and no tenant admin role",
        credential:
          "30-day client credential, kept only in memory and encrypted Microsoft connector",
        purpose: "Native Dataverse connector for unattended FieldOps flows",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const dv = client();
const graphToken = serviceToken("https://graph.microsoft.com/");
let secret = "";
async function graph(path, method = "GET", body) {
  const r = await fetch("https://graph.microsoft.com/v1.0/" + path, {
    method,
    headers: {
      Authorization: `Bearer ${graphToken}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw Error(
      "Graph " + r.status + ": " + (e.error?.code || "request failed"),
    );
  }
  return r.status === 204 ? {} : r.json();
}
await mkdir(".data", { recursive: true });
let record;
try {
  record = JSON.parse(await readFile(stateFile, "utf8"));
} catch {
  record = {};
}
const who = await dv("WhoAmI");
let roles = await dv(
  "roles?$filter=name eq 'FieldOps Integration Runtime'&$select=roleid",
);
let roleId = roles.value[0]?.roleid;
if (!roleId) {
  const role = await dv(
    "roles",
    "POST",
    {
      name: "FieldOps Integration Runtime",
      "businessunitid@odata.bind": `/businessunits(${who.BusinessUnitId})`,
    },
    { Prefer: "return=representation" },
  );
  roleId = role.roleid;
}
const privileges = [];
for (const logical of [
  "fo_site",
  "fo_employee",
  "fo_delivery",
  "fo_document",
  "fo_integrationjob",
  "fo_auditevent",
]) {
  const metadata = await dv(
    `EntityDefinitions(LogicalName='${logical}')?$select=Privileges`,
  );
  for (const p of metadata.Privileges || []) {
    const action = p.PrivilegeType;
    const permitted = [
      "Read",
      "Append",
      "AppendTo",
      ...(["fo_site", "fo_employee"].includes(logical) ? [] : ["Create"]),
      ...(["fo_delivery", "fo_document", "fo_integrationjob"].includes(logical)
        ? ["Write"]
        : []),
    ];
    if (permitted.includes(action))
      privileges.push({ PrivilegeId: p.PrivilegeId, Depth: "Global" });
  }
}
// Connector webhook registration uses this system table; no business table access beyond fo_.
const callbacks = await dv(
  "privileges?$filter=contains(name,'CallbackRegistration')&$select=name,privilegeid",
);
for (const p of callbacks.value)
  if (/^prv(Create|Read|Write|Delete)CallbackRegistration$/.test(p.name))
    privileges.push({ PrivilegeId: p.privilegeid, Depth: "Global" });
if (privileges.length < 20)
  throw Error("FieldOps privileges could not be resolved safely");
await dv(`roles(${roleId})/Microsoft.Dynamics.CRM.AddPrivilegesRole`, "POST", {
  Privileges: privileges,
});
if (!record.appObjectId) {
  const app = await graph("applications", "POST", {
    displayName: "FieldOps 360 Runtime",
    signInAudience: "AzureADMyOrg",
    tags: ["fieldops360-portfolio"],
    requiredResourceAccess: [],
  });
  record.appObjectId = app.id;
  record.appId = app.appId;
  await writeFile(stateFile, JSON.stringify(record, null, 2), { mode: 0o600 });
}
if (!record.servicePrincipalId) {
  const sp = await graph("servicePrincipals", "POST", { appId: record.appId });
  record.servicePrincipalId = sp.id;
  await writeFile(stateFile, JSON.stringify(record, null, 2), { mode: 0o600 });
}
let appUsers = await dv(
  `systemusers?$filter=applicationid eq ${record.appId}&$select=systemuserid`,
);
let appUserId = appUsers.value[0]?.systemuserid;
if (!appUserId) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const user = await dv(
        "systemusers",
        "POST",
        {
          applicationid: record.appId,
          firstname: "FieldOps",
          lastname: "Runtime",
          "businessunitid@odata.bind": `/businessunits(${who.BusinessUnitId})`,
        },
        { Prefer: "return=representation" },
      );
      appUserId = user.systemuserid;
      break;
    } catch (error) {
      if (!error.message.includes("0x8004f510") || attempt === 7) throw error;
      console.log("Waiting for own new Entra application to propagate.");
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
}
const assigned = await dv(
  `systemusers(${appUserId})/systemuserroles_association?$select=roleid`,
);
if (!assigned.value.some((r) => r.roleid === roleId))
  await dv(
    `systemusers(${appUserId})/systemuserroles_association/$ref`,
    "POST",
    { "@odata.id": org.replace(/\/$/, "") + `/api/data/v9.2/roles(${roleId})` },
  );
record.appUserId = appUserId;
record.roleId = roleId;
await writeFile(stateFile, JSON.stringify(record, null, 2), { mode: 0o600 });
if (!record.connectionName)
  record.connectionName = "shared-commondataserviceforapps-" + randomUUID();
if (
  record.connectionName &&
  new Date(record.credentialExpires).getTime() > Date.now() + 2 * 86400000
) {
  const existing = await fetch(
    `https://api.powerapps.com/providers/Microsoft.PowerApps/connections?api-version=2016-11-01&$filter=environment%20eq%20'${environment}'`,
    {
      headers: {
        Authorization: `Bearer ${serviceToken("https://service.powerapps.com/")}`,
      },
    },
  );
  if (existing.ok) {
    const list = await existing.json();
    if (
      list.value?.some(
        (c) =>
          c.name === record.connectionName &&
          c.properties?.statuses?.some((s) => s.status === "Connected"),
      )
    ) {
      console.log(
        "Existing connected FieldOps runtime reused; no credential rotated.",
      );
      process.exit(0);
    }
  }
}
const expiry = new Date(Date.now() + 30 * 86400000).toISOString();
const credential = await graph(
  `applications/${record.appObjectId}/addPassword`,
  "POST",
  {
    passwordCredential: {
      displayName: "FieldOps Dataverse connector",
      endDateTime: expiry,
    },
  },
);
secret = credential.secretText;
if (typeof secret !== "string" || secret.length < 20)
  throw Error("Graph returned no usable secret");
let tokenReady = false;
for (let i = 0; i < 12; i++) {
  const check = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: record.appId,
        client_secret: secret,
        scope: org.replace(/\/$/, "") + "/.default",
      }),
    },
  );
  if (check.ok) {
    tokenReady = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 2000));
}
if (!tokenReady) {
  await graph(`applications/${record.appObjectId}/removePassword`, "POST", {
    keyId: credential.keyId,
  });
  throw Error(
    "New client credential did not validate at Microsoft identity endpoint",
  );
}
const powerToken = serviceToken("https://service.powerapps.com/");
const values = {
  "token:clientId": record.appId,
  "token:clientSecret": secret,
  "token:TenantId": tenant,
  "token:resourceUri": org.replace(/\/$/, ""),
  "token:grantType": "client_credentials",
  environment,
};
const properties = {
  displayName: "FieldOps 360 Dataverse Runtime",
  apiId: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps",
  environment: {
    id: "/providers/Microsoft.PowerApps/environments/" + environment,
    name: environment,
  },
  connectionParameters: values,
};
const url = `https://api.powerapps.com/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps/connections/${record.connectionName}?api-version=2016-11-01&$filter=environment%20eq%20'${environment}'`;
const r = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${powerToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ properties }),
});
if (!r.ok) {
  const e = await r.json().catch(() => ({}));
  await graph(`applications/${record.appObjectId}/removePassword`, "POST", {
    keyId: credential.keyId,
  });
  throw Error(
    (
      "Connector " +
      r.status +
      ": " +
      (e.error?.code || "creation failed") +
      " " +
      (e.error?.message || "")
    ).replaceAll(secret, "[redacted]"),
  );
}
const connection = await r.json();
secret = "";
record.credentialExpires = expiry;
record.credentialKeyId = credential.keyId;
await writeFile(stateFile, JSON.stringify(record, null, 2), { mode: 0o600 });
await dv("AddSolutionComponent", "POST", {
  ComponentId: roleId,
  ComponentType: 20,
  SolutionUniqueName: "FieldOps360",
  AddRequiredComponents: false,
});
if (connection.properties?.statuses?.some((s) => s.status === "Error"))
  throw Error(
    "Connector not connected: " +
      connection.properties.statuses
        .filter((s) => s.status === "Error")
        .map((s) => s.error?.code)
        .join(","),
  );
console.log(
  JSON.stringify(
    {
      appId: record.appId,
      role: "FieldOps Integration Runtime",
      connectionName: record.connectionName,
      statuses: connection.properties?.statuses,
      credentialExpires: expiry,
      noTenantApiPermissions: true,
    },
    null,
    2,
  ),
);
