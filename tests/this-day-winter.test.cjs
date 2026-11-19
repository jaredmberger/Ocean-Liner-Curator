// Regression checks for the unified This Day chronology.
// Run: node --test tests/this-day-winter.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = (ctx, file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
const file = 'assets/this-day-ocean-liners.js';
const expected = [
  [
    "11-01",
    1917,
    "SS Great Northern",
    "USS Great Northern enters naval service"
  ],
  [
    "11-02",
    1903,
    "SS Manchuria",
    "SS Manchuria is launched"
  ],
  [
    "11-08",
    1939,
    "SS Southern Cross",
    "SS Southern Cross is acquired for naval service"
  ],
  [
    "11-10",
    1939,
    "SS Southern Cross",
    "SS Southern Cross is renamed Wharton"
  ],
  [
    "11-12",
    1894,
    "SS St. Louis",
    "SS St. Louis is launched"
  ],
  [
    "12-04",
    1917,
    "SS George Washington",
    "USS George Washington sails with her first troop contingent"
  ],
  [
    "12-04",
    1918,
    "SS George Washington",
    "President Wilson sails aboard USS George Washington"
  ],
  [
    "12-05",
    1931,
    "SS Manhattan",
    "SS Manhattan is launched"
  ],
  [
    "12-07",
    1940,
    "SS Southern Cross",
    "USS Wharton is commissioned"
  ],
  [
    "01-07",
    1941,
    "SS Southern Cross",
    "USS Wharton departs Brooklyn for shakedown"
  ],
  [
    "01-21",
    1918,
    "SS Great Northern",
    "USS Great Northern departs Puget Sound with passengers"
  ],
  [
    "11-03",
    1917,
    "SS Northern Pacific",
    "Northern Pacific is commissioned as a troop transport"
  ],
  [
    "11-19",
    1921,
    "SS Great Northern",
    "Great Northern is renamed Columbia"
  ],
  [
    "11-24",
    1919,
    "SS Imperator",
    "Imperator is transferred to British control"
  ],
  [
    "11-25",
    1919,
    "SS Cleveland / USS Mobile",
    "USS Mobile, formerly SS Cleveland, decommissioned"
  ],
  [
    "01-01",
    1919,
    "SS Northern Pacific",
    "Northern Pacific grounds off Fire Island"
  ],
  [
    "01-02",
    1918,
    "SS Martha Washington",
    "Former Austrian liner Martha Washington is commissioned"
  ],
  [
    "01-14",
    1942,
    "SS President Van Buren",
    "Former liner President Van Buren is acquired by the Navy"
  ],
  [
    "01-18",
    1919,
    "SS Northern Pacific",
    "Northern Pacific is refloated after grounding"
  ],
  [
    "11-07",
    1940,
    "SS City of Baltimore",
    "Former City of Baltimore commissioned as USS Heywood"
  ],
  [
    "11-13",
    1902,
    "SS John Englis",
    "Former passenger liner John Englis transfers to the U.S. Navy"
  ],
  [
    "12-11",
    1920,
    "SS Silver State",
    "Passenger-cargo liner Silver State is launched"
  ],
  [
    "01-03",
    1942,
    "SS President Jackson",
    "Former President Jackson commissioned as USS Zeilin"
  ],
  [
    "01-16",
    1942,
    "SS Washington",
    "Former SS Washington departs Singapore as USS Mount Vernon"
  ],
  [
    "11-19",
    1968,
    "RMS Queen Elizabeth 2",
    "Queen Elizabeth 2 leaves Clydebank for Greenock"
  ],
  [
    "11-30",
    1911,
    "RMS Olympic",
    "Olympic's return to service recorded in historical chronology"
  ],
  [
    "12-04",
    1975,
    "RMS Queen Elizabeth 2",
    "Queen Elizabeth 2 passes one million nautical miles"
  ],
  [
    "12-16",
    1908,
    "RMS Olympic",
    "Keel of Olympic laid in Belfast"
  ],
  [
    "12-17",
    1968,
    "RMS Queen Elizabeth 2",
    "Queen Elizabeth 2 begins a second series of sea trials"
  ],
  [
    "12-23",
    1968,
    "RMS Queen Elizabeth 2",
    "Queen Elizabeth 2 begins main sea trials"
  ],
  [
    "01-02",
    1969,
    "RMS Queen Elizabeth 2",
    "Queen Elizabeth 2 arrives in Southampton after turbine difficulties"
  ],
  [
    "01-17",
    1969,
    "RMS Queen Elizabeth 2",
    "QE2's originally scheduled maiden voyage date passes"
  ],
  [
    "12-20",
    1964,
    "RMS Queen Elizabeth 2",
    "QE2 construction contract signed at Clydebank"
  ],
  [
    "01-26",
    1931,
    "SS Normandie",
    "Keel laid for SS Normandie"
  ],
  [
    "12-11",
    1931,
    "RMS Queen Mary",
    "Construction of Queen Mary halted amid Depression"
  ],
  [
    "11-07",
    1915,
    "SS Ancona",
    "Italian liner Ancona sunk in the Mediterranean"
  ],
  [
    "01-12",
    1920,
    "SS Afrique",
    "French liner Afrique sinks in the Bay of Biscay"
  ],
  [
    "11-18",
    1918,
    "SS Santa Teresa",
    "Santa Teresa commissioned as a troop transport"
  ],
  [
    "11-18",
    1919,
    "SS Martha Washington",
    "Martha Washington leaves Navy service"
  ],
  [
    "11-28",
    1919,
    "SS George Washington",
    "George Washington decommissioned after troop voyages"
  ],
  [
    "11-28",
    1945,
    "SS König Wilhelm II (1907) / USS U.S. Grant",
    "USS U.S. Grant struck from Navy List"
  ],
  [
    "11-14",
    1945,
    "SS König Wilhelm II (1907) / USS U.S. Grant",
    "USS U.S. Grant returned to Army"
  ],
  [
    "11-12",
    1919,
    "SS George Washington",
    "George Washington returns Belgian royalty to Brest"
  ],
  [
    "12-11",
    1942,
    "SS Conte Biancamano",
    "Former Conte Biancamano returns to Norfolk as Hermitage"
  ],
  [
    "01-13",
    1942,
    "SS Washington",
    "Former SS Washington reaches Singapore"
  ],
  [
    "01-23",
    1945,
    "SS König Wilhelm II (1907) / USS U.S. Grant",
    "USS U.S. Grant departs San Francisco"
  ],
  [
    "12-04",
    1919,
    "SS Amerika / USAT America",
    "Crew unrest aboard USAT America at Brest"
  ],
  [
    "12-20",
    1919,
    "SS Amerika / USAT America",
    "USAT America considered for Shipping Board operation"
  ],
  [
    "11-07",
    1945,
    "SS König Wilhelm II (1907) / USS U.S. Grant",
    "USS U.S. Grant arrives in San Francisco"
  ],
  [
    "12-08",
    1900,
    "SS Neckar (1900)",
    "North German Lloyd passenger liner Neckar is launched"
  ]
];
function getChronology() {
  const ctx = vm.createContext({window:{}});
  load(ctx,file);
  return {ctx, data:ctx.window.OCEAN_LINER_THIS_DAY};
}
test('all 50 audited winter entries reside in the authoritative chronology exactly once',()=>{
  const {ctx,data}=getChronology();
  assert.equal(expected.length,50);
  const seen = new Set();
  for(const [date,events] of Object.entries(data)) {
    assert.match(date,/^\\d{2}-\\d{2}$/);
    assert.ok(Array.isArray(events));
    for(const e of events){
      const key=JSON.stringify([date,e.year,e.ship,e.title]);
      assert.ok(!seen.has(key),'duplicate chronology event '+key);
      seen.add(key);
    }
  }
  for(const entry of expected){
    const [date,year,ship,title]=entry;
    assert.equal((data[date]||[]).filter(e=>e.year===year&&e.ship===ship&&e.title===title).length,1,'missing or duplicate '+JSON.stringify(entry));
    const e=data[date].find(e=>e.year===year&&e.ship===ship&&e.title===title);
    assert.ok(e.summary && Array.isArray(e.sources)&&e.sources.length,'missing provenance '+title);
    if(e.relatedUrl){
      assert.match(e.relatedUrl,/^\\/ships\\/[a-z0-9-]+$/);
      assert.ok(fs.existsSync(path.join(root,e.relatedUrl.slice(1)+'.html')),'missing guide '+e.relatedUrl);
    }
  }
  assert.ok(Object.values(data).reduce((n,arr)=>n+arr.length,0)>=239,'lost original chronology entries');
  load(ctx,file);
  assert.equal(Object.values(ctx.window.OCEAN_LINER_THIS_DAY).reduce((n,arr)=>n+arr.length,0),Object.values(data).reduce((n,arr)=>n+arr.length,0));
});
test('both public pages load the authoritative file and no winter supplement',()=>{
  for(const page of ['ships/ships.html','this-day-in-ocean-liner-history.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    assert.ok(html.includes('/assets/this-day-ocean-liners.js'),'missing main chronology on '+page);
    assert.ok(!html.includes('this-day-ocean-liners-winter-2026.js'),'stale supplement on '+page);
  }
  assert.ok(!fs.existsSync(path.join(root,'assets/this-day-ocean-liners-winter-2026.js')),'obsolete winter file still present');
});
