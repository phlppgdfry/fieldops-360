# Native Power Platform-componenten

De echte installatie staat in **FieldOps 360 DEV**. Zie [omgeving en links](../docs/native-environment.md) en [exacte opleverstatus](../docs/delivery-status.md).

- `native-solution/`: uitgepakte, echte Dataverse-export met tabellen, rollen, plug-in, Canvas App en vier cloud flows.
- `releases/FieldOps360_unmanaged_template.zip`: deelbaar unmanaged installatiepakket. Gesigneerde ERP-URL's zijn verwijderd; flows zijn uitgeschakeld tot verbindingen en runtime-instellingen in de doelomgeving kloppen.
- `FieldOps360Native.msapp`: de gepubliceerde **FieldOps 360 Mobile**-app. `canvas-studio/` bevat de moderne, gezaghebbende schermbronnen: overzicht, registratie, controle en bon/OCR. De app opent in Studio én player; native foto-opslag en echte Microsoft-tekstherkenning zijn getest.
- `plugin/`: C#-bron van de synchrone servervalidatie. De export bevat de geregistreerde DLL. De lokale assembliesleutel is niet gepubliceerd.
- `dataverse/schema.json`: zes tabeldefinities. De echt geïnstalleerde securityrollen staan in de native solution; het oorspronkelijke `security-roles.json` blijft een ontwerpmatrix.
- `flows/`: de oorspronkelijke drie bronontwerpen. Voor de werkelijk geïnstalleerde vier flows gebruik je `native-solution/Workflows/` en de native runbewijzen.
- `canvas-legacy/` en `FieldOps360.msapp`: oorspronkelijke collectievariant, behouden als leermateriaal. `canvas-native/`, `canvas-native-layout/` en `canvas-solution/` horen bij de gepensioneerde app en zijn geen actuele authoringbron. De oude native-builder is standaard geblokkeerd; de app-only builder gebruikt nu de huidige mobiele metadata.

## Binding en installatie

Volg [deployment.md](../docs/deployment.md). Iedere doelomgeving krijgt eigen connectoren en een eigen beperkte runtime-identiteit. De plug-in moet met dat runtime-user-ID worden geconfigureerd. De code voor de live ERP-callback staat alleen in de privé-omgeving; de gedeelde placeholder wordt door `deploy-native-flows.mjs` vervangen.

Volg voor appwijzigingen [native-canvas-authoring.md](../docs/native-canvas-authoring.md). Een volledige oudere solution importeren kan een nieuwere flow terugzetten. Gebruik Solution Checker en controleer de echte player na publicatie: een geldige zip of een geregistreerde app is onvoldoende runtimebewijs.

De native ERP is een eigen HTTP-testflow. De publieke GitHub-demo gebruikt een aparte gesimuleerde ERP en Tesseract-OCR op het toestel. Native Microsoft TextRecognizer is werkelijk uitgevoerd; veldextractie daarna is deterministisch, geen zelfgetraind model. AI Builder-licenties/capaciteit en connectoren moeten per doelomgeving worden gecontroleerd. Er is geen koppeling met een commercieel ERP gebouwd.
