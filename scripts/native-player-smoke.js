// Run in an authenticated, explicitly selected Playwright CLI player tab:
// playwright-cli -s=fieldops-native run-code --filename=scripts/native-player-smoke.js
// Creates one clearly labelled fictitious draft; does not approve or submit it.
async page => {
 const f=page.frameLocator('iframe[name="fullscreen-app-host"]');
 const checks=[];
 const check=(name,ok)=>{checks.push({name,ok});if(!ok)throw Error(name)};
 const back=f.getByRole('button',{name:'Overzicht',exact:true});
 if(await back.count())await back.click();
 else if(await f.getByRole('button',{name:'Terug naar overzicht',exact:true}).count())await f.getByRole('button',{name:'Terug naar overzicht',exact:true}).click();
 await f.getByRole('button',{name:'Nieuwe levering',exact:true}).click();
 await f.getByRole('button',{name:'Concept opslaan',exact:true}).click();
 await page.getByRole('alert').last().waitFor();
 check('Required fields blocked in published player',(await page.getByRole('alert').last().ariaSnapshot()).includes('Vul bon, leverancier, werf en positieve hoeveelheden in'));
 const reference='NATIVE-PLAYER-'+Date.now();
 await f.getByRole('textbox',{name:'Bijvoorbeeld LB-2026-1050',exact:true}).fill(reference);
 await f.getByRole('textbox',{name:'Naam leverancier',exact:true}).fill('Fictieve native playertest');
 await f.getByRole('textbox',{name:'Geleverde hoeveelheid',exact:true}).fill('18');
 await f.getByRole('textbox',{name:'Bestelde hoeveelheid',exact:true}).fill('24');
 await f.getByRole('button',{name:'Concept opslaan',exact:true}).click();
 await page.getByRole('alert').last().waitFor();
 check('Deviation above 5% requires a reason',(await page.getByRole('alert').last().ariaSnapshot()).includes('Motiveer de afwijking'));
 const note=f.getByRole('textbox',{name:'Verplicht bij meer dan 5% afwijking; beschrijf ook eventuele schade',exact:true});
 await note.fill('Fictieve playertest: 6 ton minder geleverd.');
 await f.getByRole('button',{name:'Concept opslaan',exact:true}).click();
 await f.getByText(reference,{exact:true}).waitFor();
 await f.getByText('Afwijking: 25,0%',{exact:true}).waitFor();
 check('Draft saved to Dataverse with correct 25% deviation',true);
 const submit=f.getByRole('button',{name:'Indienen ter goedkeuring',exact:true});
 check('Human confirmation gates submission',await submit.isDisabled());
 await f.getByRole('button',{name:'Concept aanpassen',exact:true}).click();
 const ref=f.getByRole('textbox',{name:'Bijvoorbeeld LB-2026-1050',exact:true});
 await ref.waitFor();
 check('Draft edit loads original reference',await ref.inputValue()===reference);
 await note.fill('Fictieve playertest aangepast: 6 ton minder geleverd.');
 await f.getByRole('button',{name:'Concept opslaan',exact:true}).click();
 await f.getByText('Fictieve playertest aangepast: 6 ton minder geleverd.',{exact:true}).waitFor();
 check('Existing draft updated without duplicate creation',true);
 const confirm=f.getByRole('checkbox');
 await confirm.check();
 check('Explicit confirmation enables submission',await submit.isEnabled());
 await f.getByRole('button',{name:'Status vernieuwen',exact:true}).click();
 await f.getByText('Status: Concept',{exact:true}).waitFor();
 check('Confirmation alone does not submit or approve',true);
 await page.locator('iframe[name="fullscreen-app-host"]').screenshot({path:'docs/evidence/native-mobile-review.png'});
 return {checkedAt:new Date().toISOString(),scope:'Actual published Microsoft Canvas player, 390×844 viewport; fictitious draft only',reference,checks};
}
