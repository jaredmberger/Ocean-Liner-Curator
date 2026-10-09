#!/usr/bin/env python3
"""Read-only inbound link inventory for Ocean Liner Curator research collections."""
import argparse
import csv
import html
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

HOSTS = {"oceanliners.net", "www.oceanliners.net"}

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)

def normalized(href, source):
    parts = urlsplit(html.unescape(href))
    if parts.scheme and parts.scheme.lower() not in ("http", "https"):
        return None
    if parts.netloc and (parts.hostname or "").lower() not in HOSTS:
        return None
    path = unquote(parts.path)
    if not path:
        return None
    if not path.startswith("/"):
        from posixpath import dirname, normpath
        path = normpath(dirname("/" + source) + "/" + path)
    if path.endswith("/"):
        path += "index"
    if path.endswith(".html"):
        path = path[:-5]
    return path.rstrip("/").lower()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--output", default="research-discoverability-report.md")
    ap.add_argument("--csv", default="research-discoverability-collections.csv")
    args = ap.parse_args()
    root = Path(args.root)
    collections = sorted((root / "collections").glob("*.html"))
    if not collections:
        raise SystemExit("No collections/*.html found; refusing an empty report")
    targets = {normalized("/collections/" + p.name, ""): p.name for p in collections}
    inbound = {k: set() for k in targets}
    ship_links = {}
    sitemap = root / "sitemaps" / "sitemap-ships.xml"
    if not sitemap.is_file():
        raise SystemExit("Missing ship sitemap; cannot establish the guide inventory")
    tree = ET.parse(sitemap)
    paths = sorted({urlsplit(e.text.strip()).path for e in tree.iter() if e.tag.endswith("loc") and e.text and "/ships/" in e.text})
    missing = []
    for url_path in paths:
        rel = url_path.lstrip("/")
        candidates = [root / rel]
        if not rel.endswith(".html"):
            candidates.append(root / (rel + ".html"))
        src = next((p for p in candidates if p.is_file()), None)
        if src is None:
            missing.append(rel)
            continue
        parser = Links()
        parser.feed(src.read_text(encoding="utf-8"))
        found = set()
        for href in parser.links:
            target = normalized(href, rel)
            if target in targets:
                found.add(target)
                inbound[target].add("/" + rel)
        ship_links["/" + rel] = found
    if not ship_links:
        raise SystemExit("No ship pages resolved from sitemap")
    all_html = list(root.rglob("*.html"))
    for src in all_html:
        rel = src.relative_to(root).as_posix()
        parser = Links()
        parser.feed(src.read_text(encoding="utf-8"))
        for href in parser.links:
            target = normalized(href, rel)
            if target in targets:
                inbound[target].add("/" + rel)
    ordered = sorted(targets, key=lambda k: (len(inbound[k]), k))
    lines = [
        "# Research Collections — Inbound Link Audit",
        "",
        "Generated from repository HTML; direct HTML anchor links only. Counts are unique source pages, not individual links.",
        "",
        f"- Ship sitemap entries: {len(paths)}",
        f"- Ship files resolved: {len(ship_links)}",
        f"- Ship files missing: {len(missing)}",
        f"- Guides with no direct collection links: {sum(not v for v in ship_links.values())}",
        f"- Research collections: {len(targets)}",
        "",
        "## Collection inbound links",
        "",
        "| Collection | All HTML sources | Ship guide sources |",
        "|---|---:|---:|",
    ]
    records = []
    for key in ordered:
        ship_sources = sum(1 for x in ship_links if x in inbound[key])
        records.append((targets[key], len(inbound[key]), ship_sources))
        lines.append(f"| {targets[key]} | {len(inbound[key])} | {ship_sources} |")
    lines += ["", "## Ship guides without direct collection links", ""]
    lines.extend("- " + x for x in sorted(k for k, v in ship_links.items() if not v))
    if missing:
        lines += ["", "## Unresolved sitemap paths", ""]
        lines.extend("- " + x for x in missing)
    lines += ["", "## Interpretation", "",
        "This is an inventory, not an SEO quality score. Some ships are not appropriate for any particular research collection; do not add links solely to improve counts.",
        "JavaScript-injected links and non-anchor navigational behavior are not counted.",
        ""]
    Path(args.output).write_text("\n".join(lines), encoding="utf-8")
    with Path(args.csv).open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(("collection", "inbound_html_sources", "inbound_ship_guides"))
        writer.writerows(records)
    print(f"Audited {len(ship_links)} ship pages and {len(targets)} collections; {len(missing)} unresolved sitemap paths")

if __name__ == "__main__":
    main()
