# Stewardship: historical consistency + external source pilot

This expands the existing **read-only** CuratorOS pipeline in one sprint.

**Historical audit** reuses `scripts/historical-consistency-monitor.py` and its existing narrowly defined Key Facts chronology rules. Its CSV and explanatory Markdown are retained as action artifacts. Flagged comparisons are **review candidates**, never automatic historical corrections.

**External-source pilot** inventories HTTPS URLs linked from ship HTML and samples the first 24 sorted external destinations, with four concurrent checks and an eight-second timeout each. Output: `tools/search/dist/stewardship/source-checks.json`. Only explicit HTTP 404/410 responses create review candidates; 403, 429, 5xx, timeouts, and connection problems are recorded as inconclusive. An HTTP 404 may still represent bot restrictions or temporary site behavior. No citations are removed or rewritten.

**Limits:** A 24-URL deterministic sample is not archive-wide coverage, and should not be characterized that way. This initial pilot checks response availability only, not whether source content or historical claims changed. Existing source findings are carried forward when a check times out or receives 5xx, so a network failure does not masquerade as recovery. No replacement source proposals are generated yet.

Both new finding types are added to the usual `findings.json` and sent to the established CuratorOS queue after a complete audit. Human review and evidence preservation are mandatory. The source pilot makes network requests from GitHub Actions, but never changes the source archive, site files, or public search index.

## Verification after merge

Run `CuratorOS Stewardship Review` manually. Inspect workflow logs, `source-checks.json`, `chronology.md`, `chronology-findings.csv`, and final `findings.json`; confirm the delivery succeeds. Check that the CuratorOS queue shows correctly described historical/source candidates if any are detected. A clean historical scan is not certification of factual correctness.
