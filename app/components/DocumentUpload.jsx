import { useState } from "react";
import { ScanLine } from "lucide-react";
import { upload, isBrowserDemo } from "../api";
export default function DocumentUpload({ onResult, setError }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  return (
    <>
      <label className="upload">
        <ScanLine size={28} />
        <strong>
          {busy ? "Document wordt gelezen…" : "Leveringsbon toevoegen"}
        </strong>
        <span>
          {busy && progress
            ? progress
            : "PNG of JPEG · maximaal 5 MB · echte OCR"}
        </span>
        {isBrowserDemo && (
          <span>
            Bonfoto blijft op dit toestel · eerste herkenning laadt het
            OCR-model
          </span>
        )}
        <input
          aria-label="Leveringsbon uploaden"
          type="file"
          accept={
            isBrowserDemo
              ? "image/png,image/jpeg,text/plain"
              : "image/png,image/jpeg,text/plain,application/pdf"
          }
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setBusy(true);
            try {
              onResult(
                await upload(file, (status, n) =>
                  setProgress(
                    status === "recognizing text"
                      ? `Tekst herkennen: ${Math.round(n * 100)}%`
                      : "OCR voorbereiden…",
                  ),
                ),
              );
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {isBrowserDemo && (
        <p className="demo-help">
          <a
            href={import.meta.env.BASE_URL + "samples/leveringsbon.png"}
            download="fieldops-oefenbon.png"
          >
            Download de fictieve oefenbon
          </a>{" "}
          en upload deze hierboven. Gebruik alleen oefendata.
        </p>
      )}
    </>
  );
}
