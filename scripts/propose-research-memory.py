#!/usr/bin/env python3
"""Merge research *investigation records* into a PR-bound ledger, never site content."""
import argparse
import json
from pathlib import Path

ALLOWED_STATUSES = {"pending_editorial_review"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proposal", required=True, type=Path)
    parser.add_argument("--ledger", default=Path("research/agent-ledger.json"), type=Path)
    parser.add_argument("--run-url", required=True)
    args = parser.parse_args()

    ledger = json.loads(args.ledger.read_text(encoding="utf-8"))
    proposal = json.loads(args.proposal.read_text(encoding="utf-8"))
    if ledger.get("schema_version") != 1 or not isinstance(ledger.get("entries"), dict):
        raise SystemExit("Invalid ledger schema")
    if proposal.get("schema_version") != 1 or not isinstance(proposal.get("entries"), dict):
        raise SystemExit("Invalid proposal schema")

    added = []
    for name, record in sorted(proposal["entries"].items()):
        if not (name.endswith(".html") and "/" not in name and "\\" not in name):
            raise SystemExit("Invalid ship guide name in proposal")
        if record.get("review_status") not in ALLOWED_STATUSES:
            raise SystemExit("Invalid status: only pending editorial review is allowed")
        if not Path("ships", name).is_file():
            raise SystemExit(f"Guide not found: {name}")
        if name in ledger["entries"]:
            continue
        ledger["entries"][name] = {
            "investigated_at": record["investigated_at"],
            "review_status": "pending_editorial_review",
            "dossier": args.run_url,
            "notes": "Automatically proposed from successful research run; citations and claims require independent editorial verification.",
        }
        added.append(name)

    if added:
        args.ledger.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("New investigations:", ", ".join(added) if added else "none")
    Path("research-ledger-added.txt").write_text("\n".join(added) + ("\n" if added else ""), encoding="utf-8")

if __name__ == "__main__":
    main()
