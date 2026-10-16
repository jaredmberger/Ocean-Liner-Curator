#!/usr/bin/env node
// Conservative external reference pilot. Bounded, deterministic sample of outgoing
// references; statuses are observations, never proof that historical sources are invalid.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const files=(await readdir(resolve(root,'ships'))).filter(f=>f.endsWith('.html')).sort();
const refs=new Map();
for(const file of files){
 const html=await readFile(resolve(root,'ships',file),'utf8');
 const links=[...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["'](https?:\/\/[^"'#\s<>]+)["']/gi)].map(x=>x[1].replaceAll('&amp;','&'));
 for(const raw of links){
  try{const u=new URL(raw);if(u.protocol!=='https:'||/(^|\.)oceanliners\.net$/.test(u.hostname)||/(^|\.)facebook\.com$/.test(u.hostname)||/(^|\.)instagram\.com$/.test(u.hostname))continue;
   u.hash='';const key=u.toString();if(!refs.has(key))refs.set(key,[]);if(refs.get(key).length<6)refs.get(key).push(file);
  }catch{}
 }
}
const sample=[...refs.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(0,24);
const results=[];let index=0;
async function worker(){
 while(index<sample.length){
  const [url,sourcePages]=sample[index++];
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),8000);
  try{
   const r=await fetch(url,{method:'GET',redirect:'follow',signal:ctrl.signal,headers:{'User-Agent':'OceanLinerCurator-Stewardship/1.0 (+https://oceanliners.net/contact)','Accept':'text/html,*/*;q=0.5'}});
   // Redirect to login/challenge or errors are not conclusive evidence of missing source.
   results.push({url,sourcePages,status:r.status,finalUrl:r.url,kind:r.status===404||r.status===410?'missing-candidate':'observed'});
   await r.body?.cancel();
  }catch(e){results.push({url,sourcePages,status:null,kind:'unverified',error:e.name==='AbortError'?'timeout':'network-error'});}
  finally{clearTimeout(timeout)}
 }
}
await Promise.all(Array.from({length:4},worker));
results.sort((a,b)=>a.url.localeCompare(b.url));
const dir=resolve(root,'tools/search/dist/stewardship');await mkdir(dir,{recursive:true});
await writeFile(resolve(dir,'source-checks.json'),JSON.stringify({mode:'pilot',sampled:sample.length,inventory:refs.size,results},null,2)+'\n');
console.log(JSON.stringify({inventory:refs.size,sampled:sample.length,missingCandidates:results.filter(r=>r.kind==='missing-candidate').length,unverified:results.filter(r=>r.kind==='unverified').length}));
