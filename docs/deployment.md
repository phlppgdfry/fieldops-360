# Deployment, beheer en adoptie

## Lokale demonstratie
1. Node.js 24 installeren; repository klonen; `npm ci`.
2. `npm test && npm run build`; `npm start`.
3. Open loopback http://127.0.0.1:3600. macOS + Swift/Xcode Command Line Tools voor lokale OCR; anders Azure Document Intelligence instellen met servervariabelen.
4. `npm run test:ui`; bewaar daadwerkelijke uitkomsten. Tests gebruiken fictieve data en registreren nieuwe UI-bonnen.

## Power Platform DEV → TEST → PROD
De eigen omgeving is geïnstalleerd; zie [native-environment.md](native-environment.md) en [opleverstatus](delivery-status.md). De standaardomgeving en Halverdijk worden niet als FieldOps-ontwikkelomgeving gebruikt.

1. Meld Azure CLI en PAC aan met het toegestane werkaccount. Stel `DATAVERSE_USER`, `DATAVERSE_URL`, `POWER_PLATFORM_ENVIRONMENT_ID` en `AZURE_TENANT_ID` expliciet in. Gebruik een Developer-omgeving voor tests; activeer geen betaalde capaciteit zonder afzonderlijke toestemming.
2. Controleer dat de doelomgeving Dataverse én de Microsoft AI Builder-oplossing/AI Model-tabel bevat; de native tekstherkenner heeft die beheerde Microsoft-afhankelijkheid. Importeer daarna `power-platform/releases/FieldOps360_unmanaged_template.zip` in de nieuwe ontwikkelomgeving. De vier flows zijn bewust uitgeschakeld; de ERP-URL is een placeholder. Dit pakket is gebaseerd op een echte export, geen lege solution.
3. `scripts/provision-dataverse.mjs` controleert de zes tabellen/relaties. `scripts/provision-native-documents.mjs` controleert apart de foto-/OCR-kolommen en zet volledige afbeeldingsopslag expliciet aan; de aanmaakvlag alleen bleek onvoldoende. `scripts/provision-runtime-connection.mjs --apply` creëert een beperkte toepassing en versleutelde Dataverse-connector. `scripts/create-approvals-connection.mjs` maakt de eigen Approvals-verbinding. Controleer connectorstatus en account.
4. `scripts/provision-native-roles.mjs` installeert de operationele rollen en unieke integratiesleutel. `scripts/install-native-validation.mjs` configureert de synchrone plug-in met het runtime-user-ID van de doelomgeving. De geregistreerde DLL zit in de export; de bron staat in `power-platform/plugin`. Bewaar een lokale assembliesleutel privé als je opnieuw compileert.
5. `scripts/deploy-native-flows.mjs` bindt connection references, maakt de ERP-testcallback uitsluitend in geheugen beschikbaar en activeert de flows. De foutmelding reageert op Dataverse-events, zonder periodieke idle runs. Toegewezen approver wordt uit de aangemelde gebruiker gelezen. E-mailmeldingen en opnieuw toewijzen staan voor deze portfolio-UAT uit.
6. Appwijzigingen gebruiken de moderne `canvas-studio/*.pa.yaml`, `scripts/build-studio-source.py` en Microsofts officiële Canvas Authoring MCP. Volg [native-canvas-authoring.md](native-canvas-authoring.md); de oude builders zijn standaard geblokkeerd. Publiceer vanuit Studio, controleer de gewone player en download juist die versie. Importeer geen oudere volledige solution bij alleen een UI-wijziging.
7. Voer `scripts/test-native-runtime.mjs`, `scripts/test-native-error-path.mjs` en een echte menselijke goedkeuring uit. Scripts maken duidelijk gemarkeerde testdata; tijdelijke testsleutels worden in `finally` ingetrokken. Een menselijke beslissing wordt niet door de tests nagebootst.
8. Exporteer met `pac solution export --environment <url> --name FieldOps360 --path .data/FieldOps360-native-live.zip`. Houd de echte export privé: deze kan gesigneerde HTTP-URL's bevatten. Maak een deelbare template met `python3 scripts/sanitize-solution.py .data/FieldOps360-native-live.zip power-platform/releases/FieldOps360_unmanaged_template.zip` en pak die uit met PAC voor versiebeheer. Controleer de output op secrets.
9. TEST/PROD: apart beheerde doelomgeving, passende Power Apps/AI Builder-rechten, eigen approvers/connectoren, back-up en gecontroleerde release. Er is geen automatische productie-import in CI. Native foto/OCR is in DEV aangetoond; sitegebonden teams, meergebruikers-UAT en operationeel beheer moeten vóór een productieclaim worden gevalideerd.

## Rollback
Stop nieuwe registraties en cloud triggers; behoud queued jobs en ERP-idempotencykeys. Maak back-up van data en export van bestaande oplossing vóór upgrade. Gebruik de ondersteunde oplossing-/omgevingsherstelprocedure; een managed solution verwijderen kan data verwijderen en is geen veilige standaardrollback. Vergelijk ERP-receipts vóór opnieuw verwerken. Herstel pas writes na akkoord IT en operations.

## Beheer en adoptie
D-5: twee werfleiders als ambassadeur, 30-minuten workshop. D-2: 20 oefenbonnen en rechtenproef. D0–D10: één werf, twee chauffeurs, dagelijkse 15-minuten feedback; registratie op papier als vooraf afgesproken continuïteitsroute, later gecontroleerd reconciliëren. Dagelijks: pending >1 werkdag, dead jobs, OCR-review, duplicate rejects. Na 2 weken: besluit met KPI's en echte feedback. Opschalen per werf na go/no-go. Training: chauffeur 15 minuten, werfleider 20, beheer 30. Onboarding/offboarding via Entra-groep en werfteam, niet handmatig in appdata.

## Releasecriteria
Geen kritieke bugs; rol- en statustransities server-side bewezen; alle Must UAT-pass; werkende back-up/herstel; native Canvas checker; drie werkelijke cloud flow-runs; geen secrets in repository; DPIA/retentiebesluit waar vereist; eigenaars van incidenten en ERP duidelijk. Deze criteria staan open waar native tenantvalidatie ontbreekt.
