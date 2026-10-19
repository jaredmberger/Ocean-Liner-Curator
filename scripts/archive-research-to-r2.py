#!/usr/bin/env python3
"""Write immutable per-run research artifacts into a private Cloudflare R2 bucket.

This script must run only with a bucket-scoped R2 write token. No public URLs,
no CuratorOS HTTP import, and no modification of canonical records.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re

ALLOWED = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
RUN_ID = re.compile(r"^[0-9]{1,20}$")
MAX_FILE_SIZE = 1024 * 1024
SUFFIXES = (".md", ".evidence.json")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--directory", type=Path, required=True)
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--allow-legacy-markdown-only", action="store_true", help="Allow historical dossier artifacts without evidence JSON")
    args = ap.parse_args()
    if not RUN_ID.fullmatch(args.run_id):
        ap.error("run-id must contain 1–20 digits")
    account = os.environ.get("R2_ACCOUNT_ID", "")
    bucket = os.environ.get("R2_RESEARCH_BUCKET", "")
    key = os.environ.get("R2_ACCESS_KEY_ID", "")
    secret = os.environ.get("R2_SECRET_ACCESS_KEY", "")
    if not all((account, bucket, key, secret)):
        raise SystemExit("R2 archive not configured; no upload attempted")
    if not ALLOWED.fullmatch(bucket) or not re.fullmatch(r"[a-f0-9]{32}", account):
        raise SystemExit("Invalid R2 account or bucket configuration")
    if not args.directory.is_dir():
        raise SystemExit("Research output directory unavailable")
    files = sorted(p for p in args.directory.iterdir() if p.is_file()
                   and (p.name.endswith(SUFFIXES)) and ALLOWED.fullmatch(p.name)
                   and not p.is_symlink())
    markdown = [p for p in files if p.name.endswith(".md") and p.name != "README.md"]
    evidence = [p for p in files if p.name.endswith(".evidence.json")]
    if not evidence and not (args.allow_legacy_markdown_only and markdown):
        raise SystemExit("No research evidence registers found (legacy Markdown requires explicit backfill flag)")
    for path in files:
        if path.stat().st_size > MAX_FILE_SIZE:
            raise SystemExit(f"Research file exceeds maximum size: {path.name}")
    import boto3
    from botocore.config import Config
    client = boto3.client("s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=key, aws_secret_access_key=secret,
        region_name="auto", config=Config(signature_version="s3v4",
                                          retries={"max_attempts": 3, "mode": "standard"}))
    manifest = {"schema_version": 1, "run_id": args.run_id,
                "editorial_status": "unverified_pending_editorial_review",
                "evidence_registers_present": bool(evidence),
                "legacy_markdown_only": not bool(evidence),
                "files": []}
    for path in files:
        data = path.read_bytes()
        manifest["files"].append({"name": path.name, "sha256": hashlib.sha256(data).hexdigest(),
                                  "bytes": len(data)})
        # Each research run has an independent key prefix; retries overwrite identical bytes only.
        client.put_object(Bucket=bucket, Key=f"runs/{args.run_id}/{path.name}",
                          Body=data, ContentType="application/json" if path.suffix == ".json" else "text/markdown",
                          Metadata={"editorial-status": "unverified"})
        print(f"Archived {path.name} ({len(data)} bytes)")
    payload = json.dumps(manifest, sort_keys=True, indent=2).encode("utf-8")
    client.put_object(Bucket=bucket, Key=f"runs/{args.run_id}/manifest.json",
                      Body=payload, ContentType="application/json",
                      Metadata={"editorial-status": "unverified"})
    print(f"Archived {len(files)} research files under run {args.run_id} (private R2)")

if __name__ == "__main__":
    main()
