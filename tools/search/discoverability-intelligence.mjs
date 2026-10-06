import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const origin = 'https://oceanliners.net';

const trackedHtml = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter(path => !path.startsWith('tools/') && !path.startsWith('partials/'));

const baselineSurfaces = new Set([
  'index.html',
  'start-here.html',
  'explore.html',
  'search.html',
  'site-map.html',
  'sitemap.html',
  'collections.html',
  'comparative-liner-history.html',
  'evidence-methodology.html',
  'ships/ships.html'
]);

function cleanRoute(pathname) {
  let route = pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  if (route.length > 1) route = route.replace(/\/$/, '');
  return route || '/';
}

function internalRoute(raw, baseRoute = '/') {
  try {
    const url = new URL(raw, new URL(baseRoute.endsWith('/') ? baseRoute : baseRoute + '/', origin));
    if (!['oceanliners.net', 'www.oceanliners.net'].includes(url.hostname)) return null;
    return cleanRoute(url.pathname);
  } catch {
    return null;
  }
}

const evidenceMethodologyPages = new Set([
  'evidence-methodology.html',
  'gross-tonnage-is-not-weight.html',
  'how-to-distinguish-ocean-liners-with-the-same-name.html',
  'how-to-identify-an-ocean-liner-refit-from-a-photograph.html',
  'how-to-track-a-renamed-or-transferred-ocean-liner.html',
  'how-to-weigh-conflicting-ocean-liner-sources.html',
  'trial-speed-vs-service-speed-on-ocean-liners.html',
  'why-maiden-voyage-dates-conflict.html',
  'why-ocean-liner-casualty-totals-differ.html',
  'why-ocean-liner-passenger-capacities-change.html',
  'why-ocean-liner-specifications-disagree.html'
]);

function pageCategory(path, $, title) {
  const combined = `${title} ${$('body').text().slice(0, 8000)}`;
  if (path.startsWith('ships/') && /ship guide/i.test(combined) && path !== 'ships/ships.html') return 'ship-guide';
  if (path.startsWith('collections/')) return 'collection';
  if (/^why-.*(?:-still)?-matters\.html$/i.test(path) || /^Why .* Matters/i.test(title) || /^Why .* Still Matters/i.test(title)) return 'bridge-page';
  if (evidenceMethodologyPages.has(path)) return 'evidence-methodology';
  if (
    path === 'comparative-liner-history.html' ||
    /-vs-/.test(path) ||
    /design-evolution\.html$/i.test(path) ||
    /flagship-study\.html$/i.test(path)
  ) return 'comparative-history';
  if (/hub/i.test(title) || /(?:titanic|white-star-line|cunard).*hub/i.test(combined)) return 'hub';
  return 'article-reference';
}

const sitemapXml = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const sitemapRoutes = new Set(
  [...sitemapXml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map(match => internalRoute(match[1]))
    .filter(Boolean)
);

const pages = [];
for (const path of trackedHtml.sort()) {
  const html = await readFile(resolve(root, path), 'utf8');
  const $ = load(html);
  const robots = String($('meta[name="robots"]').attr('content') || '');
  const refresh = $('meta[http-equiv="refresh" i]').length > 0;
  const isTemplate = /(?:^|\/).*template.*\.html$/i.test(path);
  if (/noindex/i.test(robots) || refresh || isTemplate) continue;

  const physicalRoute = cleanRoute('/' + path);
  const rawCanonical = $('link[rel="canonical"]').attr('href');
  const canonicalRoute = rawCanonical ? internalRoute(rawCanonical, physicalRoute) : physicalRoute;
  if (!canonicalRoute) continue;

  const title = $('h1').first().text().replace(/\s+/g, ' ').trim()
    || $('title').text().replace(/\s+/g, ' ').trim()
    || canonicalRoute;

  const clone = load(html);
  clone('script, style, noscript, template, nav, footer, header, #site-header, .secondary-nav, .site-nav, .footer, form, button, input, select, textarea, [hidden], [aria-hidden="true"]').remove();
  const main = clone('main').length ? clone('main') : clone('body');
  const text = main.text().replace(/\s+/g, ' ').trim();
  const category = pageCategory(path, $, title);

  pages.push({
    path,
    physicalRoute,
    route: canonicalRoute,
    title,
    category,
    baselineSurface: baselineSurfaces.has(path),
    searchEligible: text.length >= 100,
    sitemapListed: sitemapRoutes.has(canonicalRoute),
    canonicalDiffersFromPhysical: canonicalRoute !== physicalRoute,
    inbound: []
  });
}

const byRoute = new Map();
for (const page of pages) {
  if (!byRoute.has(page.route) || page.physicalRoute === page.route) byRoute.set(page.route, page);
}

for (const source of pages) {
  const html = await readFile(resolve(root, source.path), 'utf8');
  const $ = load(html);
  $('script, style, noscript, template, nav, footer, header, #site-header, .secondary-nav, .site-nav, .footer').remove();
  const seen = new Set();

  $('a[href]').each((_, element) => {
    const href = String($(element).attr('href') || '').trim();
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|javascript:)/i.test(href)) return;
    const route = internalRoute(href, source.route);
    if (!route || route === source.route || seen.has(route)) return;
    const target = byRoute.get(route);
    if (!target) return;
    seen.add(route);
    target.inbound.push({
      sourcePath: source.path,
      sourceRoute: source.route,
      sourceCategory: source.category,
      sourceBaseline: source.baselineSurface
    });
  });
}

