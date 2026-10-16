# Handleiding

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
