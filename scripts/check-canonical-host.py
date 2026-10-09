#!/usr/bin/env python3
"""Fail CI when canonical metadata reintroduces the legacy www host."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY_HOST = "www.oceanliners.net"

CANONICAL_PATTERNS = (
    re.compile(
        r'<link\b(?=[^>]*\brel=["\']canonical["\'])(?=[^>]*\bhref=["\']([^"\']+)["\'])[^>]*>',
        re.I,
    ),
    re.compile(
        r'<link\b(?=[^>]*\bhref=["\']([^"\']+)["\'])(?=[^>]*\brel=["\']canonical["\'])[^>]*>',
        re.I,
    ),
)
OG_URL_PATTERNS = (
    re.compile(
        r'<meta\b(?=[^>]*\bproperty=["\']og:url["\'])(?=[^>]*\bcontent=["\']([^"\']+)["\'])[^>]*>',
        re.I,
    ),
    re.compile(
        r'<meta\b(?=[^>]*\bcontent=["\']([^"\']+)["\'])(?=[^>]*\bproperty=["\']og:url["\'])[^>]*>',
        re.I,
    ),
)


def first_value(patterns: tuple[re.Pattern[str], ...], html: str) -> str | None:
    for pattern in patterns:
        match = pattern.search(html)
        if match:
            return match.group(1).strip()
    return None


def main() -> int:
    offenders: list[tuple[str, str, str]] = []
    checked = 0

    for path in sorted(ROOT.rglob("*.html")):
        if any(part in {".git", "node_modules"} for part in path.parts):
            continue

        checked += 1
        html = path.read_text(encoding="utf-8", errors="replace")
        canonical = first_value(CANONICAL_PATTERNS, html)
        og_url = first_value(OG_URL_PATTERNS, html)

        if canonical and LEGACY_HOST in canonical.lower():
            offenders.append((path.relative_to(ROOT).as_posix(), "canonical", canonical))
        if og_url and LEGACY_HOST in og_url.lower():
            offenders.append((path.relative_to(ROOT).as_posix(), "og:url", og_url))

    if offenders:
        print(
            f"Canonical host health: FAILED | {checked} HTML files checked | "
            f"{len(offenders)} legacy metadata value(s)"
        )
        for file_path, field, value in offenders:
            print(f"ERROR {file_path}: {field} uses legacy host: {value}")
        print("Expected canonical host: https://oceanliners.net")
        return 1

    print(f"Canonical host health: healthy | {checked} HTML files checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
