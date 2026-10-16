#!/usr/bin/env node
/**
 * CuratorOS stewardship MVP: read-only observations from existing audits.
 * Produces review candidates; it never edits site content or opens PRs.
 */
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const output = resolve(dir, 'dist/stewardship');
await mkdir(output, { recursive: true });

function execute(name, args) {
  return execFileSync(process.execPath, [resolve(dir,name), ...args], {
    cwd: resolve(dir,'../..'), encoding: 'utf8', maxBuffer: 32*1024*1024
  });
}
function finding(type, scope, description, evidence, severity='review') {
  return {
    id: createHash('sha256').update(type+'|'+scope).digest('hex').slice(0,20),
    type, scope, severity, status: 'needs-human-review', description, evidence
  };
}
const errors = [];
let urls = null, links = null;
try {
  execute('search-url-integrity-audit.mjs', []);
  urls = JSON.parse(await readFile(resolve(dir,'dist/search-url-integrity-report.json'),'utf8'));
} catch (e) { errors.push({audit:'canonical',error:String(e.message).slice(0,500)}); }
try { links = JSON.parse(execute('internal-link-audit.mjs',['--json'])); }
catch (e) { errors.push({audit:'internal-links',error:String(e.message).slice(0,500)}); }

const findings = [];
if (urls) {
  for (const r of urls.findings ?? []) {
    findings.push(finding('canonical:'+r.kind, r.file,
      'Review canonical URL of '+r.file,
      {physical:r.physical ?? null,canonical:r.canonical ?? null,destinationFiles:r.destinationFiles ?? []},
      r.severity === 'error' ? 'high' : 'review'));
  }
}
if (links) {
  for (const pair of links.destinationCategories?.needsRouteOrRedirectReview ?? []) {
    findings.push(finding('link:route-review',pair,'Verify route or redirect for internal link',{sourceDestination:pair}));
  }
  for (const page of links.pages ?? []) {
    if (page.contextual === 0) findings.push(finding('discovery:no-static-context',page.path,
      'Review lack of static contextual incoming links (not proof of an orphan)',
      {incoming:page.incoming,fromShipIndex:page.fromShipIndex},'informational'));
  }
}
findings.sort((a,b)=>a.type.localeCompare(b.type)||a.scope.localeCompare(b.scope));
const counts = findings.reduce((n,f)=>(n[f.severity]=(n[f.severity]||0)+1,n),{});
const report = {
  schemaVersion:1,
  project:'Ocean Liner Curator',
  generatedAt:new Date().toISOString(),
  mode:'read-only',
  policy:'Observations are candidates, not verified historical or production errors. No content modification without human review.',
  auditHealth: errors.length ? 'incomplete' : 'complete',
  counts, errors, findings
};
await writeFile(resolve(output,'findings.json'),JSON.stringify(report,null,2)+'\n');
const groups = findings.filter(f=>f.severity!=='informational');
const markdown = [
  '# CuratorOS Stewardship Review',
  '',
  'Generated: '+report.generatedAt,
  '',
  '**Mode:** read-only. Every observation requires human review.',
  '',
  '**Audit health:** '+report.auditHealth,
  '',
  '**Counts:** '+JSON.stringify(counts),
  '',
  '## Errors', '',
  errors.length ? errors.map(e=>'- '+e.audit+': '+e.error).join('\n') : 'None.',
  '', '## Priority review candidates (up to 75)', '',
  ...groups.slice(0,75).map(f=>'- **'+f.severity+'** `'+f.type+'` — `'+f.scope+'` (id: `'+f.id+'`)'),
  '', '## Interpretation', '',
  '- Reported links may resolve through Cloudflare redirects or runtime routes.',
  '- Zero static contextual links is not evidence that a page is undiscoverable.',
  '- This report is a snapshot, not a historical trend or an automatically maintained case queue.',
  '- Editorial and historical corrections require independent verification and explicit approval.'
].join('\n');
await writeFile(resolve(output,'review.md'),markdown+'\n');
console.log(JSON.stringify({auditHealth:report.auditHealth,findings:findings.length,counts,output}));
if (errors.length) process.exitCode=1;
