#!/usr/bin/env python3
"""Audit Ocean Liner Curator ship-archive consistency.

The archive page is canonical for membership/order. This script intentionally
separates hard structural errors from review warnings so historically legitimate
differences (namesakes, launch-vs-service years, operator naming) are surfaced
without being silently "fixed".
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from collections import Counter, defaultdict
from html import unescape
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "ships" / "ships.html"
RELATED = ROOT / "assets" / "related-liners.js"
OUT = ROOT / "api" / "device" / "archive-consistency.json"

PREFIXES = {
    "ss", "rms", "ms", "mv", "tss", "qsmv", "rmmv", "tsmv",
    "hmhs", "hms", "uss", "usns", "ps", "ts", "mts", "rmsp",
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
REQUIRED_SECTIONS = ("Overview", "Key Facts", "Interpretive Notes")
REQUIRED_ASSETS = (
    "/assets/nav.css",
    "/assets/ship-guide.css",
    "/assets/nav.js",
    "/assets/related-liners.js",
)


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def norm_url_path(value: str) -> str:
    path = urlparse(value).path.rstrip("/")
    return re.sub(r"\.html$", "", path, flags=re.I)


def slug_from_href(value: str) -> str:
    return Path(norm_url_path(value)).name


def sort_key(name: str) -> str:
    text = clean(name).strip()
    first_space = text.find(" ")
    if first_space > 0:
        token = text[:first_space].replace(".", "").lower()
        parts = token.split("/")
        if parts and all(part in PREFIXES for part in parts):
            text = text[first_space + 1 :]
    # Accent-insensitive enough for current archive without external modules.
    return text.casefold().translate(str.maketrans({
        "á":"a","à":"a","â":"a","ä":"a","ã":"a","å":"a",
        "é":"e","è":"e","ê":"e","ë":"e",
        "í":"i","ì":"i","î":"i","ï":"i",
        "ó":"o","ò":"o","ô":"o","ö":"o","õ":"o",
        "ú":"u","ù":"u","û":"u","ü":"u",
        "ç":"c","ñ":"n","ł":"l",
    }))


def tracked_paths() -> set[str]:
    output = subprocess.check_output(
        ["git", "-C", str(ROOT), "ls-files"], text=True
    )
    return {line.strip() for line in output.splitlines() if line.strip()}


def archive_cards(html: str) -> list[dict]:
    cards = []
    pattern = re.compile(
        r'<article\b[^>]*class=["\'][^"\']*\bguide-card\b[^"\']*["\'][^>]*'
        r'(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</article>',
        re.I,
    )
    for match in pattern.finditer(html):
        whole_start = html.rfind("<article", 0, match.end())
        opening_end = html.find(">", whole_start)
        opening = html[whole_start:opening_end + 1]
        body = match.group("body")
        title = re.search(
            r'<a\b[^>]*class=["\'][^"\']*\bguide-title\b[^"\']*["\'][^>]*'
            r'href=["\']([^"\']+)["\'][^>]*>([\s\S]*?)</a>',
            body, re.I,
        )
        if not title:
            continue
        desc = re.search(
            r'<p\b[^>]*class=["\'][^"\']*\bguide-desc\b[^"\']*["\'][^>]*>([\s\S]*?)</p>',
            body, re.I,
        )
        line = re.search(r'data-line=["\']([^"\']*)["\']', opening, re.I)
        year = re.search(r'data-year=["\']([^"\']*)["\']', opening, re.I)
        cards.append({
            "href": title.group(1).strip(),
            "name": clean(title.group(2)),
            "summary": clean(desc.group(1)) if desc else "",
            "line": clean(line.group(1)) if line else "",
            "year": clean(year.group(1)) if year else "",
        })
    return cards


def page_path_for(href: str) -> Path:
    slug = slug_from_href(href)
    return ROOT / "ships" / f"{slug}.html"


def guide_text_before_sources(html: str) -> str:
    # Limit inline-citation audit to the guide body before its Sources heading.
    guide = re.search(r'<div\b[^>]*class=["\'][^"\']*\bguide\b[^"\']*["\'][^>]*>([\s\S]*?)</div>', html, re.I)
    body = guide.group(1) if guide else html
    source = re.search(r'<h2[^>]*>\s*(?:Selected\s+)?Sources(?:\s*\(Selected\))?\s*</h2>', body, re.I)
    return body[:source.start()] if source else body


def h2_texts(html: str) -> list[str]:
    return [clean(x) for x in re.findall(r"<h2\b[^>]*>([\s\S]*?)</h2>", html, re.I)]


def image_refs(html: str) -> set[str]:
    refs = set()
    for raw in re.findall(r'(?:src|content)=["\']([^"\']+)["\']', html, re.I):
        path = urlparse(raw).path
        if path.lower().startswith("/ships/") and Path(path).suffix.lower() in IMAGE_EXTS:
            refs.add(path.lstrip("/"))
    return refs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fail-on-warnings",
        action="store_true",
        help="Treat review warnings as failures (not recommended for normal CI).",
    )
    args = parser.parse_args()

    tracked = tracked_paths()
    html = ARCHIVE.read_text(encoding="utf-8", errors="replace")
    cards = archive_cards(html)

    errors: list[dict] = []
    warnings: list[dict] = []
    stats: dict[str, int] = {}

    def error(code: str, **details):
        errors.append({"code": code, **details})

    def warn(code: str, **details):
        warnings.append({"code": code, **details})

    # 1. Membership, duplicates, and prefix-agnostic alphabetical order.
    href_counts = Counter(card["href"] for card in cards)
    for href, count in href_counts.items():
        if count > 1:
            error("duplicate-archive-href", href=href, count=count)

    name_groups = defaultdict(list)
    for card in cards:
        name_groups[sort_key(card["name"])].append(card["href"])
    for name, hrefs in sorted(name_groups.items()):
        if len(hrefs) > 1:
            warn("possible-namesake", normalizedName=name, hrefs=hrefs)

    breaks = []
    for previous, current in zip(cards, cards[1:]):
        if sort_key(previous["name"]) > sort_key(current["name"]):
            breaks.append({
                "before": previous["name"],
                "after": current["name"],
                "beforeHref": previous["href"],
                "afterHref": current["href"],
            })
    if breaks:
        error("archive-order", count=len(breaks), breaks=breaks)

    archive_slugs = {slug_from_href(card["href"]) for card in cards}
    stats["archiveCards"] = len(cards)

    # 2–7. Per-guide identity, images, structure, inline citations, dates/operators.
    guide_html_by_slug = {}
    line_variants = defaultdict(set)
    years_flagged = 0
    structural_warnings = 0
    inline_link_errors = 0
    image_errors = 0

    for card in cards:
        slug = slug_from_href(card["href"])
        path = page_path_for(card["href"])
        rel = path.relative_to(ROOT).as_posix()

        if rel not in tracked:
            error("missing-guide-page", slug=slug, href=card["href"], expectedFile=rel)
            continue

        page = path.read_text(encoding="utf-8", errors="replace")
        guide_html_by_slug[slug] = page

        title_match = re.search(r"<title>([\s\S]*?)</title>", page, re.I)
        h1_match = re.search(r"<h1\b[^>]*>([\s\S]*?)</h1>", page, re.I)
        canon_match = re.search(
            r'<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']',
            page, re.I,
        )
        if not canon_match:
            # tolerate reversed attribute order
            canon_match = re.search(
                r'<link\b[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']',
                page, re.I,
            )

        page_title = clean(title_match.group(1)) if title_match else ""
        page_h1 = clean(h1_match.group(1)) if h1_match else ""
        expected_path = f"/ships/{slug}"

        if not page_h1:
            error("missing-h1", slug=slug)
        elif sort_key(page_h1) != sort_key(card["name"]):
            warn("card-h1-name-mismatch", slug=slug, card=card["name"], h1=page_h1)

        if not page_title:
            error("missing-title", slug=slug)
        elif sort_key(card["name"]) not in sort_key(page_title):
            warn("card-title-name-mismatch", slug=slug, card=card["name"], title=page_title)

        if not canon_match:
            error("missing-canonical", slug=slug)
        elif norm_url_path(canon_match.group(1)) != expected_path:
            error(
                "canonical-mismatch",
                slug=slug,
                canonical=canon_match.group(1),
                expected=f"https://oceanliners.net{expected_path}",
            )

        # Year consistency is review-only because launch/service years legitimately differ.
        if card["year"] and re.fullmatch(r"\d{4}", card["year"]):
            year = card["year"]
            title_year = re.search(r"\((\d{4})\)", card["name"])
            h1_year = re.search(r"\((\d{4})\)", page_h1)
            if title_year and title_year.group(1) != year:
                warn("card-name-year-mismatch", slug=slug, dataYear=year, cardName=card["name"])
                years_flagged += 1
            if h1_year and h1_year.group(1) != year:
                warn("h1-year-mismatch", slug=slug, dataYear=year, h1=page_h1)
                years_flagged += 1

        if card["line"]:
            line_variants[card["line"].casefold()].add(card["line"])

        sections = h2_texts(page)
        for required in REQUIRED_SECTIONS:
            if not any(required.casefold() == section.casefold() for section in sections):
                warn("missing-standard-section", slug=slug, section=required)
                structural_warnings += 1

        if not any(re.fullmatch(r"(?:Selected\s+)?Sources(?:\s*\(Selected\))?", section, re.I) for section in sections):
            warn("missing-sources-section", slug=slug)
            structural_warnings += 1

        if "Evidence-first ship guide" not in page:
            warn("missing-evidence-badge", slug=slug)
            structural_warnings += 1

        for asset in REQUIRED_ASSETS:
            if asset not in page:
                warn("missing-standard-asset", slug=slug, asset=asset)
                structural_warnings += 1

        if 'id="site-header"' not in page and "id='site-header'" not in page:
            warn("missing-site-header-mount", slug=slug)
            structural_warnings += 1

        # Narrative links are the best objective proxy for inline citations.
        before_sources = guide_text_before_sources(page)
        narrative_links = []
        for href in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\']', before_sources, re.I):
            # Internal navigational anchors in the narrative are allowed.
            if href.startswith("#"):
                continue
            narrative_links.append(href)
        if narrative_links:
            error("inline-narrative-links", slug=slug, hrefs=sorted(set(narrative_links)))
            inline_link_errors += 1

        refs = image_refs(page)
        for ref in refs:
            if ref not in tracked:
                error("missing-image-file", slug=slug, image=ref)
                image_errors += 1

        # Hero/OG/Twitter consistency: warn if multiple different ship images are used.
        if len(refs) > 1:
            warn("multiple-ship-image-references", slug=slug, images=sorted(refs))

    stats["inlineLinkErrors"] = inline_link_errors
    stats["imageErrors"] = image_errors
    stats["structuralWarnings"] = structural_warnings
    stats["yearWarnings"] = years_flagged

    # 8. Reverse-direction orphan audit.
    tracked_guides = {
        Path(path).stem
        for path in tracked
        if path.startswith("ships/")
        and path.endswith(".html")
        and Path(path).name != "ships.html"
    }
    known_nonship = {"tall-ships-guide"}
    orphan_guides = sorted(tracked_guides - archive_slugs - known_nonship)
    for slug in orphan_guides:
        warn("orphan-guide-html", slug=slug, file=f"ships/{slug}.html")

    tracked_images = {
        path
        for path in tracked
        if path.startswith("ships/") and Path(path).suffix.lower() in IMAGE_EXTS
    }
    referenced_images = set()
    for page in guide_html_by_slug.values():
        referenced_images.update(image_refs(page))
    orphan_images = sorted(tracked_images - referenced_images)
    for image in orphan_images:
        warn("orphan-ship-image", image=image)

    stats["orphanGuides"] = len(orphan_guides)
    stats["orphanImages"] = len(orphan_images)

    # 9. Source-section hygiene.
    for slug, page in guide_html_by_slug.items():
        section = re.search(
            r'<h2[^>]*>\s*(?:Selected\s+)?Sources(?:\s*\(Selected\))?\s*</h2>([\s\S]*?)(?=<h2\b|</div>)',
            page, re.I,
        )
        if not section:
            continue
        hrefs = re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\']', section.group(1), re.I)
        duplicates = [href for href, count in Counter(hrefs).items() if count > 1]
        if duplicates:
            warn("duplicate-source-url", slug=slug, hrefs=sorted(duplicates))
        external = [href for href in hrefs if href.startswith("http")]
        if not external:
            warn("no-external-selected-source", slug=slug)

    # 10. Related Liners references must resolve to archive guides.
    if RELATED.is_file():
        related_text = RELATED.read_text(encoding="utf-8", errors="replace")
        refs = {
            slug_from_href(href)
            for href in re.findall(r'href:\s*["\']([^"\']+)["\']', related_text)
            if "/ships/" in href
        }
        unresolved = sorted(refs - archive_slugs)
        for slug in unresolved:
            error("related-liner-unresolved", slug=slug)
        stats["relatedLinerRefs"] = len(refs)
        stats["relatedLinerUnresolved"] = len(unresolved)

    # Operator normalization review: case-only duplicates are already merged; surface
    # near-identical common variants that likely want canonical display naming.
    lines = sorted({card["line"] for card in cards if card["line"]})
    canonical_tokens = defaultdict(list)
    for line in lines:
        token = re.sub(r"\([^)]*\)", "", line).replace("Line", "").strip().casefold()
        canonical_tokens[token].append(line)
    for token, variants in sorted(canonical_tokens.items()):
        if len(variants) > 1:
            warn("operator-name-variants", normalized=token, variants=variants)

    payload = {
        "schema": 1,
        "project": "Ocean Liner Curator",
        "audit": "ship-archive-consistency",
        "status": "error" if errors else ("warning" if warnings else "healthy"),
        "counts": {
            "errors": len(errors),
            "warnings": len(warnings),
            **stats,
        },
        "errors": errors,
        "warnings": warnings,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"Archive consistency: {payload['status']} | "
        f"{len(cards)} cards | {len(errors)} errors | {len(warnings)} warnings"
    )
    for item in errors:
        print(f"ERROR {item['code']}: {json.dumps(item, ensure_ascii=False)}")
    if warnings:
        print(f"Warnings recorded in {OUT.relative_to(ROOT)}")

    if errors or (args.fail_on_warnings and warnings):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
