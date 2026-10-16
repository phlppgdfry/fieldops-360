export class Fault extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function canRead(user, d) {
  return (
    user.role === "admin" ||
    (user.role === "manager" && user.site === d.site) ||
    (user.role === "driver" && d.owner === user.id)
  );
}
export function validateRegistration(user, input, sites, exists) {
  const {
    reference,
    site,
    supplier,
    unit = "m³",
    note = "",
    document = null,
  } = input;
  const quantity = Number(input.quantity),
    expected = Number(input.expected);
  if (!/^[A-Z0-9-]{3,40}$/.test(reference || ""))
    throw new Fault(422, "Bonnummer: 3–40 hoofdletters, cijfers of streepjes");
  if (
    typeof supplier !== "string" ||
    !supplier.trim() ||
    supplier.length > 150 ||
    !["m³", "ton", "stuks"].includes(unit) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > 100000 ||
    !Number.isFinite(expected) ||
    expected <= 0 ||
    expected > 100000 ||
    typeof note !== "string" ||
    note.length > 2000
  )
    throw new Fault(422, "Controleer leverancier, eenheid en hoeveelheden");
  if (!sites.some((s) => s.id === site)) throw new Fault(422, "Onbekende werf");
  if (user.role !== "admin" && site !== user.site)
    throw new Fault(403, "Je bent niet toegewezen aan deze werf");
  if (Math.abs(quantity - expected) / expected > 0.05 && !note.trim())
    throw new Fault(422, "Motiveer afwijkingen groter dan 5%");
  if (exists(reference)) throw new Fault(409, "Bonnummer bestaat al");
  return {
    reference,
    site,
    supplier: supplier.trim(),
    unit,
    quantity,
    expected,
    note,
    document,
  };
}
export function validateDecision(user, d, { decision, reason = "", version }) {
  if (!["manager", "admin"].includes(user.role) || d.owner === user.id)
    throw new Fault(
      403,
      "Goedkeurder moet bevoegd zijn en onafhankelijk van indiener",
    );
  if (d.status !== "pending" || version !== d.version)
    throw new Fault(409, "Levering gewijzigd; vernieuw de pagina");
  if (
    !["approve", "reject"].includes(decision) ||
    typeof reason !== "string" ||
    (decision === "reject" && !reason.trim())
  )
    throw new Fault(422, "Beslissing of afwijsreden ontbreekt");
}
