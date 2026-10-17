# Google Search Console stewardship — ingestion foundation

This is an **offline, read-only adapter**, not a live Google Search Console connection.
GSC Wizard currently cannot be used under the connected account's subscription state.
The adapter avoids fabricating indexing statuses or treating traffic drops as penalties.

From a trusted Google URL Inspection JSON export shaped as `{"inspections":[...]}`, run:

```bash
node tools/search/stewardship-gsc-import.mjs /path/to/inspections.json
node tools/search/stewardship-gsc-import.test.mjs
```

It writes `tools/search/dist/stewardship/gsc-review-candidates.json`.
Only OceanLiners.net HTTPS URLs are accepted. Signals such as explicit inspection failure,
reported indexing block, fetch error, or Google/user canonical disagreement become
human-review candidates with supporting fields. PASS or missing statuses do not
create issues. The importer does not inspect URLs or call Google.

**Current limitation:** These candidates are not automatically delivered to the
production CuratorOS queue. A later authenticated ingestion step must use a
validated, current inspection source and preserve lifecycle semantics; blindly
sending a partial inspection set could incorrectly resolve unrelated cases.
Do not copy an entire old inspection history into a live scanner.

Google Search Console's Search Analytics traffic reporting is separate from the
URL Inspection API. A traffic decline alone is not proof of manual action,
index exclusion, crawl errors or an algorithmic penalty.

No secret is required or stored, and no source content is edited.
