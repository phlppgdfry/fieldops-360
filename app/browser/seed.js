export function seed() {
  const sites = [
    { id: "s1", name: "Kanaalzone Brugge", location: "Brugge" },
    { id: "s2", name: "N34 Herinrichting", location: "Oostende" },
    { id: "s3", name: "Logistiek park", location: "Roeselare" },
  ];
  const users = [
    { id: "driver", name: "Tom Vandenberghe", role: "driver", site: "s1" },
    { id: "manager", name: "Sarah Maes", role: "manager", site: "s1" },
    { id: "admin", name: "Philippe Godfroy", role: "admin", site: null },
    { id: "other", name: "Jan Peeters", role: "driver", site: "s2" },
  ];
  const suppliers = [
    "Declercq Beton",
    "Devagro",
    "Willy Naessens",
    "De Brabandere",
    "Verhelst",
    "Declercq Beton",
    "Devagro",
    "Verhelst",
  ];
  const deliveries = suppliers.map((supplier, i) => ({
    id: crypto.randomUUID(),
    reference: `LB-2026-${1041 + i}`,
    site: ["s1", "s2", "s1", "s3"][i % 4],
    supplier,
    quantity: i === 0 ? 18 : 24,
    expected: 24,
    unit: "m³",
    note: i === 0 ? "6 m³ minder geleverd dan besteld." : "",
    status: [
      "pending",
      "pending",
      "approved",
      "synced",
      "rejected",
      "synced",
      "pending",
      "draft",
    ][i],
    owner: i % 4 === 1 ? "other" : "driver",
    document: null,
    confirmed: 0,
    erp_id: [3, 5].includes(i) ? `DEMO-ERP-${1041 + i}` : null,
    created: new Date(Date.now() - i * 3600000).toISOString(),
    version: 1,
  }));
  return {
    schema: 1,
    sites,
    users,
    deliveries,
    documents: {},
    jobs: [],
    alerts: [],
    receipts: {},
    failing: false,
    audit: deliveries.map((d, i) => ({
      id: i + 1,
      delivery: d.id,
      actor: "demo",
      event: "seed",
      detail: "Fictief oefendossier",
      created: d.created,
    })),
  };
}
