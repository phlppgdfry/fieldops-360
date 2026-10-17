import {client} from './dataverse.mjs';const c=client();
for(const [name,location]of [['Kanaalzone Brugge','Brugge'],['N34 Herinrichting','Oostende'],['Logistiek park','Roeselare']]){const e=await c(`fo_sites?$filter=fo_name eq '${name}'&$select=fo_siteid`);if(!e.value.length)await c('fo_sites','POST',{fo_name:name,fo_location:location});console.log('Fictieve demo-werf klaar:',name)}
