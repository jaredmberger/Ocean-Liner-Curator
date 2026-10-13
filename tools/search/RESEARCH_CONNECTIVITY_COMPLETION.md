# Research Connectivity — Archive Completion Workflow

**Read-only and evidence-first.** This tooling inventories all ship-guide routes using the existing conservative connectivity audit. It does not edit guides or automatically recommend links.

## Run

```sh
node tools/search/research-connectivity-completion.mjs
node tools/search/research-connectivity-completion.mjs --ledger tools/search/research-connectivity-review-ledger.csv --out research-connectivity-completion
```

Results: `worklist.csv`, `worklist.json`, and `completion-report.md`. The manual GitHub Actions workflow uploads these as artifacts with the existing connectivity baseline.

## Large-batch editorial process

1. Review the entire inventory in one worklist, starting with structural exceptions and then zero-link, one-link and multiply-linked guides. A guide without a static research link is **not** automatically deficient.
2. Screen 75–100 guides per editorial pass; propose 25–40 historically relevant changes per PR **only where justified**, not to fulfill a quota.
3. Record a decision for each reviewed guide in the versioned ledger. For a proposed link include a valid sitemap destination, a verbatim passage from the guide, substantive reasoning and reviewer identification.
4. Manually edit only approved links. Require preservation of historical text, citations, metadata, chronology and separate ship identities. Confirm no duplicate anchors and that rendered destinations work.
5. Once the merge is verified, mark a proposed link `complete-linked` only when the expected link exists in the current guide. Mark existing coverage `complete-existing` or a reviewed intentional exception `complete-no-suitable-link`.
6. Repeat audit, review of modified files, and worklist reconciliation until no unreviewed genuine guide, pending `needs-link`, pending `needs-research`, or unresolved classification exists. The completion boolean is a bookkeeping gate, **not proof of historical correctness**. Perform a final CI/rendered-link editorial sign-off.

## Review ledger

Columns: `ship,decision,destination,evidence,reason,reviewer`. Use canonical `/ships/...` routes. CSV fields containing commas or quotation marks must be quoted and escaped according to CSV rules.

Decisions:
- `needs-link`: approved editorial candidate awaiting a guide change; requires a destination and an exact source passage.
- `needs-research`: insufficient evidence; unresolved.
- `complete-linked`: verified new contextual destination exists in the guide; requires destination and verbatim evidence.
- `complete-existing`: adequate preexisting research context, with reason.
- `complete-no-suitable-link`: no justified added link following manual review; record why.
- `not-a-guide`: intentional exception where the audit indicates a non-guide; never use this to dismiss a genuinely scanned guide.

No ledger row means `unreviewed`. The initially empty ledger intentionally produces `complete: false`. The validator checks unknown and duplicated ships, invalid statuses, missing reason/reviewer, target paths against the sitemap, evidence against the source guide and claims of completed links against HTML. Invalid decisions fail the workflow; incomplete review alone does not.

**Stopping rule:** every actual ship guide has a reviewed, justified settled decision; all classification exceptions are resolved; outstanding research/link decisions are addressed; validation has no errors; CI and rendering pass. Do not use a minimum link count as the stopping rule.
