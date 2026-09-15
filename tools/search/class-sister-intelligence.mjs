import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const paths=execFileSync('git',['ls-files','-z','ships/*.html'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).sort();
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’‘]/g,"'").replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const shipPrefix=/^(?:RMS|SS|S\.S\.|MV|MS|HMHS|HMT|HMS|TS|RMMV|QSMV)\s+/i;

const records=[];
for(const path of paths){
  const html=await readFile(resolve(root,path),'utf8');
  const $=load(html);
  const title=clean($('h1').first().text())||clean($('title').first().text().split(/\s+[|—]\s+/)[0]);
  const subtitle=clean($('.subtitle').first().text());
  if(!/ship guide/i.test(`${$('title').first().text()} ${subtitle}`))continue;
  const body=clean($('main').text());
  const launch=(body.match(/\b(?:18|19|20)\d{2}\b/)||[])[0]||null;
  const classes=new Set();
  const sisters=new Set();

  for(const m of body.matchAll(/\b([A-Z][A-Za-zÀ-ÖØ-öø-ÿ0-9'’.-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ0-9'’.-]+){0,3})-class\s+(?:liner|liners|ship|ships|vessel|vessels)\b/g))classes.add(clean(m[1]));
  for(const m of body.matchAll(/\b(?:member|ship|vessel)\s+of\s+the\s+([A-Z][A-Za-zÀ-ÖØ-öø-ÿ0-9'’.-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ0-9'’.-]+){0,3})-class\b/g))classes.add(clean(m[1]));

  for(const m of body.matchAll(/\b(?:sister ship(?:s)?(?:\s+were|\s+was|\s+included|\s+include|\s+of|\s+to)?|sister(?:s)?\s+of)\s+([^.;:]{2,180})/gi)){
    const segment=clean(m[1]).replace(/\([^)]*\)/g,'');
    for(const raw of segment.split(/,|\band\b|\bwith\b/i)){
      const candidate=clean(raw).replace(/^(?:the\s+)?/i,'').replace(shipPrefix,'').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’.-]+$/g,'');
      if(candidate.length>=3&&candidate.length<=60&&!/^(?:three|two|other|her|his|its|the|a|an)$/i.test(candidate))sisters.add(candidate);
    }
  }

  records.push({name:title,path,url:'/'+path.replace(/\.html$/,''),launchYear:launch,classes:[...classes],sisters:[...sisters]});
}

const byName=new Map();
for(const r of records){
  const base=norm(r.name.replace(shipPrefix,''));
  if(base&&!byName.has(base))byName.set(base,[]);
  if(base)byName.get(base).push(r);
}

const classes=new Map();
for(const r of records){
  for(const raw of r.classes){
    const name=raw.replace(/-class$/i,'').trim();
    const key=norm(name);
    if(!key)continue;
    if(!classes.has(key))classes.set(key,{id:key.replace(/\s+/g,'-'),name,rawValues:new Set(),ships:[]});
    const g=classes.get(key);g.rawValues.add(raw);g.ships.push({name:r.name,path:r.path,url:r.url,launchYear:r.launchYear});
  }
}

const sisterLinks=[];const unresolved=[];const seen=new Set();
for(const r of records){
  for(const sisterName of r.sisters){
    const candidates=byName.get(norm(sisterName.replace(shipPrefix,'')))||[];
    if(candidates.length===1){
      const other=candidates[0];if(other.path===r.path)continue;
      const pair=[r.path,other.path].sort();const key=pair.join('|');if(seen.has(key))continue;seen.add(key);
      sisterLinks.push({a:{name:r.name,path:r.path,url:r.url},b:{name:other.name,path:other.path,url:other.url},evidenceFrom:r.path});
    }else unresolved.push({ship:r.name,path:r.path,mentioned:sisterName,candidateCount:candidates.length});
  }
}

const classGroups=[...classes.values()].map(g=>({id:g.id,name:g.name,rawValues:[...g.rawValues].sort(),shipCount:g.ships.length,ships:g.ships.sort((a,b)=>a.name.localeCompare(b.name))})).sort((a,b)=>b.shipCount-a.shipCount||a.name.localeCompare(b.name));
const feed={schemaVersion:1,generatedAt:new Date().toISOString(),source:'Explicit class and sister-ship wording in tracked ship guides',summary:{shipGuides:records.length,guidesWithExplicitClass:records.filter(r=>r.classes.length).length,canonicalClasses:classGroups.length,explicitSisterLinks:sisterLinks.length,unresolvedSisterMentions:unresolved.length},classes:classGroups,sisterLinks,unresolvedSisterMentions:unresolved,ships:records};
await mkdir(resolve(root,'data'),{recursive:true});
await writeFile(resolve(root,'data/curatoros-classes-sisters.json'),JSON.stringify(feed,null,2)+'\n');
console.log('Class and sister-ship intelligence');
console.log(JSON.stringify(feed.summary,null,2));
