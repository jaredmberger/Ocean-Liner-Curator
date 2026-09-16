import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const clean = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

const fixes = [
  {
    path: 'ships/rms-lucania.html',
    label: 'Builder',
    value: 'Fairfield Shipbuilding & Engineering Co., Glasgow',
    insertAfter: ['operator']
  },
  {
    path: 'ships/ss-macedonia.html',
    label: 'Builder',
    value: 'Sir James Laing & Sons, Sunderland',
    insertAfter: ['operator', 'owner']
  },
  {
    path: 'ships/ss-adriatic-1872.html',
    label: 'Launched',
    value: '17 October 1871',
    insertAfter: ['builder']
  },
  {
    path: 'ships/ss-nieuw-amsterdam-1906.html',
    label: 'Launched',
    value: '28 September 1905',
    insertAfter: ['builder']
  },
  {
    path: 'ships/ss-president-lincoln.html',
    label: 'Launched',
    value: '8 October 1903',
    insertAfter: ['builder']
  }
];

function factLabels($) {
  return $('.fact-row .fact-label').map((_, el) => clean($(el).text())).get();
}

function rowHtml(label, value) {
  return `\n        <div class="fact-row">\n          <div class="fact-label">${label}</div>\n          <div class="fact-value">${value}</div>\n        </div>`;
}

for (const fix of fixes) {
  const file = resolve(root, fix.path);
  const source = await readFile(file, 'utf8');
  const $ = load(source, { decodeEntities: false });
  const labels = factLabels($);
  const wanted = clean(fix.label);
  if (labels.some(label => label === wanted || label.startsWith(wanted + ' ') || label.includes('/ ' + wanted))) {
    console.log(`${fix.path}: ${fix.label} already present`);
    continue;
  }

  const facts = $('.facts').first();
  if (!facts.length) throw new Error(`${fix.path}: facts table not found`);
  let anchor = null;
  for (const preferred of fix.insertAfter || []) {
    const match = facts.find('.fact-row').filter((_, el) => clean($(el).find('.fact-label').first().text()).includes(preferred)).first();
    if (match.length) { anchor = match; break; }
  }
  if (anchor && anchor.length) anchor.after(rowHtml(fix.label, fix.value));
  else facts.prepend(rowHtml(fix.label, fix.value));

  // Cheerio serialization would reformat the whole legacy guide. Replace only the facts block in source.
  const originalFactsMatch = source.match(/<div\s+class=["']facts["'][^>]*>[\s\S]*?<\/div>\s*(?=<h2|<p\s+class=["']note|<div\s+class=["']mini-badge|<\/div>)/i);
  if (!originalFactsMatch) {
    // Fall back to a narrow string insertion around the chosen label rather than rewriting the page.
    const anchorLabels = fix.insertAfter || [];
    let updated = source;
    let inserted = false;
    for (const preferred of anchorLabels) {
      const rowPattern = new RegExp(`(<div\\s+class=["']fact-row["'][^>]*>[\\s\\S]*?<div\\s+class=["']fact-label["'][^>]*>[^<]*${preferred}[^<]*<\\/div>[\\s\\S]*?<\\/div>\\s*<\\/div>)`, 'i');
      if (rowPattern.test(updated)) {
        updated = updated.replace(rowPattern, `$1${rowHtml(fix.label, fix.value)}`);
        inserted = true;
        break;
      }
    }
    if (!inserted) throw new Error(`${fix.path}: could not safely locate insertion point`);
    await writeFile(file, updated, 'utf8');
    console.log(`${fix.path}: added ${fix.label}`);
    continue;
  }

  // Safer direct DOM-fragment replacement: serialize only .facts, preserving the rest of the document byte-for-byte.
  const serializedFacts = $.html(facts);
  const updated = source.replace(originalFactsMatch[0], serializedFacts);
  await writeFile(file, updated, 'utf8');
  console.log(`${fix.path}: added ${fix.label}`);
}
