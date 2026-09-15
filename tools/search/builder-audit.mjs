import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const output = resolve(here, 'dist');
const publicDataPath = resolve(here, 'builders-data.json');
const origin = 'https://oceanliners.net';
const aliases = JSON.parse(await readFile(resolve(here, 'builder-aliases.json'), 'utf8'));

const paths = execFileSync('git', ['ls-files', '-z', 'ships/*.html'], {
  cwd: root,
  encoding: 'utf8'
}).split('\0').filter(Boolean).sort();

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalize = value => clean(value)
  .normalize('NFD').replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[’‘]/g, "'")
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function physicalUrl(path) {
  return '/' + path.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/^\//, '');
}

const annotationPattern = /\b(?:yard|yard no|yard number|slip no|commonly cited|often cited|ship no|hull no|building no)\b/i;
const corporateTailPattern = /\b(?:co\.?|company|ltd\.?|limited|sons?|works|shipbuilding|engineering|yard|yards|werft|corporation|corp\.?)\b/i;

function splitBuilder(raw) {
  const original = clean(raw);
  let working = original;
  const notes = [];
  const locations = [];

  while (true) {
    const match = working.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    if (!match) break;
    const inside = clean(match[2]);
    working = clean(match[1]);
    if (annotationPattern.test(inside)) notes.unshift(inside);
    else locations.unshift(inside);
  }

  const dotParts = working.split(/\s+·\s+/).map(clean).filter(Boolean);
  if (dotParts.length > 1) {
    working = dotParts.shift();
    for (const part of dotParts) {
      if (annotationPattern.test(part)) notes.push(part);
      else working += ` · ${part}`;
    }
  }

  const lastComma = working.lastIndexOf(',');
  if (lastComma > 0) {
    const before = clean(working.slice(0, lastComma));
    const tail = clean(working.slice(lastComma + 1));
    if (tail && !corporateTailPattern.test(tail) && tail.length <= 48) {
      working = before;
      locations.unshift(tail);
    }
  }

  const baseKey = normalize(working || original);
  const canonicalName = aliases[baseKey] || working || original;
  const canonicalKey = normalize(canonicalName);

  return {
    raw: original,
    name: working || original,
    key: baseKey,
    canonicalName,
    canonicalKey,
    locations: [...new Set(locations.filter(Boolean))],
    notes: [...new Set(notes.filter(Boolean))]
  };
}

