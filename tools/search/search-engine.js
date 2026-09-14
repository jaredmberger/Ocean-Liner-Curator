export function normalizeSearchKey(value) {
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,' ').trim();
}

export function normalizeTitleKey(value) {
  return normalizeSearchKey(value)
    .replace(/^the\s+/,'')
    .trim();
}

export function normalizeShipName(value) {
  return normalizeSearchKey(value)
    .replace(/^(?:(?:rms|ss|s s|hmhs|hmt|hms|mv|ms|ts|rmmv|qsmv)(?:\s+|$))+/,'')
    .trim();
}

const INTENT_TITLE_ALIASES = new Map([
  ['white star ships', 'White Star Line'],
  ['white star line ships', 'White Star Line'],
  ['what happened to ocean liners', 'Why Did Ocean Liners Disappear?'],
  ['what happened to the ocean liners', 'Why Did Ocean Liners Disappear?'],
  ['where did ocean liners go', 'Why Did Ocean Liners Disappear?']
]);

export function intentTitleFor(value) {
  return INTENT_TITLE_ALIASES.get(normalizeSearchKey(value)) || '';
}

export async function searchArchive(pagefind, term) {
  if (!/[\p{L}\p{N}]/u.test(term)) return {results:[]};
  // Submitted one-word searches must match a word, not shrink to an unrelated prefix.
  const singleWord = /^\S+$/.test(term) && !term.includes('"');
  const intentTitle = intentTitleFor(term);
  const [regular, exactShip, exactTitle, intentMatch, strict] = await Promise.all([
    pagefind.search(term),
    pagefind.search(null, {filters:{ship:normalizeShipName(term)}}),
    pagefind.search(null, {filters:{title_key:normalizeTitleKey(term)}}),
    intentTitle ? pagefind.search(null, {filters:{title_key:normalizeTitleKey(intentTitle)}}) : Promise.resolve({results:[]}),
    singleWord ? pagefind.search(`"${term}"`) : Promise.resolve(null)
  ]);
  const seen = new Set();
  const prioritized = [];
  for (const result of [...exactShip.results, ...exactTitle.results, ...intentMatch.results]) {
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    prioritized.push(result);
  }
  const strictIds = strict && new Set(strict.results.map(r=>r.id));
  return {
    ...regular,
    results:[
      ...prioritized,
      ...regular.results.filter(r=>!seen.has(r.id) && (!strictIds || strictIds.has(r.id)))
    ]
  };
}
