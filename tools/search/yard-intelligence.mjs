import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const audit=JSON.parse(await readFile(resolve(here,'dist/builders-audit.json'),'utf8'));

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const norm=value=>clean(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’‘]/g,"'").replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

const locationAliases={
  'belfast northern ireland':'Belfast',
  'belfast ireland':'Belfast',
  'belfast':'Belfast',
  'govan glasgow scotland':'Govan',
  'govan glasgow':'Govan',
  'govan scotland':'Govan',
  'govan clyde':'Govan',
  'govan':'Govan',
  'clydebank scotland':'Clydebank',
  'clydebank glasgow scotland':'Clydebank',
  'clydebank':'Clydebank',
  'hamburg germany':'Hamburg',
  'hamburg':'Hamburg',
  'stettin germany':'Stettin',
  'stettin':'Stettin',
  'saint nazaire france':'Saint-Nazaire',
  'saint nazaire':'Saint-Nazaire',
  'barrow in furness england':'Barrow-in-Furness',
  'barrow in furness uk':'Barrow-in-Furness',
  'barrow in furness':'Barrow-in-Furness',
  'wallsend england':'Wallsend',
  'wallsend on tyne':'Wallsend',
  'wallsend':'Wallsend',
  'newport news virginia usa':'Newport News, Virginia',
  'newport news virginia':'Newport News, Virginia'
};

function canonicalLocation(raw){
  const text=clean(raw);
  if(!text)return null;
  const key=norm(text);
  return locationAliases[key]||text;
}

const ships=[];
const yards=new Map();
for(const record of audit.records||[]){
  const assignments=[];
  for(const identity of record.builderIdentities||[]){
    for(const rawLocation of identity.locations||[]){
      const location=canonicalLocation(rawLocation);
      if(!location)continue;
      const key=norm(location);
      const assignment={builder:identity.canonicalName,builderId:identity.canonicalKey.replace(/\s+/g,'-'),location,locationRaw:rawLocation};
      assignments.push(assignment);
      if(!yards.has(key))yards.set(key,{id:key.replace(/\s+/g,'-'),name:location,rawValues:new Set(),builders:new Set(),ships:[]});
      const yard=yards.get(key);
      yard.rawValues.add(rawLocation);
      yard.builders.add(identity.canonicalName);
      yard.ships.push({name:record.ship,path:record.path,url:record.url?.replace('https://oceanliners.net','')||'',launchYear:record.launchYear||null,builder:identity.canonicalName});
    }
  }
  ships.push({name:record.ship,path:record.path,url:record.url?.replace('https://oceanliners.net','')||'',launchYear:record.launchYear||null,assignments});
}

const yardGroups=[...yards.values()].map(yard=>({
  id:yard.id,
  name:yard.name,
  rawValues:[...yard.rawValues].sort(),
  builders:[...yard.builders].sort(),
  shipCount:yard.ships.length,
  ships:yard.ships.sort((a,b)=>(Number(a.launchYear||9999)-Number(b.launchYear||9999))||a.name.localeCompare(b.name))
})).sort((a,b)=>b.shipCount-a.shipCount||a.name.localeCompare(b.name));

const summary={
  shipGuides:Number(audit.summary?.shipGuides||0),
  guidesWithDocumentedYard:ships.filter(ship=>ship.assignments.length).length,
  guidesWithoutDocumentedYard:ships.filter(ship=>!ship.assignments.length).length,
  canonicalYardLocations:yardGroups.length,
  multiYardShips:ships.filter(ship=>new Set(ship.assignments.map(a=>a.location)).size>1).length
};

const feed={schemaVersion:1,generatedAt:audit.generatedAt,source:'Ship-specific builder yard/location wording extracted by builder audit',summary,yards:yardGroups,ships};
await mkdir(resolve(root,'data'),{recursive:true});
await writeFile(resolve(root,'data/curatoros-yards.json'),JSON.stringify(feed,null,2)+'\n');
console.log('Yard intelligence');
console.log(JSON.stringify(summary,null,2));