function builderEntries(raw) {
  const value = clean(raw);
  if (!value) return [];
  const segments = value.split(/\s+·\s+/).map(clean).filter(Boolean);
  if (segments.length <= 1) return [splitBuilder(value)];

  const substantive = [];
  for (const segment of segments) {
    if (annotationPattern.test(segment) && substantive.length) {
      substantive[substantive.length - 1] += ` · ${segment}`;
    } else {
      substantive.push(segment);
    }
  }
  return substantive.map(splitBuilder);
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

function subtitleOperator(subtitle) {
  if (!subtitle) return null;
  const first = clean(subtitle.split(/\s*[·•]\s*/)[0]);
  if (!first || /^\d{4}$/.test(first) || /ship guide/i.test(first)) return null;
  return first;
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
  const normalizedRows = rows.map(row => ({ ...row, normalizedLabel: normalize(row.label) }));
  const findRow = predicate => normalizedRows.find(row => predicate(row.normalizedLabel));

  const builderRow = findRow(label => label === 'builder' || label === 'shipbuilder' || label === 'ship builder' || label === 'built by' || label.startsWith('builder '));
  const operatorRow =
    findRow(label => /\bas built\b/.test(label) && /\boperator\b/.test(label)) ||
    findRow(label => /\boperator\b/.test(label) && !/later/.test(label)) ||
    findRow(label => label === 'shipping line' || label === 'line' || label === 'company');
  const launchedRow = findRow(label => label === 'launched' || label === 'launch date' || label.startsWith('launched '));
  const builtRow = findRow(label => label === 'built' || label.startsWith('built '));
  const completedRow = findRow(label => label === 'completed' || label === 'completion' || label === 'entered service');

  const h1 = clean($('h1').first().text()) || titleTag.split(/\s+[|—]\s+/)[0];
  const canonical = $('link[rel="canonical"]').attr('href');
  let url = origin + physicalUrl(path);
  if (canonical) {
    try { url = new URL(canonical, origin).href; } catch {}
  }

  const rawBuilder = builderRow?.value || null;
  const identities = rawBuilder ? builderEntries(rawBuilder) : [];
  const launchText = launchedRow?.value || builtRow?.value || null;
  const launchYear = launchText?.match(/\b(?:18|19|20)\d{2}\b/)?.[0] || null;
  const operatorFromSubtitle = subtitleOperator(subtitle);
  const operator = operatorRow?.value || operatorFromSubtitle || null;

  records.push({
    path,
    url,
    ship: h1,
    builder: rawBuilder,
    builderIdentities: identities,
    operator,
    operatorSource: operatorRow ? `facts:${operatorRow.label}` : operatorFromSubtitle ? 'subtitle' : null,
    launched: launchText,
    launchYear,
    completed: completedRow?.value || null
  });
}

const builders = new Map();
for (const record of records) {
  for (const identity of record.builderIdentities) {
    if (!builders.has(identity.canonicalKey)) {
      builders.set(identity.canonicalKey, {
        key: identity.canonicalKey,
        canonicalName: identity.canonicalName,
        names: new Set(),
        rawValues: new Set(),
        locations: new Set(),
        notes: new Set(),
        operators: new Set(),
        ships: []
      });
    }
    const entry = builders.get(identity.canonicalKey);
    entry.names.add(identity.name);
    entry.rawValues.add(identity.raw);
    identity.locations.forEach(location => entry.locations.add(location));
    identity.notes.forEach(note => entry.notes.add(note));
    if (record.operator) entry.operators.add(record.operator);
    if (!entry.ships.some(ship => ship.url === record.url)) {
      entry.ships.push({ ship: record.ship, url: record.url, launchYear: record.launchYear, operator: record.operator, builderRaw: record.builder });
    }
  }
}

const builderGroups = [...builders.values()].map(entry => {
  const years = entry.ships.map(ship => Number(ship.launchYear)).filter(Number.isFinite).sort((a, b) => a - b);
  return {
    key: entry.key,
    canonicalName: entry.canonicalName,
    names: [...entry.names].sort(),
    rawValues: [...entry.rawValues].sort(),
    locations: [...entry.locations].sort(),
    notes: [...entry.notes].sort(),
    operators: [...entry.operators].sort(),
    shipCount: entry.ships.length,
    firstLaunchYear: years[0] || null,
    lastLaunchYear: years.at(-1) || null,
    ships: entry.ships.sort((a, b) => (Number(a.launchYear || 9999) - Number(b.launchYear || 9999)) || a.ship.localeCompare(b.ship))
  };
}).sort((a, b) => b.shipCount - a.shipCount || a.canonicalName.localeCompare(b.canonicalName));

const missing = {
  builder: records.filter(record => !record.builderIdentities.length).map(record => ({ ship: record.ship, path: record.path })),
  operator: records.filter(record => !record.operator).map(record => ({ ship: record.ship, path: record.path })),
  launched: records.filter(record => !record.launched).map(record => ({ ship: record.ship, path: record.path }))
};

const variantGroups = builderGroups.filter(group => group.names.length > 1 || group.rawValues.length > 1 || group.locations.length > 1 || group.notes.length > 1);
const suspiciousLaunchYears = records.filter(record => record.launched && !record.launchYear).map(record => ({ ship: record.ship, path: record.path, launched: record.launched }));
const operatorFallbacks = records.filter(record => record.operatorSource === 'subtitle').map(record => ({ ship: record.ship, path: record.path, operator: record.operator }));

const summary = {
  trackedShipHtmlFiles: paths.length,
  shipGuides: records.length,
  canonicalBuilders: builderGroups.length,
  guidesWithBuilder: records.length - missing.builder.length,
  guidesMissingBuilder: missing.builder.length,
  guidesMissingOperator: missing.operator.length,
  operatorValuesRecoveredFromSubtitle: operatorFallbacks.length,
  guidesMissingLaunch: missing.launched.length,
  builderVariantGroups: variantGroups.length,
  suspiciousLaunchDatesWithoutYear: suspiciousLaunchYears.length
};

const report = {
  generatedAt: new Date().toISOString(),
  source: 'Tracked ships/*.html pages identified as Ship Guides',
  summary,
  missing,
  operatorFallbacks,
  suspiciousLaunchYears,
  variantGroups,
  builders: builderGroups,
  records,
  skipped
};

const publicData = {
  generatedAt: report.generatedAt,
  summary: {
    shipGuides: summary.shipGuides,
    canonicalBuilders: summary.canonicalBuilders,
    guidesWithBuilder: summary.guidesWithBuilder
  },
  builders: builderGroups.map(builder => ({
    id: builder.key.replace(/\s+/g, '-'),
    name: builder.canonicalName,
    shipCount: builder.shipCount,
    locations: builder.locations,
    firstLaunchYear: builder.firstLaunchYear,
    lastLaunchYear: builder.lastLaunchYear,
    ships: builder.ships.map(ship => ({
      name: ship.ship,
      url: ship.url.replace(origin, ''),
      launchYear: ship.launchYear,
      operator: ship.operator,
      builderRaw: ship.builderRaw
    }))
  }))
};

await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'builders-audit.json'), JSON.stringify(report, null, 2));
await writeFile(publicDataPath, JSON.stringify(publicData, null, 2));

console.log('Shipbuilder audit');
console.log(JSON.stringify(summary, null, 2));
if (missing.builder.length) console.log('Missing builder:', missing.builder.slice(0, 25));
if (missing.operator.length) console.log('Missing operator:', missing.operator.slice(0, 25));
if (missing.launched.length) console.log('Missing launched:', missing.launched.slice(0, 25));
if (variantGroups.length) console.log('Builder naming/location variants:', variantGroups.slice(0, 25).map(group => ({
  key: group.key,
  canonicalName: group.canonicalName,
  names: group.names,
  rawValues: group.rawValues,
  locations: group.locations,
  notes: group.notes,
  shipCount: group.shipCount
})));
