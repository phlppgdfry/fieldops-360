import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {writeFile} from 'node:fs/promises';
const run=promisify(execFile);
const {stdout,stderr}=await run('pac',['solution','check','--environment',process.env.DATAVERSE_URL,'--path','power-platform/releases/FieldOps360_unmanaged_template.zip','--outputDirectory','.data/checker-final','--geo','Europe'],{maxBuffer:10*1024*1024});
// Checker stdout contains a short-lived signed download URL. Keep it private.
await writeFile('.data/checker-final.log',stdout+'\n'+stderr,{mode:0o600});
console.log(stdout.split('\n').filter(line=>/Status:|Critical|\b[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\b/.test(line)).join('\n'));
