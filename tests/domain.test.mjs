import { test } from "node:test";
import assert from "node:assert/strict";
import { Operations } from "../server/domain.mjs";
import { extractFields } from "../server/documents.mjs";
const input = (extra = {}) => ({
  reference: "TEST-100",
  site: "s1",
  supplier: "Beton Test",
  quantity: 24,
  expected: 24,
  unit: "m³",
  ...extra,
});
function setup() {
  const o = new Operations();
  return {
    o,
    driver: o.user("driver"),
    manager: o.user("manager"),
    admin: o.user("admin"),
  };
}
test("chauffeur ziet uitsluitend eigen leveringen en kan geen andere werf registreren", () => {
  const { o, driver } = setup();
  assert.ok(o.list(driver).every((d) => d.owner === driver.id));
  assert.throws(() => o.create(driver, input({ site: "s2" })), { status: 403 });
  o.db.close();
});
test("validatie beschermt hoeveelheden, unieke referenties en afwijkingsreden", () => {
  const { o, driver } = setup();
  for (const bad of [
    { quantity: 0 },
    { quantity: -1 },
    { quantity: "NaN" },
    { expected: 0 },
    { quantity: 18 },
    { reference: "x" },
    { unit: "kg" },
  ])
    assert.throws(() => o.create(driver, input(bad)), { status: 422 });
  o.create(driver, input());
  assert.throws(() => o.create(driver, input()), { status: 409 });
  o.db.close();
});
test("indienen, onafhankelijk goedkeuren en ERP leveren audit en unieke ontvangst", async () => {
  const { o, driver, manager } = setup();
  let d = o.create(driver, input());
  d = o.submit(driver, d.id);
  assert.equal(d.status, "pending");
  assert.throws(
    () => o.decide(driver, d.id, { decision: "approve", version: d.version }),
    { status: 403 },
  );
  d = o.decide(manager, d.id, { decision: "approve", version: d.version });
  assert.equal(d.status, "approved");
  await o.processJobs((delivery, key) =>
    o.erp(key, { reference: delivery.reference }),
  );
  assert.equal(o.get(driver, d.id).status, "synced");
  assert.equal(o.db.prepare("SELECT count(*) n FROM erp").get().n, 1);
  assert.equal(o.erp(d.id, { reference: d.reference }).replayed, true);
  assert.throws(() => o.erp(d.id, { reference: "DIFFERENT" }), { status: 409 });
  assert.equal(
    o.db.prepare("SELECT count(*) n FROM audit WHERE delivery=?").get(d.id).n,
    4,
  );
  o.db.close();
});
test("verouderde beslissing en dubbele indiening worden geweigerd", () => {
  const { o, driver, manager } = setup();
  let d = o.create(driver, input());
  d = o.submit(driver, d.id);
  assert.throws(() => o.submit(driver, d.id), { status: 409 });
  assert.throws(
    () => o.decide(manager, d.id, { decision: "approve", version: 0 }),
    { status: 409 },
  );
  assert.throws(
    () =>
      o.decide(manager, d.id, {
        decision: "reject",
        reason: "",
        version: d.version,
      }),
    { status: 422 },
  );
  o.db.close();
});
test("afwijzen met reden laat herindiening toe", () => {
  const { o, driver, manager } = setup();
  let d = o.create(driver, input());
  d = o.submit(driver, d.id);
  o.decide(manager, d.id, {
    decision: "reject",
    reason: "Controleer bon",
    version: d.version,
  });
  assert.equal(o.submit(driver, d.id).status, "pending");
  o.db.close();
});
test("ERP-storing geeft retries, dead letter en meldingen zonder sync", async () => {
  const { o, driver, manager } = setup();
  let d = o.create(driver, input());
  d = o.submit(driver, d.id);
  o.decide(manager, d.id, { decision: "approve", version: d.version });
  for (let i = 0; i < 3; i++) {
    o.db.exec("UPDATE jobs SET next_run=0");
    await o.processJobs(() => {
      throw Error("HTTP 503");
    });
  }
  assert.equal(o.db.prepare("SELECT state FROM jobs").get().state, "dead");
  assert.equal(o.db.prepare("SELECT count(*) n FROM alerts").get().n, 3);
  assert.equal(o.get(driver, d.id).status, "approved");
  o.db.close();
});
test("vreemde levering en document blijven afgeschermd", () => {
  const { o, driver } = setup();
  const id = o.db
    .prepare("SELECT id FROM deliveries WHERE owner='other'")
    .get().id;
  assert.throws(() => o.get(driver, id), { status: 403 });
  assert.throws(() => o.create(driver, input({ document: "foreign" })), {
    status: 403,
  });
  o.db.close();
});
test("OCR wordt nooit automatisch bevestigd; ontbrekende velden en lage confidence gemarkeerd", () => {
  const r = extractFields(
    "Bonnummer: BON-123\nLeverancier: Beton Test\nHoeveelheid: 18,5\nEenheid: ton",
    0.8,
  );
  assert.equal(r.fields.quantity, 18.5);
  assert.equal(r.fields.reference, "BON-123");
  assert.ok(r.requiresHumanReview);
  assert.ok(r.warnings.includes("Lage OCR-betrouwbaarheid"));
  assert.equal(extractFields("").warnings.length, 4);
});
test("document blokkeert indiening totdat leveringswaarden menselijk bevestigd zijn", () => {
  const { o, driver } = setup();
  o.db
    .prepare("INSERT INTO documents VALUES(?,?,?,?,?)")
    .run(
      "doc",
      "/tmp/demo",
      "image/png",
      JSON.stringify({ fields: { quantity: 18 } }),
      "driver",
    );
  const d = o.create(driver, input({ document: "doc" }));
  assert.throws(() => o.submit(driver, d.id), { status: 422 });
  assert.throws(
    () =>
      o.confirm(driver, d.id, {
        reference: "wrong",
        quantity: 24,
        supplier: "Beton Test",
      }),
    { status: 422 },
  );
  o.confirm(driver, d.id, {
    reference: d.reference,
    quantity: 24,
    supplier: "Beton Test",
  });
  assert.equal(o.submit(driver, d.id).status, "pending");
  o.db.close();
});
