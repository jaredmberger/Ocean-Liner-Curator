#!/usr/bin/env python3
"""Generate ESP32-friendly Ocean Liner Curator device feeds from ships/ships.html.

The ship archive page is the canonical source for names, line, year, summary and
page links. Individual ship pages are inspected only for optional builder and
image metadata. No historical facts are invented when a field is unavailable.
"""

from __future__ import annotations

import json
import re
from datetime import date
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_HTML = ROOT / "ships" / "ships.html"
DEVICE_DIR = ROOT / "api" / "device"
DETAIL_DIR = DEVICE_DIR / "ships"
SITE = "https://oceanliners.net"

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP")
SKIP_IMAGE_WORDS = ("logo", "favicon", "icon", "glyph", "flag", "tile", "badge", "star", "arrow")


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def slug_from_href(href: str) -> str:
    path = urlparse(href).path.rstrip("/")
    name = Path(path).name
    if name.lower().endswith(".html"):
        name = name[:-5]
    return name


def local_page_from_href(href: str) -> Path | None:
    path = urlparse(href).path.lstrip("/")
    candidate = ROOT / path
    if candidate.is_file():
        return candidate
    if not candidate.suffix:
        html_candidate = candidate.with_suffix(".html")
        if html_candidate.is_file():
            return html_candidate
    return None


class ArchiveParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.cards: list[dict] = []
        self.card: dict | None = None
        self.article_depth = 0
        self.capture_title = False
        self.capture_desc = False
        self.title_parts: list[str] = []
        self.desc_parts: list[str] = []

    @staticmethod
    def _classes(attrs: dict[str, str]) -> set[str]:
        return set(attrs.get("class", "").split())

    def handle_starttag(self, tag: str, attrs_list) -> None:
        attrs = dict(attrs_list)
        if tag == "article" and "guide-card" in self._classes(attrs):
            self.card = {
                "line": attrs.get("data-line", "").strip(),
                "year": attrs.get("data-year", "").strip(),
                "href": "",
                "name": "",
                "summary": "",
            }
            self.article_depth = 1
            self.title_parts = []
            self.desc_parts = []
            return

        if self.card is None:
            return

        if tag == "article":
            self.article_depth += 1
        elif tag == "a" and "guide-title" in self._classes(attrs):
            self.card["href"] = attrs.get("href", "").strip()
            self.capture_title = True
        elif tag == "p" and "guide-desc" in self._classes(attrs):
            self.capture_desc = True

    def handle_endtag(self, tag: str) -> None:
        if self.card is None:
            return
        if tag == "a" and self.capture_title:
            self.capture_title = False
        elif tag == "p" and self.capture_desc:
            self.capture_desc = False
        elif tag == "article":
            self.article_depth -= 1
            if self.article_depth == 0:
                self.card["name"] = clean_text(" ".join(self.title_parts))
                self.card["summary"] = clean_text(" ".join(self.desc_parts))
                if self.card["name"] and self.card["href"]:
                    self.cards.append(self.card)
                self.card = None

    def handle_data(self, data: str) -> None:
        if self.card is None:
            return
        if self.capture_title:
            self.title_parts.append(data)
        if self.capture_desc:
            self.desc_parts.append(data)


def parse_year(raw: str):
    raw = raw.strip()
    if re.fullmatch(r"\d{4}", raw):
        return int(raw)
    return raw or None


def extract_canonical(page_html: str, fallback_href: str) -> str:
    match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', page_html, re.I)
    if match:
        return match.group(1).strip()
    return urljoin(SITE + "/", fallback_href.lstrip("/"))


def extract_builder(page_html: str) -> str:
    # Optional only: pages use several templates, so accept a few common fact-table forms.
    patterns = [
        r'Builder\s*</[^>]+>\s*<[^>]+>(.*?)</[^>]+>',
        r'Built\s+by\s*</[^>]+>\s*<[^>]+>(.*?)</[^>]+>',
        r'<(?:dt|th|strong)[^>]*>\s*(?:Builder|Built by)\s*:?(?:</(?:dt|th|strong)>)\s*<(?:dd|td|span)[^>]*>(.*?)</(?:dd|td|span)>',
        r'(?:Builder|Built by)\s*:\s*</?[^>]*>\s*([^<\n]{2,120})',
    ]
    for pattern in patterns:
        match = re.search(pattern, page_html, re.I | re.S)
        if match:
            value = clean_text(match.group(1))
            if value:
                return value
    return ""


