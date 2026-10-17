import assert from 'node:assert/strict';
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const dir=await mkdtemp(join(tmpdir(),'gsc-stewardship-'));
try{
 const file=join(dir,'inspections.json');
 await writeFile(file,JSON.stringify({inspections:[
  {url:'https://oceanliners.net/ships/test',verdict:'PASS',user_canonical:'https://oceanliners.net/ships/test',google_canonical:'https://oceanliners.net/ships/test'},
  {url:'https://oceanliners.net/ships/blocked',verdict:'FAIL',coverage_state:'Excluded'},
  {url:'https://example.org/other',verdict:'FAIL'},
  {url:'https://oceanliners.net/ships/canonical',verdict:'NEUTRAL',user_canonical:'https://oceanliners.net/ships/canonical',google_canonical:'https://oceanliners.net/ships/other'}
 ]}));
 execFileSync('node',['tools/search/stewardship-gsc-import.mjs',file],{encoding:'utf8'});
 const result=JSON.parse(await readFile('tools/search/dist/stewardship/gsc-review-candidates.json','utf8'));
 assert.equal(result.importedRows,4);
 assert.equal(result.candidates.length,2);
 assert(result.candidates.every(x=>x.status==='needs-human-review'));
 assert(result.candidates.every(x=>x.id.length===20));
 console.log('GSC importer tests passed');
}finally{await rm(dir,{recursive:true,force:true})}
