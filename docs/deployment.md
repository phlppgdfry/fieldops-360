# Deployment, beheer en adoptie

## Lokale demonstratie
1. Node.js 24 installeren; repository klonen; `npm ci`.
2. `npm test && npm run build`; `npm start`.
3. Open loopback http://127.0.0.1:3600. macOS + Swift/Xcode Command Line Tools voor lokale OCR; anders Azure Document Intelligence instellen met servervariabelen.
4. `npm run test:ui`; bewaar daadwerkelijke uitkomsten. Tests gebruiken fictieve data en registreren nieuwe UI-bonnen.

## Power Platform DEV → TEST → PROD
Voorwaarden: afgescheiden developer/sandboxomgeving met Dataverse, systeemaanpasserrechten voor deployment, passende Power Apps/Power Automate/premium connector-rechten; AI-capaciteit apart bevestigen. Huidige omgeving weigerde `prvCreateEntity`; zolang dit niet is opgelost is native installatie niet voltooid. Wijs geen adminrollen toe via deze repository.

1. Platformbeheer kent de benodigde deploymentrechten toe in DEV. Controleer juiste `DATAVERSE_USER` en `DATAVERSE_URL`. Azure CLI-account en PAC-account moeten dezelfde toegestane organisatie gebruiken.
2. `node scripts/provision-dataverse.mjs` met deze variabelen creëert uitsluitend FieldOps publisher, FieldOps360 solution, zes `fo_`-tabellen en relaties. Bestaande gelijknamige componenten worden hergebruikt. Dit script is bootstrap; pas bestaande schemawijzigingen daarna toe via solution-ALM. Lees- en schemarechten vereist.
3. Configureer alternate keys, kolombeveiliging, owner teams en servervalidatie. Specifieke rechtenmatrix staat in security.md. Laat een Dataverse plug-in/custom API de transities en onafhankelijkheid afdwingen vóór productie; een asynchrone flow alleen volstaat niet.
4. Open de mobiele Canvas App in Power Apps Studio. De meegeleverde collectievariant is offline verpakt indien beschikbaar, maar moet in Studio worden gevalideerd. Voor Dataverse: voeg de zes tabellen als datasource toe en vervang Collect/Patch door de gecontroleerde custom API/flow; zie power-platform/README.md. Publiceer pas na checker en toestelproef.
5. Importeer/bouw de drie flowdefinities in de solution. Bind Dataverse- en Approvals-connection references. Configureer approver, echte HTTPS ERP-sandboxendpoint en secret server-side. Definities zijn bronontwerpen; operationIds/parameters moeten door de huidige designer worden gevalideerd. Geen connector of e-mailontvanger wordt door de lokale demo geactiveerd.
6. Richt ERP sandbox in op het contract; test 200/400/401/429/503, timeout en replay. Voeg server-side idempotency en taakclaim toe. Gebruik een goedgekeurde securityservice, geen demo-rolselector op internet.
7. Voer TC17–20 uit, documenteer run-ID's, Dataverse-rij-ID's, checker-output, mobiel bewijs, onafhankelijke approver en 403-proeven. Sponsor, operations en IT tekenen UAT af.
8. `pac solution export --name FieldOps360 --path artifacts/FieldOps360_unmanaged.zip --managed false`; exporteer managed release na DEV-check. Uitpakken met PAC naar versiebeheer en checker uitvoeren. Laat connection IDs/secrets buiten git. Een lege solution-zip is geen oplevering.
9. TEST: importeer managed solution, bind omgevingswaarden en connectoren; voer smoke/UAT uit. PROD: gecontroleerd releasevenster, back-up, import, bindings, pilotgroep en monitoring. Geen automatische productie-import in CI.

## Rollback
Stop nieuwe registraties en cloud triggers; behoud queued jobs en ERP-idempotencykeys. Maak back-up van data en export van bestaande oplossing vóór upgrade. Gebruik de ondersteunde oplossing-/omgevingsherstelprocedure; een managed solution verwijderen kan data verwijderen en is geen veilige standaardrollback. Vergelijk ERP-receipts vóór opnieuw verwerken. Herstel pas writes na akkoord IT en operations.

## Beheer en adoptie
D-5: twee werfleiders als ambassadeur, 30-minuten workshop. D-2: 20 oefenbonnen en rechtenproef. D0–D10: één werf, twee chauffeurs, dagelijkse 15-minuten feedback; registratie op papier als vooraf afgesproken continuïteitsroute, later gecontroleerd reconciliëren. Dagelijks: pending >1 werkdag, dead jobs, OCR-review, duplicate rejects. Na 2 weken: besluit met KPI's en echte feedback. Opschalen per werf na go/no-go. Training: chauffeur 15 minuten, werfleider 20, beheer 30. Onboarding/offboarding via Entra-groep en werfteam, niet handmatig in appdata.

## Releasecriteria
Geen kritieke bugs; rol- en statustransities server-side bewezen; alle Must UAT-pass; werkende back-up/herstel; native Canvas checker; drie werkelijke cloud flow-runs; geen secrets in repository; DPIA/retentiebesluit waar vereist; eigenaars van incidenten en ERP duidelijk. Deze criteria staan open waar native tenantvalidatie ontbreekt.
