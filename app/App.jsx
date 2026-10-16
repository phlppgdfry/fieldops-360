import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Truck,
  ClipboardCheck,
  ScanLine,
  Workflow,
  TrendingUp,
  Plus,
  Search,
  MapPin,
  ChevronRight,
  X,
  Menu,
  RefreshCw,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { api, post, isBrowserDemo, resetBrowserDemo } from "./api";
import { labels } from "./constants";
import DeliveryForm from "./components/DeliveryForm";
import Detail from "./components/Detail";
import DeliveryTable from "./components/DeliveryTable";
import Roi from "./components/Roi";
import Automation from "./components/Automation";
const menu = [
  ["Overzicht", LayoutDashboard],
  ["Leveringen", Truck],
  ["Goedkeuringen", ClipboardCheck],
  ["Documentcontrole", ScanLine],
  ["Automatisering", Workflow],
  ["Businesscase", TrendingUp],
];
export default function App() {
  const [state, setState] = useState(null),
    [page, setPage] = useState("Overzicht"),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [modal, setModal] = useState(null),
    [mobile, setMobile] = useState(false);
  async function refresh() {
    try {
      setState(await api("/state"));
    } catch (e) {
      if (e.status === 401) setState(null);
      else if (isBrowserDemo) setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);
  async function login(userId) {
    try {
      await post("/session", { userId });
      await refresh();
      setModal(null);
    } catch (e) {
      setError(e.message);
    }
  }
  if (!state)
    return (
      <main className="login">
        <div className="brand">
          <span>F</span>FieldOps <b>360</b>
        </div>
        <h1>Grip op elke levering.</h1>
        <p>Een digitale werkdag, van werf tot administratie.</p>
        <div className="login-options">
          {[
            ["driver", "Chauffeur", "Registreer en controleer je leveringen"],
            ["manager", "Werfleider", "Beoordeel leveringen op je werf"],
            ["admin", "Beheerder", "Bekijk de volledige operatie"],
          ].map(([id, title, sub]) => (
            <button key={id} onClick={() => login(id)}>
              <strong>{title}</strong>
              <span>{sub}</span>
              <ArrowUpRight />
            </button>
          ))}
        </div>
        <small>
          Portfolio-demo · fictieve bedrijfsgegevens ·{" "}
          {isBrowserDemo
            ? "browseropslag op dit toestel"
            : "lokale demosessies"}
        </small>
        {isBrowserDemo && (
          <p className="demo-intro">
            Deze publieke oefenomgeving werkt zonder Microsoft-login. Je
            handelingen blijven op dit toestel. OCR is echt; ERP-overdracht is
            gesimuleerd.{" "}
            <a href={import.meta.env.BASE_URL + "case/"}>
              Bekijk de case en video ↗
            </a>
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {isBrowserDemo && (
          <button onClick={resetBrowserDemo}>Nieuwe oefensessie</button>
        )}
      </main>
    );
  const rows = state.deliveries.filter(
    (d) =>
      `${d.reference} ${d.supplier} ${d.site_name}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || d.status === status) &&
      (page !== "Goedkeuringen" || d.status === "pending"),
  );
  const pending = state.deliveries.filter((d) => d.status === "pending").length;
  return (
    <div className="shell">
      <aside className={mobile ? "open" : ""}>
        <div className="brand">
          <span>F</span>FieldOps <b>360</b>
        </div>
        <span className="nav-label">WERKOMGEVING</span>
        <nav>
          {menu.map(([title, Icon]) => (
            <button
              key={title}
              className={page === title ? "active" : ""}
              onClick={() => {
                setPage(title);
                setMobile(false);
              }}
            >
              <Icon size={19} />
              {title}
              {title === "Goedkeuringen" && pending > 0 && <b>{pending}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-dot" />
          {isBrowserDemo ? "Publieke browserdemo" : "Lokale portfolio-demo"}
          <small>Fictieve West-Vlaamse bouwgroep</small>
          <label htmlFor="role">Demonstratierol</label>
          <select
            id="role"
            value={state.user.id}
            onChange={(e) => login(e.target.value)}
          >
            <option value="driver">Tom · Chauffeur</option>
            <option value="manager">Sarah · Werfleider</option>
            <option value="admin">Philippe · Beheerder</option>
          </select>
        </div>
      </aside>
      <main>
        <div className="topbar">
          <button
            className="mobile-menu"
            aria-label="Menu"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span>
            Operaties <ChevronRight size={13} /> {page}
          </span>
          <div className="profile">
            <span className="avatar">
              {state.user.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </span>
            {state.user.name}
          </div>
        </div>
        {isBrowserDemo && (
          <div className="demo-banner">
            <span>
              <strong>Browserdemo</strong> · oefendata op dit toestel · geen
              Microsoft-verbinding · ERP gesimuleerd
            </span>
            <div>
              <a href={import.meta.env.BASE_URL + "case/"}>Case & video ↗</a>
              <button onClick={resetBrowserDemo}>Nieuwe oefensessie</button>
            </div>
          </div>
        )}
        <div className="content">
          <header className="page-header">
            <div>
              <h1>{page}</h1>
              <p>
                {page === "Overzicht"
                  ? "Grip op elke levering. Van registratie tot ERP."
                  : "FieldOps 360 · Digital Operations Transformation"}
              </p>
            </div>
            <button className="primary" onClick={() => setModal("new")}>
              <Plus size={18} />
              Nieuwe levering
            </button>
          </header>
          {error && (
            <div role="alert" className="error">
              {error}
              <button aria-label="Melding sluiten" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {page === "Businesscase" ? (
            <Roi />
          ) : page === "Automatisering" ? (
            <Automation state={state} refresh={refresh} setError={setError} />
          ) : page === "Documentcontrole" ? (
            <>
              <div className="section-title">
                <div>
                  <h2>Van document naar gecontroleerde data</h2>
                  <p>
                    Upload een echte bon bij een nieuwe levering. OCR vult de
                    velden in; jij bevestigt.
                  </p>
                </div>
              </div>
              <div className="notice">
                <ScanLine />
                <p>
                  {isBrowserDemo
                    ? "Deze browserdemo leest foto's met Tesseract.js op je toestel. Er wordt geen bon naar een server verzonden. ERP-overdracht is gesimuleerd."
                    : "Op macOS gebruikt deze demo Apple Vision. Met Azure-configuratie gebruikt ze Document Intelligence."}{" "}
                  Tekstbestanden gebruiken uitsluitend een parser. Elke
                  OCR-uitkomst vereist menselijke bevestiging.
                </p>
              </div>
              <DeliveryTable
                rows={state.deliveries.filter((d) => d.document)}
                onSelect={setModal}
              />
              <button className="primary" onClick={() => setModal("new")}>
                Document registreren
                <Plus size={16} />
              </button>
            </>
          ) : (
            <>
              {page === "Overzicht" && (
                <div className="metrics">
                  {[
                    [state.deliveries.length, "Leveringen", Truck],
                    [pending, "Ter controle", ClipboardCheck],
                    [
                      state.deliveries.filter((d) => d.status === "synced")
                        .length,
                      "Gesynchroniseerd",
                      Check,
                    ],
                    [
                      new Set(state.deliveries.map((d) => d.site)).size,
                      "Actieve werven",
                      MapPin,
                    ],
                  ].map(([n, t, I]) => (
                    <div key={t}>
                      <span>
                        {t}
                        <I size={18} />
                      </span>
                      <strong>{n.toString().padStart(2, "0")}</strong>
                      <small>
                        {t === "Ter controle"
                          ? "Wacht op menselijke beoordeling"
                          : isBrowserDemo
                            ? "Binnen de gekozen demonstratierol"
                            : "Binnen je toegangsrechten"}
                      </small>
                    </div>
                  ))}
                </div>
              )}
              <section className="deliveries">
                <div className="section-title">
                  <div>
                    <h2>
                      {page === "Goedkeuringen"
                        ? "Te beoordelen leveringen"
                        : "Recente leveringen"}
                    </h2>
                    <p>Een actueel overzicht van de operatie.</p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Vernieuwen"
                    onClick={refresh}
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>
                <div className="filters">
                  <div className="search">
                    <Search size={17} />
                    <input
                      aria-label="Zoek leveringen"
                      placeholder="Zoek referentie, werf of leverancier…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Filter op status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Alle statussen</option>
                    {Object.entries(labels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <span>{rows.length} resultaten</span>
                </div>
                <DeliveryTable
                  rows={page === "Overzicht" ? rows.slice(0, 6) : rows}
                  onSelect={setModal}
                />
              </section>
              {page === "Overzicht" && (
                <div className="bottom-grid">
                  <section>
                    <div className="section-title">
                      <h2>Actieve werven</h2>
                      <MapPin size={18} />
                    </div>
                    {state.sites.map((s) => {
                      const deliveries = state.deliveries.filter(
                        (d) => d.site === s.id,
                      );
                      const done = deliveries.filter(
                        (d) => d.status === "synced",
                      ).length;
                      return (
                        <div className="site" key={s.id}>
                          <div>
                            <strong>{s.name}</strong>
                            <span>
                              {done}/{deliveries.length} verwerkt
                            </span>
                          </div>
                          <small>{s.location}</small>
                          <div className="progress">
                            <i
                              style={{
                                width: deliveries.length
                                  ? `${(done / deliveries.length) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </section>
                  <section>
                    <div className="section-title">
                      <h2>Activiteiten</h2>
                      <span className="muted">Auditspoor</span>
                    </div>
                    <div className="timeline">
                      {state.audit.slice(0, 4).map((a) => (
                        <div key={a.id}>
                          <i />
                          <section>
                            <strong>
                              {a.reference} ·{" "}
                              {a.event === "seed"
                                ? "Dossier aangemaakt"
                                : a.event}
                            </strong>
                            <small>
                              {a.actor} ·{" "}
                              {new Date(a.created).toLocaleTimeString("nl-BE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </section>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
          <div className="footnote">
            FIELDOPS 360{" "}
            <span>
              Fictieve case · 200 medewerkers · 40 chauffeurs · meerdere werven
            </span>
          </div>
        </div>
      </main>
      {modal === "new" && (
        <DeliveryForm
          state={state}
          setError={setError}
          onClose={() => setModal(null)}
          onCreated={async (d) => {
            await refresh();
            setModal({
              ...d,
              site_name: state.sites.find((s) => s.id === d.site)?.name,
            });
          }}
        />
      )}
      {modal && modal !== "new" && (
        <Detail
          delivery={modal}
          state={state}
          onClose={() => setModal(null)}
          refresh={refresh}
          setError={setError}
        />
      )}
    </div>
  );
}
