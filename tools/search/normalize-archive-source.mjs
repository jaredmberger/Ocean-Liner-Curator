import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const archivePath = resolve(root, 'ships/ships.html');

let html = await readFile(archivePath, 'utf8');
const before = html;

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function replaceCardDescription(source, href, description) {
  const articlePattern = new RegExp(
    `(<article\\s+class=["']guide-card["'][\\s\\S]*?<a\\s+class=["']guide-title["']\\s+href=["']${escapeRegExp(href)}["'][\\s\\S]*?</article>)`,
    'i'
  );

  if (!articlePattern.test(source)) {
    throw new Error(`Archive card not found for ${href}`);
  }

  return source.replace(articlePattern, article => {
    const descPattern = /<p\s+class=["']guide-desc["'][^>]*>[\s\S]*?<\/p>/i;
    if (!descPattern.test(article)) {
      throw new Error(`Archive description not found for ${href}`);
    }
    return article.replace(descPattern, `<p class="guide-desc">${description}</p>`);
  });
}

const correctedDescriptions = {
  '/ships/rms-carpathia.html': 'A Cunard liner best remembered for rescuing <em>Titanic</em>’s survivors on 15 April 1912; she was later torpedoed and sunk by U-55 in 1918.',
  '/ships/ss-catalonia.html': 'A Cunard transatlantic steamship of the early 1880s, representative of the line’s practical passenger-and-cargo service.',
  '/ships/ss-duchess-of-atholl.html': 'One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.',
  '/ships/ss-duchess-of-bedford.html': 'One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.',
  '/ships/ss-duchess-of-richmond.html': 'One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.',
  '/ships/ss-duchess-of-york.html': 'One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.'
};

for (const [href, description] of Object.entries(correctedDescriptions)) {
  html = replaceCardDescription(html, href, description);
}

// Derive the archive span from the card data rather than maintaining a second manual date range.
const years = [...html.matchAll(/data-year=["'](\d{4})["']/g)].map(match => Number(match[1])).filter(Number.isFinite);
if (!years.length) throw new Error('No archive data-year values found');
const firstYear = Math.min(...years);
const lastYear = Math.max(...years);
const span = `${firstYear}–${lastYear}`;
const description = `Browse 300+ ocean liner ship guides spanning ${span}, including Cunard, White Star, French Line, and more—curated with evidence-first standards.`;

// Keep exactly one ordinary meta description and align schema wording to the same computed span.
html = html.replace(/\s*<meta\s+name=["']description["'][^>]*>\s*/gi, '\n');
html = html.replace(/(<title>[^<]*<\/title>)/i, `$1\n<meta name="description" content="${description}" />`);
html = html.replace(/Browse 300\+ ocean liner ship guides spanning \d{4}–\d{4}, including Cunard, White Star, French Line, and more—curated with evidence-first standards\./g, description);

// Canonical/social metadata should point at the same public archive URL.
html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'][^"']+["']\s*\/?>/i,
  '<meta property="og:url" content="https://oceanliners.net/ships/ships">');

// Avoid exposing a stale hard-coded count before the live counter runs.
html = html.replace(
  /(<div\s+class=["']archive-badge__note["']\s+id=["']badgeNote["']>)[\s\S]*?(<\/div>)/i,
  '$1\n      Calculating archive coverage…\n    $2'
);

// The UI promises description search, so include card descriptions in the archive search haystack.
const oldSearchFunction = /function getSearchText\(card\)\{\s*return norm\(\[\s*getTitle\(card\),\s*getMeta\(card\)\s*\]\.join\(" "\)\);\s*\}/;
if (!oldSearchFunction.test(html)) {
  throw new Error('Archive getSearchText() shape changed; refusing to patch search silently');
}
html = html.replace(oldSearchFunction, `function getSearchText(card){\n  return norm([\n    getTitle(card),\n    getMeta(card),\n    card.querySelector(".guide-desc")?.textContent || ""\n  ].join(" "));\n}`);

if (html === before) {
  console.log('Ship Archive source already normalized.');
} else {
  await writeFile(archivePath, html, 'utf8');
  console.log(`Normalized Ship Archive source (${Object.keys(correctedDescriptions).length} card descriptions; span ${span}).`);
}
