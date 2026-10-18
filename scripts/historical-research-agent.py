#!/usr/bin/env python3
"""Read-only historical research agent. Produces candidate dossiers, never edits guides."""
import argparse
import datetime as dt
import html
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "ships"
LEDGER = ROOT / "research" / "agent-ledger.json"
SYSTEM = """You are the Ocean Liner Curator Historical Research Agent. Investigate cautiously.
You must distinguish documented evidence, interpretation, and unknowns.
Prefer original contemporary documents, national archives, inquiries, newspapers, and established maritime reference collections.
Do not invent quotations, publication details, sources, exact dates, or URLs.
Web results are leads, not automatically verified evidence. Explicitly flag inaccessible or unverified sources.
Respect the vessel's exact identity and phase of service; distinguish namesakes and changes of operator.
Never recommend silently overwriting existing text. Make modest, specific additions only where clearly warranted.
Never recommend generating an image or copying copyrighted source text.
Return Markdown with headings: Research question; Current guide baseline; Candidate findings (each with a source URL and confidence); Contradictions and uncertainties; Recommended verification; Proposed editorial action.
For each proposed finding give: exact claim, direct source URL, publisher/institution and date if known, source type (contemporary primary / archival catalog / scholarly secondary / general secondary / derivative), and evidence access status (actual source read / search snippet only / inaccessible). Compare it explicitly with the current guide: already present, new, conflict or unclear. Note ship identities and service phases, competing evidence, uncertainty and confidence rationale. Do not mistake search snippets for source verification, or repeated derivative reports for independent corroboration. Favor no more than three strong leads. Finish with sections Sources inspected, Unverified source leads, Unresolved questions, and Editorial triage (no change / verification needed / candidate for human review). If credible evidence cannot be found, say so and recommend no change."""

def text_only(source):
    source = re.sub(r"(?is)<(script|style|nav|footer)\b.*?</\1>", " ", source)
    source = re.sub(r"(?s)<[^>]*>", " ", source)
    return html.unescape(re.sub(r"\s+", " ", source)).strip()

def load_ledger():
    if not LEDGER.exists():
        raise RuntimeError(f"Missing research ledger: {LEDGER}")
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    if ledger.get("schema_version") != 1 or not isinstance(ledger.get("entries"), dict):
        raise RuntimeError("Invalid research ledger schema")
    return ledger

def candidates(ledger):
    guides = []
    reviewed = ledger["entries"]
    for file in GUIDES.glob("*.html"):
        if file.name in reviewed:
            continue  # Earlier investigation recorded in persistent reviewed ledger.
        raw = file.read_text(encoding="utf-8", errors="replace")
        body = text_only(raw)
        if len(body) < 250:
            continue
        # Prioritize less-developed narrative; deterministic, not a verdict on quality.
        guides.append((len(body), file, body))
    return sorted(guides, key=lambda x: (x[0], x[1].name))

