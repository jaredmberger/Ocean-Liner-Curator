import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const calendarPath = 'assets/this-day-ocean-liners.js';
const source = fs.readFileSync(calendarPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const calendar = sandbox.window.OCEAN_LINER_THIS_DAY || {};
const occupied = new Set(Object.keys(calendar).filter(k => Array.isArray(calendar[k]) && calendar[k].length));

const monthMap = new Map([
  ['january','01'],['february','02'],['march','03'],['april','04'],['may','05'],['june','06'],
  ['july','07'],['august','08'],['september','09'],['october','10'],['november','11'],['december','12'],
  ['jan','01'],['feb','02'],['mar','03'],['apr','04'],['jun','06'],['jul','07'],['aug','08'],['sep','09'],['sept','09'],['oct','10'],['nov','11'],['dec','12']
]);
const monthName = '(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const rx1 = new RegExp(`\\b(\\d{1,2})\\s+(${monthName})\\s+(18\\d{2}|19\\d{2}|20\\d{2})\\b`, 'gi');
const rx2 = new RegExp(`\\b(${monthName})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(18\\d{2}|19\\d{2}|20\\d{2})\\b`, 'gi');

const scoreTerms = [
  [/maiden voyage|maiden crossing|first voyage|first crossing/i, 10, 'maiden'],
  [/launch(?:ed|ing)?/i, 9, 'launch'],
  [/sank|sunk|founder|torpedo|mine|collision|collided|wreck|disaster/i, 10, 'casualty'],
  [/seized|requisition|troopship|hospital ship|commissioned|decommissioned/i, 8, 'wartime'],
  [/blue riband|record crossing|record time|speed record/i, 9, 'record'],
  [/retired|withdrawn|scrap|broken up|demolition|final voyage|last voyage/i, 7, 'final'],
  [/entered service|service began|inaugural|inaugurated/i, 8, 'service'],
  [/departed|sailed|arrived|reached/i, 5, 'movement'],
  [/rescued|rescue|survivors/i, 9, 'rescue'],
  [/laid down|keel laid/i, 6, 'construction']
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ');
}

function dateKey(day, monthToken) {
  const m = monthMap.get(String(monthToken).toLowerCase().replace(/\.$/, ''));
  if (!m) return null;
  const d = String(Number(day)).padStart(2, '0');
  if (Number(d) < 1 || Number(d) > 31) return null;
  return `${m}-${d}`;
}

function collectMatches(text, file) {
  const out = [];
  for (const [rx, order] of [[rx1, 1],[rx2,2]]) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(text))) {
      const day = order === 1 ? m[1] : m[2];
      const month = order === 1 ? m[2] : m[1];
      const year = Number(m[3]);
      const key = dateKey(day, month);
      if (!key || occupied.has(key)) continue;
      const start = Math.max(0, m.index - 220);
      const end = Math.min(text.length, m.index + m[0].length + 260);
      const context = text.slice(start, end).trim();
      let score = 0;
      const reasons = [];
      for (const [term, pts, label] of scoreTerms) {
        if (term.test(context)) { score += pts; reasons.push(label); }
      }
      if (/fact-label|fact-value/i.test(context)) score += 1;
      out.push({ key, year, dateText: m[0], file, score, reasons: [...new Set(reasons)], context });
    }
  }
  return out;
}

const shipsDir = 'ships';
const files = fs.readdirSync(shipsDir).filter(f => f.endsWith('.html') && f !== 'ships.html');
let candidates = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(shipsDir, file), 'utf8');
  const text = stripHtml(html);
  candidates.push(...collectMatches(text, file));
}

const dedupe = new Map();
for (const c of candidates) {
  const k = `${c.key}|${c.year}|${c.file}|${c.context.slice(0,80)}`;
  if (!dedupe.has(k) || dedupe.get(k).score < c.score) dedupe.set(k, c);
}
candidates = [...dedupe.values()]
  .filter(c => c.score >= 5)
  .sort((a,b) => b.score - a.score || a.key.localeCompare(b.key) || a.year - b.year);

const byDate = new Map();
for (const c of candidates) {
  if (!byDate.has(c.key)) byDate.set(c.key, []);
  if (byDate.get(c.key).length < 4) byDate.get(c.key).push(c);
}
const compact = [...byDate.entries()].map(([date, items]) => ({ date, items }));
console.log(JSON.stringify({occupiedDates:occupied.size, emptyDates:365-occupied.size, candidateDates:compact.length, candidates:compact.slice(0,120)}, null, 2));
