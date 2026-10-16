# Rotating archive-wide source stewardship

This replaces the fixed 24-reference pilot with a complete inventory of external HTTPS links found in repository HTML pages. The inventory includes all pages the scanner can traverse; it is not an assertion that every bibliographic reference is linked in HTML.

Each run selects up to **48** unique URLs, prioritizing never-checked and least-recently checked references, with **no more than two URLs per hostname** and three concurrent workers. Network checks use a nine-second timeout, inspect HTTP response status only, and do not crawl documents or modify citations.

The state file `tools/search/.stewardship-state/source-history.json` uses the **existing GitHub Actions cache**. It records previous observations, coverage, and provisional missing-source state. Cache expiry can reset coverage history; it is not yet durable archival provenance.

A review candidate is created only after **two HTTP 404/410 observations on separate UTC dates**. HTTP 403/429, server failures and timeouts are inconclusive. Previously flagged candidates remain in the queue on inconclusive or unobserved runs; a successful 2xx/3xx recheck ends the finding as an observed technical recovery, not a historical conclusion.

The CI artifact `source-checks.json` reports total inventory, checked this run, total checked in available history, detailed observations and confirmed candidates. All findings remain subject to human review. No link removal, source substitution, evidence assertions, or editorial edits are performed.

**Known limitations:** Hostname selection and GitHub Actions cache are best-effort. Dynamic citations and unlinked bibliographic entries are not covered. Anti-bot behavior may yield incorrect 404 responses, and some redirect destinations could still be unreliable. Follow-up work should add durable state and content fingerprinting only after validating coverage and false-positive rates.
