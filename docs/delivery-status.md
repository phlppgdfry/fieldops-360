# Opleverstatus — controleerbaar bewijs

| Onderdeel | Werkelijke status | Bewijs / grens |
|---|---|---|
| Business Analysis | Probleem, stakeholders, workshop, requirements, stories, criteria, ROI | Uitgewerkt; fictieve bedrijfscase, geen klantvalidatie |
| BPMN | AS-IS en TO-BE met diagraminformatie | XML, referenties en diagramdekking gecontroleerd |
| Publieke demo | Echte Tesseract-OCR, menselijke controle, registratie, review, gesimuleerde ERP, filters, CSV en rondleiding | 3 Chromium-tests desktop/mobiel; opslag per bezoeker, geen Microsoft-koppeling |
| Lokale backend | Autorisatie, SQLite, Apple Vision, echte lokale ERP-test-API | 14 unit/API-tests; browserworkflow |
| Eigen Microsoft-omgeving | FieldOps 360 DEV, Developer Plan, eigen Dataverse | [Omgeving](native-environment.md); Halverdijk blijft apart |
| Dataverse | Zes tabellen, zes relaties, drie fictieve werven | dataverse-deployment.json |
| Securityrollen | Chauffeur, werfleider, beperkte integratieruntime | native-security-roles.json; geen extra mensen toegewezen; werfleider ziet alle FieldOps-werven |
| Servervalidatie | Synchrone Create/Update-plug-in, unieke bon- en integratiesleutels | Directe API-tests voor afwijkingsreden, bevestiging, status en onveranderlijke goedgekeurde hoeveelheid |
| Canvas App | Geregistreerd, gepubliceerd, echte Dataverse-bronnen; drie mobiele schermen, zoeken, werfkeuze, eenheden en menselijke bevestiging | native-app-registry.json; player geeft publicatiefout en Studio geeft ErrOpeningDocument_UnknownError; native foto-invoer nog open |
| Power Automate | Vier actieve flows: ERP-test-API, goedkeuring, ERP-sync en foutmelding | native-flow-runs.json; echte runs, geen bronontwerpclaim |
| Native ERP | Echte HTTP-testdienst en ontvangst in Dataverse | 9 runtimechecks en 5 storing/herstelchecks geslaagd; geen commercieel ERP |
| Native menselijke goedkeuring | Gebruiker heeft UAT-bon bewust goedgekeurd in Microsoft Approvals | native-approval-uat.json; eerste overdracht vereiste herstel, uiteindelijk gesynchroniseerd met één taak |
| AI | Werkende browser-OCR en menselijke bevestiging | AI Builder niet inbegrepen/gepubliceerd; native document-/OCR-koppeling nog open |
| Microsoft Solution Checker | Volledige export: 0 critical/high, 5 medium meldingen over mogelijke flow-recursie | native-solution-checker.json; statusfilters en geslaagde runtimechecks onderbouwen de afhandeling; meldingen blijven zichtbaar |
| Solution-export | Echte export met tabellen, rollen, plug-in, Canvas App en vier flows; deelbare template en uitgepakte bron | Gesigneerde URL verwijderd; flows uitgeschakeld voor nieuwe import; binding en runtime-config per doelomgeving nodig |
| Screenshots/video | Webdemo-opname, ondertitels, desktop en mobiel; nieuw ontwerp en rondleiding | Geen native Canvas-runtimevideo of verzonnen bedrijfs-UAT |
| Implementatie/adoptie | Deployment, rollback, pilot, beheer, handleiding en ROI | Productiegoedkeuring en meergebruikers-UAT blijven open |

## Wat is werkelijk getest?

De native ERP-API geeft echte 200/422/503-antwoorden. Een Dataverse-trigger verwerkt een goedgekeurde testlevering en bewaart een ERP-ontvangst. Een opzettelijke 503 veroorzaakt retries, een dead letter, een aparte auditmelding en herstel van dezelfde taak. De Dataverse-plug-in weigert ongeldige wijzigingen buiten de app. Zie de afzonderlijke JSON-bewijzen in `evidence/`.

De gebruiker heeft `NATIVE-UAT-20261017014909` in Microsoft Approvals goedgekeurd. De flow heeft de beslissing verwerkt. De eerste ERP-overdracht mislukte doordat een oudere ERP-testflow tijdens de appimport was teruggezet. Na herstel is dezelfde taak gesynchroniseerd. Appimports zijn vervolgens in een apart Canvas-pakket ondergebracht.

## Open en eerlijk afgebakend

- De native Canvas App is op 17 oktober rechtstreeks in Chrome gecontroleerd. De player geeft nog een publicatiefout; Studio weigert het bestand met `ErrOpeningDocument_UnknownError`. Het huidige Canvas-bestand moet worden hersteld en is nog geen werkende native app.
- Foto-upload/OCR is bewezen in de browserdemo. Een volledig werkende native Canvas-foto-/OCR-koppeling is nog niet aangetoond.
- De rollen zijn geïnstalleerd, maar niet met twee echte operationele eindgebruikers getest. De native werfleiderrol heeft toegang tot alle FieldOps-werven; teams per werf zijn een vervolgstap.
- Eén eigen UAT-scenario is geen acceptatie door een echt bouwbedrijf. Er is geen productie-go, productiebelastingtest of werkelijk gerealiseerde ROI.

De eerdere ontbrekende Dataverse-rechten en Developer Plan-licentie zijn opgelost. De publieke site blijft bewust gescheiden van de privé-Microsoft-omgeving.
