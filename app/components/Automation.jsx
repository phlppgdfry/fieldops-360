import { useState } from "react";
import { Workflow } from "lucide-react";
import { post } from "../api";
export default function Automation({ state, refresh, setError }) {
  const [failing, setFailing] = useState(false);
  return (
    <>
      <div className="section-title">
        <div>
          <h2>Van registratie tot ERP</h2>
          <p>
            Drie uitvoerbare lokale workflows. Microsoft cloud flows:
            afzonderlijke deployment.
          </p>
        </div>
      </div>
      <div className="flow-list">
        {[
          [
            "01",
            "Validatie & goedkeuring",
            "Indienen controleert de data en zet de levering klaar voor de bevoegde werfleider.",
          ],
          [
            "02",
            "ERP-synchronisatie",
            "Goedkeuring maakt een duurzame taak. De worker roept de ERP-test-API aan met een idempotentiesleutel.",
          ],
          [
            "03",
            "Foutmelding & herstel",
            "Mislukte taken krijgen drie pogingen, een foutmelding en daarna een handmatige herstart.",
          ],
        ].map(([n, t, d]) => (
          <section key={n}>
            <span>{n}</span>
            <div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
            <Workflow />
          </section>
        ))}
      </div>
      {state.user.role === "admin" ? (
        <>
          <div className="section-title">
            <h2>Integratieproef</h2>
            <button
              onClick={async () => {
                try {
                  const r = await post("/admin/erp", { failing: !failing });
                  setFailing(r.failing);
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              {failing ? "ERP herstellen" : "ERP-storing simuleren"}
            </button>
          </div>
          <p>
            Goedkeuren tijdens een storing demonstreert retry en foutmeldingen.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Levering</th>
                  <th>Taakstatus</th>
                  <th>Pogingen</th>
                  <th>Fout / actie</th>
                </tr>
              </thead>
              <tbody>
                {state.jobs.map((j) => (
                  <tr key={j.id}>
                    <td>{j.reference}</td>
                    <td>{j.state}</td>
                    <td>{j.attempts}</td>
                    <td>
                      {j.error}
                      {["dead", "retry"].includes(j.state) && (
                        <button
                          onClick={async () => {
                            try {
                              await post("/admin/retry", { job: j.id });
                              refresh();
                            } catch (e) {
                              setError(e.message);
                            }
                          }}
                        >
                          Herstarten
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {state.alerts.map((a) => (
            <p className="notice" key={a.id}>
              {a.message}
            </p>
          ))}
        </>
      ) : (
        <p className="notice">
          Taakbeheer is alleen beschikbaar voor de beheerder.
        </p>
      )}
    </>
  );
}
