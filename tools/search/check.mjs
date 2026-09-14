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
  'Queen Mary', 'Mauretania', 'Deutschland', 'America',
  'White Star Line', 'The White Star Line',
  'Art Deco', 'interiors', 'immigration', 'troop transport', 'ships used as troop transports',
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
const olympic = report.find(r => r.query === 'Olympic');
assert.equal(olympic.top[0].url, 'https://oceanliners.net/ships/rms-olympic', 'Olympic guide should rank first');
assert.equal(report.find(r=>r.query==='RMS Olympic').top[0].url, olympic.top[0].url, 'RMS prefix should resolve to Olympic guide');
assert.ok(report.find(r=>r.query==='Britannic').top.filter(r=>r.type==='Ship guide').length >= 3, 'Distinguish Britannic vessels');
const leviathan = report.find(r=>r.query==='Leviathan');
assert.equal(report.find(r=>r.query==='S.S. Leviathan').top[0].url, leviathan.top[0].url, 'Punctuated SS prefix should resolve to Leviathan guide');
const whiteStar = report.find(r => r.query === 'White Star Line');
assert.equal(whiteStar.top[0].title, 'White Star Line', 'Exact page-title matches should rank first');
assert.equal(report.find(r=>r.query==='The White Star Line').top[0].title, 'White Star Line', 'Leading article should not prevent an exact title match');
for (const query of ['Art Deco','interiors','immigration','troop transport']) assert.ok(report.find(r=>r.query===query).count > 0, query);
assert.equal(report.at(-1).count, 0);
await writeFile(new URL('./dist/query-report.json', import.meta.url), JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(({query,count,milliseconds,loadedBytes,top})=>({query,count,milliseconds,loadedBytes,top:top.map(r=>`${r.type}: ${r.title}`)})),null,2));
