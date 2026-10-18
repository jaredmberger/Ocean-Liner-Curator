# Optional CuratorOS Research Evidence Import

The Historical Research Agent workflow offers an **opt-in** `import_to_curatoros` checkbox (default **false**).

When disabled, research works as before, generating dossiers and opening the usual ledger-only pull request. Nothing is posted to CuratorOS.

## Prerequisites before enabling

1. Verify the `curator.oceanliners.net` Pages deployment and Cloudflare Access policies, including service-to-service requests to `/api/research-agent/import`.
2. In CuratorOS's **server-side** Cloudflare Pages environment, configure a strong secret `RESEARCH_AGENT_IMPORT_TOKEN`, and only after security review set `RESEARCH_AGENT_IMPORT_ENABLED=true`.
3. In the **Ocean-Liner-Curator** GitHub Actions repository secrets, configure `CURATOROS_RESEARCH_IMPORT_TOKEN` with that token. Never expose it to browser JavaScript or commit it to Git.
4. Test one ship with the opt-in checkbox. Check the separate `import-curatoros` job's status, then verify storage using a controlled Cloudflare administrative method.
5. Leave the checkbox off during regular research until we have authenticated readback and archival export/recovery tests.

The uploader uses a fixed HTTPS destination, uploads only `*.evidence.json` from the successful run, sends the Actions run ID, and reports created vs already-present counts. Failure of an explicitly opted-in import appears as a failing **separate** job; the research artifact and memory PR are unaffected.

## Current limits

This is not enabled by merging the PR. The token and Cloudflare-side feature flag are prerequisites. The endpoint itself is disabled by default. The record is marked unverified and does not alter canonical Ship Records. Import preserves structured claims, **not** the complete Markdown research dossier, so the dossier artifact still expires after 30 days unless separately archived. Cloudflare KV has eventual consistency; this is not a transactional exactly-once importer.

Do not enable without first verifying authentication, Access policies, rate limits and recovery coverage.
