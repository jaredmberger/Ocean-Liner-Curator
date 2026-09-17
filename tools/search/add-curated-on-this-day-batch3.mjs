import fs from 'node:fs';
import vm from 'node:vm';

const path = 'assets/this-day-ocean-liners.js';
const source = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.OCEAN_LINER_THIS_DAY || {};

const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();

function add(date, event) {
  if (!Array.isArray(data[date])) data[date] = [];
  const duplicate = data[date].some(existing => Number(existing?.year) === Number(event.year) && normalize(existing?.title) === normalize(event.title));
  if (duplicate) return false;
  data[date].push(event);
  return true;
}

const events = [
  ['01-31',{year:1858,title:'SS Great Eastern finally launched',ship:'SS Great Eastern',category:'Launch',summary:'After months of difficult launch attempts, Brunel’s immense Great Eastern was finally floated into the Thames.',whyItMatters:'At the time she was by far the largest ship ever built, and her scale anticipated the giant passenger ships of later generations.',relatedUrl:'',significance:'high',tags:['great-eastern','brunel','launch'],sources:['Royal Museums Greenwich — Great Eastern collection and history']}],
  ['04-06',{year:1917,title:'SS Vaterland seized by the United States',ship:'SS Vaterland / USS Leviathan',category:'Wartime Service',summary:'The former Hamburg America liner Vaterland was seized at Hoboken when the United States entered World War I.',whyItMatters:'The seizure began the ship’s transformation into USS Leviathan, one of the most important American troop transports of the war.',relatedUrl:'/ships/ss-leviathan',significance:'high',tags:['vaterland','leviathan','world-war-i'],sources:['Naval History and Heritage Command — Leviathan (SP-1326)']}],
  ['05-27',{year:1936,title:'RMS Queen Mary begins maiden voyage',ship:'RMS Queen Mary',category:'Maiden Voyage',summary:'Queen Mary departed on her maiden voyage, inaugurating Cunard White Star’s new flagship service.',whyItMatters:'Her entry into service opened one of the defining chapters of twentieth-century North Atlantic passenger travel.',relatedUrl:'/ships/rms-queen-mary',significance:'high',tags:['queen-mary','cunard','maiden-voyage'],sources:['Royal Museums Greenwich — RMS Queen Mary maiden-voyage passenger list']}],
  ['07-03',{year:1952,title:'SS United States begins maiden voyage',ship:'SS United States',category:'Maiden Voyage',summary:'SS United States departed New York on her maiden eastbound crossing.',whyItMatters:'The voyage immediately demonstrated the extraordinary speed built into William Francis Gibbs’s American flagship.',relatedUrl:'/ships/ss-us',significance:'high',tags:['united-states-lines','ss-united-states','maiden-voyage'],sources:['SS United States Conservancy — The Maiden Voyage']}],
  ['07-07',{year:1952,title:'SS United States completes record maiden crossing',ship:'SS United States',category:'Record Crossing',summary:'SS United States completed her maiden Atlantic crossing in record time and captured the Blue Riband.',whyItMatters:'Her performance established the enduring transatlantic speed record associated with the fastest ocean liner ever built.',relatedUrl:'/ships/ss-us',significance:'high',tags:['ss-united-states','blue-riband','record-crossing'],sources:['SS United States Conservancy — The Maiden Voyage']}],
  ['07-19',{year:1843,title:'SS Great Britain launched at Bristol',ship:'SS Great Britain',category:'Launch',summary:'Brunel’s iron-hulled SS Great Britain was launched into Bristol’s Floating Harbour with Prince Albert in attendance.',whyItMatters:'Her combination of an iron hull and screw propulsion made her one of the most consequential ships in the development of modern ocean travel.',relatedUrl:'',significance:'high',tags:['great-britain','brunel','launch'],sources:['SS Great Britain Trust — The Launch of the SS Great Britain, 1843']}],
  ['07-26',{year:1845,title:'SS Great Britain departs on maiden Atlantic voyage',ship:'SS Great Britain',category:'Maiden Voyage',summary:'SS Great Britain departed Liverpool for New York on her first transatlantic voyage.',whyItMatters:'The crossing placed Brunel’s revolutionary iron screw steamer into regular Atlantic passenger service.',relatedUrl:'',significance:'high',tags:['great-britain','brunel','maiden-voyage'],sources:['SS Great Britain Trust — voyage records']}],
  ['08-08',{year:1845,title:'SS Great Britain reaches New York on maiden voyage',ship:'SS Great Britain',category:'Maiden Voyage',summary:'SS Great Britain arrived at New York after her first westbound Atlantic crossing.',whyItMatters:'The arrival demonstrated the practical transatlantic capability of a large iron-hulled screw-propelled passenger ship.',relatedUrl:'',significance:'medium',tags:['great-britain','brunel','maiden-voyage'],sources:['SS Great Britain Trust — voyage records']}],
  ['09-01',{year:1845,title:'SS Great Britain departs New York on first return crossing',ship:'SS Great Britain',category:'Service',summary:'SS Great Britain departed New York for Liverpool on the return leg of her inaugural transatlantic round trip.',whyItMatters:'The voyage helped establish the operating pattern of the new iron screw steamer on the North Atlantic.',relatedUrl:'',significance:'medium',tags:['great-britain','brunel','transatlantic-service'],sources:['SS Great Britain Trust — voyage records']}],
  ['09-06',{year:1917,title:'Vaterland renamed USS Leviathan',ship:'USS Leviathan',category:'Wartime Service',summary:'The seized German liner Vaterland was formally renamed Leviathan for United States Navy service.',whyItMatters:'Under her new name she became one of the largest and most productive troop transports of World War I.',relatedUrl:'/ships/ss-leviathan',significance:'high',tags:['leviathan','vaterland','world-war-i'],sources:['Naval History and Heritage Command — Leviathan (SP-1326)']}],
  ['09-15',{year:1845,title:'SS Great Britain completes first transatlantic round trip',ship:'SS Great Britain',category:'Service',summary:'SS Great Britain arrived back at Liverpool, completing her first round trip to New York.',whyItMatters:'The voyage demonstrated the viability of Brunel’s iron screw liner in sustained transatlantic operation.',relatedUrl:'',significance:'medium',tags:['great-britain','brunel','transatlantic-service'],sources:['SS Great Britain Trust — voyage records']}],
  ['09-26',{year:1934,title:'RMS Queen Mary launched',ship:'RMS Queen Mary',category:'Launch',summary:'Cunard’s new express liner Queen Mary was launched at John Brown’s Clydebank yard.',whyItMatters:'The launch introduced the hull that would become one of the most famous ocean liners of the twentieth century.',relatedUrl:'/ships/rms-queen-mary',significance:'high',tags:['queen-mary','cunard','launch'],sources:['Royal Museums Greenwich — Queen Mary launch commemorative record']}],
  ['10-29',{year:1919,title:'USS Leviathan decommissioned after World War I service',ship:'USS Leviathan',category:'Wartime Service',summary:'USS Leviathan was decommissioned and returned to the U.S. Shipping Board after wartime transport service.',whyItMatters:'The date closed her extraordinary Navy career and began the transition toward her peacetime United States Lines service.',relatedUrl:'/ships/ss-leviathan',significance:'medium',tags:['leviathan','world-war-i','united-states-lines'],sources:['Naval History and Heritage Command — Leviathan (SP-1326)']}],
  ['11-07',{year:1907,title:'RMS Mauretania arrives on the Mersey for the first time',ship:'RMS Mauretania',category:'Service',summary:'Mauretania reached the Mersey before berthing at the Prince’s Landing Stage ahead of her maiden voyage.',whyItMatters:'The arrival was the public prelude to the service career of one of Cunard’s most successful express liners.',relatedUrl:'/ships/rms-mauretania',significance:'medium',tags:['mauretania','cunard','service-entry'],sources:['Royal Museums Greenwich — The steamship Mauretania in the Mersey, November 1907']}],
  ['12-10',{year:1937,title:'SS Leviathan sold for scrapping',ship:'SS Leviathan',category:'Final Disposition',summary:'United States Lines sold Leviathan to a British firm for scrapping.',whyItMatters:'The sale ended the career of the former Vaterland, a ship whose life connected Imperial German liner competition, World War I troop transport, and interwar American passenger service.',relatedUrl:'/ships/ss-leviathan',significance:'medium',tags:['leviathan','vaterland','scrapping'],sources:['Naval History and Heritage Command — Leviathan (SP-1326)']}]
];

