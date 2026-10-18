#!/usr/bin/env python3
"""Explicitly opted-in upload of unverified evidence registers to CuratorOS."""
import argparse
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

ENDPOINT = "https://curator.oceanliners.net/api/research-agent/import"

def classify_error(error):
    """Report fixed categories only; never log response bodies or credentials."""
    headers = error.headers
    markers = []
    for label, header in (
        ("access-location", "Location"),
        ("access-request-id", "CF-Access-Request-Id"),
        ("challenge-indicator", "cf-mitigated"),
        ("worker-indicator", "x-worker-error"),
    ):
        if headers.get(header):
            markers.append(label)
    # Inspect a bounded error body locally. Only emit hard-coded classifications.
    sample = error.read(4096).lower()
    if b"error 1020" in sample or b"access denied" in sample and b"cloudflare" in sample:
        category = "cloudflare-access-denied-page"
    elif b"cloudflare access" in sample or b"/cdn-cgi/access/" in sample:
        category = "cloudflare-access-response"
    elif b"attention required" in sample or b"just a moment" in sample or b"challenge-platform" in sample:
        category = "cloudflare-challenge-response"
    elif b"forbidden" in sample:
        category = "generic-forbidden"
    elif b"error code: 403" in sample:
        category = "generic-403"
    else:
        category = "unclassified"
    return category, markers

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=Path, default=Path("research-agent-output"))
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    token = os.environ.get("CURATOROS_RESEARCH_IMPORT_TOKEN", "")
    if not token:
        raise SystemExit("Missing CURATOROS_RESEARCH_IMPORT_TOKEN; no upload attempted")
    access_id = os.environ.get("CURATOROS_CF_ACCESS_CLIENT_ID", "")
    access_secret = os.environ.get("CURATOROS_CF_ACCESS_CLIENT_SECRET", "")
    if not access_id or not access_secret:
        raise SystemExit("Cloudflare Access service credentials are required; no upload attempted")
    files = sorted(args.directory.glob("*.evidence.json"))
    if not files:
        raise SystemExit("No evidence registers; no upload attempted")
    for path in files:
        register = json.loads(path.read_text(encoding="utf-8"))
        payload = json.dumps({"run_id": args.run_id, "register": register}).encode("utf-8")
        request = urllib.request.Request(
            ENDPOINT,
            data=payload,
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json",
                     "CF-Access-Client-Id": access_id, "CF-Access-Client-Secret": access_secret},
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
            # Response metadata only; never echo credentials, response body or full URLs.
            cf_ray = (error.headers.get("CF-Ray") or "unavailable").splitlines()[0][:100]
            content_type = (error.headers.get("Content-Type") or "unknown").split(";")[0][:60]
            service = (error.headers.get("Server") or "unknown").splitlines()[0][:40]
            category, markers = classify_error(error)
            print(f"{path.name}: import failed: HTTP {error.code}; content-type={content_type}; server={service}; CF-Ray={cf_ray}")
            print(f"Response classification: {category}; header indicators: {','.join(markers) or 'none'}")
            if error.code == 403:
                print("403 is not emitted by the Research Agent endpoint; compare Access, WAF, and response classification for the CF-Ray.")
            raise SystemExit(1) from None

if __name__ == "__main__":
    main()
