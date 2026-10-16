# Wat zijn de OCR-workers?

OCR (Optical Character Recognition) zet tekst op een bonfoto om naar tekst die software kan verwerken. Een browserworker is een aparte rekentaak: de herkenning draait buiten de UI-thread, zodat knoppen en formulieren blijven reageren.

## Wat is gebruikt en wat is eigen code?
De herkenningsmotor is **Tesseract.js**, een bestaand opensourceproject. De onderliggende Tesseract-motor draait met WebAssembly; een vooraf getraind Engels taalmodel wordt meegeleverd. Er is geen eigen OCR-model getraind. Nederlandse woorden in eenvoudige gedrukte bonnen kunnen hiermee worden herkend; kwaliteit bij handschrift, slechte belichting, rotatie en speciale layouts moet apart worden getoetst.

Eigen projectcode:
- `app/browser/ocr.js`: bestandstype/limiet controleren, worker starten, herkenning uitvoeren, confidence doorgeven, worker beëindigen.
- `shared/document-fields.mjs`: de tekst deterministisch omzetten naar bonnummer, leverancier, hoeveelheid en eenheid. Deze regex-parser is geen apart AI-model.
- `app/browser/client.js`: voorstel opslaan en menselijke bevestiging verplichten voordat de levering kan worden ingediend.
- `scripts/build-pages.mjs`: worker, WASM-core en taalmodel in de Pages-build opnemen. De modelchecksum staat in `vendor/ocr/manifest.json`.

## De route
Bonfoto → worker leest letters/woorden → ruwe tekst + confidence → veldextractie → gebruiker corrigeert → expliciet bevestigen → onafhankelijke demonstratierol keurt goed.

De werkelijke browseraanroep gebruikt `createWorker('eng', 1, {workerPath,corePath,langPath,workerBlobURL:false})`; daarna `worker.recognize(file)` en altijd `worker.terminate()`. Alle assetpaden verwijzen naar dezelfde gehoste Pages-site, inclusief de projectsubmap. Geen bonfoto wordt voor herkenning verzonden. GitHub levert alleen de statische motor/modelbestanden aan de browser.

## Verschillende uitvoeringen
| Uitvoering | OCR | Procesopslag | ERP |
|---|---|---|---|
| Publieke GitHub Pages-demo | Tesseract.js in browser, echte OCR | LocalStorage + IndexedDB op dit toestel | Expliciet gesimuleerd |
| Lokale Node-demo op macOS | Apple Vision, echte ML-OCR | SQLite + lokale bestanden | Echte lokale test-API |
| Optionele Azure-adapter | Document Intelligence prebuilt-read | Server | Test-API; adapter vereist eigen configuratie |
| Native Power Platform | Nog niet geïnstalleerd/gevalideerd | Dataverse-deployment wacht op rechten | Cloud flows nog niet als werkend bewezen |

Browseropslag en selecteerbare demonstratierollen zijn geen productiebeveiliging. Gebruik fictieve bonnen in de openbare demo. De eerste OCR duurt langer door modeldownload/initialisatie; daarna kan browsercache helpen. PDF is niet beschikbaar in deze browservariant. Tekstbestanden lopen door een parser en worden als ‘geen AI’ benoemd.

Bron: [Tesseract.js lokale hosting](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md), [worker-API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md).
