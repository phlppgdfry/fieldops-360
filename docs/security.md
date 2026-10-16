# Rechten, privacy en productiegrens

| Rol | Lezen | Aanmaken | Goedkeuren | Beheer |
|---|---|---|---|---|
| Chauffeur | Eigen leveringen | Eigen werf | Nooit | Geen |
| Werfleider | Toegewezen werf | Eigen werf | Werf, nooit eigen indiening | Geen |
| Integratie-identiteit | Goedgekeurde payloads | Taken/ontvangsten | Nooit | Retry service |
| Beheerder | Alle demodossiers | Alle demo-werven | Onafhankelijk van indiener | Storing en herstel |

Lokale demosessies zijn bewust selecteerbaar en vormen geen productieauthenticatie. Server bindt standaard op loopback. Niet publiek hosten met deze sessiekeuze. Cookie: HttpOnly, SameSite=Strict, 8 uur geldigheid. Cross-origin mutaties geweigerd. API controleert eigenaar/werf; bestanden worden via een geautoriseerde route gelezen, niet als openbare statische directory.

Dataverse: user/team-owned tabellen; chauffeurs user-depth read/create/write, team per werf voor werfleiders; geen organization-depth lezen voor chauffeurs. Standaardrollen nooit blind overschrijven. Gebruik Entra-groepen voor onboarding en deprovisioning. Een veld `fo_role` of verborgen knop geeft op zichzelf geen toegangsrecht. Gebruik een server-side custom API/plug-in voor toegestane statustransities, onafhankelijke approver en hoeveelheden; maak status, ERP-ID en auditvelden alleen schrijfbaar door de service. Zet Dataverse auditing op omgevings-, tabel- en kolomniveau aan. De huidige tenant mist tabelcreatierechten; deze rolconfiguratie is nog niet toegepast.

Foto's: vermijd personen, nummerplaten en andere niet-noodzakelijke gegevens. Bewaar uitsluitend bon/evidentie. Voorstel retentie: bonnen volgen formeel vastgestelde zakelijke bewaarplicht; ruwe OCR-output 90 dagen tenzij benodigd bij een geschil; audit 1 jaar als pilotvoorstel. Dit zijn ontwerpkeuzes, geen juridisch vastgestelde termijnen. Privacyverantwoordelijke en administratie stellen definitieve termijnen vast. Verwijder verzoeken verlopen via beheer; verwijder audit niet via de app. Ongebruikte uploads na mislukte OCR opruimen vóór productie.

Secretbeheer: `.env` en lokale databases zijn gitignored. Azure-key alleen server-side. ERP-testservice heeft een willekeurige procesgebonden sleutel. Cloud productie: dedicated integratie-identiteit, minimaal benodigde rechten, connector-DLP, Azure Key Vault waar passend, private networking waar vereist en TLS. Stuur fouten naar intern beheer zonder tokens of volledige documenten te loggen.
