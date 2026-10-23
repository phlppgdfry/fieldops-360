# Uitgevoerde verificatie

Bijgewerkt: 23 oktober 2026 (Europe/Brussels). Bewijs van uitvoering met fictieve gegevens; geen bedrijfsacceptatie of productiecertificering.

| Uitvoering | Werkelijk resultaat | Bewijs |
|---|---|---|
| Unit/API en productiebuild | 14 tests geslaagd; Vite-build geslaagd | `npm run verify` |
| Publieke browserdemo | Echte Tesseract-PNG-herkenning, menselijke controle, gesimuleerde ERP, herstel, desktop/mobiel en rondleiding | Pages Chromium-tests; afzonderlijk van Microsoft |
| Native Canvas player | Acht mobiele functietests: validatie, 25% afwijking, concept opslaan/bewerken en menselijke bevestiging | native-player-tests.json |
| Native foto/document | Zeven echte Dataverse-controles, inclusief >4000 tekens en volledige PNG-download | native-document-tests.json |
| Native AI | Microsoft TextRecognizer werkelijk uitgevoerd in de gepubliceerde player; 18/24 ton herkend, velden/afwijking en ruwe tekst opgeslagen | native-ocr-ui-test.json |
| Native authoring | Moderne bron compileert; Canvas- en toegankelijkheidscontrole zonder meldingen; na SourceCode-import opent Studio zonder formulefouten | native-canvas-quality.json; native app-registry |
| Native integratie | Negen runtimechecks en vijf echte storing/herstelchecks; vier flows actief | native-runtime-tests.json, native-error-path-tests.json, native-flow-runs.json |
| Menselijke goedkeuring | Gebruiker besliste zelf in Microsoft Approvals; dezelfde taak eindigde na herstel met één ERP-testontvangst | native-approval-uat.json |
| Volledige Solution Checker | 0 critical/high, 5 medium mogelijke recursiemeldingen; statusfilters en runtimebewijs afzonderlijk vastgelegd | native-solution-checker.json |
| Deelbare export | Actuele mobiele app in standalone en solution; oude appreferentie verwijderd; geneste scan zonder signed URLs/tokenpatronen; vier flows uit voor doelomgevingbinding | native-release-artifacts.json |
| BPMN | XML, referenties en diagramdekking gecontroleerd | `npm run check:artifacts` |

De [native video](native-demo.webm) toont de echte Microsoft-player: opgeslagen echte OCR beoordelen en een eerder werkelijk goedgekeurde UAT met ERP-ontvangst bekijken. De video voert geen beslissing uit. [Nederlandse ondertitels](native-demo.nl.vtt) en [opnamemetadata](native-demo-recording.json) horen bij die opname. De oorspronkelijke webdemo-video is een afzonderlijke uitvoering.

Open productiepoorten: meergebruikers-UAT, operationele roltoewijzingen/werfteams, belastingtest, herstelproef, passende licenties/capaciteit en formele acceptatie. De eerdere `prvCreateEntity`-blokkade en het oude onbruikbare Canvas-bestand zijn opgelost; ze worden niet meer als huidige blokkades beschreven.
