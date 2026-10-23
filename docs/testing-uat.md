# Testplan en UAT

## Testlagen en uitvoering
`npm test`: echte bedrijfslogica met afzonderlijke in-memory SQLite per testcase. `npm run build`: productiecompile. `npm run test:ui`: Chromium met draaiende server op 3600; UI met desktop 1440×1000 en mobiel 390×844. `node scripts/document-smoke.mjs`: upload van PNG → echte OCR → velden en verplichte review geassert. Microsoft cloud checks staan afzonderlijk; een lokale groene test vervangt geen tenantproef.

| TC | Scenario | Verwacht | Geautomatiseerd |
|---|---|---|---|
| 01 | Geldige registratie | Draft + audit | Ja |
| 02 | Nul/negatief/NaN/onbekende eenheid | 422, geen nieuwe rij | Ja |
| 03 | Duplicaat bonnummer | 409 | Ja |
| 04 | >5% afwijking zonder reden | 422 | Ja |
| 05 | Andere chauffeur/werf | 403 / afgeschermde lijst | Ja |
| 06 | OCR zonder menselijke bevestiging | Indienen geblokkeerd | Ja |
| 07 | Eigen levering goedkeuren | 403 | Ja |
| 08 | Verouderde versie goedkeuren | 409 | Ja |
| 09 | Afwijzing zonder reden | 422 | Ja |
| 10 | Afwijzing + herindienen | Pending opnieuw | Ja |
| 11 | Approval → ERP | Synced + receipt | Ja |
| 12 | Dubbele ERP-aanroep | Zelfde receipt | Ja |
| 13 | ERP geeft 503 | 3 pogingen, dead-letter, alerts | Ja |
| 14 | Zoekfilter met nul resultaten | Expliciete lege toestand | Ja |
| 15 | Mobiel registreren | Geen afgesneden velden | Ja + screenshot |
| 16 | PNG documentherkenning | Reference/supplier/quantity juist, review verplicht | Ja, macOS |
| 17 | Tenantimport en connectorbinding | Canvas speelt, flows hebben runhistoriek | Uitgevoerd; native-player-tests.json en native-flow-runs.json |
| 18 | 40 gelijktijdige gebruikers | p95 <2 sec CRUD | Nog niet uitgevoerd |
| 19 | Dataverse-rechten en bypasspoging | Serverregel weigert ongeldige status | Uitgevoerd via beperkte runtime; native-runtime-tests.json en native-server-validation.json; meergebruikers-UAT apart |
| 20 | Back-up herstellen | Dossiers en audit gelijk | Handmatige productiepoort |

## UAT-draaiboek (niet reeds ondertekend)
De native mobiele player heeft acht functietests doorlopen. Native documentopslag heeft zeven controles doorlopen; Microsoft TextRecognizer heeft de fictieve bon daadwerkelijk verwerkt, inclusief opgeslagen veldvergelijking en verplichte menselijke bevestiging. De eigen gebruiker heeft één echte Microsoft-goedkeuring gegeven; de gesynchroniseerde ontvangst is opnieuw zichtbaar in de player. Dit vervangt niet de onderstaande bedrijfssessie met meerdere operationele gebruikers.

Deelnemers: 2 chauffeurs, 1 werfleider, 1 administrateur, 1 IT-beheerder. Fictieve bonnen; geen persoonsgegevens. Leg browser, toestel, tijd, test-ID, verwacht/werkelijk resultaat en bewijs vast. Laat deelnemers zelfstandig werken.

UAT01 chauffeur registreert 24 ton zonder afwijking (FR01). UAT02 18/24 ton met verplichte toelichting (FR03). UAT03 upload PNG en corrigeer eventueel bonnummer vóór dossieraanmaak; bevestig handmatig (FR08). UAT04 werfleider wijst af met reden, chauffeur dient opnieuw in (FR05). UAT05 goedkeuring synchroniseert eenmaal (FR06). UAT06 beheer simuleert ERP-storing, controleert melding en herstart na herstel (FR07). UAT07 verkeerde rol probeert dossier en bestand te openen (FR09). UAT08 sponsor wijzigt ROI-inputs (FR12).

Acceptatie: alle Must-verhalen geslaagd, nul open kritieke/hoge fouten, geen ongeautoriseerde toegang of automatische AI-goedkeuring, geen dubbele ERP-ontvangsten. Medium issues alleen met gedocumenteerde workaround en eigenaar. Sponsor + operationeel verantwoordelijke + IT tekenen af. Dit document bevat een uitvoerbaar plan, geen verzonnen gebruikersgoedkeuring.

| Test-ID | Tester | Werkelijk resultaat | Bewijs | Pass/fail | Bevinding |
|---|---|---|---|---|---|
| UAT01–08 | In te vullen bij sessie | Niet uitgevoerd door eindgebruikers | — | Open | — |

Bevindingen: impact (data/toegang/werkonderbreking), reproduceerbare stappen, verwacht/werkelijk, eigenaar, prioriteit, hertest en besluit. P1 blokkade: productie-go stoppen. P2 beperkt: pilot alleen bij akkoord en alternatief proces. P3 cosmetisch: backlog.
