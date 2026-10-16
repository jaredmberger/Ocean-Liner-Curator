#!/usr/bin/env node
// Deliver read-only stewardship observations to CuratorOS.
// Only called from the main-branch workflow after a successful audit.
import { readFile } from 'node:fs/promises';
const endpoint='https://curator.oceanliners.net/api/stewardship-review';
const token=process.env.STEWARDSHIP_INGEST_TOKEN;
if (!token) {
  console.error('Missing STEWARDSHIP_INGEST_TOKEN GitHub Actions secret. No findings were delivered.');
  process.exit(1);
}
const file=new URL('./dist/stewardship/findings.json',import.meta.url);
const snapshot=JSON.parse(await readFile(file,'utf8'));
if (snapshot.auditHealth!=='complete' || !Array.isArray(snapshot.findings) || snapshot.errors?.length) {
  console.error('Audit is incomplete: refusing to deliver a potentially misleading snapshot.');
  process.exit(1);
}
const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),20000);
try {
  const result=await fetch(endpoint,{
    method:'POST',
    headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({action:'ingest',snapshot}),
    signal:controller.signal
  });
  const body=await result.text();
  if(!result.ok){
    console.error('Stewardship ingestion failed with HTTP '+result.status+'. '+body.slice(0,350));
    process.exitCode=1;
  }else{
    let data;try{data=JSON.parse(body)}catch{throw Error('CuratorOS returned invalid JSON');}
    if(data.ok!==true)throw Error('CuratorOS did not confirm ingestion');
    console.log('Stewardship findings delivered:',JSON.stringify({version:data.version,total:data.total,active:data.active}));
  }
} finally{clearTimeout(timeout)}
