# Ocean Liner Curator canonical data — version 0.1

This is the first reversible canonical-data layer generated from the builder extraction test.

## Files

- `builders.json` — canonical builder records, aliases, ship counts, and linked ship IDs.
- `ships.json` — one core record for each extracted ship guide.
- `builder-aliases.json` — exact published Builder strings mapped to canonical IDs.
- `builder-review-queue.json` — provisional and unresolved mappings requiring editorial review.
- `ship.schema.json` — an initial JSON Schema for validating ship records.

## Core rule

The visible Builder wording from each ship guide is preserved as `builderDisplay`.
Canonical grouping is stored separately as `builderId`.

Example:

```json
{
  "name": "RMS Olympic",
  "builderId": "harland-wolff",
  "builderDisplay": "Harland & Wolff (Belfast, Northern Ireland)"
}
```

## Mapping statuses

- `confirmed` — high-confidence spelling or formatting variants of the same company.
- `provisional` — likely the same company/family, but corporate or yard history deserves review.
- `needs-review` — generated conservatively from a unique source string and not intentionally merged.

## Current counts

- Ships: 297
- Canonical builder records: 58
- Exact builder aliases: 177
- Confirmed builder records: 22
- Provisional builder records: 7
- Builder records needing review: 29

## Recommended next action

Review `builder-review-queue.json`. Editing an alias mapping changes grouping without requiring any ship-guide HTML changes.