def research(name, guide):
    key = os.environ["OPENAI_API_KEY"]
    payload = {
        "model": os.getenv("RESEARCH_MODEL", "gpt-5"),
        "tools": [{"type": "web_search"}],
        "max_output_tokens": 7000,
        "reasoning": {"effort": "low"},
        "instructions": SYSTEM,
        "input": f"Investigate this existing vessel guide. Guide path: ships/{name}\nExisting text excerpt (may be incomplete):\n{guide[:11500]}\nSeek up to three meaningful evidence-backed research leads, not a rewrite. Avoid repeating claims already in the guide. Never present a search-result snippet as primary-source verification.",
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.load(response)
    chunks = []
    for item in result.get("output", []):
        if item.get("type") == "message":
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    chunks.append(part.get("text", ""))
    if not chunks:
        status = result.get("status", "unknown")
        reason = (result.get("incomplete_details") or {}).get("reason", "not provided")
        types = ",".join(item.get("type", "?") for item in result.get("output", []))
        usage = result.get("usage") or {}
        raise RuntimeError(f"Empty dossier: status={status}; incomplete_reason={reason}; output_types={types}; output_tokens={usage.get('output_tokens', 'unknown')}")
    return "\n\n".join(chunks)

def evidence_register(name, dossier):
    """Extract structured *unverified* claims; no independent source retrieval here."""
    schema = {
        "type": "object",
        "properties": {
            "claims": {
                "type": "array",
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "properties": {
                        "claim": {"type": "string"},
                        "guide_comparison": {"type": "string", "enum": ["new", "already_present", "possible_conflict", "unclear"]},
                        "source_url": {"type": "string"},
                        "source_title": {"type": "string"},
                        "source_type": {"type": "string", "enum": ["contemporary_primary", "archival_catalog", "scholarly_secondary", "general_secondary", "derivative", "unknown"]},
                        "access_status": {"type": "string", "enum": ["model_reports_read", "model_reports_snippet_only", "inaccessible", "unknown"]},
                        "source_support": {"type": "string"},
                        "identity_and_period": {"type": "string"},
                        "uncertainty": {"type": "string"},
                        "verification_needed": {"type": "string"}
                    },
                    "required": ["claim", "guide_comparison", "source_url", "source_title", "source_type", "access_status", "source_support", "identity_and_period", "uncertainty", "verification_needed"],
                    "additionalProperties": False
                }
            }
        },
        "required": ["claims"],
        "additionalProperties": False
    }
    payload = {
        "model": os.getenv("RESEARCH_MODEL", "gpt-5"),
        "max_output_tokens": 4000,
        "reasoning": {"effort": "low"},
        "instructions": "Extract up to three research claims from the supplied dossier only. Do not use external knowledge or invent sources. If no actual source URL supports a claim, leave source_url empty. Never assert that a source or claim has been independently verified. Output only the requested JSON.",
        "input": dossier[:26000],
        "text": {"format": {"type": "json_schema", "name": "evidence_claims", "strict": True, "schema": schema}},
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        result = json.load(response)
    strings = [part.get("text", "") for item in result.get("output", [])
               if item.get("type") == "message"
               for part in item.get("content", []) if part.get("type") == "output_text"]
    if not strings:
        raise RuntimeError("No structured evidence response returned")
    data = json.loads("".join(strings))
    for claim in data["claims"]:
        url = claim["source_url"]
        # A citation must occur verbatim in the dossier. This is an integrity check,
        # not evidence that the remote source is accessible or that the claim is true.
        if url and (not url.startswith(("https://", "http://")) or url not in dossier):
            raise RuntimeError("Structured register contains a source URL absent from dossier")
        claim["editorial_status"] = "unverified_pending_editorial_review"
        claim["independently_verified"] = False
    return {"schema_version": 1, "guide": name, "verification_method": "model_extraction_only", "claims": data["claims"]}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--count", type=int, default=3)
    p.add_argument("--output", default="research-agent-output")
    args = p.parse_args()
    if not 1 <= args.count <= 5:
        p.error("--count must be 1..5")
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is required; no research run attempted.")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    ledger = load_ledger()
    selected = candidates(ledger)[:args.count]
    if not selected:
        raise SystemExit("No eligible ship guides found")
    summary = ["# Historical Research Agent — Review Queue", "", f"Run: {dt.datetime.now(dt.timezone.utc).isoformat()}", "", "Research leads only. No guide files modified. Human verification required.", ""]
    pending = {"schema_version": 1, "entries": {}}
    failures = 0
    for length, file, guide in selected:
        print(f"Investigating {file.name} ({length} characters)", flush=True)
        try:
            dossier = research(file.name, guide)
            path = output / (file.stem + ".md")
            path.write_text(f"# Research dossier — {file.stem}\n\nSource guide: ships/{file.name}\n\n{dossier}\n", encoding="utf-8")
            register = evidence_register(file.name, dossier)
            register_path = output / (file.stem + ".evidence.json")
            register_path.write_text(json.dumps(register, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            summary.append(f"- {file.name}: dossier + unverified claim register generated ({path.name}, {register_path.name})")
            pending["entries"][file.name] = {
                "investigated_at": dt.datetime.now(dt.timezone.utc).date().isoformat(),
                "review_status": "pending_editorial_review",
                "dossier": path.name,
                "notes": "Unverified research leads. Review before incorporation into the authoritative ledger."
            }
        except (urllib.error.URLError, TimeoutError, RuntimeError, ValueError) as exc:
            failures += 1
            message = str(exc).replace("\\n", " ")[:500]
            print(f"::error title=Research dossier failed::{file.name}: {type(exc).__name__}: {message}", flush=True)
            summary.append(f"- {file.name}: FAILED ({type(exc).__name__}: {message}); no findings inferred")
    (output / "proposed-ledger-additions.json").write_text(json.dumps(pending, indent=2) + "\n", encoding="utf-8")
    (output / "README.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print("\n".join(summary), flush=True)
    if failures:
        raise SystemExit(f"{failures} of {len(selected)} research dossiers failed")

if __name__ == "__main__":
    main()
