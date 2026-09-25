#!/usr/bin/env python3
"""Generate a deterministic CuratorOS integrity/freshness manifest.

This audit reconciles the public ship archive against the device feed, ship
sitemap, both Random Ship lists, device detail files, and CuratorOS intelligence
feeds. It intentionally reports incomplete builder coverage without treating it
as a failure: builder curation remains a reviewed, evolving dataset.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "api" / "device" / "curatoros-integrity.json"
ARCHIVE = ROOT / "api" / "device" / "archive.json"
SHIP_SITEMAP = ROOT / "sitemaps" / "sitemap-ships.xml"
RANDOM_FILES = [ROOT / "random-ship.js", ROOT / "assets" / "random-ship.js"]
DETAIL_DIR = ROOT / "api" / "device" / "ships"
BUILDERS = ROOT / "data" / "builders.json"
INTELLIGENCE_FEEDS = [
    ROOT / "data" / "curatoros-archive-gaps.json",
    ROOT / "data" / "curatoros-builders.json",
    ROOT / "data" / "curatoros-classes-sisters.json",
    ROOT / "data" / "curatoros-eras.json",
    ROOT / "data" / "curatoros-operators.json",
    ROOT / "data" / "curatoros-yards.json",
]
RANDOM_EXCLUSIONS = {"tall-ships-guide"}
MIN_ARCHIVE_COUNT = 300


def slugs_from_random(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    slugs = set()
    for match in re.finditer(r"""["']/ships/([^"'?#]+?)(?:\.html)?["']""", text, re.I):
        slug = re.sub(r"\.html$", "", match.group(1), flags=re.I)
        if slug not in RANDOM_EXCLUSIONS:
            slugs.add(slug)
    return slugs


def slugs_from_sitemap(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    return set(re.findall(r"https://oceanliners\.net/ships/([a-z0-9-]+)\.html", text, re.I))


def diff(expected: set[str], actual: set[str]) -> dict:
    return {
        "missing": sorted(expected - actual),
        "extra": sorted(actual - expected),
        "match": expected == actual,
    }


def feed_summary(path: Path) -> dict:
    item = {"file": path.relative_to(ROOT).as_posix(), "exists": path.is_file()}
    if not path.is_file():
        item["status"] = "missing"
        return item
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        item.update(status="invalid-json", error=str(exc))
        return item
    item.update(
        status="ok",
        generatedAt=payload.get("generatedAt") or payload.get("generated"),
    )
    counts = payload.get("counts")
    if isinstance(counts, dict):
        item["counts"] = counts
    elif isinstance(payload.get("count"), int):
        item["count"] = payload["count"]
    return item


def main() -> None:
    archive = json.loads(ARCHIVE.read_text(encoding="utf-8"))
    archive_ids = {ship["id"] for ship in archive.get("ships", []) if ship.get("id")}
    random_expected = archive_ids - RANDOM_EXCLUSIONS

    sitemap_ids = slugs_from_sitemap(SHIP_SITEMAP)
    detail_ids = {p.stem for p in DETAIL_DIR.glob("*.json")}

    checks = []

    def add(name: str, ok: bool, severity: str = "error", **details):
        checks.append({"name": name, "ok": ok, "severity": severity, **details})

    add(
        "archive-minimum",
        len(archive_ids) >= MIN_ARCHIVE_COUNT,
        count=len(archive_ids),
        minimum=MIN_ARCHIVE_COUNT,
    )
    add(
        "archive-declared-count",
        archive.get("count") == len(archive_ids),
        declared=archive.get("count"),
        actual=len(archive_ids),
    )

    sitemap_diff = diff(archive_ids, sitemap_ids)
    add("ship-sitemap-reconciliation", sitemap_diff["match"], **sitemap_diff)

    detail_diff = diff(archive_ids, detail_ids)
    add("device-detail-reconciliation", detail_diff["match"], **detail_diff)

    random_reports = []
    for path in RANDOM_FILES:
        actual = slugs_from_random(path)
        result = diff(random_expected, actual)
        random_reports.append({
            "file": path.relative_to(ROOT).as_posix(),
            "count": len(actual),
            **result,
        })
    add(
        "random-ship-reconciliation",
        all(r["match"] for r in random_reports),
        expectedCount=len(random_expected),
        intentionalExclusions=sorted(RANDOM_EXCLUSIONS),
        files=random_reports,
    )

    builder_report = feed_summary(BUILDERS)
    builder_unknown = []
    if BUILDERS.is_file():
        try:
            payload = json.loads(BUILDERS.read_text(encoding="utf-8"))
            for builder in payload.get("builders", []):
                for ship_id in builder.get("shipIds", []):
                    if ship_id not in archive_ids:
                        builder_unknown.append({"builder": builder.get("id"), "shipId": ship_id})
        except Exception:
            pass
    add(
        "builder-references-resolve",
        not builder_unknown,
        severity="warning",
        unknownShipReferences=builder_unknown,
        note="Incomplete builder coverage is allowed; only references to nonexistent archive IDs are flagged.",
    )

    intelligence = [feed_summary(path) for path in INTELLIGENCE_FEEDS]
    missing_or_invalid = [x["file"] for x in intelligence if x.get("status") != "ok"]
    add(
        "curatoros-intelligence-feeds-readable",
        not missing_or_invalid,
        severity="warning",
        affected=missing_or_invalid,
    )

    errors = [c for c in checks if not c["ok"] and c["severity"] == "error"]
    warnings = [c for c in checks if not c["ok"] and c["severity"] == "warning"]

    manifest = {
        "schema": 1,
        "project": "Ocean Liner Curator",
        "system": "CuratorOS",
        "status": "healthy" if not errors else "error",
        "generatedFrom": {
            "archiveGenerated": archive.get("generated"),
        },
        "counts": {
            "archive": len(archive_ids),
            "randomEligible": len(random_expected),
            "sitemapShips": len(sitemap_ids),
            "deviceDetails": len(detail_ids),
            "errors": len(errors),
            "warnings": len(warnings),
        },
        "freshness": {
            "archive": feed_summary(ARCHIVE),
            "builders": builder_report,
            "intelligenceFeeds": intelligence,
        },
        "checks": checks,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"CuratorOS integrity: {manifest['status']} | "
        f"{len(archive_ids)} archive entries | {len(errors)} errors | {len(warnings)} warnings"
    )
    if errors:
        for check in errors:
            print(f"ERROR: {check['name']}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
