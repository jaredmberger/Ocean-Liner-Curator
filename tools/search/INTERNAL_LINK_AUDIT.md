# Internal navigation audit

Run from the repository root (Node.js 22+):

```sh
node tools/search/internal-link-audit.mjs
node tools/search/internal-link-audit.mjs --json > internal-link-audit.json
```

The audit reads the published `sitemap.xml` and HTML files, and counts **unique source pages** with explicit `<a href>` links to each listed destination. URLs are normalized for optional `.html`, `/index.html`, and trailing slashes. It additionally subtracts links from the ship-archive index from a **contextual incoming** count, since the index can make every guide seem adequately linked.

Interpretation:
- **0 incoming**: no static link found among scanned sitemap HTML files. This is only a review candidate.
- **0 contextual**: any static incoming links come only from the ship archive index (or none at all).
- **Unlisted destinations** in JSON: links whose paths did not match the sitemap, *not* necessarily broken URLs. Static assets are ignored. Redirects, aliases and excluded pages can be valid.\n- **destinationCategories.existingHtmlNotInSitemap**: a target matches a physical HTML page found in the repository; investigate whether sitemap inclusion is appropriate, but do not assume it is missing incorrectly.\n- **destinationCategories.needsRouteOrRedirectReview**: no directly matching physical HTML file was found. Check redirects, aliases and deployed routing before calling these broken links.
- Script-injected navigation (including the shared header and Related Liners), JSON-LD URLs, externally hosted sites, and dynamically rendered links are **not** counted.
- The script does not write source files, fetch the network, modify the sitemap, or fail the build. Use the output to select a small number of editorial linking improvements, verify destinations separately, and remeasure after changes.

This is a diagnostic only. Do not label any page orphaned or change content based solely on these numbers.
