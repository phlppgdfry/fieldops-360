# Power Platform — bronnen en verificatiestatus

De lokale webdemo en de native Microsoft-oplossing zijn twee verschillende runtimes. Zie ../docs/delivery-status.md voor de daadwerkelijke opleverstatus. JSON-bestanden in flows/ zijn **bronontwerpen**, geen claim van geëxporteerde of succesvol draaiende cloud flows.

## Dataverse
`dataverse/schema.json`: zes tabellen; `../scripts/provision-dataverse.mjs`: publisher + FieldOps360 solution + metadata + zes relaties. Owner-team ontwerp in ../docs/security.md. Er is geen automatische privilege-escalatie. Bij 403 `prvCreateEntity`: laat platformbeheer de juiste ontwikkelrol toekennen; herhaal daarna hetzelfde bootstrapcommando. Een makerrol zonder Dataverse-customizationrechten is mogelijk onvoldoende.

## Canvas
`canvas-legacy/`: leesbare Power Fx-schermbronnen voor een mobiele collectievariant (Home, Register, Review), bonzoekfunctie, invoer en validatie. De collectie is alleen geheugen en geen Dataverse. Bonfoto/OCR werkt in de webdemo; de native mediabinding is nog open. Verpakking via `pac canvas pack --sources power-platform/canvas-legacy --msapp power-platform/FieldOps360.msapp`; deze legacy pack/unpack-route is door Microsoft deprecated. Controleer huidige toolondersteuning en open het resultaat altijd eerst in Studio. Een .msapp is geen solution-export.

Voor de native versie: voeg Werf/Levering/Document-tabellen toe in Studio; map weergavenamen uit de werkelijk gedeployde metadata. Voorbeeld datatoegang (afstemmen op Engelse of Nederlandse schemanaam in de tenant):

```powerfx
// Gallery.Items, delegatievriendelijk zoeken op bonreferentie:
Filter(fo_deliveries, StartsWith(fo_reference, SearchBon.Text))
// Alleen een draft schrijven; goedkeuring en statusovergang via serveractie:
Patch(fo_deliveries, Defaults(fo_deliveries), {
  fo_name: Upper(Trim(RefInput.Text)),
  fo_reference: Upper(Trim(RefInput.Text)),
  fo_supplier: Trim(SupplierInput.Text),
  fo_quantity: Value(QuantityInput.Text),
  fo_expected: Value(ExpectedInput.Text),
  fo_unit: "ton", fo_status: "draft", fo_note: NoteInput.Text
})
```

Dit is een bindingsvoorbeeld, geen bewijs van een tenantverbinding. Datasource-displaynamen kunnen verschillen. Een verborgen goedkeurknop of clientfilter is nooit voldoende beveiliging. Gebruik de echte Dataverse-form-control/EditForm met required cards na binding en voer SubmitForm alleen uit voor draftvelden; statussen via gecontroleerde serveractie. Registreer App Checker, toestelproef, datasourcebinding en row-ID's als native bewijs.

## Drie flowbronnen
1. fo_ValidateAndApprove: Dataverse status pending → validatie → onafhankelijke Microsoft Approval → status + integratietaak.
2. fo_SynchronizeERP: queued taak → levering ophalen → HTTP POST met idempotency key en exponential retry → receipt; catch → dead-letter.
3. fo_ErrorMonitor: iedere 15 minuten dead jobs → interne auditmelding → dead_notified om herhaalmeldingen te beperken.

Voor activering: huidige connectorparameters door designer laten valideren; approver op basis van werf resolveren en indiener uitsluiten; rejection reason controleren; timeout-vangpad testen; row key en taaklease toevoegen; schrijfbevoegdheid afschermen; ERP-secret als secure input; responsschema en receipt verplicht valideren; fouten na deelupdate reconciliëren. `fo_ErpEndpoint` is geen openbaar lokaal adres: een Microsoft cloud flow bereikt 127.0.0.1 niet. Gebruik een geautoriseerde HTTPS-testservice of goedgekeurde gateway.

De lokale backend implementeert de drie bedrijfsworkflows wel uitvoerbaar en getest. Native flows blijven inactief tot security, verbindingen en tenant-UAT zijn afgerond.

## Microsoft-bronnen (geraadpleegd via Context7)
- [Canvas CLI en deprecation](https://learn.microsoft.com/power-platform/developer/cli/reference/canvas)
- [Solutions exporteren](https://learn.microsoft.com/power-platform/alm/export-solutions)
- [Power Platform Git-integratie](https://learn.microsoft.com/power-platform/alm/git-integration/overview)
- [Microsoft PowerApps-Tooling](https://github.com/microsoft/PowerApps-Tooling) — MIT, basisfixture voor offline Canvas-verpakking; eigen FieldOps-schermen en businesslogica.

Een managed/unmanaged export wordt pas als volledig releaseartefact opgenomen nadat de componenten in DEV zijn geïnstalleerd en getest. Geen lege zip als complete oplossing presenteren.
