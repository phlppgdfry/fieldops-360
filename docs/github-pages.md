# Publieke demo op GitHub Pages

GitHub Pages host statische bestanden. De Node-server, SQLite en Apple Vision kunnen er niet worden uitgevoerd. Daarom bouwt `npm run build:pages` een aparte browseruitvoering van dezelfde interface, met gedeelde validatieregels en expliciete labels voor de simulatie.

## Wat werkt op de site?
Registreren, zoeken, rolfilters, originele bonfoto, echte Tesseract.js-OCR, correctie vóór opslag, verplichte menselijke bevestiging, onafhankelijke goedkeuring in de oefenroute, gesimuleerde ERP-overdracht, retries/foutmeldingen/herstart en ROI. Oefendata blijft op het toestel via LocalStorage; bonfoto's in IndexedDB. Elke bezoeker heeft zijn eigen dataset. Geen Microsoft-login, Dataverse-token of backendsecret wordt meegepubliceerd.

De rolselector is een demonstratiecontrole. Een bezoeker kan zijn eigen browseropslag wijzigen; er is geen serverbeveiliging in deze statische variant. Toon dit nooit als bewijs van Dataverse-rechten of werkende Power Automate-cloud flows. De browsertaakverwerking gebeurt wanneer de open tab de gegevens vernieuwt; het is geen achtergrondcloudservice.

## Bouw en test

```sh
npm ci
npm run build:pages
npm run test:pages
```

`preview:pages` start alleen een lokale statische server voor QA. In productie levert GitHub dezelfde bestanden. De Pages-workflow test eerst de bron en de complete browser-OCR-route, uploadt daarna `dist-pages/` en publiceert met de officiële Pages-acties. App op `/fieldops-360/`, case/video op `/fieldops-360/case/`. De project-base-path is bewust ingesteld zodat workers en assets ook onder de repositorysubmap laden.

Oefenbon: `samples/leveringsbon.png` is meegeleverd op de site. Gebruik uitsluitend fictieve gegevens. Nieuwe oefensessie reset de browserdemo; dit raakt nooit Dataverse of een ERP.

## Verificatie
De browsertest controleert de echte PNG-herkenning, verplichte bevestiging, bestand openen, goedkeuren, drie mislukte pogingen, herstel, gesimuleerde ontvangst en herladen met behouden data. Hij controleert ook dat er tijdens de route geen HTTP-aanroepen naar een andere origin gebeuren. Dit bewijst de geobserveerde route; het is geen algemene veiligheidscertificering.

De video op de casepagina is de eerder opgenomen lokale webdemo en is als zodanig gelabeld. De publieke interactieve demo is een afzonderlijke uitvoeringsvorm.

Bron: [GitHub Pages met Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
