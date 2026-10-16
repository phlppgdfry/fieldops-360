import { useState } from "react";
import { fmt } from "../constants";
export default function Roi() {
  const [n, setN] = useState(80),
    [minutes, setMinutes] = useState(9),
    [rate, setRate] = useState(38),
    [cost, setCost] = useState(12000),
    [license, setLicense] = useState(4800);
  const gross = ((n * 220 * minutes) / 60) * rate,
    net = gross - license;
  return (
    <>
      <div className="section-title">
        <div>
          <h2>Een businesscase die je kunt toetsen</h2>
          <p>Aannames, geen gerealiseerde besparingen. Pas de inputs aan.</p>
        </div>
      </div>
      <div className="roi">
        <section className="panel">
          <div className="form-grid">
            {[
              ["Leveringen per werkdag", n, setN],
              ["Minuten bespaard per levering", minutes, setMinutes],
              ["Volledige uurkost (€)", rate, setRate],
              ["Implementatie (€)", cost, setCost],
              ["Licenties en beheer per jaar (€)", license, setLicense],
            ].map(([label, value, set]) => (
              <label key={label}>
                {label}
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => set(Math.max(0, Number(e.target.value)))}
                />
              </label>
            ))}
          </div>
          <p className="muted">
            220 werkdagen/jaar · tijdwinst alleen bij effectieve adoptie.
          </p>
        </section>
        <section className="roi-result">
          <span>Netto potentieel per jaar</span>
          <strong>€ {fmt.format(Math.round(net))}</strong>
          <p>
            {net > 0
              ? `${((cost / net) * 12).toFixed(1)} maanden terugverdientijd`
              : "Geen terugverdieneffect met deze aannames"}
          </p>
          <hr />
          <p>Bruto tijdwaarde: € {fmt.format(Math.round(gross))}</p>
          <p>
            Eerstejaars ROI:{" "}
            {cost > 0
              ? Math.round(((net - cost) / cost) * 100) + "%"
              : "n.v.t."}
          </p>
          <p>
            Start met een nulmeting van 20 dossiers en een pilot van twee weken.
          </p>
        </section>
      </div>
    </>
  );
}