const priorityCategories = new Set([
  'collection',
  'comparative-history',
  'evidence-methodology',
  'bridge-page'
]);

const records = pages.map(page => {
  const editorial = page.inbound.filter(link => !link.sourceBaseline);
  const baseline = page.inbound.filter(link => link.sourceBaseline);
  const byCategory = {};
  for (const link of editorial) byCategory[link.sourceCategory] = (byCategory[link.sourceCategory] || 0) + 1;
  return {
    path: page.path,
    route: page.route,
    title: page.title,
    category: page.category,
    searchEligible: page.searchEligible,
    sitemapListed: page.sitemapListed,
    canonicalDiffersFromPhysical: page.canonicalDiffersFromPhysical,
    inboundTotal: page.inbound.length,
    editorialInbound: editorial.length,
    baselineInbound: baseline.length,
    byCategory,
    sources: editorial.slice().sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))
  };
}).sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

const priority = records.filter(record => priorityCategories.has(record.category) && record.searchEligible);
const sitemapMissing = priority.filter(record => !record.sitemapListed);
const editorialOrphans = priority.filter(record => record.editorialInbound === 0);
const weak = priority.filter(record => record.editorialInbound === 1);
const strong = priority.filter(record => record.editorialInbound >= 3);

const categories = {};
for (const record of records) {
  if (!categories[record.category]) categories[record.category] = { pages: 0, searchEligible: 0, sitemapListed: 0, editorialInbound: 0 };
  const group = categories[record.category];
  group.pages += 1;
  if (record.searchEligible) group.searchEligible += 1;
  if (record.sitemapListed) group.sitemapListed += 1;
  group.editorialInbound += record.editorialInbound;
}
for (const group of Object.values(categories)) {
  group.averageEditorialInbound = group.pages ? Number((group.editorialInbound / group.pages).toFixed(2)) : 0;
}

const feed = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  methodology: {
    purpose: 'Measure structural discoverability of indexable Ocean Liner Curator pages beyond ship-guide-only linkage intelligence.',
    priorityCategories: [...priorityCategories],
    notes: [
      'Baseline discovery surfaces such as Search, Explore, Research Collections, Comparative Liner History, Evidence & Methodology, Start Here, and the Ship Archive are counted separately from editorial links.',
      'A page can be technically discoverable through the sitemap or a hub while still being weakly integrated editorially.',
      'Low inbound counts are signals for review, not instructions to invent links. Contextual links should reflect documented historical or thematic relationships.',
      'Search eligibility approximates the production Pagefind build by excluding noindex/redirect/template pages and requiring substantive page text.'
    ]
  },
  summary: {
    trackedHtml: trackedHtml.length,
    indexablePages: records.filter(record => record.searchEligible).length,
    priorityPages: priority.length,
    priorityMissingFromSitemap: sitemapMissing.length,
    priorityEditorialOrphans: editorialOrphans.length,
    priorityWithOneEditorialInbound: weak.length,
    priorityWithThreePlusEditorialInbound: strong.length
  },
  categories,
  signals: {
    missingFromSitemap: sitemapMissing,
    editorialOrphans,
    weaklyLinked: weak
  },
  pages: records
};

await mkdir(resolve(root, 'data'), { recursive: true });
await writeFile(resolve(root, 'data/curatoros-discoverability.json'), JSON.stringify(feed, null, 2) + '\n');

console.log('Discoverability intelligence');
console.log(JSON.stringify(feed.summary, null, 2));
