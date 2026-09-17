import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const calendarPath = 'assets/this-day-ocean-liners.js';
const source = fs.readFileSync(calendarPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const data = sandbox.window.OCEAN_LINER_THIS_DAY || {};

const months = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

function cleanText(value) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&lsquo;|&rsquo;/gi, '’')
    .replace(/&ldquo;|&rdquo;/gi, '”')
    .replace(/\s+/g, ' ')
    .trim();
}

function norm(value) {
  return cleanText(value)
    .normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseDate(value) {
  const text = cleanText(value);
  let m = text.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+((?:18|19|20)\d{2})\b/i);
  if (m) {
    const day = Number(m[1]);
    if (day >= 1 && day <= 31) return { key: `${months[m[2].toLowerCase()]}-${String(day).padStart(2, '0')}`, year: Number(m[3]), text };
  }
  m = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+((?:18|19|20)\d{2})\b/i);
  if (m) {
    const day = Number(m[2]);
    if (day >= 1 && day <= 31) return { key: `${months[m[1].toLowerCase()]}-${String(day).padStart(2, '0')}`, year: Number(m[3]), text };
  }
  return null;
}

function factRows(html) {
  const rows = [];
  const rowRe = /<div\b[^>]*class=(['"])[^'"]*\bfact-row\b[^'"]*\1[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let m;
  while ((m = rowRe.exec(html))) {
    const block = m[2] || '';
    const label = block.match(/<[^>]*class=(['"])[^'"]*\bfact-label\b[^'"]*\1[^>]*>([\s\S]*?)<\/[^>]+>/i);
    const value = block.match(/<[^>]*class=(['"])[^'"]*\bfact-value\b[^'"]*\1[^>]*>([\s\S]*?)<\/[^>]+>/i);
    if (label && value) rows.push({ label: cleanText(label[2]), value: cleanText(value[2]) });
  }
  return rows;
}

function findRow(rows, tests) {
  for (const row of rows) {
    const n = norm(row.label);
    if (tests.some(test => typeof test === 'string' ? n === test : test.test(n))) return row;
  }
  return null;
}

function canonicalUrl(html, path) {
  const a = html.match(/<link\b[^>]*rel=(['"])canonical\1[^>]*href=(['"])([^'"]+)\2/i);
  const b = html.match(/<link\b[^>]*href=(['"])([^'"]+)\1[^>]*rel=(['"])canonical\3/i);
  const href = a?.[3] || b?.[2];
  if (href) {
    try { return new URL(href, 'https://oceanliners.net').pathname.replace(/\.html?$/i, ''); } catch {}
  }
  return '/' + path.replace(/^\/+/, '').replace(/\.html?$/i, '');
}

function existingLaunch(arr, ship, year) {
  const target = norm(ship);
  return arr.some(event => {
    if (!event || Number(event.year) !== Number(year)) return false;
    const category = norm(event.category || '');
    const title = norm(event.title || '');
    const eventShip = norm(event.ship || '');
    const looksLaunch = category === 'launch' || /\blaunched\b/.test(title);
    if (!looksLaunch) return false;
    return (eventShip && (eventShip === target || eventShip.includes(target) || target.includes(eventShip))) || title.includes(target);
  });
}

const paths = execFileSync('git', ['ls-files', '-z', 'ships/*.html'], { encoding: 'utf8' })
  .split('\0').filter(Boolean).sort();

let guidesWithFullLaunchDate = 0;
let added = 0;
const addedDates = new Set();
const addedShips = [];

for (const path of paths) {
  if (/\/(?:ships|index)\.html$/i.test(path)) continue;
  const html = fs.readFileSync(path, 'utf8');
  if (!/ship guide/i.test(html)) continue;

  const h1m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const ship = cleanText(h1m ? h1m[1] : '');
  if (!ship) continue;

  const rows = factRows(html);
  const launchRow = findRow(rows, ['launched', 'launch date', /^launched\b/]);
  if (!launchRow) continue;

  const parsed = parseDate(launchRow.value);
  if (!parsed) continue;
  guidesWithFullLaunchDate++;

  const key = parsed.key;
  if (!Array.isArray(data[key])) data[key] = [];
  if (existingLaunch(data[key], ship, parsed.year)) continue;

  const builderRow = findRow(rows, ['builder', 'shipbuilder', 'ship builder', 'built by', /^builder\b/]);
  const operatorRow = findRow(rows, [/operator/, 'shipping line', 'line', 'company']);
  const builder = builderRow?.value || '';
  const operator = operatorRow?.value || '';
  const relatedUrl = canonicalUrl(html, path);

  const summary = builder
    ? `${ship} was launched by ${builder}.`
    : `${ship} was launched, marking a major construction milestone before fitting-out and entry into service.`;

  const tags = ['launch'];
  if (operator) tags.push(norm(operator).replace(/\s+/g, '-'));

  data[key].push({
    year: parsed.year,
    title: `${ship} launched`,
    ship,
    category: 'Launch',
    summary,
    whyItMatters: `The launch marked the point at which ${ship} entered the water and moved from hull construction toward fitting-out and service.`,
    relatedUrl,
    significance: 'medium',
    tags,
    sources: [`Ocean Liner Curator ship guide — structured launch fact (${parsed.text})`]
  });

  added++;
  addedDates.add(key);
  addedShips.push(`${key} ${parsed.year} ${ship}`);
}

for (const key of Object.keys(data)) {
  if (!Array.isArray(data[key])) data[key] = [];
  data[key].sort((a, b) => (Number(a.year || 0) - Number(b.year || 0)) || String(a.title || '').localeCompare(String(b.title || '')));
}

const ordered = {};
for (const key of Object.keys(data).sort()) ordered[key] = data[key];

const banner = `// Ocean Liner Curator — This Day in Ocean Liner History
// Authoritative calendar data for /api/on-this-day.
// Multiple events on the same date belong in the SAME array; do not duplicate object keys.
// Exact launch events may be sourced from structured ship-guide facts.

`;
fs.writeFileSync(calendarPath, banner + 'window.OCEAN_LINER_THIS_DAY = ' + JSON.stringify(ordered, null, 2) + ';\n');

const populatedDates = Object.keys(ordered).filter(key => ordered[key]?.length);
const multiEventDates = populatedDates.filter(key => ordered[key].length > 1);
console.log(JSON.stringify({
  guidesWithFullLaunchDate,
  addedEvents: added,
  addedDistinctDates: addedDates.size,
  totalPopulatedDates: populatedDates.length,
  multiEventDates: multiEventDates.length,
  firstAdded: addedShips.slice(0, 25)
}, null, 2));
