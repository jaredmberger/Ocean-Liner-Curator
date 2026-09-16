import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const dist = resolve(here, 'dist');
const audit = JSON.parse(await readFile(resolve(dist, 'builders-audit.json'), 'utf8'));
const archiveHtml = await readFile(resolve(root, 'ships/ships.html'), 'utf8');
const operatorAliases = JSON.parse(await readFile(resolve(here, 'operator-aliases.json'), 'utf8'));

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalize = value => clean(value)
  .normalize('NFD').replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[’‘]/g, "'")
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function canonicalOperator(raw) {
  const text = clean(raw);
  if (!text) return null;
  const candidates = [
    text,
    text.replace(/\s*\([^)]*\)\s*$/, '').trim(),
    text.split(';')[0].trim(),
    text.split('/')[0].trim()
  ].filter(Boolean);
  for (const candidate of [...new Set(candidates)]) {
    const mapped = operatorAliases[normalize(candidate)];
    if (mapped) return mapped;
  }
  return text;
}

function physicalPath(path) {
  return '/' + path.replace(/\.html$/, '').replace(/^\//, '');
}

const records = audit.records || [];
const recordsByPath = new Map();
const recordsByUrl = new Map();
for (const record of records) {
  recordsByPath.set(physicalPath(record.path), record);
  try {
    const url = new URL(record.url);
    recordsByUrl.set(url.pathname.replace(/\/$/, ''), record);
  } catch {}
}

// These are duplicate guide identities already represented by the long-established
// archive-linked guide. They must not cause the audit to request a second archive card.
const duplicateGuideIdentities = new Map([
  ['/ships/ss-monarch-of-bermuda', ['/ships/monarch-of-bermuda']],
  ['/ships/ss-columbia', ['/ships/ss-columbia-anchor-line']]
]);

const $ = load(archiveHtml);
const archiveCards = [];
$('.guide-card').each((_, element) => {
  const card = $(element);
  const link = card.find('.guide-title[href]').first();
  const hrefRaw = link.attr('href') || '';
  let href = hrefRaw.replace(/\.html$/, '').replace(/\/$/, '');
  if (!href.startsWith('/')) href = '/' + href;
  const meta = clean(card.find('.guide-meta').first().text());
  const description = clean(card.find('.guide-desc').first().text());
  const dataLine = clean(card.attr('data-line'));
  const dataYear = clean(card.attr('data-year'));
  const metaParts = meta.split('·').map(clean).filter(Boolean);
  const metaLine = metaParts[0] || null;
  const metaYear = metaParts.find(part => /^(?:18|19|20)\d{2}$/.test(part)) || null;
  archiveCards.push({ href, hrefRaw, title: clean(link.text()), description, dataLine: dataLine || null, dataYear: dataYear || null, metaLine, metaYear });
});

const specialArchiveHrefs = new Set(['/ships/tall-ships-guide']);
const specialArchiveReferences = archiveCards
  .filter(card => specialArchiveHrefs.has(card.href))
  .map(card => ({ title: card.title, href: card.hrefRaw, dataYear: card.dataYear, meta: [card.metaLine, card.metaYear].filter(Boolean).join(' · ') || null }));

const matchedGuidePaths = new Set();
const archiveWithoutGuide = [];
const archiveYearConventionDifferences = [];
const archiveOperatorDifferences = [];
const archiveYearSelfMismatches = [];
const archiveLinePresentationDifferences = [];

for (const card of archiveCards) {
  if (specialArchiveHrefs.has(card.href)) continue;
  const record = recordsByPath.get(card.href) || recordsByUrl.get(card.href);
  if (!record) {
    archiveWithoutGuide.push({ title: card.title, href: card.hrefRaw });
    continue;
  }
  matchedGuidePaths.add(record.path);

  // Mark known duplicate guide files as represented by the same archive identity.
  for (const duplicateHref of duplicateGuideIdentities.get(card.href) || []) {
    const duplicateRecord = recordsByPath.get(duplicateHref) || recordsByUrl.get(duplicateHref);
    if (duplicateRecord) matchedGuidePaths.add(duplicateRecord.path);
  }

  if (card.dataYear && card.metaYear && card.dataYear !== card.metaYear) {
    archiveYearSelfMismatches.push({ ship: card.title, href: card.hrefRaw, dataYear: card.dataYear, metaYear: card.metaYear });
  }

  // Archive years often represent service/name identity years rather than launch years.
  // Keep differences visible for curatorial review; never classify them as automatic errors.
  if (record.launchYear && card.dataYear && String(record.launchYear) !== String(card.dataYear)) {
    archiveYearConventionDifferences.push({
      ship: record.ship,
      path: record.path,
      guideLaunchYear: record.launchYear,
      archiveYear: card.dataYear,
      archiveMetaYear: card.metaYear
    });
  }

  const guideOperator = canonicalOperator(record.operator);
  const archiveOperator = canonicalOperator(card.dataLine || card.metaLine);
  if (guideOperator && archiveOperator && normalize(guideOperator) !== normalize(archiveOperator)) {
    archiveOperatorDifferences.push({
      ship: record.ship,
      path: record.path,
      guideOperator: record.operator,
      guideOperatorCanonical: guideOperator,
      archiveOperator: card.dataLine || card.metaLine,
      archiveOperatorCanonical: archiveOperator
    });
  }

  if (card.dataLine && card.metaLine && normalize(card.dataLine) !== normalize(card.metaLine)) {
    archiveLinePresentationDifferences.push({ ship: card.title, href: card.hrefRaw, dataLine: card.dataLine, metaLine: card.metaLine });
  }
}

const guidesMissingFromArchive = records
  .filter(record => !matchedGuidePaths.has(record.path))
  .map(record => ({ ship: record.ship, path: record.path, url: record.url }));

const canonicalCounts = new Map();
for (const record of records) {
  let canonical = null;
  try { canonical = new URL(record.url).href.replace(/\/$/, ''); } catch {}
  if (!canonical) continue;
  if (!canonicalCounts.has(canonical)) canonicalCounts.set(canonical, []);
  canonicalCounts.get(canonical).push({ ship: record.ship, path: record.path });
}
const duplicateCanonicals = [...canonicalCounts.entries()]
  .filter(([, values]) => values.length > 1)
  .map(([canonical, values]) => ({ canonical, records: values }));

const duplicateArchiveHrefs = [...archiveCards.reduce((map, card) => {
  if (!map.has(card.href)) map.set(card.href, []);
  map.get(card.href).push({ title: card.title, hrefRaw: card.hrefRaw });
  return map;
}, new Map()).entries()]
  .filter(([, values]) => values.length > 1)
  .map(([href, values]) => ({ href, cards: values }));

const titleGroups = new Map();
for (const record of records) {
  const key = normalize(record.ship);
  if (!key) continue;
  if (!titleGroups.has(key)) titleGroups.set(key, []);
  titleGroups.get(key).push({ ship: record.ship, path: record.path, launchYear: record.launchYear });
}
const repeatedNormalizedTitles = [...titleGroups.values()].filter(group => group.length > 1);

const safeStructural = {
  missingBuilder: audit.missing?.builder || [],
  missingOperator: audit.missing?.operator || [],
  missingLaunch: audit.missing?.launched || [],
  suspiciousLaunchDatesWithoutYear: audit.suspiciousLaunchYears || [],
  archiveYearSelfMismatches,
  archiveWithoutGuide,
  guidesMissingFromArchive,
  duplicateCanonicals,
  duplicateArchiveHrefs
};

const reviewRequired = {
  operatorValuesRecoveredFromSubtitle: audit.operatorFallbacks || [],
  archiveYearConventionDifferences,
  archiveOperatorDifferences,
  archiveLinePresentationDifferences,
  builderVariantGroups: (audit.variantGroups || []).map(group => ({
    canonicalName: group.canonicalName,
    names: group.names,
    rawValues: group.rawValues,
    locations: group.locations,
    notes: group.notes,
    shipCount: group.shipCount
  })),
  repeatedNormalizedTitles
};

const informational = {
  specialArchiveReferences,
  knownDuplicateGuideIdentities: [...duplicateGuideIdentities.entries()].map(([archiveHref, duplicateGuideHrefs]) => ({ archiveHref, duplicateGuideHrefs }))
};
const countItems = object => Object.values(object).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
const summary = {
  generatedAt: new Date().toISOString(),
  shipGuides: records.length,
  archiveCards: archiveCards.length,
  oceanLinerArchiveCards: archiveCards.length - specialArchiveReferences.length,
  safeStructuralIssueCount: countItems(safeStructural),
  reviewRequiredIssueCount: countItems(reviewRequired),
  archiveYearConventionDifferenceCount: archiveYearConventionDifferences.length,
  archiveOperatorDifferenceCount: archiveOperatorDifferences.length,
  guidesMissingFromArchiveCount: guidesMissingFromArchive.length,
  archiveWithoutGuideCount: archiveWithoutGuide.length,
  operatorSubtitleFallbackCount: (audit.operatorFallbacks || []).length,
  builderVariantGroupCount: (audit.variantGroups || []).length,
  specialArchiveReferenceCount: specialArchiveReferences.length,
  knownDuplicateGuideIdentityCount: duplicateGuideIdentities.size
};

const report = {
  schemaVersion: 4,
  generatedAt: summary.generatedAt,
  source: 'Ship guide facts + ships/ships.html archive cards + alias maps',
  summary,
  safeStructural,
  reviewRequired,
  informational
};

await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, 'data-quality-audit.json'), JSON.stringify(report, null, 2) + '\n');

console.log('Ship guide data quality audit');
console.log(JSON.stringify(summary, null, 2));
if (archiveYearSelfMismatches.length) console.log('Archive year self-mismatches:', archiveYearSelfMismatches.slice(0, 40));
if (guidesMissingFromArchive.length) console.log('Guides missing from archive:', guidesMissingFromArchive.slice(0, 40));
if (archiveWithoutGuide.length) console.log('Archive cards without matched guide:', archiveWithoutGuide.slice(0, 40));
if ((audit.operatorFallbacks || []).length) console.log('Operator subtitle fallbacks:', audit.operatorFallbacks.slice(0, 40));
