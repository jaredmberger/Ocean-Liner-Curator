import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const paths=execFileSync('git',['ls-files','-z','ships/*.html'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).sort();
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/[’‘]/g,"'").replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const year=v=>String(v||'').match(/\b(?:18|19|20)\d{2}\b/)?.[0]||null;

function facts($){
  const rows=[];
  $('.fact-row').each((_,el)=>{const label=clean($(el).find('.fact-label').first().text());const value=clean($(el).find('.fact-value').first().text());if(label&&value)rows.push({label,value,key:norm(label)});});
  return rows;
}
function findRow(rows,predicate){return rows.find(r=>predicate(r.key))?.value||null}
function eraFor(y){
  const n=Number(y);if(!n)return null;
  if(n<1880)return'Pioneer steam era';
  if(n<1900)return'Late Victorian expansion';
  if(n<1914)return'Edwardian / pre-war peak';
  if(n<1920)return'First World War era';
  if(n<1930)return'Interwar recovery';
  if(n<1939)return'Interwar express-liner era';
  if(n<1946)return'Second World War era';
  if(n<1960)return'Postwar liner renaissance';
  if(n<1975)return'Jet-age transition';
  return'Late liner / cruise transition';
}
function decadeFor(y){const n=Number(y);return n?`${Math.floor(n/10)*10}s`:null}

const ships=[];
for(const path of paths){
  const html=await readFile(resolve(root,path),'utf8');
  const $=load(html);const subtitle=clean($('.subtitle').first().text());const titleTag=clean($('title').first().text());
  if(!/ship guide/i.test(`${subtitle} ${titleTag}`))continue;
  const rows=facts($);const name=clean($('h1').first().text())||titleTag.split(/\s+[|—]\s+/)[0];
  const launched=findRow(rows,k=>k==='launched'||k==='launch date'||k.startsWith('launched '));
  const completed=findRow(rows,k=>k==='completed'||k==='completion'||k==='entered service');
  const maiden=findRow(rows,k=>k==='maiden voyage'||k==='maiden service'||k==='entered service');
  const service=findRow(rows,k=>k==='service'||k==='years in service'||k==='service period'||k==='career'||k==='fate');
  const body=clean($('main').text());
  let startYear=year(maiden)||year(completed)||year(launched);
  let endYear=null;let endEvidence=null;
  if(service){
    const years=[...service.matchAll(/\b(?:18|19|20)\d{2}\b/g)].map(m=>m[0]);
    if(years.length){endYear=years.at(-1);endEvidence=service;}
  }
  if(!endYear){
    const patterns=[/\b(?:retired|withdrawn|scrapped|broken up|sold for scrap|ceased service|left service|decommissioned)\b[^.]{0,100}\b((?:18|19|20)\d{2})\b/i,/\b((?:18|19|20)\d{2})\b[^.]{0,80}\b(?:retired|withdrawn|scrapped|broken up|sold for scrap|decommissioned)\b/i];
    for(const p of patterns){const m=body.match(p);if(m){endYear=m[1];endEvidence=m[0];break;}}
  }
  ships.push({name,path,url:'/'+path.replace(/\.html$/,''),launchYear:year(launched),serviceStartYear:startYear,serviceEndYear:endYear,era:eraFor(startYear),decade:decadeFor(startYear),endEvidence});
}

const decades=new Map();const eras=new Map();
for(const ship of ships){
  if(ship.decade){if(!decades.has(ship.decade))decades.set(ship.decade,[]);decades.get(ship.decade).push(ship);}
  if(ship.era){if(!eras.has(ship.era))eras.set(ship.era,[]);eras.get(ship.era).push(ship);}
}
const serialise=map=>[...map.entries()].map(([name,items])=>({name,shipCount:items.length,ships:items.map(s=>({name:s.name,path:s.path,url:s.url,serviceStartYear:s.serviceStartYear,serviceEndYear:s.serviceEndYear}))})).sort((a,b)=>b.shipCount-a.shipCount||a.name.localeCompare(b.name));
const feed={schemaVersion:1,generatedAt:new Date().toISOString(),source:'Structured ship-guide dates with conservative explicit service-end extraction',summary:{shipGuides:ships.length,guidesWithServiceStart:ships.filter(s=>s.serviceStartYear).length,guidesWithExplicitServiceEnd:ships.filter(s=>s.serviceEndYear).length,eras:eras.size,decades:decades.size},eras:serialise(eras),decades:serialise(decades),ships};
await mkdir(resolve(root,'data'),{recursive:true});
await writeFile(resolve(root,'data/curatoros-eras.json'),JSON.stringify(feed,null,2)+'\n');
console.log(JSON.stringify(feed.summary,null,2));
