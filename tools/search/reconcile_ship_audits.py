#!/usr/bin/env python3
"""Reconcile canonical ship-index paths with documented editorial reviews.

Run from repository root:
    python3 tools/search/reconcile_ship_audits.py

Writes:
    tools/search/ship-audit-coverage.csv
    tools/search/SHIP_AUDIT_COVERAGE.md

Review status measures *recorded scope*, not independently certified accuracy.
"""
from collections import Counter
from pathlib import Path
import csv
import re

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "ships/ships.html"
AUDITS = ROOT / "tools/search"
LEDGER = ROOT / "EDITORIAL_AUDIT_LEDGER.md"
OUT_CSV = AUDITS / "ship-audit-coverage.csv"
OUT_MD = AUDITS / "SHIP_AUDIT_COVERAGE.md"
PATH_RE = re.compile(r"(?:/)?ships/([a-z0-9-]+)\.html")
BARE_RE = re.compile(r"`([a-z0-9-]+\.html)`")
URL_RE = re.compile(r'href="/ships/([a-z0-9-]+\.html)"')

def path(slug):
    return "ships/" + slug

def canonical():
    # This is the canonical index, not the set of every stray HTML file in ships/.
    return sorted({path(m) for m in URL_RE.findall(INDEX.read_text(encoding="utf8")) if m != "ships.html"})

def batch_guides(body, inventory):
    # Audit records have multiple layouts: some name their five guides in the
    # introduction, others list them as the first five Markdown table entries.
    # Collect explicit, backticked ship paths or filenames from the whole
    # document, in order. Validate that exactly five canonical identities are
    # present rather than presuming the introductory paragraph lists them.
    candidates = []
    for match in re.finditer(
        r"`(?:ships/)?([a-z0-9-]+\.html)`|(?:^|[\\s(])ships/([a-z0-9-]+\.html)",
        body, flags=re.MULTILINE
    ):
        name = match.group(1) or match.group(2)
        guide = path(name)
        if guide in inventory and guide not in candidates:
            candidates.append(guide)
    if len(candidates) != 5:
        raise ValueError(
            f"expected five distinct indexed guide identities, got {len(candidates)}: {candidates}"
        )
    return candidates

def main():
    ships = canonical()
    inventory = set(ships)
    batches = {}
    for doc in sorted(AUDITS.glob("SHIP_GUIDE_AUDIT_BATCH_*.md")):
        body = doc.read_text(encoding="utf8")
        try:
            guides = batch_guides(body, inventory)
        except ValueError as exc:
            raise ValueError(str(doc.relative_to(ROOT)) + ": " + str(exc)) from exc
        batches[doc.name] = guides
    sampled = {}
    for doc, guides in batches.items():
        for guide in guides:
            sampled.setdefault(guide, []).append(doc)
    ledger_text = LEDGER.read_text(encoding="utf8") if LEDGER.exists() else ""
    ledger_paths = {path(x + ".html") for x in PATH_RE.findall(ledger_text)} & inventory

    rows = []
    for guide in ships:
        batch_names = sampled.get(guide, [])
        ledger = guide in ledger_paths
        # "Reviewed" means a documented scoped guide inspection, NOT a comprehensive
        # historical verification. "Partially reviewed" is a claim-level ledger entry.
        status = ("Reviewed — scoped" if batch_names else
                  "Partially reviewed — ledger only" if ledger else
                  "Not documented as reviewed")
        rows.append(dict(guide=guide, status=status,
                         batch_records="; ".join(sorted(batch_names)),
                         ledger_mention="yes" if ledger else "no"))
    with OUT_CSV.open("w", newline="", encoding="utf8") as fp:
        w = csv.DictWriter(fp, fieldnames=["guide", "status", "batch_records", "ledger_mention"])
        w.writeheader()
        w.writerows(rows)
    counts = Counter(r["status"] for r in rows)
    repeated = {k: v for k, v in sampled.items() if len(v) > 1}
    missing = sorted(inventory - set(sampled) - ledger_paths)
    lines = [
        "# Ship-guide audit coverage — reconciled",
        "",
        "Generated against the current canonical ship index, numbered audit-batch files, and partial editorial ledger. **No category certifies full historical accuracy.**",
        "",
        f"- Canonical indexed guides: **{len(ships)}**",
        f"- Numbered batch records parsed: **{len(batches)}**",
        f"- Batch review instances: **{sum(map(len, batches.values()))}**",
        f"- Unique guides in documented scoped batches: **{len(sampled)}**",
        f"- Scoped batch + ledger overlap: **{len(set(sampled) & ledger_paths)}**",
        f"- Ledger-only guides: **{len(ledger_paths - set(sampled))}**",
        f"- Guides without recorded batch or ledger coverage: **{len(missing)}**",
        f"- Guides repeated across numbered batches: **{len(repeated)}**",
        "",
        "## Coverage categories",
        "",
        "| Status | Count | Meaning |",
        "| --- | ---: | --- |",
        *[f"| {label} | {counts[label]} | " + {
            "Reviewed — scoped": "One or more five-guide editorial inspections; not a full audit.",
            "Partially reviewed — ledger only": "Selected fact/source mentioned in ledger; not a systematic guide inspection.",
            "Not documented as reviewed": "No match in the indexed batches or partial ledger; not proof no one ever read it.",
        }[label] + " |" for label in ("Reviewed — scoped", "Partially reviewed — ledger only", "Not documented as reviewed")],
        "",
        "## Guides without recorded coverage",
        "",
        *[f"- `{g}`" for g in missing],
        "",
        "## Notes",
        "",
        "- A source-only PR without a ledger entry is intentionally not counted as a formal guide audit.",
        "- The ledger explicitly states that it is a partial historical backfill; absence is not proof of no prior review.",
        "- This generated list should be updated whenever the index, batch records or ledger changes.",
        "- Full historical certification would need a separate, claim-by-claim protocol.",
        "",
    ]
    OUT_MD.write_text("\n".join(lines), encoding="utf8")
    print("\n".join(lines[:14]))
    print(f"\nWrote {OUT_CSV.relative_to(ROOT)} and {OUT_MD.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
