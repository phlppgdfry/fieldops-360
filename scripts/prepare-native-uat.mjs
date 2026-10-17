import {withRuntimeClient} from './runtime-session.mjs';import {writeFile} from 'node:fs/promises';
await withRuntimeClient(async call=>{
 const reference='NATIVE-UAT-'+new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
 const d=await call('fo_deliveries','POST',{fo_name:reference,fo_reference:reference,fo_supplier:'FieldOps UAT Beton',fo_quantity:18,fo_expected:24,fo_unit:'ton',fo_note:'UAT: 6 ton ontbreekt. Controleer de afwijking en kies bewust goedkeuren of afwijzen.',fo_confirmed:true,fo_status:'draft'});
 await call(`fo_deliveries(${d.fo_deliveryid})`,'PATCH',{fo_status:'pending'});
 const r={environment:process.env.POWER_PLATFORM_ENVIRONMENT_ID,reference,deliveryId:d.fo_deliveryid,createdAt:new Date().toISOString(),scope:'Test dossier created by the limited runtime principal; actual human approval is still required.'};
 await writeFile('docs/evidence/native-approval-uat.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
});
