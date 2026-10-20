#!/usr/bin/env python3
"""Fail-closed validation of a generated research investigation ledger commit.

Only new, unverified investigation records may be merged automatically.
Historical findings and ship guide edits are never approved here.
"""
import argparse
import datetime as dt
import json
import re
import subprocess
from pathlib import Path

LEDGER = "research/agent-ledger.json"
FIELDS = {"investigated_at", "review_status", "dossier", "notes"}

def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--expected-count", type=int, required=True)
    args = parser.parse_args()
    changed = git("diff", "--name-only", "HEAD^", "HEAD").splitlines()
    if changed != [LEDGER]:
        raise SystemExit(f"Refusing auto-merge: changed paths are {changed!r}")
    before = json.loads(git("show", f"HEAD^:{LEDGER}"))
    after = json.loads(Path(LEDGER).read_text(encoding="utf-8"))
    if before.get("schema_version") != 1 or after.get("schema_version") != 1:
        raise SystemExit("Unsupported research ledger schema")
    old, new = before.get("entries"), after.get("entries")
    if not isinstance(old, dict) or not isinstance(new, dict):
        raise SystemExit("Malformed ledger entries")
    if any(name not in new or new[name] != record for name, record in old.items()):
        raise SystemExit("Existing investigation ledger records changed or disappeared")
    added = set(new) - set(old)
    declared = set(Path("research-ledger-added.txt").read_text().splitlines())
    if not added or added != declared or len(added) > args.expected_count:
        raise SystemExit("New entries do not match the current research run")
    expected_url = (
        f"https://github.com/jaredmberger/Ocean-Liner-Curator/actions/runs/{args.run_id}"
    )
    for name in added:
        if not re.fullmatch(r"[a-zA-Z0-9_-]+\.html", name):
            raise SystemExit(f"Invalid ship guide: {name}")
        if not Path("ships", name).is_file():
            raise SystemExit(f"Ship guide missing: {name}")
        record = new[name]
        if not isinstance(record, dict) or set(record) != FIELDS:
            raise SystemExit(f"Unexpected record structure: {name}")
        if record["review_status"] != "pending_editorial_review":
            raise SystemExit(f"Record was marked verified: {name}")
        try:
            dt.date.fromisoformat(record["investigated_at"])
        except (ValueError, TypeError):
            raise SystemExit(f"Invalid investigation date: {name}")
        if record["dossier"] != expected_url:
            raise SystemExit(f"Unexpected dossier reference: {name}")
        if record["notes"] != (
            "Automatically proposed from successful research run; "
            "citations and claims require independent editorial verification."
        ):
            raise SystemExit(f"Unexpected notes or editorial assertion: {name}")
    print(f"Validated {len(added)} ledger-only investigation additions (unverified).")

if __name__ == "__main__":
    main()
