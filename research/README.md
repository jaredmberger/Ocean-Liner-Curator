# Historical Research Agent — Persistent Memory

The source-controlled ledger at `research/agent-ledger.json` is the durable record of prior investigations.

## How it works
1. On each manually dispatched run, read the ledger from the checked-out repository.
2. Skip guides already recorded in the ledger, so the next run moves to different ships.
3. Create normal Markdown dossiers and `proposed-ledger-additions.json` within the GitHub Actions artifact.
4. After an editor reviews the proposed findings, incorporate appropriate entries into `research/agent-ledger.json` through a GitHub pull request.

This is intentionally a **human-reviewed memory model**: agent output is not automatically made authoritative. GitHub artifacts expire, so material worth retaining should be separately preserved before expiration. A ledger entry tracks that an investigation occurred, **not** that its assertions are true.

## Editorial states
Use `pending_editorial_review`, `verified`, `needs_further_research`, or `closed_no_change` with careful editorial judgment. The scheduler presently excludes all ledger entries regardless of state. We can later add optional revisit periods or explicit named-guide overrides.

## Initial entry
SS Hamburg (1925) is recorded from the October 18 pilot with its run artifact URL, but its findings are explicitly unverified.

## Constraints
No site pages are edited, no automated writes to the ledger or repository are performed by the workflow, and no recurring automation is enabled.
