// Optional independent ERP sandbox; never a commercial ERP.
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
const key = process.env.ERP_API_KEY;
if (!key || key.length < 24)
  throw Error("ERP_API_KEY moet minimaal 24 tekens bevatten");
mkdirSync(".data", { recursive: true });
const db = new DatabaseSync(".data/erp-sandbox.sqlite");
db.exec(
  "CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,key TEXT UNIQUE,payload TEXT)",
);
http
  .createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };
    if (req.headers.authorization !== `Bearer ${key}`)
      return send(401, { error: "Unauthorized" });
    if (req.url !== "/receipts" || req.method !== "POST")
      return send(404, { error: "Not found" });
    if (process.env.ERP_FAIL === "1")
      return send(503, { error: "Simulated outage" });
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 65536) return send(413, { error: "Too large" });
      }
      const payload = JSON.parse(body),
        idempotency = req.headers["idempotency-key"];
      if (
        !idempotency ||
        idempotency.length > 100 ||
        !payload.reference ||
        !Number.isFinite(payload.quantity) ||
        payload.quantity <= 0
      )
        return send(422, {
          error: "reference, positive quantity and Idempotency-Key required",
        });
      const old = db
        .prepare("SELECT * FROM receipts WHERE key=?")
        .get(idempotency);
      if (old) {
        if (old.payload !== JSON.stringify(payload))
          return send(409, {
            error: "Idempotency key reused for different payload",
          });
        return send(200, { id: old.id, replayed: true });
      }
      const id = `ERP-${randomUUID()}`;
      db.prepare("INSERT INTO receipts VALUES(?,?,?)").run(
        id,
        idempotency,
        JSON.stringify(payload),
      );
      send(201, { id, replayed: false });
    } catch {
      send(400, { error: "Invalid request" });
    }
  })
  .listen(
    Number(process.env.ERP_PORT || 3602),
    process.env.ERP_HOST || "127.0.0.1",
    () => console.log("Independent ERP sandbox ready"),
  );
