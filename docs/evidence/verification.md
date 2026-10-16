# Uitgevoerde verificatie

Datum: 16 oktober 2026. Lokale macOS-omgeving, Node 24.21, PAC 2.13.1. Geen eindgebruikersacceptatie of native runtimevalidatie geïmpliceerd.

- 13 unit/API-tests geslaagd: hoeveelheden, duplicaten, autorisatie, afwijkingen, onafhankelijke approval, versieconflict, herindiening, ERP-retries, idempotentie, menselijke documentbevestiging en uploadtoegang.
- Chromium: desktop 1440×1000 en mobiel 390×844; betekenisvolle pagina, juiste titel, geen runtime-errors. Registratie → onafhankelijke goedkeuring → gesynchroniseerde ERP-status geslaagd. Zoekfunctie met resultaat/lege toestand en ROI-weergave gecontroleerd.
- Werkelijke PNG via upload-API: Apple Vision herkent OCR-2026-001 / Demo Beton / 18 / ton. Provider, confidence en verplichte menselijke review vastgelegd in ocr-result.json.
- BPMN: XML parse, sequenceFlow-referenties, start/eindevents, BPMN-DI shape/edge-dekking geslaagd; geen engine-execution of externe XSD-conformiteitsclaim.
- Cloud-flow JSON: structurele controle geslaagd; geen connector- of tenantvalidatie.
- Canvas: PAC pack en terug-unpack van FieldOps360.msapp geslaagd; drie eigen schermen. Checksum-waarschuwing is verwacht na bronwijziging. Geen Power Apps Studio App Checker uitgevoerd; er is geen gekopieerd Microsoft-checkerrapport als eigen bewijs opgenomen.
- Tenant: WhoAmI succesvol met organisatieaccount. Publisher/solution aangemaakt. Tabelcreatie geeft 403 `prvCreateEntity`; gebruiker laat rechten toekennen.
- Ontwerpconcept en werkelijke desktopweergave visueel geïnspecteerd; verschillen en keuzes in ../design-verification.md.

Bewijsbestanden zijn echte uitvoer van demo/tests. Screenshots tonen fictieve data; video toont de lokale webdemo, niet de native Microsoft-runtime.

Publieke Pages-uitvoering toegevoegd: twee aanvullende Chromium-proeven verifiëren echte Tesseract.js-OCR, verplichte menselijke bevestiging, originele foto uit IndexedDB, onafhankelijke demonstratierol, gesimuleerde ERP-storing/drie pogingen/herstel, ontvangst en behoud na reload. Tijdens die geteste route zijn geen HTTP-verzoeken naar andere origins waargenomen. Dit is afzonderlijk bewijs van de browserdemo, niet van native Microsoft-componenten.
