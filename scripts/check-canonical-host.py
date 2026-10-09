#!/usr/bin/env python3
"""Guard against reintroducing the legacy www canonical host.

The repository still contains historical legacy metadata. This check reports
the full backlog, but fails CI only when an HTML file changed by the current
commit/PR contains a legacy canonical or og:url value.
"""

from __future__ import annotations

import os
import re
import subprocess
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


def findings_for(path: Path) -> list[tuple[str, str, str]]:
    html = path.read_text(encoding="utf-8", errors="replace")
    rel = path.relative_to(ROOT).as_posix()
    findings: list[tuple[str, str, str]] = []

    canonical = first_value(CANONICAL_PATTERNS, html)
    og_url = first_value(OG_URL_PATTERNS, html)

    if canonical and LEGACY_HOST in canonical.lower():
        findings.append((rel, "canonical", canonical))
    if og_url and LEGACY_HOST in og_url.lower():
        findings.append((rel, "og:url", og_url))
    return findings


def changed_html_paths() -> set[str]:
    event = os.getenv("GITHUB_EVENT_NAME", "")
    base_ref = os.getenv("GITHUB_BASE_REF", "").strip()

    if event == "pull_request" and base_ref:
        cmd = ["git", "diff", "--name-only", "--diff-filter=ACMR", f"origin/{base_ref}...HEAD"]
    else:
        cmd = ["git", "diff", "--name-only", "--diff-filter=ACMR", "HEAD^", "HEAD"]

    try:
        output = subprocess.check_output(cmd, cwd=ROOT, text=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Manual/local fallback: treat every HTML file as in scope.
        return {
            path.relative_to(ROOT).as_posix()
            for path in ROOT.rglob("*.html")
            if ".git" not in path.parts and "node_modules" not in path.parts
        }

    return {
        line.strip()
        for line in output.splitlines()
        if line.strip().lower().endswith(".html")
    }


def main() -> int:
    all_findings: list[tuple[str, str, str]] = []
    html_files = [
        path for path in sorted(ROOT.rglob("*.html"))
        if ".git" not in path.parts and "node_modules" not in path.parts
    ]

    for path in html_files:
        all_findings.extend(findings_for(path))

    changed = changed_html_paths()
    blocking = [item for item in all_findings if item[0] in changed]

    print(
        f"Canonical host health: {len(html_files)} HTML files checked | "
        f"{len(all_findings)} legacy metadata value(s) in existing corpus | "
        f"{len(blocking)} blocking value(s) in changed files"
    )

    if all_findings:
        affected_files = sorted({item[0] for item in all_findings})
        print(f"Legacy backlog: {len(affected_files)} file(s) still need normalization.")

    if blocking:
        for file_path, field, value in blocking:
            print(f"ERROR {file_path}: {field} uses legacy host: {value}")
        print("Expected canonical host: https://oceanliners.net")
        return 1

    print("Canonical host health: healthy for this change set")
    return 0


if __name__ == "__main__":
    sys.exit(main())
