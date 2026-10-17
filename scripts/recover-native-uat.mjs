import {client} from './dataverse.mjs';import {withRuntimeClient} from './runtime-session.mjs';import {readFile,writeFile} from 'node:fs/promises';
const c=client(),u=JSON.parse(await readFile('docs/evidence/native-approval-uat.json','utf8'));
const jobs=(await c(`fo_integrationjobs?$filter=_fo_deliveryid_value eq ${u.deliveryId}&$select=fo_state`)).value;
if(jobs.length!==1)throw Error('UAT must have exactly one integration job');
if(jobs[0].fo_state!=='done')await withRuntimeClient(call=>call(`fo_integrationjobs(${jobs[0].fo_integrationjobid})`,'PATCH',{fo_error:'',fo_state:'queued'}));
let d;for(let i=0;i<30;i++){d=await c(`fo_deliveries(${u.deliveryId})?$select=fo_status,fo_erp_id`);if(d.fo_status==='synced')break;await new Promise(r=>setTimeout(r,2000))}
u.lastCheckedAt=new Date().toISOString();u.deliveryStatus=d.fo_status;u.erpReceipt=d.fo_erp_id;u.humanReportedApproval=true;u.initialTransferRequiredRecovery=true;
await writeFile('docs/evidence/native-approval-uat.json',JSON.stringify(u,null,2));
console.log(JSON.stringify({reference:u.reference,status:d.fo_status,receipt:d.fo_erp_id,oneIntegrationJob:true}));if(d.fo_status!=='synced')throw Error('UAT synchronization has not completed');
