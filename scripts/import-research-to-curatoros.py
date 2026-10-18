#!/usr/bin/env python3
"""Explicitly opted-in upload of unverified evidence registers to CuratorOS."""
import argparse
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

ENDPOINT = "https://curator.oceanliners.net/api/research-agent/import"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=Path, default=Path("research-agent-output"))
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    token = os.environ.get("CURATOROS_RESEARCH_IMPORT_TOKEN", "")
    if not token:
        raise SystemExit("Missing CURATOROS_RESEARCH_IMPORT_TOKEN; no upload attempted")
    files = sorted(args.directory.glob("*.evidence.json"))
    if not files:
        raise SystemExit("No evidence registers; no upload attempted")
    for path in files:
        register = json.loads(path.read_text(encoding="utf-8"))
        payload = json.dumps({"run_id": args.run_id, "register": register}).encode("utf-8")
        request = urllib.request.Request(
            ENDPOINT,
            data=payload,
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            # Never print a response body or headers that may contain sensitive data.
            with urllib.request.urlopen(request, timeout=25) as response:
                result = json.load(response)
                if response.status != 200 or not result.get("ok"):
                    raise RuntimeError("Import response did not indicate success")
                print(f"{path.name}: {result.get('imported', 0)} new, {result.get('already_present', 0)} existing")
        except urllib.error.HTTPError as error:
            raise SystemExit(f"{path.name}: CuratorOS import returned HTTP {error.code} (verify access, token, and enable flag)") from None

if __name__ == "__main__":
    main()
