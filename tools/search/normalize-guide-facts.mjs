import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const clean = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

function rowHtml(label, value) {
  return `\n        <div class="fact-row">\n          <div class="fact-label">${label}</div>\n          <div class="fact-value">${value}</div>\n        </div>`;
}

// France already records both dates, but in one compound row that the structured-data
// extractor cannot distinguish safely. Split the row without changing either fact.
{
  const path = 'ships/ss-france-1912.html';
  const file = resolve(root, path);
  let source = await readFile(file, 'utf8');
  if (!/<div\s+class=["']fact-label["'][^>]*>Launched<\/div>/i.test(source)) {
    const compound = /<div\s+class=["']fact-row["'][^>]*>\s*<div\s+class=["']fact-label["'][^>]*>Laid down \/ launched \(commonly cited\)<\/div>\s*<div\s+class=["']fact-value["'][^>]*>Laid down Feb 1909 · launched 20 Sep 1910<\/div>\s*<\/div>/i;
    if (!compound.test(source)) throw new Error(`${path}: expected combined launch row not found`);
    source = source.replace(compound,
      `${rowHtml('Laid down (commonly cited)', 'February 1909')}${rowHtml('Launched', '20 September 1910')}`
    );
    await writeFile(file, source, 'utf8');
    console.log(`${path}: split laid-down and launch facts`);
  } else {
    console.log(`${path}: launch fact already normalized`);
  }
}

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

for (const fix of fixes) {
  const file = resolve(root, fix.path);
  const source = await readFile(file, 'utf8');
  const $ = load(source, { decodeEntities: false });
  const labels = factLabels($);
  const wanted = clean(fix.label);
  if (labels.some(label => label === wanted || label.startsWith(wanted + ' '))) {
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

  // Serialize only the facts fragment; the rest of each legacy guide remains byte-for-byte unchanged.
  const originalFactsMatch = source.match(/<div\s+class=["']facts["'][^>]*>[\s\S]*?<\/div>\s*(?=<h2|<p\s+class=["']note|<div\s+class=["']mini-badge|<\/div>)/i);
  if (!originalFactsMatch) {
    const anchorLabels = fix.insertAfter || [];
    let updated = source;
    let inserted = false;
    for (const preferred of anchorLabels) {
      const rowPattern = new RegExp(`(<div\\s+class=["']fact-row["'][^>]*>[\\s\\S]*?<div\\s+class=["']fact-label["'][^>]*>[^<]*${preferred}[^<]*<\\/div>[\\s\\S]*?<div\\s+class=["']fact-value["'][^>]*>[\\s\\S]*?<\\/div>\\s*<\\/div>)`, 'i');
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

  const serializedFacts = $.html(facts);
  const updated = source.replace(originalFactsMatch[0], serializedFacts);
  await writeFile(file, updated, 'utf8');
  console.log(`${fix.path}: added ${fix.label}`);
}
