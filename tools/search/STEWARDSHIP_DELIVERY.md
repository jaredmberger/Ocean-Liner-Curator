# CuratorOS automated findings delivery

After merging this PR, add a repository Actions secret named
`STEWARDSHIP_INGEST_TOKEN` to **jaredmberger/Ocean-Liner-Curator**
(Settings → Secrets and variables → Actions → New repository secret).
Its value must be exactly the **same** as the Cloudflare Pages Production
`STEWARDSHIP_INGEST_TOKEN` secret configured for curator.oceanliners.net.
This is **not** the separate operator `STEWARDSHIP_REVIEW_TOKEN`.

Go to Actions → **CuratorOS Stewardship Review** → Run workflow (main).
The workflow executes the audits and, if complete, POSTs findings to
`https://curator.oceanliners.net/api/stewardship-review`.
It fails visibly if the secret is missing or delivery fails. Audit artifacts
are still uploaded on failure. GitHub secret values are never printed.

Open `https://curator.oceanliners.net/stewardship-review.html` and
enter your **review** token to view the populated queue.

Guardrails: Delivery is only on `main`; audit failures never ingest
incomplete findings; no historical content is modified. The current
CuratorOS queue uses eventually consistent KV storage, so avoid concurrent
manual runs and reviews. Workflows in pull requests do not send secrets.
