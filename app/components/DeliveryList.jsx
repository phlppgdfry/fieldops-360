import { useState } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { labels } from "../constants";
import { deliveryCsv, downloadCsv } from "../export";
import DeliveryTable from "./DeliveryTable";
export default function DeliveryList({
  deliveries,
  sites,
  approvals,
  onSelect,
  refresh,
}) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [site, setSite] = useState(""),
    [page, setPage] = useState(0);
  const rows = deliveries.filter(
    (d) =>
      `${d.reference} ${d.supplier} ${d.site_name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (!site || d.site === site) &&
      (!status || d.status === status) &&
      (!approvals || d.status === "pending"),
  );
  const size = 6,
    index = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1)),
    start = index * size;
  function filter(set, value) {
    set(value);
    setPage(0);
  }
  return (
    <section className="deliveries" aria-label="Leveringenoverzicht">
      <div className="section-title">
        <div>
          <h2>
            {approvals ? "Te beoordelen leveringen" : "Recente leveringen"}{" "}
            <span className="list-count">({rows.length})</span>
          </h2>
          <p>Een actueel overzicht van de operatie.</p>
        </div>
        <div className="list-actions">
          <button
            onClick={() => downloadCsv(deliveryCsv(rows))}
            disabled={!rows.length}
          >
            <Download size={16} />
            Exporteer CSV
          </button>
          <button
            className="icon-button"
            aria-label="Vernieuwen"
            onClick={refresh}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>
      <div className="filters">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Zoek leveringen"
            placeholder="Zoek referentie, werf of leverancier…"
            value={query}
            onChange={(e) => filter(setQuery, e.target.value)}
          />
        </div>
        <select
          aria-label="Filter op werf"
          value={site}
          onChange={(e) => filter(setSite, e.target.value)}
        >
          <option value="">Alle werven</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter op status"
          value={status}
          onChange={(e) => filter(setStatus, e.target.value)}
        >
          <option value="">Alle statussen</option>
          {Object.entries(labels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <DeliveryTable
        rows={rows.slice(start, start + size)}
        onSelect={onSelect}
      />
      <div className="pagination">
        <span role="status">
          {rows.length
            ? `${start + 1}–${Math.min(start + size, rows.length)} van ${rows.length} leveringen`
            : "0 leveringen"}
        </span>
        <div>
          <button
            aria-label="Vorige pagina"
            disabled={!index}
            onClick={() => setPage(index - 1)}
          >
            <ChevronLeft size={16} />
            Vorige
          </button>
          <button
            aria-label="Volgende pagina"
            disabled={start + size >= rows.length}
            onClick={() => setPage(index + 1)}
          >
            Volgende
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
