# Native Power Platform-componenten

De echte installatie staat in **FieldOps 360 DEV**. Zie [omgeving en links](../docs/native-environment.md) en [exacte opleverstatus](../docs/delivery-status.md).

- `native-solution/`: uitgepakte, echte Dataverse-export met tabellen, rollen, plug-in, Canvas App en vier cloud flows.
- `releases/FieldOps360_unmanaged_template.zip`: deelbaar unmanaged installatiepakket. Gesigneerde ERP-URL's zijn verwijderd; flows zijn uitgeschakeld tot verbindingen en runtime-instellingen in de doelomgeving kloppen.
- `FieldOps360Native.msapp`: Dataverse-gebonden mobiele app. `canvas-native-layout/` bevat de drie gezaghebbende schermbronnen; `canvas-native/` bevat het volledige PAC-authoringformaat met metadata. De app opent momenteel niet in player of Studio (`ErrOpeningDocument_UnknownError`); dit is een herstelartefact, geen werkende native app. Native mediabinding blijft open.
- `plugin/`: C#-bron van de synchrone servervalidatie. De export bevat de geregistreerde DLL. De lokale assembliesleutel is niet gepubliceerd.
- `dataverse/schema.json`: zes tabeldefinities. De echt geïnstalleerde securityrollen staan in de native solution; het oorspronkelijke `security-roles.json` blijft een ontwerpmatrix.
- `flows/`: de oorspronkelijke drie bronontwerpen. Voor de werkelijk geïnstalleerde vier flows gebruik je `native-solution/Workflows/` en de native runbewijzen.
- `canvas-legacy/` en `FieldOps360.msapp`: oorspronkelijke collectievariant, behouden als leermateriaal. Deze is geen Dataverse-app.

## Binding en installatie

Volg [deployment.md](../docs/deployment.md). Iedere doelomgeving krijgt eigen connectoren en een eigen beperkte runtime-identiteit. De plug-in moet met dat runtime-user-ID worden geconfigureerd. De code voor de live ERP-callback staat alleen in de privé-omgeving; de gedeelde placeholder wordt door `deploy-native-flows.mjs` vervangen.

Gebruik app-only imports bij UI-wijzigingen. Een volledige oudere solution importeren kan anders een nieuwere flow terugzetten. Gebruik Solution Checker en controleer de echte player na publicatie: een geldige zip of een geregistreerde app is onvoldoende runtimebewijs.

De native ERP is een eigen HTTP-testflow. De publieke GitHub-demo gebruikt een aparte gesimuleerde ERP en echte Tesseract-OCR op het toestel. Er is geen AI Builder-model gepubliceerd en er wordt geen cloud-OCR of commerciële ERP-koppeling voorgesteld als reeds getest.
