import { useState } from "react";
import { X, Check, ChevronRight } from "lucide-react";
import Status from "./Status";
import { post, openDocument } from "../api";
export default function Detail({
  delivery: d,
  state,
  onClose,
  refresh,
  setError,
}) {
  const [reason, setReason] = useState("");
  async function act(action, payload) {
    try {
      await post(`/deliveries/${d.id}/${action}`, payload);
      await refresh();
      onClose();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="backdrop">
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <header>
          <div>
            <h2 id="detail-title">{d.reference}</h2>
            <p>
              {d.site_name} · {d.supplier}
            </p>
          </div>
          <button aria-label="Sluiten" onClick={onClose}>
            <X />
          </button>
        </header>
        <Status value={d.status} />
        <div className="detail-values">
          <div>
            Geleverd
            <strong>
              {d.quantity} {d.unit}
            </strong>
          </div>
          <div>
            Besteld
            <strong>
              {d.expected} {d.unit}
            </strong>
          </div>
          <div>
            Afwijking
            <strong>
              {Math.round(((d.quantity - d.expected) / d.expected) * 100)}%
            </strong>
          </div>
        </div>
        {d.note && <div className="notice">{d.note}</div>}
        {d.document && (
          <p>
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await openDocument(d.document);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Origineel document bekijken ↗
            </button>{" "}
            · {d.confirmed ? "Menselijk bevestigd" : "Bevestiging vereist"}
          </p>
        )}
        {d.erp_id && (
          <p>
            ERP-ontvangst: <strong>{d.erp_id}</strong>
          </p>
        )}
        <h3>Auditspoor</h3>
        <div className="timeline">
          {state.audit
            .filter((a) => a.delivery === d.id)
            .map((a) => (
              <div key={a.id}>
                <i />
                <section>
                  <strong>{a.event}</strong>
                  <small>
                    {a.actor} · {new Date(a.created).toLocaleString("nl-BE")}
                  </small>
                  {a.detail && <p>{a.detail}</p>}
                </section>
              </div>
            ))}
        </div>
        {["draft", "rejected"].includes(d.status) && (
          <footer>
            {d.document && !d.confirmed ? (
              <button
                className="primary"
                onClick={() =>
                  act("confirm", {
                    reference: d.reference,
                    supplier: d.supplier,
                    quantity: d.quantity,
                  })
                }
              >
                Ik heb de gegevens gecontroleerd
              </button>
            ) : (
              <button className="primary" onClick={() => act("submit")}>
                Indienen ter goedkeuring
                <ChevronRight size={16} />
              </button>
            )}
          </footer>
        )}
        {d.status === "pending" &&
          ["admin", "manager"].includes(state.user.role) &&
          d.owner !== state.user.id && (
            <>
              <label>
                Toelichting
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Verplicht bij afwijzing"
                />
              </label>
              <footer>
                <button
                  onClick={() =>
                    act("decision", {
                      decision: "reject",
                      reason,
                      version: d.version,
                    })
                  }
                >
                  Afwijzen
                </button>
                <button
                  className="primary"
                  onClick={() =>
                    act("decision", {
                      decision: "approve",
                      reason,
                      version: d.version,
                    })
                  }
                >
                  <Check size={16} />
                  Goedkeuren
                </button>
              </footer>
            </>
          )}
      </section>
    </div>
  );
}
