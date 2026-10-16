import http from "node:http";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { randomUUID, randomBytes, timingSafeEqual } from "node:crypto";
import { Operations, Fault } from "./domain.mjs";
import { readDocument } from "./documents.mjs";
const root = resolve(import.meta.dirname, "..");
const data = process.env.DATA_DIR || resolve(root, ".data");
await mkdir(resolve(data, "uploads"), { recursive: true });
export const ops = new Operations(resolve(data, "fieldops.sqlite"));
const sessions = new Map();
const erpSecret = randomBytes(32).toString("hex");
let failing = false;
let processing = false;
async function body(req, max = 100000) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw new Fault(413, "Bestand of verzoek te groot");
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (
      req.method !== "GET" &&
      req.headers.origin &&
      ![
        "http://127.0.0.1:3600",
        "http://127.0.0.1:3601",
        `http://${req.headers.host}`,
      ].includes(req.headers.origin)
    )
      throw new Fault(403, "Onbekende oorsprong");
    if (path === "/api/health")
      return json(res, 200, {
        ok: true,
        mode: "local-demo",
        ocr:
          process.platform === "darwin"
            ? "Apple Vision"
            : "Azure configuratie nodig",
      });
    if (path === "/api/session" && req.method === "POST") {
      const { userId } = JSON.parse(await body(req));
      const user = ops.user(userId);
      const token = randomUUID();
      sessions.set(token, {
        userId: user.id,
        expires: Date.now() + 8 * 3600000,
      });
      res.setHeader(
        "Set-Cookie",
        `fieldops=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`,
      );
      return json(res, 200, user);
    }
    if (path === "/api/erp/receipts" && req.method === "POST") {
      if (req.headers.authorization !== `Bearer ${erpSecret}`)
        throw new Fault(401, "ERP-authenticatie vereist");
      if (failing)
        throw new Fault(503, "ERP-test-API tijdelijk niet beschikbaar");
      const payload = JSON.parse(await body(req));
      return json(res, 200, ops.erp(req.headers["idempotency-key"], payload));
    }
    const token = req.headers.cookie?.match(/(?:^|; )fieldops=([^;]+)/)?.[1];
    const session = sessions.get(token);
    if (path.startsWith("/api") || path.startsWith("/uploads")) {
      if (!session || session.expires < Date.now())
        throw new Fault(401, "Kies een demonstratierol");
    }
    const user = session ? ops.user(session.userId) : null;
    if (path === "/api/state" && req.method === "GET")
      return json(res, 200, { ...ops.summary(user), failing });
    if (path === "/api/deliveries" && req.method === "POST")
      return json(res, 201, ops.create(user, JSON.parse(await body(req))));
    const action = path.match(
      /^\/api\/deliveries\/([^/]+)\/(submit|decision|confirm)$/,
    );
    if (action && req.method === "POST") {
      const [, id, method] = action;
      const input = JSON.parse((await body(req)).toString() || "{}");
      return json(
        res,
        200,
        method === "submit"
          ? ops.submit(user, id)
          : method === "confirm"
            ? ops.confirm(user, id, input)
            : ops.decide(user, id, input),
      );
    }
    if (path === "/api/documents" && req.method === "POST") {
      const mime = req.headers["content-type"]?.split(";")[0];
      const extensions = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "text/plain": ".txt",
        "application/pdf": ".pdf",
      };
      if (!extensions[mime])
        throw new Fault(415, "Upload PNG, JPEG, PDF of tekst");
      if (mime === "application/pdf" && !process.env.AZURE_DOCUMENT_ENDPOINT)
        throw new Fault(422, "PDF vereist Azure OCR; gebruik lokaal een foto");
      const bytes = await body(req, 5 * 1024 * 1024);
      if (
        mime === "image/png" &&
        !bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        throw new Fault(422, "Ongeldige PNG");
      if (
        mime === "image/jpeg" &&
        bytes.subarray(0, 3).toString("hex") !== "ffd8ff"
      )
        throw new Fault(422, "Ongeldige JPEG");
      const id = randomUUID();
      const file = resolve(data, "uploads", id + extensions[mime]);
      await writeFile(file, bytes);
      let result;
      try {
        result = await readDocument(file, mime);
      } catch (e) {
        await unlink(file).catch(() => {});
        console.error("OCR failure:", e.message);
        throw new Fault(
          502,
          "Documentherkenning mislukt; probeer een scherpere foto of registreer handmatig.",
        );
      }
      ops.db
        .prepare("INSERT INTO documents VALUES(?,?,?,?,?)")
        .run(id, file, mime, JSON.stringify(result), user.id);
      return json(res, 201, { id, ...result, url: `/uploads/${id}` });
    }
    if (path.startsWith("/uploads/") && req.method === "GET") {
      const doc = ops.db
        .prepare("SELECT * FROM documents WHERE id=?")
        .get(path.split("/").pop());
      if (!doc) throw new Fault(404, "Bestand niet gevonden");
      const linked = ops.db
        .prepare("SELECT * FROM deliveries WHERE document=?")
        .all(doc.id);
      if (doc.owner !== user.id && !linked.some((d) => ops.canRead(user, d)))
        throw new Fault(403, "Geen toegang");
      res.writeHead(200, {
        "Content-Type": doc.mime,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Disposition": "inline",
      });
      return res.end(await readFile(doc.path));
    }
    if (path === "/api/admin/erp" && req.method === "POST") {
      if (user.role !== "admin") throw new Fault(403, "Beheerder vereist");
      failing = Boolean(JSON.parse(await body(req)).failing);
      return json(res, 200, { failing });
    }
    if (path === "/api/admin/retry" && req.method === "POST") {
      if (user.role !== "admin") throw new Fault(403, "Beheerder vereist");
      const { job } = JSON.parse(await body(req));
      const row = ops.db.prepare("SELECT * FROM jobs WHERE id=?").get(job);
      if (!row || !["dead", "retry"].includes(row.state))
        throw new Fault(409, "Taak kan niet herstart worden");
      ops.db
        .prepare(
          "UPDATE jobs SET state='queued',next_run=0,attempts=0 WHERE id=?",
        )
        .run(job);
      ops.audit(row.delivery, user.id, "retry_requested");
      return json(res, 200, { ok: true });
    }
    if (path.startsWith("/api/"))
      throw new Fault(404, "API-route niet gevonden");
    const requested = path === "/" ? "/index.html" : decodeURIComponent(path);
    const file = resolve(root, "dist", "." + requested);
    if (!file.startsWith(resolve(root, "dist") + "/"))
      throw new Fault(403, "Ongeldig pad");
    let bytes;
    try {
      bytes = await readFile(file);
    } catch {
      if (extname(requested)) throw new Fault(404, "Bestand niet gevonden");
      bytes = await readFile(resolve(root, "dist/index.html"));
    }
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webm": "video/webm",
    };
    res.writeHead(200, { "Content-Type": types[extname(file)] || "text/html" });
    res.end(bytes);
  } catch (e) {
    if (e instanceof SyntaxError) e = new Fault(400, "Ongeldige JSON");
    if (!res.headersSent)
      json(res, e.status || 500, {
        error: e.status
          ? e.message
          : "Verwerking mislukt; controleer serverlog",
      });
    else res.end();
    if (!e.status) console.error(e);
  }
});
const port = Number(process.env.PORT || 3600);
server.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`FieldOps 360 http://127.0.0.1:${port} (lokale demo)`),
);
const worker = setInterval(async () => {
  if (processing) return;
  processing = true;
  try {
    await ops.processJobs(async (d, key) => {
      const r = await fetch(`http://127.0.0.1:${port}/api/erp/receipts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${erpSecret}`,
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          reference: d.reference,
          quantity: d.quantity,
          unit: d.unit,
          site: d.site,
        }),
      });
      if (!r.ok) throw Error(`ERP HTTP ${r.status}`);
      return r.json();
    });
  } catch (e) {
    console.error(e);
  } finally {
    processing = false;
  }
}, 1000);
function stop() {
  clearInterval(worker);
  server.close(() => {
    ops.db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
