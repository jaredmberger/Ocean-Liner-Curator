import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const audit=JSON.parse(await readFile(resolve(here,'dist/builders-audit.json'),'utf8'));
const aliases=JSON.parse(await readFile(resolve(here,'operator-aliases.json'),'utf8'));

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const normalize=value=>clean(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’‘]/g,"'").replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

function candidates(raw){
  const text=clean(raw);
  const values=[text];
  const beforeParen=text.replace(/\s*\([^)]*\)\s*$/,'').trim();
  if(beforeParen&&beforeParen!==text)values.push(beforeParen);
  const beforeSemi=text.split(';')[0].trim();
  if(beforeSemi&&beforeSemi!==text)values.push(beforeSemi);
  const beforeSlash=text.split('/')[0].trim();
  if(beforeSlash&&beforeSlash!==text)values.push(beforeSlash);
  return [...new Set(values)];
}

function canonicalOperator(raw){
  const text=clean(raw);
  if(!text)return null;
  for(const candidate of candidates(text)){
    const mapped=aliases[normalize(candidate)];
    if(mapped)return {name:mapped,key:normalize(mapped),raw:text,matchedAlias:candidate};
  }
  return {name:text,key:normalize(text),raw:text,matchedAlias:null};
}

const groups=new Map();
const ships=[];
for(const record of audit.records||[]){
  const identity=canonicalOperator(record.operator);
  if(!identity)continue;
  if(!groups.has(identity.key))groups.set(identity.key,{id:identity.key.replace(/\s+/g,'-'),name:identity.name,rawValues:new Set(),ships:[]});
  const group=groups.get(identity.key);
  group.rawValues.add(identity.raw);
  const ship={name:record.ship,path:record.path,url:record.url?.replace('https://oceanliners.net','')||'',launchYear:record.launchYear||null,operatorRaw:record.operator,operator:identity.name};
  group.ships.push(ship);
  ships.push(ship);
}

const operators=[...groups.values()].map(group=>({
  id:group.id,
  name:group.name,
  rawValues:[...group.rawValues].sort(),
  shipCount:group.ships.length,
  ships:group.ships.sort((a,b)=>(Number(a.launchYear||9999)-Number(b.launchYear||9999))||a.name.localeCompare(b.name))
})).sort((a,b)=>b.shipCount-a.shipCount||a.name.localeCompare(b.name));

const summary={
  shipGuides:Number(audit.summary?.shipGuides||0),
  guidesWithOperator:ships.length,
  guidesMissingOperator:Number(audit.summary?.guidesMissingOperator||0),
  canonicalOperators:operators.length,
  aliasedOperatorGroups:operators.filter(operator=>operator.rawValues.some(raw=>normalize(raw)!==normalize(operator.name))).length
};

const feed={schemaVersion:1,generatedAt:audit.generatedAt,source:audit.source,summary,operators:operators.map(({ships,...operator})=>operator),ships};
await mkdir(resolve(here,'../../data'),{recursive:true});
await writeFile(resolve(here,'../../data/curatoros-operators.json'),JSON.stringify(feed,null,2)+'\n');
console.log('Operator intelligence');
console.log(JSON.stringify(summary,null,2));
