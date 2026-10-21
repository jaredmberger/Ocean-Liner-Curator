# Public Research Provenance — editorial publication standard

**Public attribution:** Ocean Liner Curator Editorial Review

The provenance record is an account of a *specific editorial investigation*, not a site-wide certification or an assertion that every sentence in a guide was independently verified. It should demonstrate evidence and judgement rather than assert blanket trustworthiness.

## Page structure

1. **Specific historical question:** state the previously open question or correction, including any competing dates/names.
2. **Evidence examined:** cite inspectable institutional, archival or contemporary material with working direct links. Distinguish original documents from *catalogue descriptions of* originals, and contemporary reports from later recollections.
3. **Assessment:** explain why available evidence supports the particular conclusion and why contrary material carries different weight. Do not erase reasonable conflicts.
4. **Editorial outcome:** explain exactly what changed in the ship guide and link to the actual GitHub editorial PR.
5. **Limits:** enumerate unresolved questions. Explicitly disclaim comprehensive verification of the guide when only selected claims were reviewed.
6. **Method:** AI-assisted research only identifies candidate leads. Original sources, independent checking, qualified reasoning, and human editorial approval control publication.

## Release checklist

- [ ] Historical sources have been independently examined, not just summarized by the Research Agent.
- [ ] Only the specifically verified portions of compound claims appear as established facts.
- [ ] The linked revision PR actually contains the stated guide correction.
- [ ] The public page contains no unpublished research dossiers, private CuratorOS data, personal reviewer identifiers, access tokens, or internal tracking keys.
- [ ] Institutional attribution is exactly **Ocean Liner Curator Editorial Review**.
- [ ] Link color, hover and visited states use the site's dark-green/brass palette, never default browser blue.
- [ ] Canonical link, page title, and the return-to-guide link are correct; navigation works on iPad and mobile.
- [ ] The new provenance link remains discreet in the guide, and does not imply comprehensive verification.
- [ ] PR CI and deployment preview pass; a human explicitly approves the merge.
- [ ] Verify the public URL and guide link after deployment; do not assume a GitHub merge proves deployment.

## Pilot implementation

- Ship: **Monarch of Bermuda**
- Historical point: **24 March 1947 refit fire**
- Guide editorial PR: https://github.com/jaredmberger/Ocean-Liner-Curator/pull/594
- Provenance pilot PR: https://github.com/jaredmberger/Ocean-Liner-Curator/pull/595
- Page path (pilot): `provenance/ss-monarch-of-bermuda.html`
- RMG archival *catalogue* and contemporary `Northern Advocate` newspaper reporting support the date.
- Original machinery maker names and the exact 1950 departure remain separate unresolved topics.

## Template content outline

```
Ocean Liner Curator · Research Provenance

[Ship]: [specific historical question]
Editorial attribution: Ocean Liner Curator Editorial Review

The question
[Concise disputed or previously unknown fact. Do not imply more was investigated.]

Evidence examined
[Source A: precise description, direct link, what was *actually* examined.]
[Source B: independent corroboration or contradiction, direct link.]
[Where applicable, explain the relative evidentiary weight.]

Editorial conclusion and guide revision
[Conclusion and why it follows, with uncertainty preserved.]
[Link to the actual guide PR and describe the changed passage.]

Limits of this review
[Specific aspects not independently verified.]
[This does not constitute comprehensive guide verification.]

Method
[AI-assisted discovery is not historical proof; human editorial review controls publication.]
```

This is an **authoring standard**, not automatic publication machinery. New provenance records require ship-specific researched text and individual editorial approval.
