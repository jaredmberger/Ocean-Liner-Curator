#!/usr/bin/env python3
"""Read-only, conservative cross-guide chronology audit; flags require human review."""
import argparse
import csv
import html
import re
from datetime import datetime
from pathlib import Path
import xml.etree.ElementTree as ET

# Explicit same-hull identity chains, not sister ships (whose dates should differ).
IDENTITY_GROUPS = [
    ("Imperator / Berengaria", ("ss-imperator", "rms-berengaria")),
    ("Vaterland / Leviathan", ("ss-vaterland", "ss-leviathan")),
    ("Bismarck / Majestic", ("ss-bismarck-1914", "rms-majestic")),
    ("Berlin / Arabic", ("ss-berlin-1909", "ss-arabic-1920")),
    ("Europa / Liberté", ("ss-europa", "ss-liberte")),
]
DATE_PATTERN = re.compile(
    r"\b(?:\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})\b"
)
ROW_PATTERN = re.compile(
    r'<div\b[^>]*class="[^"]*\bfact-row\b[^"]*"[^>]*>(.*?)</div>\s*</div>',
    re.I | re.S)
LABEL_PATTERN = re.compile(r'<div\b[^>]*class="[^"]*\bfact-label\b[^"]*"[^>]*>(.*?)</div>', re.I | re.S)
VALUE_PATTERN = re.compile(r'<div\b[^>]*class="[^"]*\bfact-value\b[^"]*"[^>]*>(.*?)</div>', re.I | re.S)
TAG = re.compile(r"<[^>]+>")

def clean(raw):
    return " ".join(html.unescape(TAG.sub(" ", raw)).split())

def facts(source):
    out = {}
    for row in ROW_PATTERN.findall(source):
        a, b = LABEL_PATTERN.search(row), VALUE_PATTERN.search(row)
        if a and b:
            out[clean(a.group(1)).lower()] = clean(b.group(1))
    return out

def dates(value):
    values = []
    for match in DATE_PATTERN.finditer(value):
        token = match.group()
        for fmt in ("%d %B %Y", "%B %d, %Y", "%B %d %Y", "%d %b %Y", "%b %d, %Y"):
            try:
                values.append(datetime.strptime(token, fmt).date())
                break
            except ValueError:
                pass
    return values

def classify(label):
    if "launch" in label:
        return "launch"
    if "maiden" in label:
        return "maiden"
    if "completed" in label:
        return "completion"
    return None

def scan(root):
    sitemap = root / "sitemaps/sitemap-ships.xml"
    if not sitemap.is_file():
        raise ValueError("Ship sitemap missing")
    tree = ET.parse(sitemap)
    slugs = {
        x.text.strip().split("/ships/", 1)[1].replace(".html", "")
        for x in tree.iter() if x.tag.endswith("loc") and x.text and "/ships/" in x.text
    }
    if not slugs:
        raise ValueError("Ship sitemap has no ship entries")
    records, unresolved = {}, []
    guides_with_facts = 0
    dated_fields = 0
    for slug in sorted(slugs):
        path = root / "ships" / (slug + ".html")
        if not path.is_file():
            unresolved.append(slug)
            continue
        records[slug] = facts(path.read_text(encoding="utf-8"))
        if records[slug]:
            guides_with_facts += 1
        dated_fields += sum(bool(dates(value)) for value in records[slug].values())
    findings = []
    for group, members in IDENTITY_GROUPS:
        present = [m for m in members if m in records]
        if len(present) < 2:
            continue
        # Compare launch dates only: same physical hull has one launch, even if renamed.
        extracted = []
        for slug in present:
            for label, value in records[slug].items():
                if classify(label) == "launch":
                    found = dates(value)
                    if len(found) == 1:
                        extracted.append((slug, label, value, found[0]))
        if len({x[3] for x in extracted}) > 1:
            findings.append(("review", "same-hull launch disagreement", group,
                             "; ".join(f"{s} [{l}]: {v}" for s,l,v,_ in extracted)))
    for slug, fields in records.items():
        launches, maidens, completions = [], [], []
        for label, value in fields.items():
            found = dates(value)
            if len(found) != 1:  # ambiguous/ranges: don't guess
                continue
            kind = classify(label)
            if kind == "launch":
                launches.append((label, value, found[0]))
            elif kind == "maiden":
                maidens.append((label, value, found[0]))
            elif kind == "completion":
                completions.append((label, value, found[0]))
        for a in launches:
            for b in maidens:
                if a[2] > b[2]:
                    findings.append(("review", "maiden voyage predates launch", slug,
                                     f"{a[0]}: {a[1]}; {b[0]}: {b[1]}"))
        # Only explicit exact completion dates; don't compare qualifiers or circa dates.
        for a in completions:
            if re.search(r"\b(?:by|about|around|circa|approx|commonly|varies)\b", a[1], re.I):
                continue
            for b in maidens:
                if a[2] > b[2]:
                    findings.append(("review", "maiden voyage predates completion", slug,
                                     f"{a[0]}: {a[1]}; {b[0]}: {b[1]}"))
    if guides_with_facts == 0:
        raise ValueError("No ship Key Facts rows could be parsed; refusing misleading clean report")
    for slug in unresolved:
        findings.append(("inventory", "sitemap ship file not found", slug, ""))
    return len(slugs), len(records), findings, guides_with_facts, dated_fields

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--output", default="historical-consistency-report.md")
    parser.add_argument("--csv", default="historical-consistency-findings.csv")
    a = parser.parse_args()
    total, resolved, findings, guides_with_facts, dated_fields = scan(Path(a.root))
    lines = ["# Historical Consistency Monitor — Editorial Review", "",
             "Read-only heuristic report. Findings are **candidates**, not proven errors; no ship guide is edited.",
             "Only explicit dates in Key Facts rows are compared; narrative assertions and phase-dependent tonnage are not automatically reconciled.",
             "", f"- Ship sitemap entries: {total}", f"- Ship files resolved: {resolved}",
             f"- Guides with parseable Key Facts rows: {guides_with_facts}",
             f"- Key Facts fields containing explicit calendar dates: {dated_fields}",
             f"- Findings requiring review: {sum(f[0] == 'review' for f in findings)}",
             f"- Inventory notices: {sum(f[0] == 'inventory' for f in findings)}",
             "", "| Level | Potential issue | Guide or identity group | Evidence |",
             "|---|---|---|---|"]
    for level, issue, subject, evidence in findings:
        safe = [x.replace("|", r"\|").replace("\n", " ") for x in (level, issue, subject, evidence)]
        lines.append("| " + " | ".join(safe) + " |")
    if not findings:
        lines += ["| — | No flags in the current ruleset | — | — |"]
    lines += ["", "## Interpretation", "",
              "A clean scan does not verify historical truth; it only means these narrow structural rules found no conflicts.",
              "Ships renamed across careers can have different completion/refit and maiden-voyage dates. "
              "Only original launch dates are compared across explicitly named same-hull pairs.",
              "Historical changes require separate primary-source review and an editorial PR.", ""]
    Path(a.output).write_text("\n".join(lines), encoding="utf-8")
    with Path(a.csv).open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(("level", "issue", "subject", "evidence"))
        writer.writerows(findings)

if __name__ == "__main__":
    main()
