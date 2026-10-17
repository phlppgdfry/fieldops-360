# FieldOps 360 — ontwerpverbetering

Referentie: evidence/design-concept-v2.png, gegenereerd met de ingebouwde Image Gen-tool.

Behoud de bestaande zes navigatie-items, de diepe petrolzijbalk, witte hoofdvlakken, tealacties en limoen F. De bediening blijft volledig React/HTML; het concept is geen screenshot-UI. De echte fictieve oefendata bepalen aantallen, rijen en datums.

Toevoegingen: werffilter, veilige CSV-export van de huidige selectie, paginering met zes rijen, aandachtregel voor open goedkeuringen en een toegankelijke rondleiding met vijf stappen. Geen wijziging aan de betekenis van browseropslag, OCR en ERP-simulatie. De twee onderste secties blijven open kolommen met scheidingslijn.

Tokens: achtergrond #fff, zijbalk #142b32, actie #087f70, tekst #142b32, lijn #e6ecec, waarschuwing #fff5df. Tabeltekst 13px, secundair 11px, sectietitels 18px, paginatitel 34px. Mobiel: kolomindeling, aanraakdoelen minstens 40px, horizontale tabelscroll, samengevouwen navigatie.

Bewuste afwijkingen van het gegenereerde concept: echte seednamen en aantallen behouden; merkicoon en bestaande Lucide-iconen behouden; header en metrics behouden hun vertrouwde ordening; refreshknop blijft beschikbaar. Geen synthetische prestatieclaims of verzonnen native verbindingsstatus.

## Verificatie

Browser-plugin niet beschikbaar in deze sessie; Playwright Chromium gebruikt op 1440×1000 en 390×844. Referentie en de nieuwste render zijn met `view_image` bekeken. Bewijs: `evidence/dashboard-v2-desktop.png` en `evidence/tour-v2-mobile.png`.

| Vergelijkingspunt | Uitkomst |
|---|---|
| Navigatie en tekst | De zes bestaande navigatie-items en oorspronkelijke CTA blijven behouden; rondleiding, werffilter, CSV en paginering zijn de geplande toevoegingen |
| Palette | Witte hoofdvlakken, petrolzijbalk, tealacties en amber aandachtregel zoals vastgelegd |
| Leesbaarheid | Tabel 13px, data 11px, duidelijke secties; filters en acties hebben expliciete typografie |
| Tabel en gegevens | Tabel blijft een tabel; zes rijen per pagina; aantallen en statussen komen uit de echte fictieve seed, geen pixels uit het concept |
| Mobiel | Geen documentbrede overflow op 390px; acties blijven zichtbaar; rondleiding is volledig leesbaar en sluit met Escape of sluitknop |
| Interactie | Werffilter reset pagina, CSV bevat uitsluitend gefilterde rijen, rondleidingstappen reageren, OCR/goedkeuring/ERP-route blijft werken |

Boven-de-vouw-copy is vergeleken met het bestaande scherm plus de vastgelegde uitbreidingen. Geen extra marketingclaims of live Microsoft-verbindingsclaim toegevoegd. Bestaande metricvolgorde, logo en iconen zijn bewust behouden; dit zijn de gedocumenteerde afwijkingen van het gegenereerde concept. De eerste mobiele opname viel tijdens de animatie en leek daardoor doorschijnend; de definitieve opname schakelt animaties uit en toont het werkelijke, witte dialoogvlak.
