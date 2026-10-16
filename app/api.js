export const isBrowserDemo = import.meta.env.VITE_DEMO_MODE === "browser";
let browserClient;
const client = () => (browserClient ??= import("./browser/client"));
export async function api(path, options = {}) {
  if (isBrowserDemo) return (await client()).browserApi(path, options);
  const res = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    const error = Error(data.error || "Verzoek mislukt");
    error.status = res.status;
    throw error;
  }
  return data;
}
export const post = (path, data = {}) =>
  api(path, { method: "POST", body: JSON.stringify(data) });
export async function upload(file, onProgress) {
  if (isBrowserDemo) return (await client()).browserUpload(file, onProgress);
  const r = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": file.type || "text/plain" },
    body: file,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error);
  return data;
}
export async function openDocument(id) {
  if (!isBrowserDemo) {
    window.open("/uploads/" + id, "_blank", "noopener,noreferrer");
    return;
  }
  const popup = window.open("", "_blank");
  if (!popup)
    throw Error("Sta het openen van de bon in een nieuw tabblad toe.");
  popup.opener = null;
  popup.document.title = "Bonfoto · FieldOps 360";
  popup.document.body.textContent = "Bonfoto wordt geopend…";
  try {
    const blob = await (await client()).browserDocument(id);
    const url = URL.createObjectURL(blob);
    popup.location.replace(url);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    popup.close();
    throw e;
  }
}
export async function resetBrowserDemo() {
  await (await client()).newSession();
}
