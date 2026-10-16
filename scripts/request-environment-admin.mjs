// Official Microsoft self-elevation API. Apply only after explicit owner authorization.
import { execFileSync } from "node:child_process";
const envId = process.env.POWER_PLATFORM_ENVIRONMENT_ID;
if (!envId) throw Error("POWER_PLATFORM_ENVIRONMENT_ID vereist");
if (process.argv[2] !== "--apply") {
  console.log(
    JSON.stringify(
      {
        action:
          "Self-elevate current tenant administrator to Dataverse System Administrator",
        scope: "Selected environment only",
        environmentId: envId,
        changesTenantAdminRoles: false,
        reference:
          "https://learn.microsoft.com/power-platform/admin/manage-high-privileged-admin-roles",
        applyRequiresExplicitOwnerAuthorization: true,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const text = execFileSync("pac", ["auth", "token"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const token = text.match(
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
)?.[0];
if (!token) throw Error("Geen Power Platform token ontvangen");
const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url"));
if (claims.aud !== "https://api.powerplatform.com")
  throw Error("Onverwachte token-audience");
const r = await fetch(
  `https://api.powerplatform.com/usermanagement/environments/${encodeURIComponent(envId)}/user/applyAdminRole?api-version=2022-03-01-preview`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  },
);
if (!r.ok)
  throw Error(`Self-elevation ${r.status}: ${(await r.text()).slice(0, 1000)}`);
const data = await r.json();
console.log(
  JSON.stringify(
    {
      httpStatus: r.status,
      errors: data.errors || [],
      resultCodes: (data.information || []).map((x) => x.Code),
    },
    null,
    2,
  ),
);
