import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');

const clean = value => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Guide HTML is authoritative. This script intentionally performs no writes.
// It verifies the structured facts that were formerly injected during builds.
const expectedFacts = [
  ['ships/rms-lucania.html', 'Builder', 'Fairfield Shipbuilding & Engineering Co., Govan, Scotland'],
  ['ships/ss-macedonia.html', 'Builder', 'Malcolmson & Co., Waterford'],
  ['ships/ss-adriatic-1872.html', 'Launched', '17 October 1871'],
  ['ships/ss-nieuw-amsterdam-1906.html', 'Launched', '28 September 1905'],
  ['ships/ss-president-lincoln.html', 'Launched', '8 October 1903'],
  ['ships/ss-asturias-1925.html', 'Operator', 'Royal Mail Steam Packet Company / Royal Mail Lines'],
  ['ships/ss-batavia.html', 'Operator', 'Hamburg America Line'],
  ['ships/ss-belgravia.html', 'Operator', 'Hamburg America Line'],
  ['ships/ss-bismarck-1914.html', 'Operator', 'Hamburg America Line'],
  ['ships/ss-brasilia.html', 'Operator', 'Hamburg America Line'],
  ['ships/ss-bulgaria.html', 'Operator', 'Hamburg America Line'],
  ['ships/ss-commonwealth.html', 'Operator', 'Dominion Line'],
  ['ships/ss-drottningholm.html', 'Operator', 'Swedish American Line'],
  ['ships/ss-eastland.html', 'Operator (original)', 'Michigan Steamship Company'],
  ['ships/ss-empress-of-france.html', 'Operator', 'Canadian Pacific'],
  ['ships/ss-new-england.html', 'Operator', 'Dominion Line'],
  ['ships/ss-pennland.html', 'Operator', 'Red Star Line'],
  ['ships/ss-poland.html', 'Operator', 'Atlantic Transport Line; later operated for Red Star Line and White Star Line'],
  ['ships/ss-rijndam-1901.html', 'Operator', 'Holland America Line'],
  ['ships/ss-storstad.html', 'Operator', 'A. F. Klaveness'],
  ['ships/ss-westernland.html', 'Operator', 'Red Star Line']
];

async function loadFacts(path) {
  const source = await readFile(resolve(root, path), 'utf8');
  const $ = load(source, { decodeEntities: false });
  const facts = $('.facts').first();
  assert(facts.length, `${path}: facts table not found`);

  const rows = facts.find('.fact-row').map((_, row) => ({
    label: clean($(row).find('.fact-label').first().text()),
    value: clean($(row).find('.fact-value').first().text())
  })).get();

  return { source, $, facts, rows };
}

for (const [path, label, value] of expectedFacts) {
  const { rows } = await loadFacts(path);
  const wantedLabel = clean(label);
  const wantedValue = clean(value);
  const row = rows.find(item => item.label === wantedLabel);

  assert(row, `${path}: required source fact “${label}” is missing`);
  assert(
    row.value === wantedValue,
    `${path}: “${label}” has unexpected source value. Expected “${value}”; found “${row.value}”.`
  );
}

// France formerly stored these dates in one compound row. Both must now be
// explicit source facts so downstream extraction never has to rewrite the page.
{
  const path = 'ships/ss-france-1912.html';
  const { rows } = await loadFacts(path);
  const laidDown = rows.find(item => item.label === clean('Laid down (commonly cited)'));
  const launched = rows.find(item => item.label === clean('Launched'));

  assert(laidDown, `${path}: separate laid-down fact is missing`);
  assert(laidDown.value === clean('February 1909'), `${path}: laid-down source value is unexpected`);
  assert(launched, `${path}: separate launch fact is missing`);
  assert(launched.value === clean('20 September 1910'), `${path}: launch source value is unexpected`);
  assert(
    !rows.some(item => item.label === clean('Laid down / launched (commonly cited)')),
    `${path}: obsolete compound laid-down/launch fact returned`
  );
}

console.log(`Verified ${expectedFacts.length + 2} authoritative structured guide facts.`);
console.log('Guide fact build step is verification-only; ships/*.html remains authoritative.');