let added = 0;
const newDates = new Set();
for (const [date,event] of events) {
  const existed = Array.isArray(data[date]) && data[date].length > 0;
  if (add(date,event)) {
    added++;
    if (!existed) newDates.add(date);
  }
}
for (const key of Object.keys(data)) data[key].sort((a,b)=>(Number(a.year||0)-Number(b.year||0)) || String(a.title||'').localeCompare(String(b.title||'')));
const ordered = {};
for (const key of Object.keys(data).sort()) ordered[key] = data[key];
const banner = `// Ocean Liner Curator — This Day in Ocean Liner History\n// Authoritative calendar data for /api/on-this-day.\n// Multiple events on the same date belong in the SAME array; do not duplicate object keys.\n// Exact launch events may be sourced from structured ship-guide facts.\n\n`;
fs.writeFileSync(path, banner + 'window.OCEAN_LINER_THIS_DAY = ' + JSON.stringify(ordered,null,2) + ';\n');
const populated = Object.keys(ordered).filter(k=>ordered[k]?.length);
const multi = populated.filter(k=>ordered[k].length>1);
console.log(JSON.stringify({proposed:events.length,addedEvents:added,newlyPopulatedDates:newDates.size,totalPopulatedDates:populated.length,multiEventDates:multi.length},null,2));