def image_url_for(slug: str, page_html: str, page_path: Path | None) -> tuple[str, bool]:
    ships_dir = ROOT / "ships"

    # Prefer an image whose filename exactly matches the guide slug.
    for ext in IMAGE_EXTS:
        candidate = ships_dir / f"{slug}{ext}"
        if candidate.is_file():
            return f"{SITE}/ships/{candidate.name}", True

    # Then accept slug-prefixed images, shortest filename first.
    prefixed = []
    if ships_dir.is_dir():
        for candidate in ships_dir.glob(f"{slug}*"):
            if candidate.is_file() and candidate.suffix in IMAGE_EXTS:
                prefixed.append(candidate)
    if prefixed:
        prefixed.sort(key=lambda p: (len(p.name), p.name.lower()))
        return f"{SITE}/ships/{prefixed[0].name}", True

    # Finally inspect the ship page for a content image, excluding site chrome.
    candidates = []
    for match in re.finditer(r'<(?:img|source)\b[^>]*(?:src|srcset)=["\']([^"\']+)', page_html, re.I):
        raw = match.group(1).strip().split(",", 1)[0].split()[0]
        if not raw or raw.startswith("data:"):
            continue
        lower = raw.lower()
        if any(word in lower for word in SKIP_IMAGE_WORDS):
            continue
        if not any(lower.split("?", 1)[0].endswith(ext.lower()) for ext in IMAGE_EXTS):
            continue
        candidates.append(urljoin(SITE + "/", raw))
    if candidates:
        return candidates[0], True

    # Keep the legacy field usable while explicitly marking that no ship image was found.
    return f"{SITE}/logo.png", False


def build_record(card: dict) -> dict:
    href = card["href"]
    slug = slug_from_href(href)
    page_path = local_page_from_href(href)
    page_html = page_path.read_text(encoding="utf-8", errors="replace") if page_path else ""
    image, has_image = image_url_for(slug, page_html, page_path)
    canonical = extract_canonical(page_html, href)

    return {
        "id": slug,
        "name": card["name"],
        "line": card["line"],
        "year": parse_year(card["year"]),
        "builder": extract_builder(page_html),
        "summary": card["summary"],
        "tag": "SHIP GUIDE",
        "image": image,
        "hasImage": has_image,
        "page": canonical,
    }


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    if not ARCHIVE_HTML.is_file():
        raise SystemExit(f"Missing canonical archive: {ARCHIVE_HTML}")

    parser = ArchiveParser()
    parser.feed(ARCHIVE_HTML.read_text(encoding="utf-8", errors="replace"))
    records = [build_record(card) for card in parser.cards]

    # De-duplicate conservatively by id, preserving archive order.
    unique = []
    seen = set()
    for record in records:
        if not record["id"] or record["id"] in seen:
            continue
        seen.add(record["id"])
        unique.append(record)
    records = unique

    if len(records) < 100:
        raise SystemExit(f"Refusing to publish suspiciously small device archive ({len(records)} ships)")

    generated = date.today().isoformat()
    full_feed = {
        "schema": 2,
        "project": "Ocean Liner Curator",
        "site": SITE,
        "source": "/ships/ships.html",
        "generated": generated,
        "count": len(records),
        "ships": records,
    }
    write_json(DEVICE_DIR / "archive.json", full_feed)

    compact = {
        "schema": 2,
        "project": "Ocean Liner Curator",
        "site": SITE,
        "source": "/ships/ships.html",
        "generated": generated,
        "count": len(records),
        "ships": [
            {
                "id": r["id"],
                "name": r["name"],
                "line": r["line"],
                "year": r["year"],
                "image": r["image"],
                "hasImage": r["hasImage"],
            }
            for r in records
        ],
    }
    write_json(DEVICE_DIR / "archive-index.json", compact)

    DETAIL_DIR.mkdir(parents=True, exist_ok=True)
    for old in DETAIL_DIR.glob("*.json"):
        old.unlink()
    for record in records:
        write_json(DETAIL_DIR / f"{record['id']}.json", {"schema": 2, **record})

    featured = {
        "schema": 1,
        "project": "Ocean Liner Curator",
        "generated": generated,
        "count": sum(1 for r in records if r["hasImage"]),
        "shipIds": [r["id"] for r in records if r["hasImage"]],
    }
    write_json(DEVICE_DIR / "featured.json", featured)

    print(f"Generated device archive for {len(records)} ships; {featured['count']} have ship images.")


if __name__ == "__main__":
    main()
