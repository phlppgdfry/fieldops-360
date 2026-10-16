import { useState } from "react";
import { ScanLine } from "lucide-react";
import { upload } from "../api";
export default function DocumentUpload({ onResult, setError }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="upload">
      <ScanLine size={28} />
      <strong>
        {busy ? "Document wordt gelezen…" : "Leveringsbon toevoegen"}
      </strong>
      <span>PNG of JPEG · maximaal 5 MB · echte OCR</span>
      <input
        aria-label="Leveringsbon uploaden"
        type="file"
        accept="image/png,image/jpeg,text/plain,application/pdf"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          setBusy(true);
          try {
            onResult(await upload(file));
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}
