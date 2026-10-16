# CuratorOS Automated Stewardship — MVP

Runs daily, on main changes, or manually through **CuratorOS Stewardship Review** GitHub Actions.

This is a **read-only** snapshot of two existing audits: canonical/search-result URL integrity and static internal link/discoverability coverage.

## Run locally

```bash
npm ci --prefix tools/search
npm run stewardship --prefix tools/search
```

Outputs: `tools/search/dist/stewardship/findings.json` and `review.md`. CI uploads them as a 30-day artifact.

## Contract

- `schemaVersion`: integer (currently 1).
- `generatedAt`: UTC ISO timestamp.
- `auditHealth`: `complete` or `incomplete`.
- `findings[]`: `id` (stable hash of type+scope), `type`, `scope`, `severity`, `status`, `description`, `evidence`.
- `errors[]`: failure to run/read an audit, never silently interpreted as a healthy result.
- `status` is always `needs-human-review`. Review decisions are **not** persisted in MVP.

## Interpretation and guardrails

Do not equate canonical mismatches with proven live 404s; check redirects/rewrites. Do not equate zero static links with an orphan: shared and client-rendered navigation is not captured.

No automatic editing, commits, PRs, alerts, source deletion, historical inference, or auto-dismissal. The workflow has read-only contents permission. This first integration intentionally does not yet include source-change watches, persistent case state, Search Console monitoring or an integrated dashboard. Those need tested providers and durable state.

## Next increment

Add a persistent finding ledger (first-seen, last-seen, acknowledged/dismissed states) and CuratorOS integration after the snapshot output is validated, then layer in source-change/indexing detectors without producing duplicate alerts.

## Lifecycle tracking (second sprint)

The workflow now writes `history.json` and tracks `new`, `continuing`, `resolved`, and `unverified` cases by stable finding ID. First/last seen and occurrence counts are retained between successful runs on `main` using a GitHub Actions cache. Missing observations from a failed audit are **unverified**, not resolved. `node tools/search/stewardship-state.test.mjs` checks these transitions.

**Limits:** Cache is best-effort and can expire or be evicted; missing state resets first-seen history. This is not a durable system of record. Manual dismissals, editorial reviewer identity, persistent acknowledgements, and CuratorOS dashboard integration are deliberately not implemented here. Do not interpret lifecycle `resolved` as an approved historical correction; it means a heuristic was no longer observed in a healthy audit.
