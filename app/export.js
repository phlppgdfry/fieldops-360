import { labels } from "./constants.js";
// CSV exports include only the visible, authorized selection. Guard spreadsheet formulas.
export function csvCell(value) {
  const text = String(value ?? "");
  const safe =
    /^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)
      ? "'" + text
      : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function deliveryCsv(rows) {
  const lines = [
    [
      "Referentie",
      "Werf",
      "Leverancier",
      "Hoeveelheid",
      "Eenheid",
      "Besteld",
      "Status",
      "ERP ontvangst",
    ],
    ...rows.map((d) => [
      d.reference,
      d.site_name,
      d.supplier,
      d.quantity,
      d.unit,
      d.expected,
      labels[d.status] || d.status,
      d.erp_id,
    ]),
  ];
  return "\uFEFF" + lines.map((r) => r.map(csvCell).join(";")).join("\r\n");
}
export function downloadCsv(content) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "fieldops-leveringen.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
