# Demonstratie — twee minuten

De video toont de werkende lokale webapp; het is geen opname van Power Apps Studio. Fictieve gegevens. Geen gerealiseerde bedrijfsresultaten claimen.

0:00–0:15: Overzicht. “Deze fictieve bouwgroep telt 200 medewerkers en 40 chauffeurs. Papier, Excel en e-mail veroorzaken dubbele invoer en ontbrekende bonnen.”
0:15–0:40: Chauffeur maakt mobiele levering. Upload `samples/leveringsbon.png`; OCR leest 18 ton. Besteld 24; voeg reden toe. Toon dat data een voorstel is en bevestig als mens.
0:40–1:00: Dien in; wissel demonstratierol naar werfleider. Controleer afwijking en origineel. Keur onafhankelijk goed.
1:00–1:20: Toon status Gesynchroniseerd en unieke ERP-ontvangst in dossier. Leg duurzame taak en idempotentie uit.
1:20–1:40: Automatisering. Toon voorbereide storing/herstel en audit; drie pogingen, daarna beheeractie. Een fout wordt niet als succesvolle levering gemarkeerd.
1:40–2:00: Businesscase en repository. Pas tijdwinst aan, benoem aannames. Toon business requirements, BPMN, tests en expliciete status van native Power Platform-installatie.

Vragen voor gesprek: Waarom server-side validatie? Hoe voorkomt idempotentie duplicaten na timeout? Waarom menselijke OCR-review? Hoe werken user/team-owned Dataverse-rollen? Welke productiecriteria staan nog open?

## Echte native opname

[native-demo.webm](evidence/native-demo.webm) toont ongeveer 25 seconden uit de gepubliceerde Microsoft-player: zoeken in Dataverse, 18/24 ton en 25% afwijking, opgeslagen echte Microsoft-OCR, menselijke controle en de ERP-testontvangst van een eerder door de gebruiker goedgekeurde UAT. De opname voert zelf geen goedkeuringsbeslissing uit. Nederlandse ondertitels staan naast de video.

Reproduceren met de eigen aangemelde testbrowser: `sh scripts/record-native-demo.sh`, daarna `python3 scripts/finalize-native-demo.py`. De ruwe opnamen blijven privé in `.data/`; alleen de gecontroleerde uitsnede en captions horen in GitHub. Gebruik uitsluitend fictieve records en neem geen aanmelding op.
