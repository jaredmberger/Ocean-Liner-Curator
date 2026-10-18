#!/usr/bin/env python3
"""Offline, read-only reviewer for unverified historical research artifacts."""
import argparse
import html
import json
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("research-agent-output"))
    args = parser.parse_args()
    reports = []
    for file in sorted(args.input.glob("*.evidence.json")):
        data = json.loads(file.read_text(encoding="utf-8"))
        if data.get("schema_version") != 1 or not isinstance(data.get("claims"), list):
            raise ValueError(f"Malformed evidence register: {file.name}")
        reports.append({"guide": data.get("guide", file.stem), "claims": data["claims"], "dossier": file.name.replace(".evidence.json", ".md")})
    payload = json.dumps(reports, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    page = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="dark">
<title>CuratorOS — Research Review</title>
<style>
:root{color-scheme:dark;--bg:#0a1110;--panel:#12201c;--line:#56492f;--gold:#bfa46a;--text:#e9e1d0;--muted:#beb4a1}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;line-height:1.55}
header,main,footer{max-width:1080px;margin:auto;padding:25px 20px}header{border-bottom:1px solid var(--line)}
h1,h2{font-family:Georgia,serif;font-weight:normal}h1{margin:.2rem 0;color:var(--gold)}
p,small{color:var(--muted)}.eyebrow{letter-spacing:.17em;font-size:.75rem;color:var(--gold)}
.toolbar{display:flex;gap:12px;flex-wrap:wrap;margin:25px 0}input,select{background:#15241f;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:12px;min-width:180px;flex:1}
.cards{display:grid;gap:15px}.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:19px;overflow-wrap:anywhere}
.meta{font-size:.83rem;color:var(--gold)}dt{margin-top:.7rem;font-weight:650;color:var(--gold)}dd{margin:0;color:var(--text)}
a{color:#e0c58a}a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #e0c58a;outline-offset:3px}
.warning{border-left:3px solid var(--gold);padding:12px 15px;background:#1b261f}
.empty{padding:25px;border:1px dashed var(--line)}
</style></head><body>
<header><div class="eyebrow">CURATOROS · EDITORIAL RESEARCH</div><h1>Research Review</h1><p>Read-only local evidence inventory — research leads, not approved historical facts.</p></header>
<main><div class="warning">All claims remain <strong>unverified and pending editorial review</strong>. Source access and classifications are model-reported. No review decisions are saved by this page.</div>
<div class="toolbar"><input id="filter" aria-label="Search claims and ships" placeholder="Search ships, claims, sources"><select id="ship" aria-label="Filter ship"><option value="">All ships</option></select></div>
<p id="summary" role="status"></p><section id="cards" class="cards" aria-label="Research findings"></section></main>
<footer><small>Offline artifact viewer. No network calls, editing or publication. Open the dossier files for full context.</small></footer>
<script id="research-data" type="application/json">__PAYLOAD__</script>
<script>
"use strict";
const reports=JSON.parse(document.getElementById("research-data").textContent);
const ship=document.getElementById("ship"),search=document.getElementById("filter"),cards=document.getElementById("cards");
const entries=reports.flatMap(r=>(r.claims||[]).map(c=>({...c,guide:r.guide,dossier:r.dossier})));
const unique=[...new Set(reports.map(r=>r.guide))].sort();
for(const name of unique){let o=document.createElement("option");o.value=name;o.textContent=name;ship.append(o)}
function el(tag,text,parent,cls){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==null&&text!==undefined)n.textContent=String(text);parent.append(n);return n}
function field(node,title,value){const dt=el("dt",title,node);const dd=el("dd",value||"Not provided",node);return dd}
function draw(){
cards.replaceChildren();const q=search.value.trim().toLowerCase();
const filtered=entries.filter(c=>(!ship.value||c.guide===ship.value)&&(!q||JSON.stringify(c).toLowerCase().includes(q)));
document.getElementById("summary").textContent=filtered.length+" candidate claim(s) in "+reports.length+" dossier(s)";
for(const c of filtered){
const box=el("article",null,cards,"card");el("div",c.guide,box,"meta");el("h2",c.claim||"Unnamed claim",box);
el("p","UNVERIFIED · PENDING EDITORIAL REVIEW",box,"meta");
const dl=el("dl",null,box);
field(dl,"Guide comparison",c.guide_comparison);
field(dl,"Source type",c.source_type);
field(dl,"Model-reported source access",c.access_status);
field(dl,"What source reportedly supports",c.source_support);
field(dl,"Ship identity / period",c.identity_and_period);
field(dl,"Uncertainty",c.uncertainty);
field(dl,"Verification required",c.verification_needed);
if(c.source_url&&/^https?:\\/\\//i.test(c.source_url)){let p=el("p",null,box);const a=el("a",c.source_title||c.source_url,p);a.href=c.source_url;a.rel="noopener noreferrer";a.target="_blank";}
else el("p","No source URL documented",box);
el("small","Full context: "+c.dossier+" (included in ZIP)",box);
}
if(!filtered.length)el("div","No matching evidence claims.",cards,"empty");
}
search.addEventListener("input",draw);ship.addEventListener("change",draw);draw();
</script></body></html>"""
    dest = args.input / "research-review.html"
    dest.write_text(page.replace("__PAYLOAD__", payload), encoding="utf-8")
    print(f"Generated {dest} with {len(reports)} dossier(s) and {sum(len(r['claims']) for r in reports)} candidate claims")

if __name__ == "__main__":
    main()
