#!/usr/bin/env python3
"""Restore generated JSON files when their only changes are volatile timestamps.

This keeps CI deterministic without hiding substantive generated-output changes.
For each requested file, compare the working-tree JSON with HEAD after recursively
removing known generation-time metadata. If the remaining JSON is identical,
restore the exact HEAD version.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VOLATILE_KEYS = {"generated", "generatedAt", "archiveGenerated"}


def without_volatile(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: without_volatile(item)
            for key, item in value.items()
            if key not in VOLATILE_KEYS
        }
    if isinstance(value, list):
        return [without_volatile(item) for item in value]
    return value


def head_text(path: str) -> str | None:
    try:
        return subprocess.check_output(
            ["git", "-C", str(ROOT), "show", f"HEAD:{path}"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return None


def stabilise(path: str) -> bool:
    target = ROOT / path
    if not target.is_file():
        return False

    previous = head_text(path)
    if previous is None:
        return False

    current = target.read_text(encoding="utf-8")
    if current == previous:
        return False

    try:
        previous_json = json.loads(previous)
        current_json = json.loads(current)
    except json.JSONDecodeError:
        return False

    if without_volatile(previous_json) != without_volatile(current_json):
        return False

    target.write_text(previous, encoding="utf-8")
    print(f"Restored timestamp-only generated diff: {path}")
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="+", help="Generated JSON files to stabilise")
    args = parser.parse_args()

    restored = sum(1 for path in args.files if stabilise(path))
    print(f"Stabilised {restored} timestamp-only generated file(s).")


if __name__ == "__main__":
    main()
