import { ChevronRight } from "lucide-react";
import Status from "./Status";
export default function DeliveryTable({ rows, onSelect }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Referentie</th>
            <th>Werf</th>
            <th>Leverancier</th>
            <th>Hoeveelheid</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} onClick={() => onSelect(d)}>
              <td>
                <button
                  className="text-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(d);
                  }}
                >
                  {d.reference}
                </button>
                <small>{new Date(d.created).toLocaleDateString("nl-BE")}</small>
              </td>
              <td>{d.site_name}</td>
              <td>{d.supplier}</td>
              <td>
                {d.quantity} <span className="muted">{d.unit}</span>
              </td>
              <td>
                <Status value={d.status} />
              </td>
              <td>
                <ChevronRight size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty">
          Geen leveringen gevonden voor deze selectie.
        </div>
      )}
    </div>
  );
}
