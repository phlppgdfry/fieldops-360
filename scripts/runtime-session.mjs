import { readFile } from "node:fs/promises";
import { nativeState } from "./native-state.mjs";
import { serviceToken } from "./power-services.mjs";
export async function withRuntimeClient(task) {
  if (!process.env.AZURE_TENANT_ID)
    throw Error("AZURE_TENANT_ID is required for runtime authentication");
  const runtime = JSON.parse(
      await readFile(await nativeState("native-runtime"), "utf8"),
    ),
    org = process.env.DATAVERSE_URL.replace(/\/$/, ""),
    graphToken = serviceToken("https://graph.microsoft.com/");
  let credential;
  async function graph(path, body) {
    const r = await fetch("https://graph.microsoft.com/v1.0/" + path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${graphToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw Error("Temporary credential request failed: " + r.status);
    return r.status === 204 ? {} : r.json();
  }
  try {
    credential = await graph(
      `applications/${runtime.appObjectId}/addPassword`,
      {
        passwordCredential: {
          displayName: "FieldOps transient integration test",
          endDateTime: new Date(Date.now() + 1800000).toISOString(),
        },
      },
    );
    let token;
    for (let i = 0; i < 12; i++) {
      const r = await fetch(
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: "POST",
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: runtime.appId,
            client_secret: credential.secretText,
            scope: org + "/.default",
          }),
        },
      );
      if (r.ok) {
        token = (await r.json()).access_token;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!token) throw Error("Temporary runtime authentication failed");
    async function call(path, method = "GET", body) {
      const r = await fetch(org + "/api/data/v9.2/" + path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!r.ok)
        throw Error(
          "Runtime Dataverse " +
            r.status +
            ": " +
            (await r.text()).slice(0, 700),
        );
      if (r.status === 204) return {};
      if (r.headers.get("content-type")?.includes("json")) return r.json();
      return {
        bytes: new Uint8Array(await r.arrayBuffer()),
        contentType: r.headers.get("content-type"),
      };
    }
    return await task(call, runtime);
  } finally {
    if (credential?.keyId)
      await graph(`applications/${runtime.appObjectId}/removePassword`, {
        keyId: credential.keyId,
      });
  }
}
