#!/usr/bin/env node
/**
 * Read-only, conservative inventory of static editorial links from ship guides
 * to non-ship research pages. A candidate count, not an assertion of quality.
 * Run: node tools/search/research-connectivity-audit.mjs [--json]
 */
import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*([^<]+)<\/loc>/g)].map(m => m[1].trim());
const normalized = raw => {
  try {
    const u = new URL(raw, 'https://oceanliners.net/');
    if (!['oceanliners.net', 'www.oceanliners.net'].includes(u.hostname)) return null;
    return u.pathname.replace(/\/index\.html?$/i, '/').replace(/\.html?$/i, '').replace(/\/+$/, '') || '/';
  } catch { return null; }
};
const targets = new Set(urls.map(normalized).filter(Boolean));
const ships = [...targets].filter(p => p.startsWith('/ships/') && p !== '/ships/ships').sort();
const excluded = new Set(['/', '/sources', '/ships/ships', '/search', '/explore', '/about', '/contact', '/attribution', '/provenance']);
const rows = [];
for (const ship of ships) {
  const file = join(root, ship.slice(1) + '.html');
  let html;
  try { html = await readFile(file, 'utf8'); }
  catch { rows.push({ ship, status: 'unresolved-file', researchTargets: [] }); continue; }
  // Avoid shared chrome, footers, and bibliographies. This deliberately only
  // measures pages with a recognizable .guide wrapper and Sources heading.
  const start = html.search(/<div\s+class=["']guide["']/i);
  const heading = start < 0 ? -1 : html.slice(start).search(/<h2[^>]*>\s*Sources\b/i);
  if (start < 0 || heading < 0) {
    rows.push({ ship, status: 'review-template', researchTargets: [] });
    continue;
  }
  const editorial = html.slice(start, start + heading);
  const found = new Set();
  for (const match of editorial.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const destination = normalized(match[1] ?? match[2]);
    if (destination && targets.has(destination) && !destination.startsWith('/ships/') && !excluded.has(destination)) found.add(destination);
  }
  rows.push({ ship, status: 'scanned', researchTargets: [...found].sort() });
}
const scanned = rows.filter(r => r.status === 'scanned');
const metrics = {
  shipRoutes: ships.length,
  scanned: scanned.length,
  templateReview: rows.filter(r => r.status === 'review-template').length,
  unresolvedFiles: rows.filter(r => r.status === 'unresolved-file').length,
  scannedWithNoStaticResearchLink: scanned.filter(r => r.researchTargets.length === 0).length,
  totalUniqueShipToResearchPairs: scanned.reduce((n, r) => n + r.researchTargets.length, 0)
};
if (process.argv.includes('--json')) console.log(JSON.stringify({ metrics, ships: rows }, null, 2));
else {
  console.log('Research connectivity candidate audit (read-only, static anchors only)');
  console.log(JSON.stringify(metrics, null, 2));
  console.log('\nFirst 30 scanned guides with no static research link:');
  console.log(scanned.filter(r => r.researchTargets.length === 0).slice(0, 30).map(r => r.ship).join('\n'));
  console.log('\nUse --json for all rows. This is not proof that a ship lacks contextual links; other templates and dynamic links are excluded.');
}
