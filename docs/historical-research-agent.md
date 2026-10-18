# Historical Research Agent (pilot)

The first research agent is **opt-in, manual, and read-only**. It selects up to five short existing ship guides for exploratory research and uses an OpenAI Responses API request with web search to prepare source-oriented markdown dossiers.

## Start
1. Add an OpenAI API key as the GitHub Actions repository secret `OPENAI_API_KEY` (requires an API account with available billing; ChatGPT subscription is separate). Never commit a key.
2. In **Actions → Historical Research Agent → Run workflow**, select 1–5 guides (start with 1).
3. Download the `historical-research-dossiers` artifact; examine `README.md` and individual markdown dossiers.

## Boundaries
- The workflow has `contents: read` and does not open PRs, write to the site, or publish claims.
- Candidate selection is a basic length heuristic, **not a claim that a short guide is historically deficient**. Later iterations should incorporate the editorial audit ledger and rotate across guides.
- AI citations are *research leads*, not verified authority. Manually open the original sources, check provenance, compare identities/periods, and verify any proposed claim before editing.
- The agent does not run on a timer. Scheduling, review queue integration, and source-verification tools are future phases after pilot assessment.
- API usage incurs separate costs. Each run invokes web search and model calls for each selected guide.
