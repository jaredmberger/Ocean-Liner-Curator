#!/usr/bin/env node
/**
 * Read-only internal discoverability audit.
 *
 * Run: node tools/search/internal-link-audit.mjs
 * Optional: node tools/search/internal-link-audit.mjs --json
 *
 * Static HTML anchors only. Shared header, client-rendered links, redirects,
 * and links inferred from navigation scripts are outside this report.
 * A low count is a review candidate, not a search-engine orphan finding.
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)]
  .map(match => match[1].trim())
  .filter(url => { try { return new URL(url).hostname === 'oceanliners.net'; } catch { return false; } });

function normalize(raw, base = 'https://oceanliners.net/') {
  try {
    const u = new URL(raw.replace(/&amp;/g, '&'), base);
    if (!['oceanliners.net', 'www.oceanliners.net'].includes(u.hostname)) return null;
    let pathname = decodeURI(u.pathname).replace(/\/index\.html?$/i, '/').replace(/\.html?$/i, '');
    pathname = pathname.replace(/\/+$/, '') || '/';
    return pathname;
  } catch { return null; }
}
const targets = new Set(urls.map(url => normalize(url)).filter(Boolean));

async function visit(dir, output) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      if (['node_modules', 'dist', 'vendor', '.git'].includes(item.name)) continue;
      await visit(path, output);
    } else if (item.isFile() && /\.html?$/i.test(item.name)) {
      output.push(path);
    }
  }
}
const files = [];
await visit(root, files);
// Physical HTML routes include files intentionally omitted from the sitemap.
const physicalRoutes = new Set(files.map(file => {
  const pathname = '/' + relative(root, file).split('\\').join('/').replace(/[.]html?$/i, '').replace(/\/index$/i, '');
  return normalize(pathname === '/index' ? '/' : pathname);
}).filter(Boolean));
const incoming = new Map([...targets].map(path => [path, new Set()]));
const fromArchive = new Map([...targets].map(path => [path, new Set()]));
const unresolved = new Map();
let matchedPages = 0;
for (const file of files) {
  const sourcePath = '/' + relative(root, file).replaceAll('\\', '/').replace(/\.html?$/i, '').replace(/\/index$/i, '');
  const source = normalize(sourcePath === '/index' ? '/' : sourcePath);
  if (!targets.has(source)) continue;
  matchedPages++;
  const html = await readFile(file, 'utf8');
  const links = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)]
    .map(match => match[1] ?? match[2]);
  const destinations = new Set(links.map(link => normalize(link, 'https://oceanliners.net' + source + (source.endsWith('/') ? '' : '/'))).filter(Boolean));
  for (const destination of destinations) {
    if (destination === source) continue;
    if (targets.has(destination)) {
      incoming.get(destination).add(source);
      if (source === '/ships/ships') fromArchive.get(destination).add(source);
    } else if (!/\.(?:png|jpe?g|webp|gif|svg|pdf|xml|css|js|ico)$/i.test(destination)) {
      const key = source + ' -> ' + destination;
      unresolved.set(key, (unresolved.get(key) || 0) + 1);
    }
  }
}
const destinationCategories = { existingHtmlNotInSitemap: [], needsRouteOrRedirectReview: [] };
for (const pair of [...unresolved.keys()].sort()) {
  const destination = pair.slice(pair.indexOf(' -> ') + 4);
  const category = physicalRoutes.has(destination)
    ? 'existingHtmlNotInSitemap'
    : 'needsRouteOrRedirectReview';
  destinationCategories[category].push(pair);
}
const rows = [...targets].map(path => ({
  path,
  incoming: incoming.get(path).size,
  contextual: [...incoming.get(path)].filter(p => p !== '/ships/ships').length,
  fromShipIndex: fromArchive.get(path).size > 0
})).sort((a, b) => a.contextual - b.contextual || a.incoming - b.incoming || a.path.localeCompare(b.path));
const metrics = {
  sitemapUrls: urls.length,
  uniqueNormalizedUrls: targets.size,
  matchedHtmlFiles: matchedPages,
  withZeroStaticIncoming: rows.filter(row => row.incoming === 0).length,
  withZeroContextualIncoming: rows.filter(row => row.contextual === 0).length,
  unlistedDestinationPairs: unresolved.size,
  existingHtmlNotInSitemapPairs: destinationCategories.existingHtmlNotInSitemap.length,
  routeOrRedirectReviewPairs: destinationCategories.needsRouteOrRedirectReview.length
};
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ metrics, pages: rows, unlistedDestinations: [...unresolved.keys()].sort(), destinationCategories }, null, 2));
} else {
  console.log('Internal link audit (read only; static HTML anchors only)');
  console.log(JSON.stringify(metrics, null, 2));
  console.log('\nLow-contextual-link review candidates (first 30):');
  console.log('Context | All | In ship index | Path');
  for (const row of rows.slice(0, 30)) {
    console.log([String(row.contextual).padStart(7), String(row.incoming).padStart(3), row.fromShipIndex ? 'yes' : ' no', row.path].join(' | '));
  }
  console.log('\nFor full results: node tools/search/internal-link-audit.mjs --json');
  console.log('Note: zero static links does not establish that a page is truly orphaned; shared navigation and client-generated links are not analyzed.');
}
