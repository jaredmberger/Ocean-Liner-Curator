import fs from 'node:fs';
import vm from 'node:vm';

const path = 'assets/this-day-ocean-liners.js';
const source = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.OCEAN_LINER_THIS_DAY || {};

const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();

function checkedUrl(url) {
  if (!url || !url.startsWith('/ships/')) return url || '';
  const local = url.replace(/^\//, '') + '.html';
  return fs.existsSync(local) ? url : '';
}

function add(date, event) {
  if (!Array.isArray(data[date])) data[date] = [];
  event.relatedUrl = checkedUrl(event.relatedUrl);
  const duplicate = data[date].some(existing => {
    if (Number(existing?.year) !== Number(event.year)) return false;
    if (normalize(existing?.title) === normalize(event.title)) return true;
    return normalize(existing?.ship) === normalize(event.ship) && normalize(existing?.category) === normalize(event.category);
  });
  if (duplicate) return false;
  data[date].push(event);
  return true;
}

const events = [
  ['04-18',{year:1912,title:'RMS Carpathia arrives in New York with Titanic survivors',ship:'RMS Carpathia',category:'Rescue',summary:'Carpathia reached New York on the evening of April 18 carrying the survivors rescued from Titanic’s lifeboats.',whyItMatters:'The arrival completed one of the most famous maritime rescue operations in history and brought the disaster’s survivors to safety.',relatedUrl:'/ships/rms-carpathia',significance:'high',tags:['carpathia','titanic','rescue','cunard'],sources:['Encyclopedia Titanica — Carpathia arrives in New York, 18 April 1912']}],
  ['05-29',{year:1914,title:'RMS Empress of Ireland sinks in the St. Lawrence',ship:'RMS Empress of Ireland',category:'Disaster',summary:'Empress of Ireland sank after colliding with the Norwegian collier Storstad in fog near Rimouski, Quebec.',whyItMatters:'The loss of more than one thousand people made the sinking Canada’s deadliest peacetime maritime disaster.',relatedUrl:'/ships/rms-empress-of-ireland',significance:'high',tags:['empress-of-ireland','canadian-pacific','disaster'],sources:['Canadian Museum of History — Empress of Ireland collection and sinking records']}],
  ['05-29',{year:1935,title:'SS Normandie begins maiden voyage',ship:'SS Normandie',category:'Maiden Voyage',summary:'Normandie departed on her maiden voyage from Le Havre toward New York.',whyItMatters:'Her first crossing immediately established the new French flagship as a technological and artistic benchmark and culminated in a Blue Riband record.',relatedUrl:'/ships/ss-normandie',significance:'high',tags:['normandie','french-line','maiden-voyage','blue-riband'],sources:['Royal Museums Greenwich — SS Normandie model record']}],
  ['05-30',{year:1914,title:'RMS Aquitania begins maiden voyage',ship:'RMS Aquitania',category:'Maiden Voyage',summary:'Aquitania sailed from Liverpool on her maiden voyage to New York for Cunard.',whyItMatters:'The voyage began a remarkably long career that would span both world wars and more than three decades of passenger service.',relatedUrl:'/ships/rms-aquitania',significance:'high',tags:['aquitania','cunard','maiden-voyage'],sources:['Royal Museums Greenwich — HMHS Aquitania history']}],
  ['06-07',{year:1906,title:'RMS Lusitania launched',ship:'RMS Lusitania',category:'Launch',summary:'Lusitania was launched at John Brown & Company’s Clydebank yard.',whyItMatters:'The launch introduced one of the two revolutionary turbine-driven Cunard express liners that reshaped competition on the North Atlantic.',relatedUrl:'/ships/rms-lusitania',significance:'high',tags:['lusitania','cunard','launch'],sources:['Royal Museums Greenwich — Launch of Lusitania']}],
  ['07-25',{year:1956,title:'SS Andrea Doria collides with MS Stockholm',ship:'SS Andrea Doria',category:'Disaster',summary:'Andrea Doria and Stockholm collided in heavy fog south of Nantucket late on July 25.',whyItMatters:'The collision led to one of the largest peacetime maritime rescue operations of the twentieth century and became a major case study in radar-era navigation.',relatedUrl:'/ships/ss-andrea-doria',significance:'high',tags:['andrea-doria','stockholm','collision','rescue'],sources:['HISTORY — Ocean liners collide off Nantucket']}],
  ['07-26',{year:1956,title:'SS Andrea Doria sinks after overnight rescue',ship:'SS Andrea Doria',category:'Disaster',summary:'Andrea Doria capsized and sank the morning after her collision with Stockholm, after most survivors had been evacuated to assisting ships.',whyItMatters:'The sinking closed an extraordinary overnight rescue effort in which more than sixteen hundred people were brought to safety.',relatedUrl:'/ships/ss-andrea-doria',significance:'high',tags:['andrea-doria','sinking','rescue'],sources:['HISTORY — The Sinking of Andrea Doria']}],
  ['09-20',{year:1906,title:'RMS Mauretania launched',ship:'RMS Mauretania',category:'Launch',summary:'Mauretania was launched from the Swan Hunter yard on the River Tyne.',whyItMatters:'She would become one of the defining Cunard express liners and hold the westbound Blue Riband for an exceptionally long period.',relatedUrl:'/ships/rms-mauretania',significance:'high',tags:['mauretania','cunard','launch','blue-riband'],sources:['Royal Museums Greenwich — Mauretania launch invitation, 20 September 1906']}],
  ['09-20',{year:1937,title:'RMS Olympic leaves Jarrow for final demolition',ship:'RMS Olympic',category:'Final Disposition',summary:'After two years of partial dismantling at Jarrow, Olympic was towed to Inverkeithing for final demolition.',whyItMatters:'The move marked the final stage in the dismantling of the first Olympic-class liner and one of White Star Line’s longest-serving ships.',relatedUrl:'/ships/rms-olympic',significance:'medium',tags:['olympic','white-star-line','scrapping'],sources:['Royal Museums Greenwich — Olympic partially broken-up at Jarrow']}],
  ['09-27',{year:1938,title:'RMS Queen Elizabeth launched',ship:'RMS Queen Elizabeth',category:'Launch',summary:'Queen Elizabeth was launched at John Brown & Company’s Clydebank yard.',whyItMatters:'The launch produced the largest passenger liner yet built and the ship that would become Queen Mary’s running mate after wartime service.',relatedUrl:'/ships/rms-queen-elizabeth',significance:'high',tags:['queen-elizabeth','cunard','launch'],sources:['Royal Museums Greenwich — Queen Elizabeth launching mechanism record']}],
  ['10-02',{year:1942,title:'RMS Queen Mary collides with HMS Curacoa',ship:'RMS Queen Mary',category:'Wartime Service',summary:'While carrying more than ten thousand American troops, Queen Mary collided with the escort cruiser HMS Curacoa off Ireland and cut the smaller ship in two.',whyItMatters:'The wartime collision was one of the gravest incidents in Queen Mary’s troopship career and resulted in heavy loss of life aboard Curacoa.',relatedUrl:'/ships/rms-queen-mary',significance:'high',tags:['queen-mary','curacoa','world-war-ii','collision'],sources:['Royal Museums Greenwich — HMS Curacoa collection record']}],
  ['10-13',{year:1935,title:'RMS Olympic arrives at Jarrow for scrapping',ship:'RMS Olympic',category:'Final Disposition',summary:'Olympic arrived at Jarrow to begin dismantling after her withdrawal from service.',whyItMatters:'Her arrival marked the practical end of a career that had spanned nearly a quarter century, including wartime troop service and decades on the North Atlantic.',relatedUrl:'/ships/rms-olympic',significance:'medium',tags:['olympic','white-star-line','scrapping'],sources:['Royal Museums Greenwich — RMS Titanic fact sheet, Olympic chronology']}],
  ['10-20',{year:1910,title:'RMS Olympic launched',ship:'RMS Olympic',category:'Launch',summary:'Olympic, the first of White Star Line’s Olympic-class liners, was launched at Harland & Wolff in Belfast.',whyItMatters:'The launch introduced the class that would include Titanic and Britannic and established a new scale for White Star’s North Atlantic service.',relatedUrl:'/ships/rms-olympic',significance:'high',tags:['olympic','white-star-line','launch'],sources:['Royal Museums Greenwich — RMS Titanic fact sheet']}],
  ['10-29',{year:1932,title:'SS Normandie launched',ship:'SS Normandie',category:'Launch',summary:'Normandie was launched at Saint-Nazaire for the Compagnie Générale Transatlantique.',whyItMatters:'Her launch introduced the hull of one of the most celebrated ocean liners ever built, combining advanced turbo-electric propulsion with landmark French design.',relatedUrl:'/ships/ss-normandie',significance:'high',tags:['normandie','french-line','launch'],sources:['Royal Museums Greenwich — SS Normandie model record']}],
  ['11-21',{year:1916,title:'HMHS Britannic sinks after striking a mine',ship:'HMHS Britannic',category:'Disaster',summary:'Britannic struck a mine in the Kea Channel while serving as a hospital ship and sank less than an hour later.',whyItMatters:'The loss ended the career of the third Olympic-class liner before she could ever enter the passenger service for which she had been built.',relatedUrl:'/ships/rms-britannic',significance:'high',tags:['britannic','white-star-line','world-war-i','hospital-ship'],sources:['Royal Museums Greenwich — RMS Titanic fact sheet']}]
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
