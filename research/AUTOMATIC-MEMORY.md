# Automatic research memory proposals

Following a **successful** manually launched Historical Research Agent run, the `propose-memory` job reads the `proposed-ledger-additions.json` artifact and makes a GitHub pull request containing **only** changes to `research/agent-ledger.json`.

The research job remains `contents: read`. The follow-up PR job has separately scoped `contents: write` and `pull-requests: write`, with no OpenAI API key. The ledger records investigations, not verified historical claims.

## Usage
- Launch **Actions → Historical Research Agent → Run workflow** (1–5 guides).
- Inspect the generated dossiers and the pull request opened by `github-actions[bot]`.
- Merge the memory PR to make the skip-history permanent. Subsequent research runs read only the merged main-branch ledger.
- Do not assume pending/unmerged memory PRs prevent repeat selections.

## GitHub permission prerequisite
GitHub repository **Settings → Actions → General → Workflow permissions** may require enabling **Allow GitHub Actions to create and approve pull requests**. If an organization policy disallows this, this PR step will fail and a maintainer can create a memory PR manually. Do not grant the researcher broader publication permissions.

The memory job only runs after the research job succeeds. If no new entries are found, it does not open a PR. The artifact's citation and factual findings must still undergo editorial verification before incorporation into published content.
