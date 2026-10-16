import { execFileSync } from "node:child_process";
export function client(org = process.env.DATAVERSE_URL) {
  if (!org) throw Error("DATAVERSE_URL vereist");
  const accounts = JSON.parse(
    execFileSync("az", ["account", "list", "-o", "json"], { encoding: "utf8" }),
  );
  const account = accounts.find(
    (a) => a.user?.name === process.env.DATAVERSE_USER,
  );
  const args = ["account", "get-access-token", "--resource", org, "-o", "json"];
  if (account) args.push("--subscription", account.id);
  const token = JSON.parse(
    execFileSync("az", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ).accessToken;
  return async function request(path, method = "GET", data, extra = {}) {
    const r = await fetch(`${org.replace(/\/$/, "")}/api/data/v9.2/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "OData-Version": "4.0",
        "OData-MaxVersion": "4.0",
        ...extra,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    if (!r.ok)
      throw Error(`Dataverse ${r.status}: ${(await r.text()).slice(0, 1500)}`);
    return r.status === 204
      ? { id: r.headers.get("odata-entityid") }
      : r.json();
  };
}
if (process.argv[2] === "probe") {
  const call = client();
  console.log(await call("WhoAmI"));
}
