# Werken aan FieldOps 360
Gebruik Node.js 24. Maak een featurebranch, houd wijzigingen klein en voer `npm test`, `npm run build` en `npm run check:artifacts` uit. Bij een gebruikersroutewijziging ook `npm run test:ui` met een draaiende demo op poort 3600. Gebruik alleen fictieve fixtures. Geen databases, secrets, echte bonnen of tenanttokens committen. Werk de opleverstatus bij met daadwerkelijk testbewijs; markeer ontbrekende verificatie expliciet.

Cloudmutaties uitsluitend in de aangewezen ontwikkelomgeving. Wijzig geen organisatiebrede rollen of bestaande oplossingen. Leg connectorbindings en checker-uitkomsten afzonderlijk vast. Een lokale groene test is geen cloudgoedkeuring.
