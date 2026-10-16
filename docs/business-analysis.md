# FieldOps 360 — Business Analysis

## Case en afbakening
Fictieve West-Vlaamse bouw- en transportgroep: 200 medewerkers, 40 chauffeurs, drie parallelle werven. Geen opdracht of implementatie voor Nuvex Systems; de genoemde referentie is uitsluitend aanleiding voor deze onafhankelijke portfolio-case. Alle leveranciers, transacties en besparingen zijn oefendata/aannames.

## Probleemstelling en nulmeting
Chauffeurs leveren papieren bonnen in. Werfleiders bevestigen via e-mail. Administratie herneemt hoeveelheden in Excel en ERP. Afwijkingen komen vaak pas aan het licht bij factuurcontrole. Er is geen betrouwbaar gedeeld processtatusveld of centraal auditspoor.

Te toetsen hypothesen: 80 leveringen/werkdag; 12 minuten administratieve verwerking per bon; 8% ontbrekende of onvolledige registraties; 2 werkdagen mediane goedkeuring. Verzamel vóór de pilot 20 willekeurig geselecteerde bonnen per werf. Meet ontvangsttijd, registratietijd, eerste complete versie, goedkeuring, ERP-ontvangst en correcties. Bevestig cijfers met administratie; registreer geen verzonnen nulmeting als resultaat.

## Doelen en grenzen
Binnen een pilot van twee weken: minimaal 95% complete dossiers; mediane registratietijd maximaal 3 minuten; 90% goedgekeurd binnen één werkdag; minimaal 99% goedgekeurde leveringen binnen 15 minuten in ERP bij beschikbare integratie. Geen routeoptimalisatie, loonverwerking, factuurbetaling, automatische schadewaardering of offline write queue in versie 1. Een slechte verbinding toont een fout; een registratie is pas opgeslagen na serverbevestiging.

## Stakeholdermap en RACI
| Stakeholder | Belang / invloed | Betrokkenheid | RACI |
|---|---|---|---|
| Operationeel directeur | Hoog / hoog | Sponsor, budget, pilotbesluit | Accountable |
| Chauffeurs | Hoog / middel | Meelopen op werf, mobiel testen | Responsible registratie |
| Werfleiders | Hoog / hoog | Validatie en dagelijkse goedkeuring | Responsible controle |
| Administratie | Hoog / middel | Nulmeting, factuurmatch, foutanalyse | Consulted |
| IT / platformbeheer | Hoog / hoog | Omgeving, rollen, DLP, monitoring | Responsible deployment |
| ERP-beheerder | Hoog / middel | Contract, sandbox, idempotentie | Responsible integratie |
| Privacyverantwoordelijke | Middel / hoog | Retentie en toegangsmodel | Consulted |
| Leverancier | Middel / laag | Leveringsbon en afwijking | Informed |

## Discovery-workshop (90 minuten)
0–10: doelen, scope en feiten onderscheiden van aannames. 10–30: één gewone en één afwijkende levering stap voor stap volgen. 30–45: dubbel werk, wachttijden en foutbronnen tekenen. 45–60: TO-BE en bevoegdheden vastleggen. 60–75: top vijf risico's en uitzonderingen. 75–85: MoSCoW prioriteiten en meetplan. 85–90: beslissingen en eigenaar per open vraag. Output: proceskaart, begrippenlijst, beslislog en gevalideerde backlog. Vragen: wie is eigenaar van een bon? Wie vervangt een werfleider? Hoe herkennen we een dubbele bon? Wanneer mag administratie een correctie doorvoeren? Wat is een geldige eenheid? Wie behandelt een blijvende ERP-fout?

## Requirements en traceerbare user stories
| ID / prio | User story | Acceptatiecriteria (Given / When / Then) | Bewijs |
|---|---|---|---|
| FR01 Must | Als chauffeur registreer ik een levering op mijn werf. | Eigen werf + geldige velden / opslaan / uniek concept met tijd en eigenaar. | domain validatie + UI |
| FR02 Must | Als chauffeur zoek ik een bon. | Bestaande bon / referentie, werf of leverancier typen / passende dossiers binnen mijn rechten. | UI zoeken |
| FR03 Must | Als werfleider beoordeel ik afwijkingen. | Verschil >5% / registratie zonder reden / 422 en geen opslag. | domain validatie |
| FR04 Must | Als werfleider keur ik onafhankelijk goed. | Pending op eigen werf, andere eigenaar / approve / approved + precies één integratietaak. | domain approval |
| FR05 Must | Als werfleider wijs ik gemotiveerd af. | Pending / reject met reden / rejected en audit; zonder reden 422. | domain reject |
| FR06 Must | Als administratie krijg ik ERP-bevestiging. | Approved / worker draait / receipt opgeslagen, status synced. | domain + UI ERP |
| FR07 Must | Als beheerder behandel ik fouten. | ERP geeft 503 / drie pogingen / dead-letter + meldingen, geen synced. | domain retry |
| FR08 Must | Als chauffeur controleer ik OCR. | Afbeelding / OCR / voorstel, provider, confidence en verplichte menselijke bevestiging. | OCR PNG + domain |
| FR09 Must | Als IT beheer ik toegang. | Andere chauffeur / levering-ID raden / 403, ook voor origineel document. | domain + HTTP tests |
| FR10 Must | Als auditor volg ik beslissingen. | Statusovergang / handeling / actor, tijd en detail in audit. | domain audit |
| FR11 Should | Als beheerder herstart ik een herstelde integratie. | Dead-letter / storing oplossen en retry / ontvangst zonder duplicaat. | UI herstel |
| FR12 Should | Als sponsor toets ik ROI. | Nieuwe aannames / input wijzigen / herberekende jaarlijkse waarde en payback. | UI ROI |
| FR13 Could | Als chauffeur werk ik offline. | Niet geïmplementeerd in v1; backlog met conflictresolutie en queue. | Geen claim |

## Niet-functionele eisen
NFR01: serverzijde autoriseren bij iedere lees- en schrijfroute; UI-filtering is geen beveiliging. NFR02: geen automatische ERP-mutatie op basis van OCR alleen. NFR03: herhaalde ERP-aanroep levert dezelfde ontvangst voor dezelfde delivery-ID. NFR04: Nederlandse interface, toetsenbordbediening, zichtbare focus, bruikbaar op 390px. NFR05: doel p95 <2s voor CRUD bij 40 gelijktijdige gebruikers; nog te bewijzen met belastingtest. NFR06: dagelijkse back-up en herstelproef vóór productie; lokaal SQLite is alleen de demonstratieopslag. NFR07: audit niet wijzigbaar via gebruikers-API. NFR08: OCR-foto's uitsluitend zakelijk; bewaartermijn na afstemming vastleggen.

## Prioritering en besluitvorming
Must: veilige registratie → menselijke controle → goedkeuring → betrouwbaar ERP. Should: herstelbediening en ROI. Could: offline en dashboarduitbreiding. Won't: automatische betaling. Reden: eerst de keten sluitend maken; fraaie analyses zijn pas waardevol met betrouwbare brongegevens. Sponsor beslist over scope; IT kan blokkeren bij onjuiste toegang of onherstelbare dataverwerking.
