from pathlib import Path
import shutil,json
base=Path('/private/tmp/fieldops-legacy');dest=Path('power-platform/canvas-legacy')
if not dest.exists():shutil.copytree(base,dest)
m=json.loads((dest/'CanvasManifest.json').read_text());m['Properties'].update({'Name':'FieldOps360.msapp','DocumentLayoutWidth':390,'DocumentLayoutHeight':844,'DocumentLayoutOrientation':'portrait','DocumentAppType':'Phone','AppDescription':'FieldOps 360 mobiele collectie-demo; Dataverse deployment afzonderlijk.','Id':'c065cbca-3828-4ab1-b811-77b68625ee36'});m['PublishInfo']['AppName']='FieldOps 360';m['ScreenOrder']=['Home','Register','Review'];(dest/'CanvasManifest.json').write_text(json.dumps(m,indent=2))
# Remove only the copied Microsoft fixture screen; all original source remains in /private/tmp.
for p in (dest/'Src').glob('*.fx.yaml'):p.unlink()
(dest/'Src/App.fx.yaml').write_text('''App As appinfo:
    OnStart: =ClearCollect(colDeliveries, {Reference:"BON-001", Supplier:"Demo Beton", Quantity:18, Expected:24, Note:"6 ton ontbreekt", Status:"Ter controle", Confirmed:false}); Set(varRole,"Chauffeur")
''')
(dest/'Src/Home.fx.yaml').write_text('''Home As screen:
    Fill: =RGBA(255,255,255,1)

    TitleHome As label:
        Text: ="FieldOps 360"
        X: =20
        Y: =24
        Width: =350
        Height: =55
        Size: =25
        FontWeight: =FontWeight.Semibold
        Color: =RGBA(20,43,50,1)

    SubHome As label:
        Text: ="Mobiele collectie-demo · fictieve gegevens"
        X: =20
        Y: =80
        Width: =350
        Size: =11

    SearchBon As text:
        Default: =""
        HintText: ="Zoek bonnummer of leverancier"
        X: =20
        Y: =140
        Width: =350
        Height: =44

    NewDelivery As button:
        Text: ="Nieuwe levering"
        OnSelect: =Navigate(Register)
        X: =20
        Y: =205
        Width: =350
        Height: =48
        Fill: =RGBA(8,127,112,1)

    DeliveriesGallery As gallery.galleryVertical:
        Items: =Filter(colDeliveries, IsBlank(SearchBon.Text) || StartsWith(Reference,SearchBon.Text) || StartsWith(Supplier,SearchBon.Text))
        X: =20
        Y: =280
        Width: =350
        Height: =450
        TemplateSize: =100

        BonTitle As label:
            Text: =ThisItem.Reference & " · " & ThisItem.Supplier
            X: =0
            Y: =5
            Width: =330
            Height: =40
            Size: =14
            OnSelect: =Set(varDelivery,ThisItem); Navigate(Review)

        BonState As label:
            Text: =ThisItem.Status & " · " & Text(ThisItem.Quantity) & " ton"
            X: =0
            Y: =45
            Width: =330
            Size: =12
            OnSelect: =Set(varDelivery,ThisItem); Navigate(Review)
''')
(dest/'Src/Register.fx.yaml').write_text('''Register As screen:
    HeaderRegister As label:
        Text: ="Nieuwe levering"
        X: =20
        Y: =25
        Width: =350
        Size: =24

    RefInput As text:
        Default: =""
        HintText: ="Bonnummer"
        X: =20
        Y: =100
        Width: =350
        Height: =46

    SupplierInput As text:
        Default: =""
        HintText: ="Leverancier"
        X: =20
        Y: =160
        Width: =350
        Height: =46

    QuantityInput As text:
        Default: =""
        HintText: ="Geleverde hoeveelheid in ton"
        Format: =TextFormat.Number
        X: =20
        Y: =220
        Width: =350
        Height: =46

    ExpectedInput As text:
        Default: ="24"
        HintText: ="Bestelde hoeveelheid"
        Format: =TextFormat.Number
        X: =20
        Y: =280
        Width: =350
        Height: =46

    NoteInput As text:
        Default: =""
        HintText: ="Toelichting bij afwijking > 5%"
        Mode: =TextMode.MultiLine
        X: =20
        Y: =340
        Width: =350
        Height: =90

    PhotoHelp As label:
        Text: ="Bonfoto en OCR: beschikbaar in de webdemo. Native mediabinding volgt na Studio-validatie."
        X: =20
        Y: =450
        Width: =350
        Height: =120
        Size: =12

    SaveDelivery As button:
        Text: ="Registreren"
        X: =20
        Y: =635
        Width: =350
        Height: =48
        Fill: =RGBA(8,127,112,1)
        OnSelect: =If(IsBlank(Trim(RefInput.Text)) || IsBlank(Trim(SupplierInput.Text)) || !IsNumeric(QuantityInput.Text) || !IsNumeric(ExpectedInput.Text) || Value(QuantityInput.Text)<=0 || Value(ExpectedInput.Text)<=0, Notify("Vul bon, leverancier en positieve hoeveelheden in",NotificationType.Error), !IsBlank(LookUp(colDeliveries,Reference=Upper(Trim(RefInput.Text)))), Notify("Bonnummer bestaat al",NotificationType.Error), Abs(Value(QuantityInput.Text)-Value(ExpectedInput.Text))/Value(ExpectedInput.Text)>0.05 && IsBlank(Trim(NoteInput.Text)), Notify("Motiveer de afwijking",NotificationType.Error), Collect(colDeliveries,{Reference:Upper(Trim(RefInput.Text)),Supplier:Trim(SupplierInput.Text),Quantity:Value(QuantityInput.Text),Expected:Value(ExpectedInput.Text),Note:NoteInput.Text,Status:"Ter controle",Confirmed:false,Photo:varPhoto}); Notify("Levering geregistreerd",NotificationType.Success); Reset(RefInput); Reset(SupplierInput); Reset(QuantityInput); Reset(NoteInput); Set(varPhoto,Blank()); Navigate(Home))

    CancelRegister As button:
        Text: ="Terug"
        X: =20
        Y: =700
        Width: =350
        OnSelect: =Navigate(Home)
''')
(dest/'Src/Review.fx.yaml').write_text('''Review As screen:
    HeaderReview As label:
        Text: =varDelivery.Reference
        X: =20
        Y: =25
        Width: =350
        Size: =24

    DetailsReview As label:
        Text: =varDelivery.Supplier & Char(10) & Text(varDelivery.Quantity) & " ton geleverd / " & Text(varDelivery.Expected) & " besteld" & Char(10) & varDelivery.Note & Char(10) & varDelivery.Status
        X: =20
        Y: =100
        Width: =350
        Height: =200
        Size: =16

    PhotoReview As image:
        Image: =varDelivery.Photo
        X: =20
        Y: =320
        Width: =350
        Height: =200

    ReviewNotice As label:
        Text: ="Goedkeuring gebeurt door een onafhankelijke werfleider in de backend. Deze Canvas-collectie-demo verleent geen rechten en synchroniseert niet met Dataverse."
        X: =20
        Y: =540
        Width: =350
        Height: =120
        Size: =12

    BackReview As button:
        Text: ="Terug naar leveringen"
        X: =20
        Y: =700
        Width: =350
        OnSelect: =Navigate(Home)
''')
print('Canvas mobile source generated')
