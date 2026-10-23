// A real, read-only tour of existing fictitious records in the published player.
// Short holds are for video readability, not for synchronizing the application.
async page => {
 const f=page.frameLocator('iframe[name="fullscreen-app-host"]');
 const started=Date.now(),scenes=[];
 const mark=title=>scenes.push({seconds:(Date.now()-started)/1000,title});
 const hold=()=>page.waitForTimeout(1800);
 const back=f.getByRole('button',{name:'Overzicht',exact:true});
 if(await back.count())await back.click();
 const search=f.getByRole('textbox',{name:'Zoek bonnummer of leverancier',exact:true});
 await search.fill('');
 mark('Echte Power Apps-player met Dataverse-leveringen.');await hold();
 await search.fill('NATIVE-UI-1792690301861');
 await f.getByRole('listitem').filter({hasText:'NATIVE-UI-1792690301861'}).getByRole('button',{name:'Open levering',exact:true}).click();
 await f.getByText('Afwijking: 25,0%',{exact:true}).waitFor();
 await f.getByText('Controle levering',{exact:true}).scrollIntoViewIfNeeded();
 mark('18 van 24 ton geleverd: 25% afwijking.');await hold();
 await f.getByRole('button',{name:'Bonfoto / tekstherkenning bekijken',exact:true}).click();
 await f.getByRole('button',{name:'Bon aan levering bewaren',exact:true}).waitFor();
 const raw=await f.getByRole('textbox',{name:'Nog geen herkende tekst',exact:true}).inputValue();
 if(!raw.includes('Hoeveelheid: 18'))throw Error('Saved real OCR result missing');
 await f.getByText('Herkenningsresultaat — controle vereist',{exact:true}).scrollIntoViewIfNeeded();
 mark('Opgeslagen Microsoft-OCR: velden vergelijken, afwijking laten controleren.');await hold();await hold();
 await f.getByRole('button',{name:'Terug naar controle',exact:true}).click();
 await f.getByRole('checkbox').check();
 if(!await f.getByRole('button',{name:'Indienen ter goedkeuring',exact:true}).isEnabled())throw Error('Human confirmation did not enable submission');
 mark('Menselijke bevestiging is verplicht. Deze tour dient niets in.');await hold();
 await f.getByRole('button',{name:'Overzicht',exact:true}).click();
 await search.fill('NATIVE-UAT-20261017014909');
 await f.getByRole('listitem').filter({hasText:'NATIVE-UAT-20261017014909'}).getByRole('button',{name:'Open levering',exact:true}).click();
 await f.getByText('Status: Gesynchroniseerd',{exact:true}).waitFor();
 await f.getByText('Controle levering',{exact:true}).scrollIntoViewIfNeeded();
 mark('Eerder door de gebruiker goedgekeurde UAT: ERP-testontvangst bewaard.');await hold();await hold();
 return {scope:'Real published player; existing fictional records; no approval or submission performed by the tour',duration:(Date.now()-started)/1000,scenes};
}
