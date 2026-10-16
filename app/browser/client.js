import {
  Fault,
  canRead,
  validateRegistration,
  validateDecision,
} from "../../shared/rules.mjs";
import { seed } from "./seed";
import {
  loadState,
  saveState,
  clearState,
  saveFile,
  readFile,
  clearFiles,
} from "./storage";
import { recognizeDocument } from "./ocr";
const now = () => new Date().toISOString();
function audit(data, delivery, actor, event, detail = "") {
  data.audit.unshift({
    id: crypto.randomUUID(),
    delivery,
    actor,
    event,
    detail,
    created: now(),
  });
}
function user(data) {
  const id = sessionStorage.getItem("fieldops-demo-user");
  const u = data.users.find((u) => u.id === id);
  if (!u) throw new Fault(401, "Kies een demonstratierol");
  return u;
}
function get(data, u, id) {
  const d = data.deliveries.find((d) => d.id === id);
  if (!d) throw new Fault(404, "Levering niet gevonden");
  if (!canRead(u, d)) throw new Fault(403, "Geen toegang tot deze levering");
  return d;
}
function requireAdmin(u) {
  if (u.role !== "admin") throw new Fault(403, "Beheerder vereist");
}
function processJobs(data) {
  for (const job of data.jobs.filter(
    (j) => ["queued", "retry"].includes(j.state) && j.next_run <= Date.now(),
  )) {
    const d = data.deliveries.find((d) => d.id === job.delivery);
    job.attempts++;
    if (data.failing) {
      job.error = "Gesimuleerde ERP-storing (browserdemo)";
      job.state = job.attempts >= 3 ? "dead" : "retry";
      job.next_run = Date.now() + 2000;
      data.alerts.unshift({
        id: crypto.randomUUID(),
        job: job.id,
        message: `Simulatie: ERP poging ${job.attempts} mislukt`,
        created: now(),
      });
      audit(data, d.id, "demo-worker", "integration_error", job.error);
      continue;
    }
    if (d.status !== "approved") {
      job.state = "dead";
      job.error = "Levering is niet goedgekeurd";
      continue;
    }
    const key = d.id,
      payload = JSON.stringify({
        reference: d.reference,
        quantity: d.quantity,
        unit: d.unit,
        site: d.site,
      });
    let receipt = data.receipts[key];
    if (receipt && receipt.payload !== payload) {
      job.state = "dead";
      job.error = "Idempotentiesleutel/payloadconflict";
      continue;
    }
    if (!receipt) {
      receipt = { id: "DEMO-ERP-" + crypto.randomUUID().slice(0, 8), payload };
      data.receipts[key] = receipt;
    }
    job.state = "done";
    job.error = null;
    d.status = "synced";
    d.erp_id = receipt.id;
    d.version++;
    audit(
      data,
      d.id,
      "demo-worker",
      "erp_simulated",
      receipt.id + " · geen externe ERP-aanroep",
    );
  }
}
function summary(data, u) {
  const deliveries = data.deliveries
    .filter((d) => canRead(u, d))
    .map((d) => ({
      ...d,
      site_name: data.sites.find((s) => s.id === d.site)?.name,
    }))
    .sort((a, b) => b.created.localeCompare(a.created));
  const visible = new Set(deliveries.map((d) => d.id));
  return {
    user: u,
    deliveries,
    sites: data.sites,
    audit: data.audit
      .filter((a) => visible.has(a.delivery))
      .map((a) => ({
        ...a,
        reference: data.deliveries.find((d) => d.id === a.delivery)?.reference,
      }))
      .slice(0, 100),
    jobs:
      u.role === "admin"
        ? data.jobs.map((j) => ({
            ...j,
            reference: data.deliveries.find((d) => d.id === j.delivery)
              ?.reference,
          }))
        : [],
    alerts: u.role === "admin" ? data.alerts : [],
    mode: "browser-demo",
    failing: data.failing,
  };
}
export async function browserApi(path, options = {}) {
  const data = loadState(seed),
    input = options.body ? JSON.parse(options.body) : {};
  const method = options.method || "GET";
  if (path === "/session" && method === "POST") {
    const u = data.users.find((u) => u.id === input.userId);
    if (!u) throw new Fault(401, "Ongeldige demonstratierol");
    sessionStorage.setItem("fieldops-demo-user", u.id);
    saveState(data);
    return u;
  }
  const u = user(data);
  if (path === "/state" && method === "GET") {
    processJobs(data);
    saveState(data);
    return summary(data, u);
  }
  if (path === "/deliveries" && method === "POST") {
    const fields = validateRegistration(u, input, data.sites, (ref) =>
      data.deliveries.some((d) => d.reference === ref),
    );
    if (fields.document && data.documents[fields.document]?.owner !== u.id)
      throw new Fault(403, "Document niet beschikbaar");
    const d = {
      ...fields,
      id: crypto.randomUUID(),
      status: "draft",
      owner: u.id,
      created: now(),
      confirmed: 0,
      version: 1,
      erp_id: null,
    };
    data.deliveries.unshift(d);
    audit(data, d.id, u.id, "created");
    saveState(data);
    return d;
  }
  const action = path.match(
    /^\/deliveries\/([^/]+)\/(submit|decision|confirm)$/,
  );
  if (action && method === "POST") {
    const [, id, verb] = action,
      d = get(data, u, id);
    if (verb === "confirm") {
      if (!["draft", "rejected"].includes(d.status))
        throw new Fault(409, "Document kan nu niet worden bevestigd");
      if (!d.document) throw new Fault(422, "Geen document gekoppeld");
      if (
        input.reference !== d.reference ||
        Number(input.quantity) !== d.quantity ||
        input.supplier !== d.supplier
      )
        throw new Fault(422, "Bevestig de gecorrigeerde leveringsvelden");
      d.confirmed = 1;
      d.version++;
      audit(
        data,
        id,
        u.id,
        "document_confirmed",
        JSON.stringify({
          original: data.documents[d.document].result.fields,
          confirmed: input,
        }),
      );
    } else if (verb === "submit") {
      if (d.owner !== u.id && u.role !== "admin")
        throw new Fault(403, "Alleen eigenaar kan indienen");
      if (!["draft", "rejected"].includes(d.status))
        throw new Fault(409, "Levering is al ingediend");
      if (d.document && !d.confirmed)
        throw new Fault(422, "Bevestig eerst de documentgegevens");
      d.status = "pending";
      d.version++;
      audit(data, id, u.id, "approval_requested");
    } else {
      validateDecision(u, d, input);
      d.status = input.decision === "approve" ? "approved" : "rejected";
      d.version++;
      audit(data, id, u.id, d.status, input.reason || "");
      if (d.status === "approved") {
        let job = data.jobs.find((j) => j.delivery === id);
        if (!job) {
          job = { id: crypto.randomUUID(), delivery: id, attempts: 0 };
          data.jobs.push(job);
        }
        Object.assign(job, { state: "queued", next_run: Date.now() + 1000 });
      }
    }
    saveState(data);
    return { ...d };
  }
  if (path === "/admin/erp" && method === "POST") {
    requireAdmin(u);
    data.failing = Boolean(input.failing);
    saveState(data);
    return { failing: data.failing };
  }
  if (path === "/admin/retry" && method === "POST") {
    requireAdmin(u);
    const job = data.jobs.find((j) => j.id === input.job);
    if (!job || !["retry", "dead"].includes(job.state))
      throw new Fault(409, "Taak kan niet herstart worden");
    Object.assign(job, {
      state: "queued",
      attempts: 0,
      next_run: Date.now() + 1000,
    });
    audit(data, job.delivery, u.id, "retry_requested");
    saveState(data);
    return { ok: true };
  }
  throw new Fault(404, "Onbekende browserdemoroute");
}
export async function browserUpload(file, onProgress) {
  const before = loadState(seed),
    u = user(before);
  const result = await recognizeDocument(file, onProgress);
  const id = crypto.randomUUID();
  await saveFile(id, file);
  // Re-read after long OCR; do not overwrite actions from another open tab.
  const data = loadState(seed);
  if (user(data).id !== u.id)
    throw Error("De demonstratierol is gewijzigd; probeer de upload opnieuw.");
  data.documents[id] = { owner: u.id, result };
  saveState(data);
  return { id, ...result };
}
export async function browserDocument(id) {
  const data = loadState(seed),
    u = user(data);
  const doc = data.documents[id];
  if (!doc) throw new Fault(404, "Document niet gevonden");
  if (
    doc.owner !== u.id &&
    !data.deliveries.some((d) => d.document === id && canRead(u, d))
  )
    throw new Fault(403, "Geen toegang");
  const file = await readFile(id);
  if (!file) throw Error("Bonfoto niet meer beschikbaar op dit toestel.");
  return file;
}
export async function newSession() {
  await clearFiles();
  clearState();
  saveState(seed());
  location.reload();
}
