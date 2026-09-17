import fs from 'node:fs';
import vm from 'node:vm';

const path = 'assets/this-day-ocean-liners.js';
const source = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.OCEAN_LINER_THIS_DAY || {};

const events = [
  {
    date: '01-11', year: 1962, title: 'SS France formally inaugurated', ship: 'SS France', category: 'Service',
    summary: 'France was formally inaugurated shortly before beginning her first transatlantic season for the French Line.',
    whyItMatters: 'The ceremony marked the public debut of France as the last great purpose-built French transatlantic liner.',
    relatedUrl: '', significance: 'medium', tags: ['french-line','france','service-entry'],
    sources: ['Institut national de l’audiovisuel (INA) — France historical feature']
  },
  {
    date: '01-14', year: 1953, title: 'SS Andrea Doria begins maiden voyage', ship: 'SS Andrea Doria', category: 'Maiden Voyage',
    summary: 'Andrea Doria began her maiden voyage from Genoa to New York for the Italian Line.',
    whyItMatters: 'Her entry into service introduced one of the most celebrated postwar Italian liners and a major symbol of Italy’s revived passenger fleet.',
    relatedUrl: '/ships/ss-andrea-doria', significance: 'high', tags: ['italian-line','andrea-doria','maiden-voyage'],
    sources: ['Italian Line vessel chronologies','SS Andrea Doria service histories']
  },
  {
    date: '02-03', year: 1962, title: 'SS France departs on maiden transatlantic voyage', ship: 'SS France', category: 'Maiden Voyage',
    summary: 'France departed Le Havre for New York on her first transatlantic crossing.',
    whyItMatters: 'The voyage introduced the French Line’s final great flagship to the North Atlantic at the beginning of the jet age.',
    relatedUrl: '', significance: 'high', tags: ['french-line','france','maiden-voyage'],
    sources: ['Institut national de l’audiovisuel (INA) — France historical feature']
  },
  {
    date: '03-19', year: 1930, title: 'SS Europa begins maiden voyage', ship: 'SS Europa', category: 'Maiden Voyage',
    summary: 'Europa departed on her maiden voyage from Bremerhaven to New York.',
    whyItMatters: 'Europa immediately joined Bremen at the forefront of German interwar express service and captured the Blue Riband on her first crossing.',
    relatedUrl: '/ships/ss-europa', significance: 'high', tags: ['north-german-lloyd','europa','maiden-voyage','blue-riband'],
    sources: ['Bremen Passenger Lists / Die Maus vessel chronology','Norddeutscher Lloyd histories']
  },
  {
    date: '04-02', year: 1912, title: 'RMS Titanic completes sea trials and is accepted by White Star Line', ship: 'RMS Titanic', category: 'Construction',
    summary: 'Titanic completed her sea trials off Belfast and was accepted by White Star Line before departing for Southampton.',
    whyItMatters: 'The successful trials marked the formal transition from construction to service only eight days before her maiden voyage.',
    relatedUrl: '/titanic', significance: 'high', tags: ['white-star-line','titanic','sea-trials','construction'],
    sources: ['Encyclopedia Titanica — Titanic sea trials and delivery research','Contemporary officer testimony']
  },
  {
    date: '05-02', year: 1969, title: 'Queen Elizabeth 2 begins maiden voyage', ship: 'Queen Elizabeth 2', category: 'Maiden Voyage',
    summary: 'Queen Elizabeth 2 departed Southampton for New York on her maiden voyage.',
    whyItMatters: 'QE2 became Cunard’s defining late-twentieth-century liner and sustained regular transatlantic passenger service deep into the jet age.',
    relatedUrl: '/ships/queen-elizabeth-2', significance: 'high', tags: ['cunard-line','qe2','maiden-voyage'],
    sources: ['The QE2 Story historical chronology']
  },
  {
    date: '05-10', year: 1922, title: 'RMS Majestic begins maiden voyage', ship: 'RMS Majestic', category: 'Maiden Voyage',
    summary: 'Majestic departed Southampton for New York on her maiden voyage for White Star Line.',
    whyItMatters: 'Her entry into service gave White Star the world’s largest passenger ship and completed the line’s postwar express trio with Olympic and Homeric.',
    relatedUrl: '/ships/rms-majestic', significance: 'high', tags: ['white-star-line','majestic','maiden-voyage'],
    sources: ['White Star Line histories','GG Archives — RMS Majestic chronology']
  },
  {
    date: '05-14', year: 1914, title: 'SS Vaterland begins maiden voyage', ship: 'SS Vaterland', category: 'Maiden Voyage',
    summary: 'Vaterland began her maiden voyage for Hamburg America Line.',
    whyItMatters: 'The voyage introduced the second Imperator-class giant, later seized by the United States and transformed into SS Leviathan.',
    relatedUrl: '/ships/ss-leviathan', significance: 'high', tags: ['hamburg-america-line','vaterland','leviathan','maiden-voyage'],
    sources: ['Great Ocean Liners — SS Vaterland facts and chronology']
  },
  {
    date: '06-11', year: 1913, title: 'SS Imperator begins maiden voyage', ship: 'SS Imperator', category: 'Maiden Voyage',
    summary: 'Imperator departed Hamburg on her maiden voyage to New York via Southampton and Cherbourg.',
    whyItMatters: 'Her debut introduced Hamburg America Line’s unprecedented new generation of giant liners and briefly made her the largest ship afloat.',
    relatedUrl: '/ships/ss-imperator', significance: 'high', tags: ['hamburg-america-line','imperator','maiden-voyage'],
    sources: ['Hamburg America Line histories','Norway Heritage — SS Imperator chronology']
  },
  {
    date: '07-04', year: 1840, title: 'RMS Britannia begins Cunard’s first transatlantic crossing', ship: 'RMS Britannia', category: 'Maiden Voyage',
    summary: 'Britannia departed Liverpool for Boston on Cunard’s first regularly scheduled transatlantic steamship crossing.',
    whyItMatters: 'The sailing established the service tradition from which Cunard’s transatlantic liner operation developed.',
    relatedUrl: '/250-years-across-the-atlantic', significance: 'high', tags: ['cunard-line','britannia','transatlantic-history','steamship'],
    sources: ['Cunard historical materials — first transatlantic crossing, 4 July 1840']
  },
  {
    date: '07-16', year: 1929, title: 'SS Bremen begins maiden voyage and record crossing', ship: 'SS Bremen', category: 'Maiden Voyage',
    summary: 'Bremen departed on her maiden voyage from Bremerhaven to New York and captured the Blue Riband on the crossing.',
    whyItMatters: 'The record restored German prominence in North Atlantic express service and helped define the technological ambitions of the interwar liner era.',
    relatedUrl: '/ships/ss-bremen', significance: 'high', tags: ['north-german-lloyd','bremen','maiden-voyage','blue-riband'],
    sources: ['Norddeutscher Lloyd vessel chronologies','Bremen service histories']
  }
];

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

