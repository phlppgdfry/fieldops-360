import {client} from './dataverse.mjs';import {nativeState} from './native-state.mjs';import {serviceToken,serviceRequest} from './power-services.mjs';import {readFile,writeFile} from 'node:fs/promises';
const call=client(),org=process.env.DATAVERSE_URL.replace(/\/$/,''),env=process.env.POWER_PLATFORM_ENVIRONMENT_ID;
const runtime=JSON.parse(await readFile(await nativeState('native-runtime'),'utf8')),flows=JSON.parse(await readFile(await nativeState('native-flows'),'utf8'));
const report={environment:env,checkedAt:new Date().toISOString(),checks:[],scope:'Server validation and real cloud ERP integration; this does not prove human Microsoft Approvals or Studio validation.'};
function result(name,ok,details){report.checks.push({name,ok,...(details?{details}: {})});console.log((ok?'PASS ':'FAIL ')+name);if(!ok)throw Error('Native check failed: '+name)}
const callback=await serviceRequest(`https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${env}/flows/${flows.fo_erptestapi.id}/triggers/manual/listCallbackUrl?api-version=2016-11-01`,'https://service.flow.microsoft.com/','POST',{});const endpoint=callback.value||callback.response?.value;
const payload={deliveryId:crypto.randomUUID(),reference:'QA-ERP',quantity:18,unit:'ton'};
let r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),receipt=await r.json();result('Native ERP test API returns a real response',r.status===200&&receipt.id==='ERP-NATIVE-'+payload.deliveryId);
r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,quantity:0})});result('Native ERP API rejects invalid quantity',r.status===422);
r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,simulateFailure:true})});result('Native ERP API can produce a real test outage',r.status===503);
const reference='NATIVE-QA-'+Date.now();const data={fo_name:reference,fo_reference:reference,fo_supplier:'FieldOps native QA',fo_quantity:18,fo_expected:24,fo_unit:'ton',fo_note:'6 ton ontbreekt; gecontroleerd testscenario.',fo_status:'draft'};
const d=await call('fo_deliveries','POST',data,{Prefer:'return=representation'});report.deliveryId=d.fo_deliveryid;
async function blocked(name,patch){try{await call(`fo_deliveries(${d.fo_deliveryid})`,'PATCH',patch);result(name,false)}catch(e){if(e.message.startsWith('Native check'))throw e;result(name,e.message.includes('FieldOps:'))}}
await blocked('Server rejects missing deviation reason',{fo_note:''});
await blocked('Server rejects unconfirmed submission',{fo_status:'pending'});
await call(`fo_deliveries(${d.fo_deliveryid})`,'PATCH',{fo_confirmed:true,fo_status:'pending'});
await blocked('Human cannot bypass the approval flow',{fo_status:'approved'});
const graphToken=serviceToken('https://graph.microsoft.com/');async function graph(path,body){const rr=await fetch('https://graph.microsoft.com/v1.0/'+path,{method:'POST',headers:{Authorization:`Bearer ${graphToken}`,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!rr.ok)throw Error('QA credential operation failed: '+rr.status);return rr.status===204?{}:rr.json()}
let credential;
try{
 credential=await graph(`applications/${runtime.appObjectId}/addPassword`,{passwordCredential:{displayName:'FieldOps transient QA only',endDateTime:new Date(Date.now()+30*60000).toISOString()}});
 let token;for(let i=0;i<12;i++){const rr=await fetch(`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,{method:'POST',body:new URLSearchParams({grant_type:'client_credentials',client_id:runtime.appId,client_secret:credential.secretText,scope:org+'/.default'})});if(rr.ok){token=(await rr.json()).access_token;break}await new Promise(res=>setTimeout(res,2000))}if(!token)throw Error('Temporary runtime token unavailable');
 async function runtimeCall(path,method,body){const rr=await fetch(org+'/api/data/v9.2/'+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)});if(!rr.ok)throw Error('Runtime Dataverse '+rr.status+': '+(await rr.text()).slice(0,500));return rr.status===204?{}:rr.json()}
 // Deliberate service-only setup isolates ERP tests from the pending human approval test.
 await runtimeCall(`fo_deliveries(${d.fo_deliveryid})`,'PATCH',{fo_status:'approved'});
 const job=await runtimeCall('fo_integrationjobs','POST',{fo_name:reference,fo_state:'queued',fo_idempotencykey:d.fo_deliveryid,'fo_deliveryid@odata.bind':`/fo_deliveries(${d.fo_deliveryid})`});
 let final;for(let i=0;i<24;i++){final=await call(`fo_integrationjobs(${job.fo_integrationjobid})?$select=fo_state,fo_error`);if(['done','dead','dead_notified'].includes(final.fo_state))break;await new Promise(res=>setTimeout(res,2500))}
 result('Dataverse-triggered ERP synchronization reaches done',final.fo_state==='done',final.fo_state);
 const synced=await call(`fo_deliveries(${d.fo_deliveryid})?$select=fo_status,fo_erp_id`);result('ERP receipt persisted in Dataverse',synced.fo_status==='synced'&&!!synced.fo_erp_id);
 await blocked('Approved delivery quantity is immutable',{fo_quantity:17});
}finally{if(credential?.keyId)await graph(`applications/${runtime.appObjectId}/removePassword`,{keyId:credential.keyId});await writeFile('docs/evidence/native-runtime-tests.json',JSON.stringify(report,null,2))}
console.log('Native ERP and server checks completed. Human approval remains a separate test.');
