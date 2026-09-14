// Runs the generated search engine in Node; this does not replace browser QA.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { searchArchive } from './search-engine.js';

let bytes = 0;
const fetchNetwork = globalThis.fetch;
globalThis.fetch = async (input, ...args) => {
  if (!String(input).startsWith('file:')) return fetchNetwork(input, ...args);
  const content = await readFile(new URL(input));
  bytes += content.byteLength;
  return new Response(content, {headers:{'Content-Type':'application/wasm'}});
};
const pagefind = await import('./dist/pagefind/pagefind.js');
const queries = [
  'Olympic', 'RMS Olympic',
  'Britannic', 'Britannic 1930',
  'Leviathan', 'S.S. Leviathan',
  'Queen Mary', 'Queen Mary 2',
  'Mauretania', 'Mauretania 1939',
  'Deutschland', 'America',
  'White Star Line', 'The White Star Line',
  'Art Deco', 'interiors', 'immigration', 'troop transport', 'ships used as troop transports',
  'White Star ships',
  'Cunard ships',
  'fastest ocean liners',
  'ships used during the war',
  'ocean liners used in World War II',
  'immigrant ships',
  'ships that carried immigrants',
  'French ocean liners',
  'German ocean liners',
  'Italian ocean liners',
  'famous ocean liner interiors',
  'ocean liner dining rooms',
  'what happened to ocean liners',
  'why did ocean liners disappear',
  'zzzxqvunknown'
];
const report = [];
for (const query of queries) {
  const before = bytes;
  const start = performance.now();
  const result = await searchArchive(pagefind, query);
  const top = await Promise.all(result.results.slice(0,8).map(async r => {
    const d = await r.data();
    assert.equal(new URL(d.url).origin, 'https://oceanliners.net');
    return {title:d.meta.title,url:d.url,type:d.meta.type,excerpt:d.excerpt};
  }));
  assert.equal(new Set(result.results.map(r => r.id)).size, result.results.length);
  report.push({query, count:result.results.length, milliseconds:Math.round(performance.now()-start), loadedBytes:bytes-before, top});
}
const byQuery = query => report.find(r => r.query === query);
const olympic = byQuery('Olympic');
assert.equal(olympic.top[0].url, 'https://oceanliners.net/ships/rms-olympic', 'Olympic guide should rank first');
assert.equal(byQuery('RMS Olympic').top[0].url, olympic.top[0].url, 'RMS prefix should resolve to Olympic guide');

const britannic = byQuery('Britannic');
assert.ok(britannic.top.slice(0,3).every(r=>r.type==='Ship guide'), 'Bare Britannic should group the three matching ship guides first');
assert.equal(byQuery('Britannic 1930').top[0].title, 'MV Britannic (1930)', 'Year-qualified Britannic should select the 1930 vessel');

const leviathan = byQuery('Leviathan');
assert.equal(byQuery('S.S. Leviathan').top[0].url, leviathan.top[0].url, 'Punctuated SS prefix should resolve to Leviathan guide');

const queenMary = byQuery('Queen Mary');
assert.equal(queenMary.top[0].title, 'RMS Queen Mary (1936)', 'Bare Queen Mary should rank the historic liner first');
assert.ok(queenMary.top.some(r=>r.title==='RMS Queen Mary 2 (2004)'), 'Bare Queen Mary should still surface Queen Mary 2 nearby');
assert.equal(byQuery('Queen Mary 2').top[0].title, 'RMS Queen Mary 2 (2004)', 'Queen Mary 2 should resolve directly to the 2004 ship');

const mauretania = byQuery('Mauretania');
assert.deepEqual(mauretania.top.slice(0,2).map(r=>r.title), ['RMS Mauretania (1907)','RMS Mauretania (II) (1939)'], 'Bare Mauretania should group both Cunard liners first');
assert.equal(byQuery('Mauretania 1939').top[0].title, 'RMS Mauretania (II) (1939)', 'Year-qualified Mauretania should select the 1939 vessel');

assert.equal(byQuery('Deutschland').top[0].title, 'SS Deutschland (1900)', 'Deutschland should rank its ship guide first');
assert.equal(byQuery('America').top[0].title, 'SS America (1940)', 'Generic-word ship names should still rank the exact ship guide first');

const whiteStar = byQuery('White Star Line');
assert.equal(whiteStar.top[0].title, 'White Star Line', 'Exact page-title matches should rank first');
assert.equal(byQuery('The White Star Line').top[0].title, 'White Star Line', 'Leading article should not prevent an exact title match');
assert.equal(byQuery('White Star ships').top[0].title, 'White Star Line', 'Broad White Star ship intent should lead with the line hub');
assert.equal(byQuery('what happened to ocean liners').top[0].title, 'Why Did Ocean Liners Disappear?', 'Natural-language disappearance intent should lead with the dedicated explainer');
assert.equal(byQuery('why did ocean liners disappear').top[0].title, 'Why Did Ocean Liners Disappear?', 'Direct disappearance query should lead with the dedicated explainer');

for (const query of ['Art Deco','interiors','immigration','troop transport']) assert.ok(byQuery(query).count > 0, query);
for (const query of [
  'White Star ships','Cunard ships','fastest ocean liners','ships used during the war',
  'ocean liners used in World War II','immigrant ships','ships that carried immigrants',
  'French ocean liners','German ocean liners','Italian ocean liners','famous ocean liner interiors',
  'ocean liner dining rooms','what happened to ocean liners','why did ocean liners disappear'
]) assert.ok(byQuery(query).count > 0, `Natural-language query should return results: ${query}`);
assert.equal(report.at(-1).count, 0);
await writeFile(new URL('./dist/query-report.json', import.meta.url), JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(({query,count,milliseconds,loadedBytes,top})=>({query,count,milliseconds,loadedBytes,top:top.map(r=>`${r.type}: ${r.title}`)})),null,2));
