const STORE = "fieldops-360-browser-v1";
export function loadState(seed) {
  const text = localStorage.getItem(STORE);
  if (!text) return seed();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw Error(
      "De oefenopslag is beschadigd. Gebruik Nieuwe oefensessie om opnieuw te beginnen.",
    );
  }
  if (
    data.schema !== 1 ||
    !Array.isArray(data.deliveries) ||
    !Array.isArray(data.audit) ||
    !data.documents
  )
    throw Error("Onbekende oefenopslag. Start een nieuwe oefensessie.");
  return data;
}
export function saveState(data) {
  try {
    localStorage.setItem(STORE, JSON.stringify(data));
  } catch {
    throw Error(
      "Opslaan op dit toestel is niet mogelijk. Controleer browseropslag of start een nieuwe oefensessie.",
    );
  }
}
export function clearState() {
  localStorage.removeItem(STORE);
  sessionStorage.removeItem("fieldops-demo-user");
}
let database;
function openDB() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const r = indexedDB.open("fieldops-360-files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () =>
        reject(Error("Documentopslag is niet beschikbaar in deze browser."));
    });
  return database;
}
export async function saveFile(id, file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(Error("De bonfoto kon niet worden opgeslagen."));
  });
}
export async function readFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction("files").objectStore("files").get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(Error("De bonfoto kon niet worden gelezen."));
  });
}

export async function clearFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(Error("Bonfoto-opslag kon niet worden geleegd."));
  });
}
