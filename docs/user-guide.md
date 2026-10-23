# Handleiding

## Native Microsoft-app

Open **FieldOps 360 Mobile** via de [eigen ontwikkelomgeving](native-environment.md). Meld aan met het toegestane werkaccount. Deze app bewaart echte gegevens in de privé-Dataverse-omgeving; de openbare GitHub-demo heeft eigen browseropslag.

1. Kies **Nieuwe levering**, vul bonnummer, leverancier, werf, geleverde/bestelde hoeveelheid en eenheid in. Een verschil boven 5% vereist een reden. Bewaar als concept.
2. Open **Bonfoto / tekstherkenning toevoegen**. Kies of maak een foto. Voor automatische herkenning kies je de afbeelding ook in de Microsoft-tekstherkenner; alleen een foto kiezen start de AI niet vanzelf.
3. Controleer de originele foto, herkende tekst en veldvergelijking. Een ontbrekend of afwijkend bonnummer, leverancier of hoeveelheid geeft een waarschuwing. De app overschrijft je gegevens niet automatisch. Bewaar de bon bij de levering.
4. Gebruik zo nodig **Concept aanpassen**. De bestaande levering wordt gewijzigd; er wordt geen tweede dossier aangemaakt. Ook een afgewezen dossier kan eerst inhoudelijk worden aangepast en opnieuw als concept worden bewaard.
5. Vink de menselijke controle aan en kies **Indienen ter goedkeuring**. Alleen aanvinken dient niets in. Ingediende/afgehandelde gegevens zijn niet via dit formulier wijzigbaar.
6. De onafhankelijke goedkeurder beslist in Microsoft Approvals. Zelfgoedkeuring wordt geweigerd. Vernieuw de status: na goedkeuring verwerkt de cloud flow de ERP-taak en verschijnt de ontvangst-ID.

De app werkt online. Native foto's zijn maximaal 10 MB; gebruikte opslag bewaart ook de volledige afbeelding. Microsoft AI Builder vereist passende rechten/capaciteit. De native werfleiderrol ziet momenteel alle FieldOps-werven; werfgebonden teams zijn een uitbreiding. De onderstaande rolselector- en serverinstructies gelden voor de afzonderlijke lokale demo.

## Starten
Node.js 24+, `npm ci`, `npm run build`, `npm start`. Open http://127.0.0.1:3600. Opslag in `.data/fieldops.sqlite`; uploads in `.data/uploads`. Stop de server voor een consistente lokale bestandsback-up. Demo herstellen: hernoem `.data` naar een gedateerde back-up en herstart; wis nooit echte data als demo-reset.

## Chauffeur
Kies Chauffeur. Klik Nieuwe levering. Selecteer je werf. Upload een bonfoto of vul handmatig. Controleer het OCR-voorstel en corrigeer alle velden. Vul bonnummer met hoofdletters/cijfers/streepjes, leverancier, positieve hoeveelheden en eenheid in. Motiveer verschil >5%. Maak dossier aan. Bekijk de originele bon, bevestig de gegevens expliciet en dien in. Zonder document kun je direct indienen. Bij afwijzing staat de reden in het auditspoor; in v1 kan je opnieuw indienen, een inhoudelijk foute registratie vergt een nieuw correctiedossier via beheer. De app slaat niet offline op: wacht op bevestiging.

## Werfleider
Kies Sarah via demonstratierol. Open Goedkeuringen. Bekijk hoeveelheid, afwijking en audit. Goedkeuren zet een ERP-taak klaar. Afwijzen vereist toelichting. Alleen dossiers van je eigen werf zijn zichtbaar. Eigen indiening kun je niet goedkeuren. Vernieuw bij een versieconflict.

## Beheerder
Kies Philippe. Automatisering toont taakstatus en foutmeldingen. Simuleer ERP-storing, keur een dossier goed met een andere rol en wacht op drie pogingen. Herstel ERP en herstart de taak. De levering wordt gesynchroniseerd; de ontvangst-ID staat in het dossier. Dit is een test-API met lokale opslag, geen extern commercieel ERP.

## Documenten
`samples/leveringsbon.png` is een fictieve oefenbon. Op macOS is Apple Vision beschikbaar. Op andere systemen configureer Azure Document Intelligence server-side. PNG/JPEG maximaal 5 MB. PDF alleen via Azure. `.txt` leest de parser en is geen AI-proef. Alle uitkomsten vereisen menselijke bevestiging. Een foto van beschadigd materiaal kan als bewijs dienen, maar automatische schadeclassificatie is niet geïmplementeerd.

## Problemen
Geen dossier opgeslagen? Lees de validatiefout; klik pas opnieuw na controle op duplicaat. Geen ERP-status? Bekijk taak en fout, herstel de API en herstart als beheerder. Verkeerde werf? Laat de toewijzing door beheer controleren. OCR mislukt? Gebruik een scherpe, rechte foto met zichtbaar bonnummer; maak anders een handmatige registratie en bewaar het bewijs via het afgesproken beheerproces. De lokale rolselector is uitsluitend voor demo's.

## Optionele Azure-configuratie en aparte ERP-sandbox
Kopieer `.env.example` naar `.env`, vul alleen lokaal de Azure endpoint/key in en start met `node --env-file=.env server/index.mjs`. De gewone `npm start` leest procesvariabelen; Node leest `.env` niet vanzelf. Azure gebruikt een bestaande betaalde resource; deze repository creëert of bestelt er geen.

Voor de zelfstandige ERP-testservice: stel `ERP_API_KEY` in op een lokaal gegenereerde willekeurige sleutel van minimaal 24 tekens en voer `npm run erp` uit. De service luistert standaard op 127.0.0.1:3602. `POST /receipts`, `Authorization: Bearer <sleutel>`, `Idempotency-Key: <delivery-id>`, JSON met reference, quantity en unit. Bij herhaling dezelfde ontvangst; bij gewijzigde payload met dezelfde sleutel 409. `ERP_FAIL=1` simuleert 503 bij het starten. Gebruik dit contract voor een later goedgekeurde HTTPS-sandbox; publiceer de demo-rolselector niet mee.
