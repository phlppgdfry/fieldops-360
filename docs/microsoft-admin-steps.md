# Dataverse-rechten laten toekennen

De bootstrap stopt met HTTP 403 voor `prvCreateEntity`. Dit is een ontbrekend Dataverse-recht; GitHub-hosting lost dat niet op. De installatie vraagt geen wijziging aan organisatiebrede adminrollen.

Een reeds bevoegde beheerder voert dit uit:

1. Open https://admin.powerplatform.microsoft.com.
2. Kies **Manage → Environments** en selecteer de afgesproken ontwikkelomgeving.
3. Controleer de omgeving-URL met de projectverantwoordelijke, zodat de rol in de juiste omgeving wordt toegevoegd.
4. Open **Settings → Users + permissions → Users**.
5. Selecteer het werkaccount waarmee de FieldOps-installatie wordt uitgevoerd.
6. Kies **Manage security roles / Manage Roles**.
7. Voeg **System Customizer** toe; behoud de bestaande **Environment Maker**-rol en andere benodigde rollen.
8. Sla op en meld dat de rol is toegekend. Vernieuw eventueel de Microsoft-aanmelding.

De combinatie is nodig omdat Environment Maker op zichzelf geen Dataverse-tabelrechten geeft. De beheerder moet de rol zelf mogen toekennen. Geef niet automatisch System Administrator als een beperktere ontwikkelrol volstaat. Dit document is een beheerverzoek; geen script wijzigt rollen of omzeilt rechten.

Verificatie na de wijziging (procesvariabelen voor het gekozen account/de omgeving instellen):

```sh
node scripts/platform-preflight.mjs
node scripts/provision-dataverse.mjs
```

De tweede opdracht is de feitelijke proef: een `fo_`-tabel kan worden gemaakt. Daarna volgen de appbinding, servervalidatie, beveiligingsrollen, connectorbindingen, cloud-flowruns en solution-export. Een geslaagde rechtencontrole bewijst deze vervolgstappen nog niet.

Bronnen: [Microsoft database security](https://learn.microsoft.com/power-platform/admin/database-security), [gebruikersrollen beheren](https://learn.microsoft.com/power-platform/admin/assign-security-roles).

## Wanneer je zelf Global Administrator bent, maar alleen ‘Kanaal wijzigen’ ziet
Microsoft kent tenantbeheerders niet automatisch Dataverse System Administrator toe. Open de **omgeving zelf** via Beheren → Omgevingen, kies **Membership / Lidmaatschap** in de opdrachtbalk en in **System Administrators** kies je **Add me / Mij toevoegen**. Dit is de officiële self-elevation-route voor Global Administrator, Power Platform Administrator of Dynamics 365 Administrator. De actie is gelogd en geeft volledige Dataverse-beheerrechten in die omgeving; bij een permanente tenantrol verdwijnt het omgevingsrecht niet vanzelf na de installatie.

`scripts/request-environment-admin.mjs` toont standaard alleen een inspectieoverzicht. De `--apply`-optie gebruikt de officiële Microsoft self-elevation-API en mag alleen worden uitgevoerd na uitdrukkelijke toestemming van de eigenaar. Geen andere gebruiker kan via deze API worden verhoogd. De overige provisioning- en preflightscripts wijzigen geen rollen.

Bron: [Microsoft self-elevation](https://learn.microsoft.com/power-platform/admin/manage-high-privileged-admin-roles#self-elevate-through-power-platform-admin-center).
