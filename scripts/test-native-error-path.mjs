import {client} from './dataverse.mjs';import {withRuntimeClient} from './runtime-session.mjs';import {writeFile} from 'node:fs/promises';
const human=client(),report={environment:process.env.POWER_PLATFORM_ENVIRONMENT_ID,checkedAt:new Date().toISOString(),checks:[],scope:'Controlled service setup tests ERP retries, dead letter, audit error alert and recovery; it is not human approval UAT.'};
function check(name,ok){report.checks.push({name,ok});console.log((ok?'PASS ':'FAIL ')+name);if(!ok)throw Error(name)}
const reference='NATIVE-FAIL-'+Date.now();const d=await human('fo_deliveries','POST',{fo_name:reference,fo_reference:reference,fo_supplier:'Native failure-path QA',fo_quantity:24,fo_expected:24,fo_unit:'ton',fo_confirmed:true,fo_status:'draft'},{Prefer:'return=representation'});report.deliveryId=d.fo_deliveryid;
await human(`fo_deliveries(${d.fo_deliveryid})`,'PATCH',{fo_status:'pending'});
try{await withRuntimeClient(async call=>{
 await call(`fo_deliveries(${d.fo_deliveryid})`,'PATCH',{fo_status:'approved'});
 const job=await call('fo_integrationjobs','POST',{fo_name:reference,fo_state:'queued',fo_error:'SIMULATE_503',fo_idempotencykey:d.fo_deliveryid,'fo_deliveryid@odata.bind':`/fo_deliveries(${d.fo_deliveryid})`});report.jobId=job.fo_integrationjobid;
 let state;for(let i=0;i<48;i++){state=await human(`fo_integrationjobs(${job.fo_integrationjobid})?$select=fo_state`);if(state.fo_state==='dead_notified')break;await new Promise(resolve=>setTimeout(resolve,2500))}
 check('Real HTTP outage is retried and becomes a notified dead letter',state.fo_state==='dead_notified');
 const alerts=await human(`fo_auditevents?$filter=_fo_deliveryid_value eq ${d.fo_deliveryid} and fo_event eq 'integration_error'&$select=fo_name`);check('Separate native error flow persists an internal alert',alerts.value.length===1);
 const failed=await human(`fo_deliveries(${d.fo_deliveryid})?$select=fo_status,fo_erp_id`);check('Failed ERP transfer never marks delivery as synchronized',failed.fo_status==='approved'&&!failed.fo_erp_id);
 await call(`fo_integrationjobs(${job.fo_integrationjobid})`,'PATCH',{fo_state:'queued',fo_error:''});
 for(let i=0;i<30;i++){state=await human(`fo_integrationjobs(${job.fo_integrationjobid})?$select=fo_state`);if(state.fo_state==='done')break;await new Promise(resolve=>setTimeout(resolve,2000))}
 check('Restart of the same integration job recovers successfully',state.fo_state==='done');
 const final=await human(`fo_deliveries(${d.fo_deliveryid})?$select=fo_status,fo_erp_id`);check('Recovery saves one deterministic ERP receipt',final.fo_status==='synced'&&final.fo_erp_id==='ERP-NATIVE-'+d.fo_deliveryid);
})}finally{await writeFile('docs/evidence/native-error-path-tests.json',JSON.stringify(report,null,2))}
