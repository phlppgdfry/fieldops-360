using System;
using System.Linq;
using Microsoft.Xrm.Sdk;
namespace FieldOps360.Validation
{
 public sealed class DeliveryGuard : IPlugin
 {
  private readonly Guid runtime;
  public DeliveryGuard(string configuration) { if(!Guid.TryParse(configuration,out runtime)) throw new InvalidPluginExecutionException("FieldOps runtime is niet geconfigureerd."); }
  public void Execute(IServiceProvider services)
  {
   var context=(IPluginExecutionContext)services.GetService(typeof(IPluginExecutionContext));
   if(!context.InputParameters.Contains("Target") || !(context.InputParameters["Target"] is Entity change) || change.LogicalName!="fo_delivery")return;
   Entity before=context.PreEntityImages.Contains("Before")?context.PreEntityImages["Before"]:new Entity("fo_delivery");
   object Get(string key) => change.Contains(key)?change[key]:(before.Contains(key)?before[key]:null);
   string Text(string key)=>Convert.ToString(Get(key))??"";
   decimal Number(string key)=>Get(key) is decimal d?d:0m;
   bool service=context.InitiatingUserId==runtime;
   string previous=before.GetAttributeValue<string>("fo_status")??"draft", next=Text("fo_status");
   if(string.IsNullOrWhiteSpace(next)) {next="draft";change["fo_status"]=next;}
   if(!new[]{"draft","pending","approved","rejected","synced"}.Contains(next))Fail("Ongeldige processtatus.");
   if(string.IsNullOrWhiteSpace(Text("fo_reference"))||string.IsNullOrWhiteSpace(Text("fo_supplier")))Fail("Bonnummer en leverancier zijn verplicht.");
   decimal quantity=Number("fo_quantity"),expected=Number("fo_expected");
   if(quantity<=0||expected<=0)Fail("Hoeveelheden moeten positief zijn.");
   if(Math.Abs(quantity-expected)/expected>0.05m&&string.IsNullOrWhiteSpace(Text("fo_note")))Fail("Motiveer de afwijking boven 5%.");
   if(!new[]{"ton","m³","m3","kg","stuks"}.Contains(Text("fo_unit")))Fail("Kies een geldige eenheid.");
   if(context.MessageName=="Create"&&next!="draft")Fail("Een nieuwe levering begint als concept.");
   if(next=="pending"&&!(Get("fo_confirmed") is bool confirmed&&confirmed))Fail("Bevestig de gegevens voordat je indient.");
   if(change.Contains("fo_erp_id")&&!service)Fail("Alleen de integratie mag een ERP-ontvangst bewaren.");
   if((previous=="approved"||previous=="synced")&&change.Attributes.Keys.Any(k=>new[]{"fo_quantity","fo_expected","fo_supplier","fo_reference","fo_unit","fo_siteid","fo_confirmed"}.Contains(k)))Fail("Een goedgekeurde levering is niet meer wijzigbaar.");
   if(context.MessageName=="Update"&&next!=previous){
    bool allowed=(previous=="draft"&&next=="pending")||(previous=="rejected"&&(next=="draft"||next=="pending"))||(previous=="pending"&&(next=="approved"||next=="rejected"))||(previous=="approved"&&next=="synced");
    if(!allowed)Fail("Deze statusovergang is niet toegestaan.");
    if(new[]{"approved","rejected","synced"}.Contains(next)&&!service)Fail("Een beslissing wordt uitsluitend door de gecontroleerde flow verwerkt.");
    if(next=="synced"&&string.IsNullOrWhiteSpace(Text("fo_erp_id")))Fail("ERP-ontvangst ontbreekt.");
   }
   if(change.Contains("fo_reference"))change["fo_reference"]=Text("fo_reference").Trim().ToUpperInvariant();
  }
  private static void Fail(string message){throw new InvalidPluginExecutionException("FieldOps: "+message);}
 }
}
