import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
test("aparte ERP-test-API bewaakt sleutel, idempotentie en payloadconflict", async () => {
  const dir = await mkdtemp(join(tmpdir(), "fieldops-erp-"));
  const key = randomBytes(32).toString("hex");
  const child = spawn(process.execPath, [resolve("server/erp.mjs")], {
    cwd: dir,
    env: { ...process.env, ERP_API_KEY: key, ERP_PORT: "3698" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await once(child.stdout, "data");
    const url = "http://127.0.0.1:3698/receipts";
    const payload = { reference: "ERP-TEST", quantity: 18, unit: "ton" };
    const req = (headers = {}, data = payload) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data),
      });
    assert.equal((await req()).status, 401);
    const headers = {
      Authorization: `Bearer ${key}`,
      "Idempotency-Key": "test-idempotency",
    };
    const first = await req(headers);
    assert.equal(first.status, 201);
    const a = await first.json();
    const second = await req(headers);
    assert.equal(second.status, 200);
    const b = await second.json();
    assert.equal(a.id, b.id);
    assert.equal(b.replayed, true);
    assert.equal(
      (await req(headers, { ...payload, quantity: 24 })).status,
      409,
    );
    assert.equal(
      (
        await req(
          { ...headers, "Idempotency-Key": "bad" },
          { ...payload, quantity: -1 },
        )
      ).status,
      422,
    );
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit");
    await rm(dir, { recursive: true, force: true });
  }
});
