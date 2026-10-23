# Native Canvas App bouwen en wijzigen

De huidige app is **FieldOps 360 Mobile**, app-ID `06f55c18-3b97-4781-a5c5-4058eb5fb458`, solutionnaam `fo_fieldops360mobile_46012`. De gezaghebbende bron staat in `power-platform/canvas-studio/*.pa.yaml`. Het downloadbare bestand is `power-platform/FieldOps360Native.msapp`.

## Ondersteunde werkwijze

1. Open de app in Power Apps Studio in de expliciet geselecteerde FieldOps-ontwikkelomgeving. Verbind de tabellen **Leveringen**, **Werven** en **Documenten** uit de huidige Dataverse-omgeving. Het TextRecognizer-onderdeel voegt zijn eigen AI-afhankelijkheid toe.
2. De bron is reproduceerbaar met `python3 scripts/build-studio-source.py` (PyYAML nodig). De generator schrijft moderne `.pa.yaml`, geen verouderde `.fx.yaml`.
3. Gebruik Microsofts officiële Canvas Authoring MCP: `dnx Microsoft.PowerApps.CanvasAuthoring.McpServer --yes`. Gebruik een geschikte MCP-client en `connect` met de juiste environment/app-ID en je eigen account. Houd Studio open met coauthoring actief. Een verbinding zonder actieve designer kan onjuiste validatiefouten over ontbrekende gegevensbronnen opleveren.
4. Laat `compile_canvas` de map `power-platform/canvas-studio` valideren. Controleer `get_appchecker_errors` én `get_accessibility_errors`. Bewaar de werkelijke uitkomst; bronvalidatie bewijst niet dat de opgeslagen/publiceerde versie is bijgewerkt. Vergelijk na opslaan altijd de werkelijk gedownloade schermbronnen.
5. Sla in Studio op, publiceer de versie en open de gewone player. Een reeds geopende player kan een eerdere versie uit de browsercache tonen. Vergelijk de versie en wis zo nodig uitsluitend de Power Apps-cache in een aparte testbrowser, met behoud van aanmeldcookies. Een andere querystring alleen bleek onvoldoende. Test registratie, wijziging, bonfoto, echte tekstherkenning en menselijke bevestiging.
6. Download de gepubliceerde app met `pac canvas download --environment <Dataverse-url> --name <app-ID> --file-name .data/FieldOps360Mobile.msapp --overwrite`. Controleer in het archief de schermen en nul parser-/bindingsfouten vóór vervanging van het gedeelde bestand.
7. Voeg een nog niet solution-aware app via **Solution → Bestaande toevoegen → App → Canvas-app → Buiten Dataverse** toe. Sluit eerst alle authoringsessies: Microsoft kan nog vijftien minuten een bewerkingsvergrendeling vasthouden. Verwijder uitsluitend de oude appreferentie uit de solution; verwijder geen bedrijfsgegevens.
8. Exporteer de actuele solution, verwijder gesigneerde URL's met `scripts/sanitize-solution.py`, controleer het pakket en voer Solution Checker uit. Volg [deployment](deployment.md) voor doelomgevingbindingen.

`build-native-canvas.mjs` is standaard geblokkeerd omdat die de gepensioneerde app genereert. De mappen `canvas-native`, `canvas-native-layout` en `canvas-solution` zijn historisch leermateriaal en geen bron voor de huidige app. Een volledige oudere solution terug importeren kan werkende flowversies overschrijven.

## App-only pakket met actuele SourceCode-layout

Als de gedeelde authoringsessie de gevalideerde bron niet in de opgeslagen versie bewaart, gebruik dan PAC 2.13.1 of nieuwer met `--layout SourceCode`: pak de huidige echte `.msapp` uit naar een privémap, vervang uitsluitend `Src/*.pa.yaml` door de gevalideerde bronnen en pak opnieuw in. `scripts/build-canvas-solution.mjs` verpakt dit bestand met de actuele Canvas-metadata uit `native-solution/` in `.data/FieldOps360Canvas-mobile.zip`. Het pakket bevat alleen de huidige mobiele app. Importeer het in de expliciete FieldOps-omgeving, open verplicht in Studio voor YAML-validatie, sla op, publiceer en test de gewone player. Behandel een geslaagde import niet als bewijs dat de app werkt.

## Documenten en AI

`fo_document` bewaart een gekoppelde primaire afbeelding (10 MB, volledige afbeelding ingeschakeld), ruwe herkenningstekst tot 100.000 tekens en een compacte JSON-samenvatting. `scripts/provision-native-documents.mjs` controleert de metadata; `scripts/test-native-documents.mjs` toetst de echte opslag via de beperkte runtime-identiteit.

Microsoft TextRecognizer voert de OCR uit. De velden worden vervolgens deterministisch uit gelabelde regels gehaald; dit is geen zelfgetraind model. Ontbrekende/afwijkende waarden krijgen een waarschuwing. Er worden geen velden stilzwijgend overschreven. De gebruiker controleert de foto en bevestigt de levering vóór indiening. Voor AI Builder-gebruik zijn passende Microsoft-rechten/capaciteit nodig; geslaagde tests bewijzen geen onbeperkt gratis productierecht.

Officiële bron: [Microsoft Canvas Apps-plugin en authoringtools](https://github.com/microsoft/power-platform-skills/tree/main/plugins/canvas-apps).
