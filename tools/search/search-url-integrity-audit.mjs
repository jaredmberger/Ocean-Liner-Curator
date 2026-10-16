// Read-only audit of the URLs emitted by the Pagefind search builder.
// Canonical paths are the source of search-result links; validate them against tracked pages.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const origin = 'https://oceanliners.net';
const tracked = execFileSync('git', ['ls-files', '-z'], {cwd:root, encoding:'utf8'}).split('\0').filter(Boolean);
const htmlFiles = tracked.filter(p => p.endsWith('.html') && !p.startsWith('tools/'));
const route = path => ('/' + path).replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
const destinations = new Map();
for (const file of htmlFiles) {
  const r = route(file);
  if (!destinations.has(r)) destinations.set(r, []);
  destinations.get(r).push(file);
}
const rows = [];
for (const file of htmlFiles) {
  const $ = load(await readFile(resolve(root,file), 'utf8'));
  const canonicalText = $('link[rel="canonical"]').first().attr('href')?.trim();
  if (!canonicalText) continue;
  let canonical;
  try { canonical = new URL(canonicalText, origin); }
  catch { rows.push({severity:'error',kind:'invalid-canonical',file,canonical:canonicalText}); continue; }
  if (!['oceanliners.net','www.oceanliners.net'].includes(canonical.hostname)) continue;
  const physical = route(file);
  const declared = canonical.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (declared !== physical) {
    rows.push({
      severity: destinations.has(declared) ? 'review' : 'error',
      kind: destinations.has(declared) ? 'canonical-points-to-different-file' : 'canonical-route-not-found',
      file,physical,canonical:canonicalText,searchResultRoute:declared,
      destinationFiles:destinations.get(declared) || []
    });
  }
  if (canonical.search || canonical.hash) rows.push({severity:'review',kind:'canonical-has-query-or-fragment',file,canonical:canonicalText});
}
const report = {
  description:'Repository route audit for canonical URLs used by the Pagefind search builder. A reported missing route may be served by a runtime redirect or rewrite; inspect before fixing.',
  trackedHtml:htmlFiles.length,
  canonicalMismatches:rows.filter(r=>r.kind==='canonical-route-not-found').length,
  reviewCount:rows.filter(r=>r.severity==='review').length,
  invalidCanonicals:rows.filter(r=>r.kind==='invalid-canonical').length,
  findings:rows
};
await mkdir(resolve(here,'dist'),{recursive:true});
await writeFile(resolve(here,'dist/search-url-integrity-report.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({trackedHtml:report.trackedHtml,canonicalMismatches:report.canonicalMismatches,reviewCount:report.reviewCount,invalidCanonicals:report.invalidCanonicals,findings:rows.slice(0,40)},null,2));
// The baseline is an explicit temporary inventory of unresolved pre-existing metadata.
// New missing routes fail CI, and removing a baseline entry makes its fix permanent.
const legacyFiles = new Set([
  // Submission paths require a separate routes/visibility review.
  "community/submissions/art.html",
  "community/submissions/thanks.html",
  // Source template is intentionally excluded from the Pagefind builder.
  "reference-objects/object-template.html"
]);
const introduced = rows.filter(row => (row.kind === 'canonical-route-not-found' || row.kind === 'invalid-canonical') && !legacyFiles.has(row.file));
if (process.argv.includes('--enforce') && introduced.length) {
  console.error('New broken canonical routes outside the legacy baseline:', JSON.stringify(introduced,null,2));
  process.exitCode = 1;
}