let added = 0;
for (const event of events) {
  if (!Array.isArray(data[event.date])) data[event.date] = [];
  const duplicate = data[event.date].some(existing =>
    Number(existing?.year) === event.year && normalize(existing?.title) === normalize(event.title)
  );
  if (!duplicate) {
    const { date, ...record } = event;
    data[event.date].push(record);
    added++;
  }
}

for (const key of Object.keys(data)) {
  data[key].sort((a, b) => (Number(a.year || 0) - Number(b.year || 0)) || String(a.title || '').localeCompare(String(b.title || '')));
}

const ordered = {};
for (const key of Object.keys(data).sort()) ordered[key] = data[key];

const banner = `// Ocean Liner Curator — This Day in Ocean Liner History
// Authoritative calendar data for /api/on-this-day.
// Multiple events on the same date belong in the SAME array; do not duplicate object keys.
// Exact launch events may be sourced from structured ship-guide facts.

`;
fs.writeFileSync(path, banner + 'window.OCEAN_LINER_THIS_DAY = ' + JSON.stringify(ordered, null, 2) + ';\n');

const populated = Object.keys(ordered).filter(key => ordered[key]?.length);
const multi = populated.filter(key => ordered[key].length > 1);
console.log(JSON.stringify({ addedCuratedEvents: added, totalPopulatedDates: populated.length, multiEventDates: multi.length }, null, 2));
