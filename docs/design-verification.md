# Visuele verificatie

Concept: `evidence/design-concept.png`, gemaakt met de ingebouwde ImageGen-tool. Prompt: volledig Nederlandstalig FieldOps-dashboard met navy zijbalk, wit canvas, teal acties, vier operationele metrics, leveringstabel, actieve werven/audit en mobiele registratie. Implementatieconcept geïnterpreteerd voor uitvoerbare demo; geen gebruiker heeft een pixelvast ontwerp goedgekeurd.

Playwright gebruikt omdat de ingebouwde browser meldt “No browser is available”. Desktop 1440×1000, mobiel 390×844. Concept én werkelijke desktop-screenshot zijn met view_image geïnspecteerd. Geen claim van identieke pixels: gegenereerde voorbeeldnamen, logo en mobiele inset zijn bewust vervangen door de echte appdata, lettermerk en aparte mobiele formulierweergave.

| Vergelijkingspunt | Concept | Implementatie / beslissing |
|---|---|---|
| Palette | Wit, navy, teal, lime | Zelfde tokens #fff / #142b32 / #087f70 / #d1ee8d |
| Structuur | Zijbalk + vier metrics + tabel + twee onderpanelen | Zelfde hiërarchie; audit en werven na tabel |
| Typografie | Zware titel, lichte kleine UI | Bewuste compacte bediening, systeemfont voor betrouwbare lokale rendering |
| Copy | Overzicht, Nieuwe levering, nav | Deze labels behouden; extra tekst verduidelijkt lokale demo en toegangsrechten |
| Containergebruik | Tabel met scheidingslijnen, rustige panels | Vlakke tabel, open panels, geen overbodige kaarten |
| Mobiel | Apart registratieformulier | Echte responsive dialog, 390px screenshot, alle velden bereikbaar |
| Data | Door imagegen verzonnen rijlabels | Fictieve vaste seed, dynamische aantallen uit geautoriseerde data |
| Beeldmateriaal | Telefoonmockup boven desktop | Geen overlappende rastermockup; echte mobiele screenshot afzonderlijk |

Bovenste copy gecontroleerd: verplichte navlabels en CTA aanwezig. Toevoegingen: Operaties-breadcrumb, lokale portfolio-demo, profiel en toelichting op toegangsrechten. Afwijkingen zijn functioneel, geen ongeteste bedrijfsclaims. Primaire route getest: chauffeur registreert → werfleider keurt goed → ERP-ontvangst verschijnt. Een te vroeg opgenomen mobiel animatieframe is vervangen door een opname met uitgeschakelde animaties. Screenshotbewijs in evidence/; geen runtime-errors tijdens browserproef.

GitHub Pages-uitbreiding: bestaande navigatie, kleuren, typografie, leveringstabel en mobiele formulieren behouden. Een zichtbare browserdemo-balk, oefenbon-download en reset zijn functionele toevoegingen. Desktop 1440×1000 en mobiel 390×844 via Playwright gecontroleerd omdat de Browser-plugin niet beschikbaar is. De Pages-screenshots zijn visueel geïnspecteerd. Echte OCR → bevestiging → onafhankelijke oefenrol → gesimuleerde ERP-storing/herstel is getest, zonder runtime-errors of HTTP-verzoeken naar andere origins in de geteste route.
