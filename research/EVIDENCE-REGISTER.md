# Historical Research Agent — Structured Evidence Register

Each research run now creates two files per vessel:

- `<ship>.md`: the narrative research dossier.
- `<ship>.evidence.json`: a machine-readable inventory of up to three candidate claims.

The JSON records the claim, guide comparison, exact cited source URL and title, provenance classification, claimed access status, what the source allegedly supports, vessel identity and period, uncertainties, and verification tasks.

All claims have `editorial_status: unverified_pending_editorial_review` and `independently_verified: false`. The register is extracted by a **second model call** from the narrative dossier. No URL is considered verified simply because the model cited it. A structural guard rejects nonempty URLs not present verbatim in the dossier, but **does not fetch or substantiate them**.

This is a review queue, not a publication pipeline. Memory PRs remain ledger-only and must still be merged by a human. Historical source verification and publication approvals remain separate.

## Pilot validation

Run one guide and inspect the dossier and evidence JSON. Confirm that every listed URL is genuine and actually supports its corresponding claim, and correct any inferred access status or vessel identity in editorial review. Repeated sources are not independent corroboration.

The second model request increases API cost and runtime. The agent will fail the research job if the structured register cannot be produced, rather than silently writing an incomplete successful result.
