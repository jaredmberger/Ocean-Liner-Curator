#!/usr/bin/env node
/**
 * Archive-wide external reference inventory with bounded rotating HTTP checks.
 * Read-only, no crawling of linked pages, no citation changes.
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const output=resolve(root,'tools/search/dist/stewardship');
const stateFile=resolve(root,'tools/search/.stewardship-state/source-history.json');
const now=new Date().toISOString();
const MAX=48;
const refs=new Map();
async function visit(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.')||['node_modules','vendor','dist','dist-pages'].includes(entry.name))continue;
  const path=resolve(dir,entry.name);
  if(entry.isDirectory())await visit(path);
  else if(entry.isFile()&&entry.name.endsWith('.html')){
   const html=await readFile(path,'utf8');
   const matches=html.matchAll(/<a\b[^>]*\bhref\s*=\s*["'](https?:\/\/[^"'#\s<>]+)["']/gi);
   for(const match of matches){
    try{
     const url=new URL(match[1].replaceAll('&amp;','&'));
     const host=url.hostname.toLowerCase();
     if(url.protocol!=='https:'||isIP(host)||host==='localhost'||host.endsWith('.local')||
       host==='oceanliners.net'||host.endsWith('.oceanliners.net')||
       ['facebook.com','www.facebook.com','instagram.com','www.instagram.com'].includes(host))continue;
     url.hash='';
     const key=url.toString();
     if(!refs.has(key))refs.set(key,[]);
     const pages=refs.get(key);
     if(pages.length<8){const relative=path.slice(root.length+1);if(!pages.includes(relative))pages.push(relative);}
    }catch{}
   }
  }
 }
}
await visit(root);
let previous={records:{}};
try{const value=JSON.parse(await readFile(stateFile,'utf8'));if(value&&typeof value.records==='object')previous=value;}
catch(e){if(e.code!=='ENOENT')throw e;}
const records={};
for(const [url,pages] of refs){
 const old=previous.records[url]||{};
 records[url]={...old,url,sourcePages:pages};
}
const candidates=Object.values(records).sort((a,b)=>(a.lastChecked||'').localeCompare(b.lastChecked||'')||a.url.localeCompare(b.url));
const selected=[],perHost=new Map();
for(const record of candidates){
 const host=new URL(record.url).hostname;
 if((perHost.get(host)||0)>=2)continue;
 selected.push(record);perHost.set(host,(perHost.get(host)||0)+1);
 if(selected.length>=MAX)break;
}
const results=[];
let cursor=0;
async function worker(){
 while(cursor<selected.length){
  const item=selected[cursor++];
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),9000);
  let status=null,finalUrl=null,kind='unverified',error=null;
  try{
   const response=await fetch(item.url,{method:'GET',redirect:'follow',signal:ctrl.signal,headers:{
    'User-Agent':'OceanLinerCurator-Stewardship/1.0 (+https://oceanliners.net/contact)',
    Accept:'text/html,application/pdf,*/*;q=0.5'}});
   status=response.status;finalUrl=response.url;
   kind=status===404||status===410?'missing-candidate':status>=200&&status<400?'accessible':'unverified';
   await response.body?.cancel();
  }catch(e){error=e.name==='AbortError'?'timeout':'network-error';}
  finally{clearTimeout(timeout);}
  // Only two observations on different UTC days constitute a confirmed candidate.
  // A challenge, server failure or timeout retains prior evidence, not a fresh confirmation.
  const observation={at:now,status,kind,finalUrl,error};
  const prior=item.lastObservation;
  if(kind==='missing-candidate'){
   const differentDay=prior?.at?.slice(0,10)!==now.slice(0,10);
   item.missingStreak=(prior?.kind==='missing-candidate'&&differentDay?(item.missingStreak||1)+1:1);
   item.confirmedMissing=item.missingStreak>=2;
  }else if(kind==='accessible'){
   item.missingStreak=0;item.confirmedMissing=false;
  }
  item.lastObservation=observation;item.lastChecked=now;
  results.push({url:item.url,sourcePages:item.sourcePages,...observation,confirmedMissing:item.confirmedMissing||false,
    missingStreak:item.missingStreak||0});
 }
}
await Promise.all(Array.from({length:3},worker));
results.sort((a,b)=>a.url.localeCompare(b.url));
await mkdir(output,{recursive:true});
await mkdir(dirname(stateFile),{recursive:true});
const state={schemaVersion:1,updatedAt:now,records};
await writeFile(stateFile,JSON.stringify(state,null,2)+'\n');
const report={
 mode:'rotating-archive-inventory',generatedAt:now,inventory:Object.keys(records).length,
 checkedThisRun:results.length,totalEverChecked:Object.values(records).filter(x=>x.lastChecked).length,
 confirmedMissing:Object.values(records).filter(x=>x.confirmedMissing).length,
 caveat:'HTTP results are not historical verification; only distinct-day 404/410 checks confirm a review candidate. Unchecked URLs retain previous state.',
 results,
 confirmedCandidates:Object.values(records).filter(x=>x.confirmedMissing).map(x=>({
   url:x.url,sourcePages:x.sourcePages,lastObservation:x.lastObservation,missingStreak:x.missingStreak
 }))
};
await writeFile(resolve(output,'source-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({inventory:report.inventory,checkedThisRun:report.checkedThisRun,
 totalEverChecked:report.totalEverChecked,confirmedMissing:report.confirmedMissing}));
