# Ocean Liner Curator search trial

An isolated Pagefind experiment using the repository's HTML. Nothing in this
directory is connected to the production homepage or the existing Cloudflare
search. No AI service, credentials, or per-query API calls are used.

## Build and try

From a full checkout (Node 22.12 or later):

```sh
npm ci --prefix tools/search
npm run build --prefix tools/search
npm test --prefix tools/search
python3 -m http.server 8765 --directory tools/search/dist
```

Open http://localhost:8765. Serve over HTTP: ES modules and WASM will not work
by double-clicking the HTML file. The trial's result links open the live articles.

## Indexing

- Reads tracked HTML; respects noindex and refresh redirects; excludes templates,
  the previous search page, and files without substantive content.
- Treats www and apex oceanliners.net canonicals as the same site.
- Deduplicates canonical routes, preferring the file at the matching physical
  path. Reports conflicting titles for manual review rather than silently fixing
  the source. Trial reports are generated in dist/index-report.json.
- Uses main content where present and removes script/style/navigation/footer,
  form controls, hidden material, and shared GPT prompts from indexing copies.
- Creates ship-name filters from guide titles and includes the existing subtitle's
  year to distinguish namesakes. These years retain each source page's convention;
  they are not independently verified launch dates.
- Exact ship-name matches precede ordinary relevance results, without duplicate
  result IDs. Full-word matching for single-word submissions prevents unrelated
  short-prefix matches. Partial names and typos need further evaluation.
- Search loads only after submitting a query or selecting an example; six excerpts
  appear per batch. DOM output uses textContent for titles and excerpts.

## Validation and limits

The generated Pagefind WASM engine is tested directly in Node with file-backed
fetch. query-report.json records the top six results for 11 searches, timings, and
bytes read. Timings are local engine timings, not browser/network performance.
Explicit checks cover Olympic's first result, three Britannic guides, subject
coverage, a no-result query, and duplicate result IDs.

The cloud browser could not reach the local HTTP server (ERR_BLOCKED_BY_CLIENT),
so rendered layout, keyboard interaction, loading/error states, Web Worker mode,
and Safari/iPad/phone behavior have NOT been verified. Do that before rollout.

This is keyword search with ship-name prioritization, not semantic AI search.
Source coverage is HTML only; downloadable PDFs are not separately indexed.
Some topical pages retain related-reading text, which may affect relevance.

## Updating and eventual integration

The companion workflow rebuilds and checks a downloadable preview artifact on
relevant pull requests and main-branch pushes. It does not publish the index.
For production, put the index build in the site's actual deployment pipeline so
the HTML and index deploy together. Copy the generated Pagefind bundle to a
dedicated public asset path and adapt the scoped search section to the homepage.
Keep tools/search, dependencies, and reports out of deployed assets.

Before enabling: verify mobile rendering, index load size on a cold connection,
deployment build command and cache behavior, and canonical result URLs on the
live site. Regular build/hosting usage still applies, although search has no
metered AI calls. Do not merge this trial as a substitute for that integration.
