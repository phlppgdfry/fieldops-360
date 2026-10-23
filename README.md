# FieldOps 360

**Digital Operations Transformation — van werfregistratie tot gecontroleerde ERP-overdracht.**

Onafhankelijke portfolio-case voor een fictieve West-Vlaamse bouw- en transportgroep met 200 medewerkers en 40 chauffeurs. Papier, Excel en e-mail maken plaats voor mobiele registratie, documentcontrole, onafhankelijke goedkeuring en betrouwbare integratie.

![FieldOps 360 dashboard](docs/evidence/dashboard-desktop.png)

**Online demo:** [Open FieldOps 360](https://phlppgdfry.github.io/fieldops-360/) · [Case en video](https://phlppgdfry.github.io/fieldops-360/case/).

**Status:** de publieke browserdemo heeft echte OCR, werffilters, CSV-export, paginering en een rondleiding. In de eigen **FieldOps 360 DEV**-omgeving staan zes tabellen, drie rollen, servervalidatie en vier actieve cloud flows. **FieldOps 360 Mobile** opent nu in Studio én de gewone Microsoft-player: registratie, concepten aanpassen, zoeken, bonfoto, echte AI Builder-tekstherkenning, veldvergelijking en menselijke bevestiging zijn uitgewerkt. Acht mobiele playertests en zeven documentopslagtests zijn geslaagd. Een echte menselijke goedkeuring is eerder verwerkt tot een ERP-testontvangst. [Exacte status en bewijs](docs/delivery-status.md).

## Online proberen

Open de [publieke demo](https://phlppgdfry.github.io/fieldops-360/), kies Chauffeur, download de fictieve oefenbon via het formulier en upload deze. De OCR-worker leest de bon op je toestel. Controleer de velden, motiveer 18/24 ton, bevestig als mens en dien in. Wissel naar Werfleider om onafhankelijk goed te keuren. Beheerder → Automatisering demonstreert storing, retries en herstel. Er is geen Microsoft-login nodig; er worden geen bonfoto's voor OCR verstuurd. Elke bezoeker heeft een eigen dataset. [Hosting en grenzen](docs/github-pages.md) · [Hoe de OCR-workers werken](docs/ocr-workers.md).

## Zelf draaien

Node.js 24+, npm en voor lokale beeldherkenning macOS met Swift/Xcode Command Line Tools.

```sh
npm ci
npm test
npm run build
npm start
```

Open **http://127.0.0.1:3600**. Kies een demonstratierol. Chauffeur registreert → mens bevestigt OCR → werfleider keurt onafhankelijk goed → worker synchroniseert met de ERP-test-API. Data blijft tussen herstarts bewaard in `.data/`.

```sh
npx playwright install chromium
npm run test:ui
node scripts/document-smoke.mjs
npm run check:artifacts
```

Windows/Linux: de CRUD-demo werkt; voor beeld-OCR is de optionele Azure-adapter nodig. Tekstbestanden gebruiken een parser en zijn geen AI-bewijs. De lokale rolselector is bewust voor demonstratie; deze backend niet publiek hosten als productie-app.

## Bekijk de demonstratie

- [Video — echte lokale gebruikersroute, circa 2 minuten](docs/evidence/demo.webm) · [Nederlandse ondertiteling](docs/evidence/demo.nl.vtt)
- [Mobiele registratie](docs/evidence/mobile-registration.png) · [Goedgekeurd en gesynchroniseerd](docs/evidence/approved-synced.png)
- [Echte OCR-uitkomst](docs/evidence/ocr-result.json) op deze [fictieve bonfoto](samples/leveringsbon.png)
- [Demonstratiescript met toelichting](docs/demo-script.md)

## Wat je kunt demonstreren

- Mobiele formulieren met werf, bonnummer, leverancier, hoeveelheid, foto/document en afwijkingsreden.
- Zoekfunctie, statussen en rolgebonden servertoegang; chauffeur ziet eigen dossiers, werfleider eigen werf.
- Hoeveelheidsvalidatie, >5%-afwijkingsreden, unieke referenties, versiecontrole en audit.
- Echte ML-OCR via Apple Vision; voorstel corrigeren en verplicht als mens bevestigen.
- Drie werkende lokale workflows: goedkeuring, duurzame ERP-synchronisatie, foutmelding/herstel.
- ERP-idempotentie, retries, dead-letter en handmatige herstart.
- Interactieve ROI-calculator met zichtbare aannames.

## Repositorykaart

| Onderdeel | Bronnen |
|---|---|
| Business Analysis | [Probleem, stakeholders, workshop, stories en criteria](docs/business-analysis.md) |
| Processen | [AS-IS / TO-BE BPMN](docs/processes/) |
| Architectuur | [Datamodel, state machine en ontwerpbesluiten](docs/architecture.md) |
| Power Apps / flows / Dataverse | [Native bronnen en status](power-platform/README.md) |
| Native Canvas App | [FieldOps360Native.msapp](power-platform/FieldOps360Native.msapp) · [moderne schermbronnen](power-platform/canvas-studio) · [authoring](docs/native-canvas-authoring.md) |
| Echte Microsoft-installatie | [Omgeving en bewijs](docs/native-environment.md) · [solutiontemplate](power-platform/releases/FieldOps360_unmanaged_template.zip) |
| Security | [Rechten, privacy en productiegrenzen](docs/security.md) |
| Testen en acceptatie | [Testplan en UAT](docs/testing-uat.md) · [Testcode](tests/) |
| Gebruikers | [Handleiding](docs/user-guide.md) |
| Implementatie | [Deployment, rollback, beheer en adoptie](docs/deployment.md) |
| Businesscase | [ROI en gevoeligheid](docs/roi.md) |
| Sollicitatievoorbereiding | [16 oefeningen en eerlijke zelfevaluatie](docs/readiness.md) |
| Bewijs | [Screenshots, video, OCR en QA](docs/evidence/) |

## Microsoft-omgeving

De aparte [Microsoft-ontwikkelomgeving](docs/native-environment.md) gebruikt het gratis Developer Plan. De echte export staat als [unmanaged deploymenttemplate](power-platform/releases/FieldOps360_unmanaged_template.zip) en als [uitgepakte solution](power-platform/native-solution) in de repository. Het gedeelde pakket bevat geen gesigneerde ERP-endpoint-URL; verbindingen, runtime-ID en flows moeten na import per omgeving worden ingesteld. De native app heeft echte Dataverse-bronnen en mobiele registratie-/bevestigingsschermen. Echte cloud runs en serverchecks staan in `docs/evidence/native-*.json`.

## Verificatie

14 unit/API-tests en de browserroute registratie → goedkeuring → ERP zijn geslaagd. Zowel Tesseract in de browser als Microsoft TextRecognizer in de native app hebben de fictieve PNG daadwerkelijk gelezen. Native foto-opslag bewaart ook de volledige afbeelding en lange OCR-tekst. De gepubliceerde player heeft acht mobiele functietests doorlopen; Canvas- en toegankelijkheidscontrole melden geen problemen. Twee BPMN-bestanden zijn gecontroleerd op XML, referenties en diagramdekking. De eigen gebruiker heeft één native goedkeuringsscenario uitgevoerd; dit is geen ondertekende bedrijfs-UAT of productiebelastingtest.

Mogelijke vervolgstappen staan in [functies en modules die nog ontbreken](docs/functionele-uitbreidingen.md): inkooporders, factuurcontrole, planning, voorraad, offline werken en QR-scanning zijn uitbreidingen en geen reeds gebouwde modules.

De [native demonstratievideo](docs/evidence/native-demo.webm) en [mobiele screenshots](docs/evidence/native-mobile-home.png) tonen de echte Microsoft-player. De [openbare casepagina](https://phlppgdfry.github.io/fieldops-360/case/) bevat zowel de webdemo-opname als de native opname met Nederlandse ondertitels.

Alle bedrijfsgegevens zijn fictief. ROI-bedragen zijn aannames, geen gerealiseerde besparingen of Microsoft-prijsofferte. Geen affiliatie met Nuvex Systems of genoemde leveranciers.

MIT · [Licentie](LICENSE) · [Bronvermeldingen](THIRD-PARTY-NOTICES.md)
