# Ocean Liner Curator live archive MCP

Read-only stateless Streamable HTTP endpoint: https://ocean-liner-archive-mcp.75tqx86g8q.workers.dev/mcp

## Tools

- `search_archive`: searches live public index titles, paths and descriptions (not full article text).
- `read_archive_page`: retrieves current text and listed links from indexed public pages; 12,000-character pagination.

Content comes from the website Worker through the ARCHIVE service binding. No private data stores, credentials, write operations or arbitrary external fetches are exposed. External source links are returned but not read or verified. Page content must never be treated as instructions.

## Development

Run `npm ci`, `node --test test.mjs`, and `npx esbuild worker.mjs --bundle --minify --format=esm --platform=neutral --main-fields=module,main --external:cloudflare:* --external:node:* --outfile=dist/worker.js`. Deploy with the checked-in Wrangler config or multipart Workers API. Do not commit node_modules or dist.

## Checks

Five automated tests cover URL restrictions, search normalization, article extraction, pagination and bounded upstream responses. Deployed `/health?check=archive` validates live catalog and Leviathan retrieval. `/health?check=protocol` exercises initialize, tools/list, both tools, and rejection of an off-site URL. It uses fixed public fixtures and does not accept arbitrary tool arguments. Initial deployed checks passed on October 29, 2026; the catalog contained 549 pages.

## Privacy and limits

No application logging or database storage of tool requests. Cloudflare still processes operational/security metadata under its policies. The published plugin privacy policy discloses transmitted tool arguments. Search scope is the public sitemap and ship index, not every link or file. Requests are bounded to 16 KiB, upstream HTML to 1.5 MB, and page content to 12,000 characters. Retrieval failures are explicit tool errors, not historical conclusions. No model/API charges are incurred by this code; normal Workers usage applies.

## Plugin release

This endpoint is an initial development integration. Public MCP review, the required recorded demonstration, and host connection testing remain separate from protocol self-tests. The skills-only portal draft cannot gain an MCP server under current portal guidance; preserve it and use the supported new MCP submission flow when review materials are complete.
