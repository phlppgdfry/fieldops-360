import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
let child, dir;
const base = "http://127.0.0.1:3699";
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "fieldops-http-"));
  child = spawn(process.execPath, ["server/index.mjs"], {
    env: { ...process.env, PORT: "3699", DATA_DIR: dir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await Promise.race([
    once(child.stdout, "data"),
    once(child, "exit").then(() => {
      throw Error("Server startup failed");
    }),
  ]);
});
after(async () => {
  child.kill("SIGTERM");
  await once(child, "exit");
  await rm(dir, { recursive: true, force: true });
});
async function login(userId) {
  const r = await fetch(base + "/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie").split(";")[0];
}
test("API vereist sessie en blokkeert cross-origin mutatie en externe ERP-calls", async () => {
  assert.equal((await fetch(base + "/api/state")).status, 401);
  assert.equal(
    (
      await fetch(base + "/api/session", {
        method: "POST",
        headers: {
          Origin: "https://evil.example",
          "Content-Type": "application/json",
        },
        body: '{"userId":"admin"}',
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(base + "/api/erp/receipts", { method: "POST", body: "{}" }))
      .status,
    401,
  );
});
test("chauffeur kan beheerroutes of andere werf niet gebruiken", async () => {
  const cookie = await login("driver");
  const state = await (
    await fetch(base + "/api/state", { headers: { Cookie: cookie } })
  ).json();
  assert.ok(state.deliveries.every((d) => d.owner === "driver"));
  assert.equal(
    (
      await fetch(base + "/api/admin/erp", {
        method: "POST",
        headers: { Cookie: cookie },
        body: '{"failing":true}',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/deliveries", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          reference: "BAD-99",
          site: "s2",
          supplier: "Test",
          quantity: 24,
          expected: 24,
        }),
      })
    ).status,
    403,
  );
});
test("upload valideert MIME-signature en schermt opgeslagen document af", async () => {
  const cookie = await login("driver");
  assert.equal(
    (
      await fetch(base + "/api/documents", {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "image/png" },
        body: "not png",
      })
    ).status,
    422,
  );
  const doc = await (
    await fetch(base + "/api/documents", {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "text/plain" },
      body: "Bonnummer: DOC-101\nLeverancier: Test\nHoeveelheid: 24\nEenheid: ton",
    })
  ).json();
  assert.equal(doc.provider, "text-parser (geen AI)");
  const other = await login("other");
  assert.equal(
    (await fetch(base + doc.url, { headers: { Cookie: other } })).status,
    403,
  );
  assert.equal(
    (await fetch(base + doc.url, { headers: { Cookie: cookie } })).status,
    200,
  );
});
