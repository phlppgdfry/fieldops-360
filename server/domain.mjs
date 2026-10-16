import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import {
  Fault,
  canRead,
  validateRegistration,
  validateDecision,
} from "../shared/rules.mjs";
export { Fault } from "../shared/rules.mjs";
export class Operations {
  constructor(path = ":memory:") {
    this.db = new DatabaseSync(path);
    this.db.exec(
      `PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS sites(id TEXT PRIMARY KEY,name TEXT NOT NULL,location TEXT NOT NULL); CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT,role TEXT,site TEXT REFERENCES sites(id)); CREATE TABLE IF NOT EXISTS deliveries(id TEXT PRIMARY KEY,reference TEXT UNIQUE NOT NULL,site TEXT NOT NULL REFERENCES sites(id),supplier TEXT NOT NULL,quantity REAL NOT NULL CHECK(quantity>0),unit TEXT NOT NULL,expected REAL NOT NULL CHECK(expected>0),note TEXT,status TEXT NOT NULL,owner TEXT REFERENCES users(id),document TEXT,confirmed INTEGER DEFAULT 0,erp_id TEXT,created TEXT NOT NULL,version INTEGER DEFAULT 1); CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,path TEXT,mime TEXT,result TEXT,owner TEXT REFERENCES users(id)); CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,delivery TEXT,actor TEXT,event TEXT,detail TEXT,created TEXT); CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,delivery TEXT UNIQUE REFERENCES deliveries(id),state TEXT,attempts INTEGER DEFAULT 0,next_run INTEGER DEFAULT 0,error TEXT); CREATE TABLE IF NOT EXISTS erp(id TEXT PRIMARY KEY,idempotency_key TEXT UNIQUE,payload TEXT); CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY AUTOINCREMENT,job TEXT,message TEXT,created TEXT);`,
    );
    if (!this.db.prepare("SELECT id FROM sites LIMIT 1").get()) this.seed();
  }
  seed() {
    for (const row of [
      ["s1", "Kanaalzone Brugge", "Brugge"],
      ["s2", "N34 Herinrichting", "Oostende"],
      ["s3", "Logistiek park", "Roeselare"],
    ])
      this.db.prepare("INSERT INTO sites VALUES(?,?,?)").run(...row);
    for (const u of [
      ["driver", "Tom Vandenberghe", "driver", "s1"],
      ["manager", "Sarah Maes", "manager", "s1"],
      ["admin", "Philippe Godfroy", "admin", null],
      ["other", "Jan Peeters", "driver", "s2"],
    ])
      this.db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(...u);
    const names = [
      "Declercq Beton",
      "Devagro",
      "Willy Naessens",
      "De Brabandere",
      "Verhelst",
      "Declercq Beton",
      "Devagro",
      "Verhelst",
    ];
    for (let i = 0; i < 8; i++) {
      const status = [
        "pending",
        "pending",
        "approved",
        "synced",
        "rejected",
        "synced",
        "pending",
        "draft",
      ][i];
      const id = randomUUID();
      this.db
        .prepare(
          "INSERT INTO deliveries(id,reference,site,supplier,quantity,unit,expected,note,status,owner,created,erp_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          `LB-2026-${String(1041 + i)}`,
          ["s1", "s2", "s1", "s3"][i % 4],
          names[i],
          i === 0 ? 18 : 24,
          "m³",
          24,
          i === 0 ? "6 m³ minder geleverd dan besteld." : "",
          status,
          i % 4 === 1 ? "other" : "driver",
          new Date(Date.now() - i * 3600000).toISOString(),
          status === "synced" ? `ERP-${1041 + i}` : null,
        );
      this.audit(id, "admin", "seed", `Fictieve demolevering ${1041 + i}`);
    }
  }
  user(id) {
    const u = this.db.prepare("SELECT * FROM users WHERE id=?").get(id);
    if (!u) throw new Fault(401, "Ongeldige demosessie");
    return u;
  }
  audit(id, actor, event, detail = "") {
    this.db
      .prepare(
        "INSERT INTO audit(delivery,actor,event,detail,created) VALUES(?,?,?,?,?)",
      )
      .run(id, actor, event, detail, new Date().toISOString());
  }
  canRead(user, d) {
    return canRead(user, d);
  }
  get(user, id) {
    const d = this.db.prepare("SELECT * FROM deliveries WHERE id=?").get(id);
    if (!d) throw new Fault(404, "Levering niet gevonden");
    if (!this.canRead(user, d))
      throw new Fault(403, "Geen toegang tot deze levering");
    return d;
  }
  list(user) {
    return this.db
      .prepare(
        "SELECT d.*,s.name site_name FROM deliveries d JOIN sites s ON s.id=d.site ORDER BY d.created DESC",
      )
      .all()
      .filter((d) => this.canRead(user, d));
  }
  create(user, input) {
    const {
      reference,
      site,
      supplier,
      quantity,
      expected,
      unit,
      note,
      document,
    } = validateRegistration(
      user,
      input,
      this.db.prepare("SELECT id FROM sites").all(),
      (ref) =>
        Boolean(
          this.db
            .prepare("SELECT id FROM deliveries WHERE reference=?")
            .get(ref),
        ),
    );
    if (document) {
      const doc = this.db
        .prepare("SELECT owner FROM documents WHERE id=?")
        .get(document);
      if (!doc || doc.owner !== user.id)
        throw new Fault(403, "Document niet beschikbaar");
    }
    const id = randomUUID();
    try {
      this.db
        .prepare(
          "INSERT INTO deliveries(id,reference,site,supplier,quantity,unit,expected,note,status,owner,document,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          reference,
          site,
          supplier.trim(),
          quantity,
          unit,
          expected,
          note,
          "draft",
          user.id,
          document,
          new Date().toISOString(),
        );
    } catch (e) {
      if (e.message.includes("UNIQUE"))
        throw new Fault(409, "Bonnummer bestaat al");
      throw e;
    }
    this.audit(id, user.id, "created");
    return this.get(user, id);
  }
  confirm(user, id, fields) {
    const d = this.get(user, id);
    if (!["draft", "rejected"].includes(d.status))
      throw new Fault(409, "Document kan nu niet worden bevestigd");
    if (!d.document) throw new Fault(422, "Geen document gekoppeld");
    const result = JSON.parse(
      this.db.prepare("SELECT result FROM documents WHERE id=?").get(d.document)
        .result,
    );
    if (
      fields.reference !== d.reference ||
      Number(fields.quantity) !== d.quantity ||
      fields.supplier !== d.supplier
    )
      throw new Fault(422, "Bevestig de gecorrigeerde leveringsvelden");
    this.db
      .prepare("UPDATE deliveries SET confirmed=1,version=version+1 WHERE id=?")
      .run(id);
    this.audit(
      id,
      user.id,
      "document_confirmed",
      JSON.stringify({ original: result.fields, confirmed: fields }),
    );
    return this.get(user, id);
  }
  submit(user, id) {
    const d = this.get(user, id);
    if (d.owner !== user.id && user.role !== "admin")
      throw new Fault(403, "Alleen eigenaar kan indienen");
    if (!["draft", "rejected"].includes(d.status))
      throw new Fault(409, "Levering is al ingediend");
    if (d.document && !d.confirmed)
      throw new Fault(422, "Bevestig eerst de documentgegevens");
    this.db
      .prepare(
        "UPDATE deliveries SET status='pending',version=version+1 WHERE id=?",
      )
      .run(id);
    this.audit(
      id,
      user.id,
      "approval_requested",
      "Flow 1: validatie en goedkeuring",
    );
    return this.get(user, id);
  }
  decide(user, id, { decision, reason = "", version }) {
    const d = this.get(user, id);
    validateDecision(user, d, { decision, reason, version });
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("UPDATE deliveries SET status=?,version=version+1 WHERE id=?")
        .run(decision === "approve" ? "approved" : "rejected", id);
      if (decision === "approve")
        this.db
          .prepare(
            "INSERT INTO jobs(id,delivery,state) VALUES(?,?,'queued') ON CONFLICT(delivery) DO UPDATE SET state='queued',next_run=0",
          )
          .run(randomUUID(), id);
      this.audit(
        id,
        user.id,
        decision === "approve" ? "approved" : "rejected",
        reason,
      );
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    return this.get(user, id);
  }
  erp(key, payload) {
    const existing = this.db
      .prepare("SELECT * FROM erp WHERE idempotency_key=?")
      .get(key);
    if (existing) {
      if (existing.payload !== JSON.stringify(payload))
        throw new Fault(
          409,
          "Idempotentiesleutel hoort bij een andere payload",
        );
      return { id: existing.id, replayed: true };
    }
    const id = `ERP-${randomUUID().slice(0, 8)}`;
    this.db
      .prepare("INSERT INTO erp VALUES(?,?,?)")
      .run(id, key, JSON.stringify(payload));
    return { id, replayed: false };
  }
  async processJobs(send) {
    const jobs = this.db
      .prepare(
        "SELECT * FROM jobs WHERE state IN ('queued','retry') AND next_run<=?",
      )
      .all(Date.now());
    for (const job of jobs) {
      const d = this.db
        .prepare("SELECT * FROM deliveries WHERE id=?")
        .get(job.delivery);
      try {
        const receipt = await send(d, job.delivery);
        if (!receipt?.id) throw Error("Ongeldige ERP-respons");
        this.db.exec("BEGIN");
        this.db
          .prepare(
            "UPDATE deliveries SET status='synced',erp_id=?,version=version+1 WHERE id=?",
          )
          .run(receipt.id, d.id);
        this.db
          .prepare(
            "UPDATE jobs SET state='done',attempts=attempts+1,error=NULL WHERE id=?",
          )
          .run(job.id);
        this.audit(d.id, "system", "erp_synced", receipt.id);
        this.db.exec("COMMIT");
      } catch (e) {
        if (this.db.isTransaction) this.db.exec("ROLLBACK");
        const attempts = job.attempts + 1;
        this.db
          .prepare(
            "UPDATE jobs SET state=?,attempts=?,next_run=?,error=? WHERE id=?",
          )
          .run(
            attempts >= 3 ? "dead" : "retry",
            attempts,
            Date.now() + 1000 * 2 ** attempts,
            e.message,
            job.id,
          );
        this.db
          .prepare("INSERT INTO alerts(job,message,created) VALUES(?,?,?)")
          .run(
            job.id,
            `ERP poging ${attempts}: ${e.message}`,
            new Date().toISOString(),
          );
        this.audit(d.id, "system", "integration_error", e.message);
      }
    }
    return jobs.length;
  }
  summary(user) {
    return {
      deliveries: this.list(user),
      sites: this.db.prepare("SELECT * FROM sites").all(),
      user,
      audit: this.db
        .prepare(
          "SELECT a.*,d.reference FROM audit a JOIN deliveries d ON d.id=a.delivery ORDER BY a.id DESC LIMIT 100",
        )
        .all()
        .filter((a) =>
          this.canRead(
            user,
            this.db
              .prepare("SELECT * FROM deliveries WHERE id=?")
              .get(a.delivery),
          ),
        ),
      jobs:
        user.role === "admin"
          ? this.db
              .prepare(
                "SELECT j.*,d.reference FROM jobs j JOIN deliveries d ON d.id=j.delivery",
              )
              .all()
          : [],
      alerts:
        user.role === "admin"
          ? this.db.prepare("SELECT * FROM alerts ORDER BY id DESC").all()
          : [],
    };
  }
}
