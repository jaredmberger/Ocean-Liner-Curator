import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const output = resolve(here, 'dist');
const origin = 'https://oceanliners.net';

const paths = execFileSync('git', ['ls-files', '-z', 'ships/*.html'], {
  cwd: root,
  encoding: 'utf8'
}).split('\0').filter(Boolean).sort();

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalize = value => clean(value)
  .normalize('NFD').replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function physicalUrl(path) {
  return '/' + path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/^\//, '');
}

function splitBuilder(raw) {
  const value = clean(raw);
  const match = value.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!match) return { name: value, location: null };
  return { name: clean(match[1]), location: clean(match[2]) || null };
}

function factRows($) {
  const rows = [];
  $('.fact-row').each((_, element) => {
    const label = clean($(element).find('.fact-label').first().text());
    const value = clean($(element).find('.fact-value').first().text());
    if (label && value) rows.push({ label, value });
  });
  return rows;
}

const records = [];
const skipped = [];

for (const path of paths) {
  const html = await readFile(resolve(root, path), 'utf8');
  const $ = load(html);
  const titleTag = clean($('title').first().text());
  const subtitle = clean($('.subtitle').first().text());
  const isGuide = /ship guide/i.test(`${titleTag} ${subtitle}`) && !/\/(?:ships|index)\.html$/.test(path);
  if (!isGuide) {
    skipped.push({ path, reason: 'Not identified as a ship guide' });
    continue;
  }

  const rows = factRows($);
  const findRow = predicate => rows.find(row => predicate(normalize(row.label)));
  const builderRow = findRow(label => label === 'builder' || label === 'shipbuilder' || label === 'ship builder' || label === 'built by');
  const operatorRow = findRow(label => label === 'operator' || label === 'operator as built' || label === 'shipping line' || label === 'line');
  const launchedRow = findRow(label => label === 'launched' || label === 'launch date');
  const completedRow = findRow(label => label === 'completed' || label === 'completion' || label === 'entered service');

  const h1 = clean($('h1').first().text()) || titleTag.split(/\s+[|—]\s+/)[0];
  const canonical = $('link[rel="canonical"]').attr('href');
  let url = origin + physicalUrl(path);
  if (canonical) {
    try { url = new URL(canonical, origin).href; } catch {}
  }

  const rawBuilder = builderRow?.value || null;
  const builderParts = rawBuilder ? splitBuilder(rawBuilder) : { name: null, location: null };
  const launchYear = launchedRow?.value.match(/\b(?:18|19|20)\d{2}\b/)?.[0] || null;

  records.push({
    path,
    url,
    ship: h1,
    builder: rawBuilder,
    builderName: builderParts.name,
    builderLocation: builderParts.location,
    builderKey: builderParts.name ? normalize(builderParts.name) : null,
    operator: operatorRow?.value || null,
    launched: launchedRow?.value || null,
    launchYear,
    completed: completedRow?.value || null
  });
}

const builders = new Map();
for (const record of records) {
  if (!record.builderKey) continue;
  if (!builders.has(record.builderKey)) {
    builders.set(record.builderKey, {
      key: record.builderKey,
      names: new Set(),
      rawValues: new Set(),
      locations: new Set(),
      operators: new Set(),
      ships: []
    });
  }
  const entry = builders.get(record.builderKey);
  entry.names.add(record.builderName);
  entry.rawValues.add(record.builder);
  if (record.builderLocation) entry.locations.add(record.builderLocation);
  if (record.operator) entry.operators.add(record.operator);
  entry.ships.push({ ship: record.ship, url: record.url, launchYear: record.launchYear, operator: record.operator });
}

const builderGroups = [...builders.values()].map(entry => ({
  key: entry.key,
  canonicalNameCandidate: [...entry.names].sort((a, b) => b.length - a.length || a.localeCompare(b))[0],
  names: [...entry.names].sort(),
  rawValues: [...entry.rawValues].sort(),
  locations: [...entry.locations].sort(),
  operators: [...entry.operators].sort(),
  shipCount: entry.ships.length,
  launchYears: entry.ships.map(ship => Number(ship.launchYear)).filter(Number.isFinite).sort((a, b) => a - b),
  ships: entry.ships.sort((a, b) => (Number(a.launchYear || 9999) - Number(b.launchYear || 9999)) || a.ship.localeCompare(b.ship))
})).sort((a, b) => b.shipCount - a.shipCount || a.canonicalNameCandidate.localeCompare(b.canonicalNameCandidate));

const missing = {
  builder: records.filter(record => !record.builder).map(record => ({ ship: record.ship, path: record.path })),
  operator: records.filter(record => !record.operator).map(record => ({ ship: record.ship, path: record.path })),
  launched: records.filter(record => !record.launched).map(record => ({ ship: record.ship, path: record.path }))
};

const variantGroups = builderGroups.filter(group => group.names.length > 1 || group.rawValues.length > 1 || group.locations.length > 1);
const suspiciousLaunchYears = records.filter(record => record.launched && !record.launchYear).map(record => ({ ship: record.ship, path: record.path, launched: record.launched }));

const report = {
  generatedAt: new Date().toISOString(),
  source: 'Tracked ships/*.html pages identified as Ship Guides',
  summary: {
    trackedShipHtmlFiles: paths.length,
    shipGuides: records.length,
    uniqueBuilderKeys: builderGroups.length,
    guidesWithBuilder: records.length - missing.builder.length,
    guidesMissingBuilder: missing.builder.length,
    guidesMissingOperator: missing.operator.length,
    guidesMissingLaunch: missing.launched.length,
    builderVariantGroups: variantGroups.length,
    suspiciousLaunchDatesWithoutYear: suspiciousLaunchYears.length
  },
  missing,
  suspiciousLaunchYears,
  variantGroups,
  builders: builderGroups,
  records,
  skipped
};

await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'builders-audit.json'), JSON.stringify(report, null, 2));

console.log('Shipbuilder audit');
console.log(JSON.stringify(report.summary, null, 2));
if (missing.builder.length) console.log('Missing builder:', missing.builder.slice(0, 25));
if (missing.operator.length) console.log('Missing operator:', missing.operator.slice(0, 25));
if (missing.launched.length) console.log('Missing launched:', missing.launched.slice(0, 25));
if (variantGroups.length) console.log('Builder naming/location variants:', variantGroups.slice(0, 25).map(group => ({
  key: group.key,
  names: group.names,
  rawValues: group.rawValues,
  locations: group.locations,
  shipCount: group.shipCount
})));
