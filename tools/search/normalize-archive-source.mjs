import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const archivePath = resolve(root, 'ships/ships.html');
const explorePath = resolve(root, 'explore.html');

const html = await readFile(archivePath, 'utf8');
const exploreHtml = await readFile(explorePath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// The Ship Archive source is now authoritative. This script intentionally does
// not rewrite it during builds; it only verifies that source-level metadata and
// search behavior remain internally consistent.
const guideCards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*\bguide-card\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)]
  .map(match => match[0]);

const years = guideCards
  .filter(card => !/href=["']\/ships\/tall-ships-guide\.html["']/i.test(card))
  .map(card => card.match(/\bdata-year=["'](\d{4})["']/i)?.[1])
  .filter(Boolean)
  .map(Number)
  .filter(Number.isFinite);

assert(years.length > 0, 'No ocean-liner archive data-year values found.');

const firstYear = Math.min(...years);
const lastYear = Math.max(...years);
const span = `${firstYear}–${lastYear}`;
const expectedDescription = `Browse 300+ ocean liner ship guides spanning ${span}, including Cunard, White Star, French Line, and more—curated with evidence-first standards.`;

assert(
  html.includes(`<meta name="description" content="${expectedDescription}" />`),
  `Ship Archive meta description is stale. Expected liner span ${span} in ships/ships.html.`
);
assert(
  html.includes(`"description": "${expectedDescription}"`),
  `Ship Archive schema description is stale. Expected liner span ${span} in ships/ships.html.`
);
assert(
  /<meta\s+property=["']og:url["']\s+content=["']https:\/\/oceanliners\.net\/ships\/ships["']\s*\/?\s*>/i.test(html),
  'Ship Archive og:url must match https://oceanliners.net/ships/ships.'
);
assert(
  /<div\s+class=["']archive-badge__note["']\s+id=["']badgeNote["']>[\s\S]*?Calculating archive coverage…[\s\S]*?<\/div>/i.test(html),
  'Ship Archive badge note is stale; keep the source-level placeholder and let runtime calculate coverage.'
);
assert(
  /function getSearchText\(card\)[\s\S]*?guide-desc[\s\S]*?\.join\(" "\)/.test(html),
  'Ship Archive source search must include .guide-desc text.'
);

// Guard against the historical cross-card regex corruption that once placed a
// Duchess-class description on SS Adriatic (1872).
const adriaticHref = '/ships/ss-adriatic-1872.html';
const adriaticPos = html.indexOf(`href="${adriaticHref}"`);
assert(adriaticPos >= 0, `Archive card not found for ${adriaticHref}.`);
const adriaticStart = html.lastIndexOf('<article', adriaticPos);
const adriaticEnd = html.indexOf('</article>', adriaticPos);
assert(adriaticStart >= 0 && adriaticEnd > adriaticStart, 'Could not isolate SS Adriatic (1872) archive card.');
const adriaticCard = html.slice(adriaticStart, adriaticEnd + '</article>'.length);
assert(!/Duchess-class/i.test(adriaticCard), 'SS Adriatic (1872) archive card contains corrupted Duchess-class copy.');

assert(
  !exploreHtml.includes('https://www.oceanliners.net'),
  'Explore canonical metadata still contains www.oceanliners.net; update explore.html directly.'
);

console.log(`Verified Ship Archive source (${guideCards.length} archive cards; liner span ${span}).`);
console.log('Archive build step is verification-only; ships/ships.html remains authoritative.');
