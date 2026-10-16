import { useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import DocumentUpload from "./DocumentUpload";
import { post } from "../api";
export default function DeliveryForm({ state, onClose, onCreated, setError }) {
  const [doc, setDoc] = useState(null),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    reference: "",
    site: state.user.site || "s1",
    supplier: "",
    quantity: "",
    expected: 24,
    unit: "m³",
    note: "",
  });
  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const fields = [
    ["Bonnummer", "reference", "text"],
    ["Leverancier", "supplier", "text"],
    ["Geleverde hoeveelheid", "quantity", "number"],
    ["Bestelde hoeveelheid", "expected", "number"],
  ];
  return (
    <div className="backdrop">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
      >
        <header>
          <div>
            <h2 id="form-title">Nieuwe levering</h2>
            <p>Van de werf naar één betrouwbaar dossier.</p>
          </div>
          <button aria-label="Sluiten" onClick={onClose}>
            <X />
          </button>
        </header>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const d = await post("/deliveries", {
                ...form,
                document: doc?.id,
              });
              onCreated(d);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <DocumentUpload
            setError={setError}
            onResult={(d) => {
              setDoc(d);
              setForm((f) => ({
                ...f,
                ...Object.fromEntries(
                  Object.entries(d.fields).filter(
                    ([, v]) => v !== null && v !== "",
                  ),
                ),
              }));
            }}
          />
          {doc && (
            <div className="notice">
              <strong>{doc.provider}</strong>
              <p>
                OCR-voorstel geladen. Controleer en corrigeer alle velden.
                Bevestiging volgt in het dossier.
              </p>
              {doc.warnings.map((w) => (
                <small key={w}>
                  {w}
                  <br />
                </small>
              ))}
            </div>
          )}
          <div className="form-grid">
            <label>
              Werf
              <select
                value={form.site}
                onChange={(e) => change("site", e.target.value)}
              >
                {state.sites
                  .filter(
                    (s) =>
                      state.user.role === "admin" || s.id === state.user.site,
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Eenheid
              <select
                value={form.unit}
                onChange={(e) => change("unit", e.target.value)}
              >
                {["m³", "ton", "stuks"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
            {fields.map(([label, name, type]) => (
              <label key={name}>
                {label}
                <input
                  required
                  type={type}
                  min={type === "number" ? "0.001" : undefined}
                  step="any"
                  value={form[name]}
                  onChange={(e) => change(name, e.target.value)}
                />
              </label>
            ))}
          </div>
          <label>
            Afwijking of opmerking
            <textarea
              value={form.note}
              onChange={(e) => change("note", e.target.value)}
              placeholder="Verplicht bij meer dan 5% verschil"
            />
          </label>
          <footer>
            <button type="button" onClick={onClose}>
              Annuleren
            </button>
            <button className="primary" disabled={busy}>
              {busy ? "Opslaan…" : "Dossier aanmaken"}
              <ArrowUpRight size={16} />
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
