import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const origin = 'https://oceanliners.net';

const operators = JSON.parse(await readFile(resolve(root, 'data/curatoros-operators.json'), 'utf8'));
const ships = (operators.ships || []).map(ship => ({
  name: ship.name,
  path: ship.path,
  url: ship.url,
  slug: String(ship.url || ship.path || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/ships\//, '').replace(/\.html?$/i, '').replace(/^\/+|\/+$/g, '')
})).filter(ship => ship.slug);

const byRoute = new Map(ships.map(ship => [`/ships/${ship.slug}`, ship]));
const trackedHtml = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean).filter(path => !path.startsWith('tools/'));

const baselineSurfaces = new Set([
  'ships/ships.html',
  'sitemap.html',
  'site-map.html',
  'search.html',
  'explore.html'
]);

function cleanRoute(pathname) {
  let route = pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  if (route.length > 1) route = route.replace(/\/$/, '');
  return route || '/';
}

function sourceCategory(path) {
  if (path.startsWith('ships/')) return 'ship-guide';
  if (path.startsWith('collections/')) return 'collection';
  if (
    /(?:^|\/)(?:cunard-line|white-star-line|titanic|history-of-|timelines-history|designs-interiors|shipyards|harland-wolff-builder-proof-of-concept)/.test(path)
  ) return 'hub-history';
  if (path === 'index.html' || path === 'start-here.html') return 'discovery-surface';
  return 'article-reference';
}

const inbound = new Map(ships.map(ship => [ship.slug, []]));

for (const path of trackedHtml) {
  const html = await readFile(resolve(root, path), 'utf8');
  const $ = load(html);
  $('script, style, noscript, template, nav, footer, header, #site-header, .secondary-nav, .site-nav, .footer').remove();

  const sourceRoute = cleanRoute('/' + path);
  const category = baselineSurfaces.has(path) ? 'baseline-surface' : sourceCategory(path);
  const seenOnPage = new Set();

  $('a[href]').each((_, element) => {
    const href = String($(element).attr('href') || '').trim();
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|javascript:)/i.test(href)) return;

    let url;
    try {
      url = new URL(href, new URL(sourceRoute.endsWith('/') ? sourceRoute : sourceRoute + '/', origin));
    } catch {
      return;
    }
    if (!['oceanliners.net', 'www.oceanliners.net'].includes(url.hostname)) return;

    const targetRoute = cleanRoute(url.pathname);
    const ship = byRoute.get(targetRoute);
    if (!ship || targetRoute === sourceRoute) return;

    const key = ship.slug;
    if (seenOnPage.has(key)) return;
    seenOnPage.add(key);

    inbound.get(key).push({
      sourcePath: path,
      sourceRoute,
      sourceCategory: category
    });
  });
}

const records = ships.map(ship => {
  const links = inbound.get(ship.slug) || [];
  const editorial = links.filter(link => link.sourceCategory !== 'baseline-surface' && link.sourceCategory !== 'discovery-surface');
  const byCategory = {};
  for (const link of editorial) byCategory[link.sourceCategory] = (byCategory[link.sourceCategory] || 0) + 1;
  return {
    name: ship.name,
    slug: ship.slug,
    url: `/ships/${ship.slug}`,
    inboundTotal: links.length,
    editorialInbound: editorial.length,
    baselineInbound: links.filter(link => link.sourceCategory === 'baseline-surface').length,
    discoverySurfaceInbound: links.filter(link => link.sourceCategory === 'discovery-surface').length,
    byCategory,
    sources: editorial
      .slice()
      .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))
  };
}).sort((a, b) => a.editorialInbound - b.editorialInbound || a.name.localeCompare(b.name));

const orphaned = records.filter(record => record.editorialInbound === 0);
const weak = records.filter(record => record.editorialInbound === 1);
const strong = records.filter(record => record.editorialInbound >= 3);
const totalEditorialLinks = records.reduce((sum, record) => sum + record.editorialInbound, 0);

const summary = {
  shipGuides: records.length,
  editorialOrphans: orphaned.length,
  oneEditorialInbound: weak.length,
  threePlusEditorialInbound: strong.length,
  totalEditorialInboundLinks: totalEditorialLinks,
  averageEditorialInbound: records.length ? Number((totalEditorialLinks / records.length).toFixed(2)) : 0
};

const feed = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  methodology: {
    purpose: 'Measure meaningful inbound HTML links to ship guides beyond the master archive, sitemap, and generic discovery surfaces.',
    exclusions: [
      'Global navigation, headers, and footers are removed before counting.',
      'The Ship Archive, sitemap, search, and Explore pages are baseline surfaces and do not count as editorial inbound links.',
      'Each source page counts at most once per target ship even if it links to that ship multiple times.'
    ],
    caution: 'A low inbound count is a discoverability signal, not evidence that additional links should be invented. New links should reflect a documented historical or thematic relationship.'
  },
  summary,
  orphanedShips: orphaned,
  weaklyLinkedShips: weak,
  ships: records
};

await mkdir(resolve(root, 'data'), { recursive: true });
await writeFile(resolve(root, 'data/curatoros-inbound-links.json'), JSON.stringify(feed, null, 2) + '\n');

console.log('Inbound-link intelligence');
console.log(JSON.stringify(summary, null, 2));
