# Functies die nog niet in FieldOps zitten

FieldOps verwerkt leveringen, bonfoto's, tekstherkenning, menselijke controle, goedkeuring, ERP-testontvangsten en integratiefouten. Het is een operationele case met een ERP-testdienst, geen volledig ERP-pakket. De publieke browserdemo en de privé-Microsoft-app zijn aparte uitvoeringen; zie [opleverstatus](delivery-status.md).

| Nog niet geïmplementeerd | Mogelijke uitbreiding | Prioriteit na de huidige oplevering |
|---|---|---|
| Inkooporders en bestellijnen | Leveringen aan een echte bestelling koppelen, ook deelleveringen | 1 |
| Factuurcontrole | Bestelling, leveringsbon en factuur vergelijken; verschillen laten beoordelen | 1 |
| Planning en dispatch | Leveringen, chauffeurs, voertuigen en tijdsloten plannen | 2 |
| Voorraad en magazijnen | Materiaalontvangsten, verbruik en interne transfers | 2 |
| Budget en nacalculatie | Materiaal, uren en transport tegenover het werfbudget | 2 |
| Urenregistratie | Prestaties per medewerker, werf en activiteit | 3 |
| Voertuigen en onderhoud | Keuringen, defecten, onderhoud en kilometerstanden | 3 |
| Schadedossiers | Losse dossiers met acties, eigenaar, kosten en afsluiting; nu alleen foto's/opmerkingen | 3 |
| Klanten, offertes en opdrachten | Commerciële opvolging en omzetting naar werkopdracht | 3 |
| Leveranciersportaal | Externe partners zelf bonnen en leveringen laten indienen | 3 |
| Boekhouding en facturatie | Facturen, betalingen en btw via een echt financieel systeem | Apart project |
| Managementrapportage | Doorlooptijden, leveranciersprestaties, kosten en afwijkingen | 2 |

## Mobiele app en Microsoft-platform

- Offline registratie en gecontroleerde synchronisatie bij herverbinding.
- Barcode/QR-scanning voor werf, materiaal, bestelling en bon.
- GPS, kaart en tijdstip van ontvangst.
- Handtekening bij ontvangst, met afzonderlijke eisen voor identiteit en bewijswaarde.
- Pushmeldingen voor toegewezen werk en acties.
- Een beheerapp voor stamgegevens, naast de operationele mobiele Canvas App.
- Werfgebonden teams en toegangsrechten; de huidige native werfleider ziet alle FieldOps-werven.
- Meerstapsgoedkeuring, vervangers en escalatie bij afwezigheid.
- Een connector naar een commercieel ERP, inclusief leveranciers, artikelen, bestellingen en terugmeldingen. De huidige native testdienst ontvangt leveringen en retourneert een ontvangst-ID.

Dit is een uitbreidingslijst, geen claim dat deze modules al gebouwd zijn of een opdracht om ze allemaal aan de huidige scope toe te voegen. Eerst de bestaande leveringsketen aantoonbaar afronden; daarna bieden inkooporders en factuurcontrole de meest samenhangende uitbreiding.
