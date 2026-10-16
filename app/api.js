export async function api(path, options = {}) {
  const res = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Verzoek mislukt");
  return data;
}
export const post = (path, data = {}) =>
  api(path, { method: "POST", body: JSON.stringify(data) });
export async function upload(file) {
  const r = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": file.type || "text/plain" },
    body: file,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error);
  return data;
}
