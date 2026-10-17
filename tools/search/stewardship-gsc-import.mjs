#!/usr/bin/env node
// Read-only adapter for manually supplied Google URL Inspection exports.
// Does not fetch GSC data or equate traffic change with indexing problems.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const input=process.argv[2];
if(!input)throw Error('Usage: node tools/search/stewardship-gsc-import.mjs <inspection-json>');
const data=JSON.parse(await readFile(resolve(input),'utf8'));
if(!Array.isArray(data.inspections))throw Error('Expected inspections array');
const output=[];
for(const item of data.inspections){
 if(!item||typeof item.url!=='string')continue;
 let parsed;try{parsed=new URL(item.url)}catch{continue}
 if(parsed.protocol!=='https:'||!['oceanliners.net','www.oceanliners.net'].includes(parsed.hostname))continue;
 const verdict=String(item.verdict||'').toUpperCase();
 const indexing=String(item.indexing_state||'').toUpperCase();
 const fetchState=String(item.page_fetch_state||'').toUpperCase();
 const userCanonical=item.user_canonical||null, googleCanonical=item.google_canonical||null;
 const canonicalDifferent=!!userCanonical&&!!googleCanonical&&userCanonical!==googleCanonical;
 const actionable=verdict==='FAIL'||indexing.includes('BLOCK')||fetchState.includes('ERROR')||canonicalDifferent;
 if(!actionable)continue;
 const kind=canonicalDifferent?'google-canonical-differs':'indexing-inspection-review';
 const id=createHash('sha256').update('gsc:'+kind+'|'+item.url).digest('hex').slice(0,20);
 output.push({id,type:'gsc:'+kind,scope:item.url,severity:'review',status:'needs-human-review',
   description:canonicalDifferent?'Review Google-selected canonical mismatch':'Review reported URL inspection status',
   evidence:{url:item.url,verdict:item.verdict||null,indexingState:item.indexing_state||null,
    coverageState:item.coverage_state||null,fetchState:item.page_fetch_state||null,
    googleCanonical,userCanonical,inspectedAt:item.requested_at||null,
    lastCrawl:item.last_crawl_time||null,source:'user-supplied Google URL Inspection export',
    caveat:'Status requires freshness and independent review; no indexation or penalty inferred from traffic trends'}});
}
output.sort((a,b)=>a.scope.localeCompare(b.scope));
const folder=resolve(root,'tools/search/dist/stewardship');await mkdir(folder,{recursive:true});
await writeFile(resolve(folder,'gsc-review-candidates.json'),JSON.stringify({
 mode:'manual-inspection-import',importedRows:data.inspections.length,candidates:output,
 caveat:'This export is not a live Search Console connection. Each candidate requires recency checking and human review.'},null,2)+'\n');
console.log(JSON.stringify({imported:data.inspections.length,candidates:output.length}));
