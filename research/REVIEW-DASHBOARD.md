# CuratorOS Research Review — First (read-only) pilot

The Historical Research Agent now packages `research-review.html` in each successful GitHub Actions `historical-research-dossiers` artifact alongside the Markdown dossier and structured evidence JSON.

## Viewing
1. Run **Historical Research Agent** with a small guide count.
2. Download the `historical-research-dossiers` ZIP from the Actions run.
3. Extract it to a folder and open `research-review.html` in a browser (including on devices with local HTML viewing support).
4. Search and filter individual unverified claims. Source links open in separate browser tabs. Use the adjacent `<ship>.md` dossiers for full context.

## Boundaries
- This is an **offline review interface**, not a published page at curator.oceanliners.net.
- It does not fetch GitHub artifacts, modify the memory ledger, or mark claims verified.
- Data is bundled into the single HTML file at generation time; no network requests are made by the interface itself. Clicking a source link navigates to that source.
- Source access and confidence are model-reported; the presence of a record does **not** prove the cited source or claim.
- The automatic memory PR job continues to update only `research/agent-ledger.json`.
- GitHub artifact retention is currently 30 days. Archive useful material outside expiring artifacts before expiration.

## Next phase
After validating the layout and claim fidelity, the private CuratorOS deployment may consume this same schema behind existing authentication. That integration is **not** introduced by this PR.
