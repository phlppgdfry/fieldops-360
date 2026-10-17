# Eigen Microsoft-ontwikkelomgeving

FieldOps heeft sinds 17 oktober 2026 een eigen **Developer**-omgeving in de Reviewell-tenant. De Halverdijk-omgeving is apart gebleven.

- Naam: **FieldOps 360 DEV**
- Environment ID: `75afe50a-9cf3-ef33-9d38-148faf2e7e48`
- Dataverse: `https://fieldops360dev.crm17.dynamics.com`
- [Power Apps-omgeving](https://make.powerapps.com/environments/75afe50a-9cf3-ef33-9d38-148faf2e7e48/home)
- [Cloud flows](https://make.powerautomate.com/environments/75afe50a-9cf3-ef33-9d38-148faf2e7e48/flows)
- [Native app](https://apps.powerapps.com/play/e/75afe50a-9cf3-ef33-9d38-148faf2e7e48/a/9b00ff7e-1b3e-40be-9890-ae24ca13831d?tenantId=7f1c6fb7-387b-4cad-a5f5-2c33b8e50295)

Dit zijn privé-Microsoft-bronnen: de GitHub Pages-demo geeft bezoekers geen toegang tot deze omgeving. De browserdemo blijft volledig gescheiden van Microsoft-gegevens.

## Geïnstalleerd en aangetoond

Zes relationele tabellen en zes relaties; drie fictieve werven; een eigen beperkte runtime-identiteit; verbonden Dataverse- en Approvals-connectoren; vier geactiveerde cloud flows; chauffeur- en werfleiderrollen; synchrone validatieplug-in op Create/Update; unieke bonnummer- en integratiesleutels.

De echte ERP-test-API is een HTTP-cloud flow. De integratieflow schrijft een ontvangst terug in Dataverse. De foutmeldingsflow reageert op een mislukte integratietaak, bewaart een interne auditmelding en vereist geen periodieke polling. Het betreft een eigen ERP-testdienst, geen commercieel ERP-pakket.

Bewijs staat in `docs/evidence/native-runtime-tests.json`, `native-error-path-tests.json`, `native-server-validation.json`, `native-security-roles.json` en `native-app-registry.json`.

## Goedkeuring en gebruikersrechten

De gebruiker heeft de eigen native UAT-bon bewust in Microsoft Approvals goedgekeurd. De flow laat een registratie van de toegewezen goedkeurder zelf niet goedkeuren. Het UAT-dossier is als testfixture door de beperkte runtime-identiteit aangemaakt, zodat deze afbakening aantoonbaar blijft. Zie `native-approval-uat.json` voor de werkelijk bereikte status.

De chauffeurrol geeft rechten op eigen leveringen/documenten en leesrechten op werfnamen. De werfleiderrol geeft operationele lees-/schrijfrechten over alle FieldOps-werven; sitegebonden teams zijn nog geen geïmplementeerde beperking. De beslissende statusovergang wordt door de gecontroleerde flow uitgevoerd. Deze rollen zijn niet aan extra personen toegewezen; een meergebruikers-UAT blijft afzonderlijk nodig.

## Beheer

De bestaande self-elevation in de standaardomgeving blijft gelden totdat de beheerder die verwijdert. In de nieuwe Developer-omgeving heeft de eigenaar beheerrechten. Er is geen extra tenantbrede adminrol toegekend.

De runtime-connector gebruikt een toepassingsidentiteit met alleen FieldOps-rechten. De connectorsleutel is 30 dagen geldig en staat uitsluitend versleuteld bij Microsoft. Tijdelijke integratietests maken een eigen kortlevende sleutel aan, houden die in geheugen en trekken die in `finally` weer in. Geen toegangstokens, clientsleutels of gesigneerde HTTP-callbacks horen in GitHub.

Het Developer Plan is voor ontwikkeling en tests. AI Builder is niet inbegrepen; de publieke OCR gebruikt echte Tesseract.js op het toestel. De native app is afzonderlijk geregistreerd; de player geeft een publicatiefout en Studio meldt `ErrOpeningDocument_UnknownError`. Het Canvas-bestand moet worden hersteld.
