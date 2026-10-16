# Opleverstatus — bewijs boven claims

| Gevraagd onderdeel | Opgeleverd | Verificatie / resterend werk |
|---|---|---|
| Business Analysis | Probleem, stakeholders, workshop, requirements, 13 stories, criteria, prioriteiten | Uitgewerkt; aannames niet door echt bedrijf gevalideerd |
| AS-IS/TO-BE BPMN | Twee bewerkbare BPMN 2.0-bestanden met diagraminformatie | XML, referenties en diagramdekking gecontroleerd |
| Publieke GitHub Pages-demo | Echte browser-OCR, registratie, review, goedkeuring, gesimuleerde ERP/retries; opslag per bezoeker | Browserroute getest; deployment via Pages-workflow |
| Mobiele werkende demo | React + Node + SQLite; registratie, upload, zoeken, statussen, audit | Browserroute desktop/mobiel geslaagd |
| Echte Canvas App-bron en bestand | Mobiele 3-schermen collectievariant + `FieldOps360.msapp` | PAC pack en unpack geslaagd; Power Apps Studio/player-validatie nog vereist |
| Dataverse-verbinding Canvas | Datamodel, bronnen en bindingsuitleg | Niet gekoppeld: tenantrechten en Studio-validatie open |
| Dataverse | 6 relationele tabeldefinities + provisioningscript; publisher en FieldOps360 solution aangemaakt | Tabelcreatie geblokkeerd door ontbrekend `prvCreateEntity`; tabellen/rollen niet live geïnstalleerd |
| 3 werkende workflows | Goedkeuring, duurzame ERP-sync en foutmelding/herstel in lokale backend | Unit/API/UI-tests geslaagd |
| Power Automate | 3 volledige brondefinities met connectorreferenties en ontwerp | Niet als werkende Microsoft cloud flows claimen: binding, onafhankelijke approval, security en tenantproeven open |
| AI-documentverwerking | Echte Apple Vision ML-OCR op PNG + extractie en menselijke bevestiging | Herkende reference/supplier/quantity/unit; bewijs in ocr-result.json |
| Azure/AI Builder | Optionele Azure-adapter, ontwerp voor native integratie | Niet cloudgetest; geen AI Builder-model getraind/gepubliceerd |
| ERP | Lokale test-API met idempotentie + aparte sleutelbeveiligde sandbox + connectorcontract | Lokale keten getest; geen commercieel ERP aangesloten |
| Security | Server-side rechten, validatie, veilige bestandsroute en onafhankelijke goedkeuring in webdemo | Demo-rolselector alleen lokaal; native rollen en serveractie nog open |
| Tests en UAT | 13 unit/API-tests + browserworkflow, OCR-proef, plan met 20 testscenario's | UAT door echte eindgebruikers niet uitgevoerd of ondertekend |
| Implementatie | DEV/TEST/PROD, rollback, beheer, pilot en adoptie | Uitgewerkt; geen productie-go |
| ROI | Interactieve calculator + scenarioanalyse | Formules gecontroleerd; inputs zijn aannames |
| Screenshots / video | Desktop, mobiel, ERP-status; echte opname met Nederlandse ondertitels | Bewijs van webdemo; geen opname native Power Apps |
| Exportable solution | Solution-bronscaffold en exportinstructies | Geen complete solution-zip: export pas na native installatie |

## Uitvoeringsvormen
- GitHub Pages: publiek, volledig in browser; OCR echt, ERP gesimuleerd; geen Microsoft-verbinding.
- Lokale backend: serverautorisatie, SQLite en echte ERP-test-API; Apple Vision op macOS.
- Native Microsoft: afzonderlijk te installeren; nog geblokkeerd door Dataverse-rechten. De beheerprocedure staat in [microsoft-admin-steps.md](microsoft-admin-steps.md).

## Concrete Microsoft-blokkade
De bestaande omgeving herkent de organisatiegebruiker, maar de metadata-API weigert nieuwe tabellen met HTTP 403, `PrivilegeName: prvCreateEntity`. De gebruiker laat rechten toekennen in deze omgeving. Er zijn geen adminrollen door scripts toegekend. De aangemaakte FieldOps360-solution bevat nog geen volledige native oplossing. Zodra de rechten beschikbaar zijn: provisioning opnieuw uitvoeren, app en flows verbinden, servervalidatie/rollen implementeren, checker en runhistoriek vastleggen, daarna solution exporteren.

## Bewijsgraad
Een geslaagde PAC-verpakking bewijst een verpakbaar appbestand, geen foutloze runtime in Studio. Een JSON-structuurcheck bewijst geen geldige connectorbinding. Een lokale test bewijst geen Dataverse-rolbeleid. Een oefen-ROI bewijst geen gerealiseerde besparing. Deze grenzen blijven zichtbaar in README en demo.
