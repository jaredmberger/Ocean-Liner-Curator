// Regression checks for the winter On This Day chronology.
// Run: node --test tests/this-day-winter.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = (context, file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const files = ['assets/this-day-ocean-liners.js', 'assets/this-day-ocean-liners-additions-2.js', 'assets/this-day-ocean-liners-winter-2026.js'];
function getChronology() {
  const context = vm.createContext({ window: {} });
  load(context, files[0]);
  load(context, files[1]);
  const before = Object.fromEntries(Object.entries(context.window.OCEAN_LINER_THIS_DAY).map(([k, v]) => [k, v.length]));
  load(context, files[2]);
  return { context, before, data: context.window.OCEAN_LINER_THIS_DAY };
}
test('scripts parse and add exactly 50 distinct entries without dropping existing history', () => {
  const { context, before, data } = getChronology();
  let added = 0;
  for (const [date, events] of Object.entries(data)) {
    assert.match(date, /^\d{2}-\d{2}$/);
    assert.ok(Array.isArray(events));
    assert.ok(events.length >= (before[date] || 0), 'lost original events on ' + date);
    added += events.length - (before[date] || 0);
    for (const e of events) {
      assert.ok(Number.isInteger(e.year));
      assert.ok(e.title && e.ship && e.summary);
      assert.ok(Array.isArray(e.sources) && e.sources.length);
    }
  }
  assert.equal(added, 50);
  load(context, files[2]);
  for (const [date, events] of Object.entries(data)) {
    const fresh = context.window.OCEAN_LINER_THIS_DAY[date];
    assert.equal(fresh.length, events.length, 'non-idempotent reload on ' + date);
  }
});
test('linked ship guides exist', () => {
  const { data, before } = getChronology();
  for (const [date, events] of Object.entries(data)) for (const e of events.slice(before[date] || 0)) {
    if (!e.relatedUrl) continue;
    assert.match(e.relatedUrl, /^\/ships\/[a-z0-9-]+$/);
    assert.ok(fs.existsSync(path.join(root, e.relatedUrl.slice(1) + '.html')), 'missing guide ' + e.relatedUrl);
  }
});
test('both public pages load the winter supplement after the baseline', () => {
  for (const page of ['ships/ships.html', 'this-day-in-ocean-liner-history.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const a = html.indexOf('/assets/this-day-ocean-liners.js');
    const b = html.indexOf('/assets/this-day-ocean-liners-additions-2.js');
    const c = html.indexOf('/assets/this-day-ocean-liners-winter-2026.js');
    assert.ok(a >= 0 && a < b && b < c, 'wrong script order: ' + page);
  }
});
