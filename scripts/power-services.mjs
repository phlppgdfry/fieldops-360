import { execFileSync } from "node:child_process";
export function serviceToken(resource) {
  const accounts = JSON.parse(
    execFileSync("az", ["account", "list", "--all", "-o", "json"], {
      encoding: "utf8",
    }),
  );
  const account = accounts.find(
    (a) => a.user?.name === process.env.DATAVERSE_USER,
  );
  if (!account)
    throw Error("Kies DATAVERSE_USER met een bestaande Azure-aanmelding");
  return JSON.parse(
    execFileSync(
      "az",
      [
        "account",
        "get-access-token",
        "--resource",
        resource,
        "--subscription",
        account.id,
        "-o",
        "json",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  ).accessToken;
}
export async function serviceRequest(url, resource, method = "GET", data) {
  const token = serviceToken(resource);
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!r.ok)
    throw Error(
      `Microsoft service ${r.status}: ${(await r.text()).slice(0, 800)}`,
    );
  const raw = await r.text();
  return raw ? JSON.parse(raw) : { status: r.status };
}
if (process.argv[2] === "inventory") {
  const environment = process.env.POWER_PLATFORM_ENVIRONMENT_ID;
  const [connections, flows] = await Promise.allSettled([
    serviceRequest(
      `https://api.powerapps.com/providers/Microsoft.PowerApps/connections?api-version=2016-11-01&$filter=environment%20eq%20'${environment}'`,
      "https://service.powerapps.com/",
    ),
    serviceRequest(
      `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${environment}/flows?api-version=2016-11-01`,
      "https://service.flow.microsoft.com/",
    ),
  ]);
  console.log(
    JSON.stringify(
      {
        connections:
          connections.status === "fulfilled"
            ? connections.value.value?.map((x) => ({
                name: x.name,
                api: x.properties?.apiId,
                status: x.properties?.statuses,
              }))
            : connections.reason.message,
        flows:
          flows.status === "fulfilled"
            ? flows.value.value?.map((x) => ({
                name: x.name,
                displayName: x.properties?.displayName,
                state: x.properties?.state,
              }))
            : flows.reason.message,
      },
      null,
      2,
    ),
  );
}
