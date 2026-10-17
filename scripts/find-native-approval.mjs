import {serviceRequest} from './power-services.mjs';import {nativeState} from './native-state.mjs';import {readFile,writeFile} from 'node:fs/promises';
const env=process.env.POWER_PLATFORM_ENVIRONMENT_ID,flows=JSON.parse(await readFile(await nativeState('native-flows'),'utf8')),f=flows.fo_validateandapprove;
const root=`https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${env}/flows/${f.id}`;
const r=await serviceRequest(root+'/runs?api-version=2016-11-01&$top=5','https://service.flow.microsoft.com/');
for(const run of r.value||[]){
 const a=await serviceRequest(root+`/runs/${run.name}/actions?api-version=2016-11-01`,'https://service.flow.microsoft.com/');
 console.log(JSON.stringify({run:run.name,status:run.properties?.status,actions:a.value?.map(x=>({name:x.name,status:x.properties?.status,code:x.properties?.error?.code}))}));
}
