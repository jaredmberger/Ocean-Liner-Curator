#!/usr/bin/env node
/** Read-only inventory/decision reconciliation. Node 22; no dependencies. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const arg=(flag,fallback)=>{const i=process.argv.indexOf(flag);if(i<0)return fallback;if(!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw Error('Missing '+flag);return process.argv[i+1];};
const out=resolve(root,arg('--out','research-connectivity-completion'));
const ledgerFile=resolve(root,arg('--ledger','tools/search/research-connectivity-review-ledger.csv'));
const data=JSON.parse(execFileSync(process.execPath,[join(root,'tools/search/research-connectivity-audit.mjs'),'--json'],{encoding:'utf8',maxBuffer:25000000}));
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const routes=new Set([...sitemap.matchAll(/<loc>\s*([^<]+)<\/loc>/g)].map(x=>{try{return new URL(x[1]).pathname.replace(/\.html?$/,'').replace(/\/+$/,'')||'/';}catch{return null;}}).filter(Boolean));
function parseCSV(s){let a=[],row=[],v='',quote=false;for(let i=0;i<s.length;i++){let c=s[i];if(quote){if(c==='"'&&s[i+1]==='"'){v+='"';i++;}else if(c==='"')quote=false;else v+=c;}else if(c==='"')quote=true;else if(c===','){row.push(v);v='';}else if(c==='\n'){row.push(v.replace(/\r$/,''));a.push(row);row=[];v='';}else v+=c;}if(quote)throw Error('Unclosed CSV quote');if(v||row.length){row.push(v);a.push(row);}return a;}
const escape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const all=new Map(data.ships.map(x=>[x.ship,x])),errors=[],decisions=new Map();
let ledger;try{ledger=await readFile(ledgerFile,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;throw Error('Missing review ledger: '+ledgerFile);}
const records=parseCSV(ledger);const header=records.shift()||[],required=['ship','decision','destination','evidence','reason','reviewer'];
if(required.some(x=>!header.includes(x)))throw Error('Ledger missing required headers');
const settled=new Set(['complete-existing','complete-linked','complete-no-suitable-link']);
const allowed=new Set([...settled,'needs-link','needs-research','not-a-guide']);
for(const [idx,fields] of records.entries()){
 if(fields.every(x=>!x.trim()))continue;
 if(fields.length!==header.length){errors.push('row '+(idx+2)+': invalid CSV field count');continue;}
 const d=Object.fromEntries(header.map((x,i)=>[x,fields[i].trim()]));
 if(!all.has(d.ship)){errors.push('row '+(idx+2)+': unknown ship');continue;}
 if(decisions.has(d.ship)){errors.push('row '+(idx+2)+': duplicate ship');continue;}
 if(!allowed.has(d.decision))errors.push('row '+(idx+2)+': invalid decision');
 if(!d.reason||!d.reviewer)errors.push('row '+(idx+2)+': reason/reviewer required');
 if(['needs-link','complete-linked'].includes(d.decision)){
  if(!d.destination||!d.evidence)errors.push('row '+(idx+2)+': destination and exact passage evidence required');
  if(!routes.has(d.destination))errors.push('row '+(idx+2)+': missing sitemap destination '+d.destination);
  try{const html=await readFile(join(root,d.ship.slice(1)+'.html'),'utf8');
   if(!html.includes(d.evidence))errors.push('row '+(idx+2)+': evidence absent from current guide');
   if(d.decision==='complete-linked'&&![...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)/gi)].some(m=>{try{return (new URL(m[1],'https://oceanliners.net').pathname.replace(/\.html?$/,'').replace(/\/+$/,'')||'/')===d.destination;}catch{return false;}}))errors.push('row '+(idx+2)+': claimed link absent');
  }catch{errors.push('row '+(idx+2)+': unreadable ship guide');}
 }
 if(d.decision==='complete-existing'&&all.get(d.ship).status==='scanned'&&!all.get(d.ship).researchTargets.length)errors.push('row '+(idx+2)+': complete-existing with zero detected links');
 if(d.decision==='not-a-guide'&&all.get(d.ship).status==='scanned')errors.push('row '+(idx+2)+': scanned guide classified non-guide');
 decisions.set(d.ship,d);
}
const priority=x=>x.status!=='scanned'?0:x.researchTargets.length===0?1:x.researchTargets.length===1?2:3;
const rows=data.ships.map(x=>({...x,priority:priority(x),decision:decisions.get(x.ship)?.decision??'unreviewed',reason:decisions.get(x.ship)?.reason??'',reviewer:decisions.get(x.ship)?.reviewer??''})).sort((a,b)=>a.priority-b.priority||a.ship.localeCompare(b.ship));
const unfinished=rows.filter(x=>x.status==='scanned'&&!settled.has(x.decision));
const exceptions=rows.filter(x=>x.status!=='scanned'&&!['not-a-guide','complete-no-suitable-link'].includes(x.decision));
const summary={...data.metrics,reviewed:decisions.size,unreviewed:rows.filter(x=>x.decision==='unreviewed').length,needsLink:rows.filter(x=>x.decision==='needs-link').length,needsResearch:rows.filter(x=>x.decision==='needs-research').length,unfinishedGuides:unfinished.length,classificationExceptions:exceptions.length,validationErrors:errors.length,complete:!errors.length&&!unfinished.length&&!exceptions.length};
const csv=['ship,status,priority,detected_destinations,decision,reason,reviewer',...rows.map(x=>[x.ship,x.status,x.priority,x.researchTargets.join(';'),x.decision,x.reason,x.reviewer].map(escape).join(','))].join('\n')+'\n';
const report=['# Research Connectivity Completion Worklist','','**Read-only triage, not a recommendation to add links.**','','## Summary',...Object.entries(summary).map(([k,v])=>'- '+k+': '+v),'','## Review order','','0. Template/unresolved/non-guide classifications; 1. no detected link; 2. one detected destination; 3. multiple detected destinations.','', '## Remaining decisions','','| Ship | Priority | Existing destinations | State |','|---|---:|---:|---|',...rows.filter(x=>!settled.has(x.decision)&&x.decision!=='not-a-guide').map(x=>'| '+x.ship+' | '+x.priority+' | '+x.researchTargets.length+' | '+x.decision+' |'),'','## Validation errors',...(errors.length?errors:['None']),'','Completion requires a reviewed disposition for every genuine guide and resolved classification exceptions. Zero links are not an error.',''].join('\n');
await mkdir(out,{recursive:true});
await Promise.all([writeFile(join(out,'worklist.csv'),csv),writeFile(join(out,'worklist.json'),JSON.stringify({summary,rows},null,2)+'\n'),writeFile(join(out,'completion-report.md'),report)]);
console.log(JSON.stringify(summary,null,2));
if(errors.length)process.exitCode=1;
