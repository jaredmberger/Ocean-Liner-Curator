import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile, rm, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import * as pagefind from 'pagefind';
import { normalizeTitleKey, normalizeShipName } from './search-engine.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const output = resolve(here, 'dist');
const origin = 'https://oceanliners.net';
const paths = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(p => p.endsWith('.html') && !p.startsWith('tools/'));
const report = { scanned: paths.length, indexed: 0, skipped: [], duplicates: [], canonicalConflicts: [] };
const documents = new Map();
const cleanPath = p => p.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

for (const path of paths.sort()) {
  const $ = load(await readFile(resolve(root, path), 'utf8'));
  if (/noindex/i.test($('meta[name="robots"]').attr('content') || '') || $('meta[http-equiv="refresh" i]').length || path === 'ocean-liner-search.html' || path.includes('template')) {
    report.skipped.push({ path, reason: 'Search, redirect, or noindex page' }); continue;
  }
  const physical = cleanPath('/' + path);
  const rawCanonical = $('link[rel="canonical"]').attr('href');
  let url = physical;
  if (rawCanonical) {
    const canonical = new URL(rawCanonical, origin);
    if (!['oceanliners.net', 'www.oceanliners.net'].includes(canonical.hostname)) { report.skipped.push({path, reason: 'External canonical'}); continue; }
    url = cleanPath(canonical.pathname);
  }
  const pageTitle = $('title').text().trim().split(/\s+[|—]\s+/)[0];
  $('h1 br').replaceWith(' ');
  let title = $('h1').first().text().replace(/\s+/g, ' ').trim() || pageTitle;
  const type = path.startsWith('ships/') && /ship guide/i.test($('title').text() + ' ' + $('.subtitle').first().text()) && !/\/(ships|index)\.html$/.test(path) ? 'Ship guide' : /hub/i.test($('title').text()) ? 'Hub' : 'Article & reference';
  const year = $('.subtitle').first().text().match(/\b(?:18|19|20)\d{2}\b/)?.[0];
  const titleAlreadyHasYear = /\b(?:18|19|20)\d{2}\b/.test(title);
  if (type === 'Ship guide' && year && !titleAlreadyHasYear) title += ` (${year})`;
  $('script, style, noscript, nav, footer, form, button, input, select, textarea, template, [hidden], [aria-hidden="true"], [role="dialog"], #site-header, .secondary-nav, .ask-gpt-wrap, .about-link, .gpt-modal').remove();
  const body = $('main').length ? $('main') : $('body');
  body.find('h1').remove();
  const text = body.text().replace(/\s+/g, ' ').trim();
  if (text.length < 100 || !title) { report.skipped.push({path, reason: 'Insufficient article text'}); continue; }

  const titleSources = [title, pageTitle, title.replace(/\([^)]*\)$/,'').trim()].filter(Boolean);
  const titleKeys = [...new Set(titleSources.map(normalizeTitleKey).filter(Boolean))];
  const titleFilters = titleKeys.map(key => `<meta data-pagefind-filter="title_key[content]" content="${escape(key)}">`).join('');

  const names = type === 'Ship guide'
    ? [...new Set(titleSources.map(normalizeShipName).filter(Boolean))]
    : [];
  const shipFilters = names.map(name => `<meta data-pagefind-filter="ship[content]" content="${escape(name)}">`).join('');

  const html = `<html lang="en"><head><title>${escape(title)}</title>${shipFilters}${titleFilters}</head><body><main data-pagefind-body><h1 data-pagefind-meta="title" data-pagefind-weight="5">${escape(title)}</h1><span data-pagefind-meta="type" data-pagefind-filter="type">${type}</span>${body.html()}</main></body></html>`;
  const doc = {path, url, title, type, html, text};
  const previous = documents.get(url);
  if (previous) {
    report.duplicates.push({url, paths:[previous.path, path]});
    if (previous.title !== title) report.canonicalConflicts.push({url, titles:[previous.title,title]});
    // Prefer the file whose physical route agrees with the declared canonical.
    if (physical === url && cleanPath('/' + previous.path) !== url) documents.set(url, doc);
  } else documents.set(url, doc);
}

await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
const { index } = await pagefind.createIndex({forceLanguage:'en'});
try {
  for (const doc of documents.values()) {
    const result = await index.addHTMLFile({url: origin + doc.url, content: doc.html});
    if (result.errors?.length) throw new Error(result.errors.join('\n'));
  }
  const result = await index.writeFiles({outputPath: resolve(output, 'pagefind')});
  if (result.errors?.length) throw new Error(result.errors.join('\n'));
  report.indexed = documents.size;
  await writeFile(resolve(output, 'index-report.json'), JSON.stringify(report, null, 2));
  for (const file of ['index.html', 'search.css', 'search.js', 'search-engine.js']) await copyFile(resolve(here, file), resolve(output,file));
  console.log(JSON.stringify(report, null, 2));
} finally { await pagefind.close(); }
