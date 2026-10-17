export const labels = {
  draft: "Concept",
  pending: "Ter controle",
  approved: "Goedgekeurd",
  synced: "Gesynchroniseerd",
  rejected: "Afgewezen",
};
export const fmt = new Intl.NumberFormat("nl-BE");

const events = {
  seed: "Dossier aangemaakt",
  created: "Levering geregistreerd",
  confirmed: "Gegevens bevestigd",
  submitted: "Ingediend ter goedkeuring",
  approved: "Levering goedgekeurd",
  rejected: "Levering afgewezen",
  erp_simulated: "ERP-overdracht gesimuleerd",
  erp_synced: "ERP-overdracht voltooid",
  integration_error: "ERP-overdracht mislukt",
  retry_requested: "Herstart aangevraagd",
  document_uploaded: "Document toegevoegd",
};
export const auditLabel = (event) => events[event] || event;
