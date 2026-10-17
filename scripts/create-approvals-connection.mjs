import {serviceRequest} from './power-services.mjs';import {nativeState} from './native-state.mjs';import {readFile,writeFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';
const env=process.env.POWER_PLATFORM_ENVIRONMENT_ID,file=await nativeState('approvals-connection');
let record;try{record=JSON.parse(await readFile(file,'utf8'))}catch{record={name:'shared-approvals-'+randomUUID()};await writeFile(file,JSON.stringify(record),{mode:0o600})}
const url=`https://api.powerapps.com/providers/Microsoft.PowerApps/apis/shared_approvals/connections/${record.name}?api-version=2016-11-01&$filter=environment%20eq%20'${env}'`;
const r=await serviceRequest(url,'https://service.powerapps.com/','PUT',{properties:{displayName:'FieldOps 360 Goedkeuringen',apiId:'/providers/Microsoft.PowerApps/apis/shared_approvals',environment:{id:'/providers/Microsoft.PowerApps/environments/'+env,name:env},connectionParameters:{}}});
console.log(JSON.stringify({name:r.name,statuses:r.properties?.statuses,requiresUserSignIn:!r.properties?.statuses?.some(s=>s.status==='Connected'),propertyNames:Object.keys(r.properties||{})},null,2));
