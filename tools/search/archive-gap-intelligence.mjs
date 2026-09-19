import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const slugFromUrl = value => clean(value).replace(/^https?:\/\/[^/]+/i, '').replace(/^\/ships\//, '').replace(/\.html?$/i, '').replace(/^\/+|\/+$/g, '');

const [operators, yards, eras, classes, relationshipBase, relationshipPhase2, relationshipEnhancements] = await Promise.all([
  readFile(resolve(root, 'data/curatoros-operators.json'), 'utf8').then(JSON.parse),
  readFile(resolve(root, 'data/curatoros-yards.json'), 'utf8').then(JSON.parse),
  readFile(resolve(root, 'data/curatoros-eras.json'), 'utf8').then(JSON.parse),
  readFile(resolve(root, 'data/curatoros-classes-sisters.json'), 'utf8').then(JSON.parse),
  readFile(resolve(root, 'assets/related-liners.js'), 'utf8'),
  readFile(resolve(root, 'assets/related-liners-phase2.js'), 'utf8'),
  readFile(resolve(root, 'assets/related-liners-enhancements.js'), 'utf8')
]);

const relationshipSource = [relationshipBase, relationshipPhase2, relationshipEnhancements].join('\n');

const ships = (operators.ships || []).map(ship => ({
  name: ship.name,
  path: ship.path,
  url: ship.url,
  slug: slugFromUrl(ship.url || ship.path),
  operator: ship.operator,
  launchYear: ship.launchYear || null
})).filter(ship => ship.slug);

const relationshipCovered = new Set(
  ships
    .filter(ship =>
      relationshipSource.includes(`"/ships/${ship.slug}`) ||
      relationshipSource.includes(`'/ships/${ship.slug}`) ||
      relationshipSource.includes(`"${ship.slug}"`) ||
      relationshipSource.includes(`'${ship.slug}'`)
    )
    .map(ship => ship.slug)
);

const uncovered = ships.filter(ship => !relationshipCovered.has(ship.slug));

const operatorStats = new Map();
for (const ship of ships) {
  if (!operatorStats.has(ship.operator)) operatorStats.set(ship.operator, { name: ship.operator, total: 0, covered: 0, uncovered: [] });
  const group = operatorStats.get(ship.operator);
  group.total += 1;
  if (relationshipCovered.has(ship.slug)) group.covered += 1;
  else group.uncovered.push({ name: ship.name, slug: ship.slug, url: ship.url, launchYear: ship.launchYear });
}

const operatorCoverage = [...operatorStats.values()]
  .map(group => ({
    ...group,
    uncoveredCount: group.uncovered.length,
    coveragePct: Number(((group.covered / group.total) * 100).toFixed(1))
  }))
  .sort((a, b) => b.uncoveredCount - a.uncoveredCount || b.total - a.total || a.name.localeCompare(b.name));

const thinOperators = operatorCoverage
  .filter(group => group.total <= 2)
  .map(group => ({
    operator: group.name,
    shipCount: group.total,
    note: 'Thin archive representation; research signal only, not proof of historical underrepresentation.'
  }))
  .sort((a, b) => a.shipCount - b.shipCount || a.operator.localeCompare(b.operator));

const eraCoverage = (eras.eras || []).map(era => {
  const slugs = (era.ships || []).map(ship => slugFromUrl(ship.url || ship.path)).filter(Boolean);
  const covered = slugs.filter(slug => relationshipCovered.has(slug)).length;
  return {
    era: era.name,
    shipCount: slugs.length,
    relationshipCovered: covered,
    relationshipUncovered: slugs.length - covered,
    relationshipCoveragePct: slugs.length ? Number(((covered / slugs.length) * 100).toFixed(1)) : null
  };
}).sort((a, b) => a.shipCount - b.shipCount || a.era.localeCompare(b.era));

const decadeCoverage = (eras.decades || []).map(decade => {
  const slugs = (decade.ships || []).map(ship => slugFromUrl(ship.url || ship.path)).filter(Boolean);
  const covered = slugs.filter(slug => relationshipCovered.has(slug)).length;
  return {
    decade: decade.name,
    shipCount: slugs.length,
    relationshipCovered: covered,
    relationshipUncovered: slugs.length - covered,
    relationshipCoveragePct: slugs.length ? Number(((covered / slugs.length) * 100).toFixed(1)) : null
  };
}).sort((a, b) => Number(String(a.decade).replace(/\D/g, '')) - Number(String(b.decade).replace(/\D/g, '')));

const yardMissing = (yards.ships || [])
  .filter(ship => !(ship.assignments || []).length)
  .map(ship => ({ name: ship.name, path: ship.path, url: ship.url, launchYear: ship.launchYear || null }));

const unresolvedSisterMentions = (classes.unresolvedSisterMentions || []).map(item => ({
  ship: item.ship,
  path: item.path,
  mentioned: item.mentioned,
  candidateCount: item.candidateCount,
  signal:
    item.candidateCount === 0
      ? 'Possible missing archive ship, alternate name, or unresolved wording'
      : 'Ambiguous archive match; identity disambiguation needed'
}));

const sisterCandidates = unresolvedSisterMentions
  .filter(item => item.candidateCount === 0)
  .slice()
  .sort((a, b) => a.ship.localeCompare(b.ship) || a.mentioned.localeCompare(b.mentioned));

const relationshipResearchCandidates = operatorCoverage
  .filter(group => group.uncoveredCount > 0)
  .flatMap(group => group.uncovered.map(ship => ({
    type: 'relationship-gap',
    ship: ship.name,
    slug: ship.slug,
    url: ship.url,
    operator: group.name,
    signalStrength: group.total >= 5 ? 'high-context' : 'normal',
    rationale: group.total >= 5
      ? `Unlinked ship within a well-represented operator group of ${group.total} archive guides; worth checking for class, running-mate, route, or succession links.`
      : 'Unlinked ship; retain as unlinked unless a specific historical relationship can be documented.'
  })));

const summary = {
  shipGuides: ships.length,
  relationshipCovered: relationshipCovered.size,
  relationshipUncovered: uncovered.length,
  relationshipCoveragePct: Number(((relationshipCovered.size / ships.length) * 100).toFixed(1)),
  canonicalOperators: Number(operators.summary?.canonicalOperators || operatorCoverage.length),
  thinOperators: thinOperators.length,
  canonicalYardLocations: Number(yards.summary?.canonicalYardLocations || 0),
  guidesWithoutDocumentedYard: yardMissing.length,
  eras: Number(eras.summary?.eras || eraCoverage.length),
  decades: Number(eras.summary?.decades || decadeCoverage.length),
  canonicalClasses: Number(classes.summary?.canonicalClasses || 0),
  explicitSisterLinks: Number(classes.summary?.explicitSisterLinks || 0),
  unresolvedSisterMentions: unresolvedSisterMentions.length,
  unresolvedSisterMentionsWithNoArchiveMatch: sisterCandidates.length
};

const feed = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  methodology: {
    purpose: 'Surface internal archive signals that merit research without treating low counts as proof of historical underrepresentation.',
    cautions: [
      'Operator, era, yard, and relationship counts describe Ocean Liner Curator, not the historical universe of ocean liners.',
      'A thin category is a research signal, not an automatic recommendation to add content.',
      'Unresolved sister-ship mentions may reflect alternate names, wording noise, or genuinely missing archive ships and require human verification.',
      'Relationship gaps should remain unfilled when no specific, historically meaningful connection can be documented.'
    ]
  },
  summary,
  signals: {
    sisterShipResearchCandidates: sisterCandidates,
    unresolvedSisterMentions,
    yardDocumentationGaps: yardMissing,
    relationshipResearchCandidates,
    thinOperatorRepresentation: thinOperators
  },
  coverage: {
    operators: operatorCoverage,
    eras: eraCoverage,
    decades: decadeCoverage
  },
  relationshipUncoveredShips: uncovered.map(ship => ({
    name: ship.name,
    slug: ship.slug,
    url: ship.url,
    operator: ship.operator,
    launchYear: ship.launchYear
  }))
};

await mkdir(resolve(root, 'data'), { recursive: true });
await writeFile(resolve(root, 'data/curatoros-archive-gaps.json'), JSON.stringify(feed, null, 2) + '\n');

console.log('Archive gap intelligence');
console.log(JSON.stringify(summary, null, 2));
