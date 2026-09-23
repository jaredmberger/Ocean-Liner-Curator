#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "ships" / "ships.html"
ROOT_SITEMAP = ROOT / "sitemap.xml"
SHIP_SITEMAP = ROOT / "sitemaps" / "sitemap-ships.xml"

html = ARCHIVE.read_text(encoding="utf-8")
slugs = []
seen = set()
for href in re.findall(r'<a\\b[^>]*href\\s*=\\s*["\\\']([^"\\\']+)["\\\']', html, flags=re.I):
    match = re.search(r'(?:^|/)ships/([a-z0-9][a-z0-9-]*)(?:\\.html)?(?:[#?].*)?$', href, flags=re.I)
    if not match:
        continue
    slug = match.group(1).lower()
    if slug == "ships" or slug in seen:
        continue
    seen.add(slug)
    slugs.append(slug)

slugs.sort()
if not slugs:
    raise SystemExit("No ship archive entries found.")

ship_lines = "\\n".join(
    f'  <url><loc>https://oceanliners.net/ships/{slug}.html</loc><priority>0.58</priority></url>'
    for slug in slugs
)
replacement = (
    "  <!-- =========================\\n"
    "       Ship Guides\\n"
    "       ========================= -->\\n"
    + ship_lines
    + "\\n\\n"
)

root_text = ROOT_SITEMAP.read_text(encoding="utf-8")
pattern = re.compile(
    r"  <!-- =========================\\n"
    r"       Ship Guides\\n"
    r"       ========================= -->[\\s\\S]*?"
    r"(?=  <!-- =========================\\n"
    r"       About / Policy / Utility)"
)
new_root, count = pattern.subn(replacement, root_text, count=1)
if count != 1:
    raise SystemExit("Could not locate the Ship Guides block in sitemap.xml")
ROOT_SITEMAP.write_text(new_root, encoding="utf-8")

ship_xml = (
    '<?xml version="1.0" encoding="UTF-8"?>\\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'
    + "\\n".join(
        "  <url>\\n"
        f"    <loc>https://oceanliners.net/ships/{slug}.html</loc>\\n"
        "    <priority>0.58</priority>\\n"
        "  </url>"
        for slug in slugs
    )
    + "\\n</urlset>\\n"
)
SHIP_SITEMAP.write_text(ship_xml, encoding="utf-8")
print(f"Synced {len(slugs)} ship URLs into sitemap.xml and sitemaps/sitemap-ships.xml")
