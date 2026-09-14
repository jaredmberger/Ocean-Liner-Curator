export function normalizeSearchKey(value) {
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,' ').trim();
}

export function normalizeShipName(value) {
  return normalizeSearchKey(value)
    .replace(/^(?:(?:rms|ss|s s|hmhs|hmt|hms|mv|ms|ts|rmmv)(?:\s+|$))+/,'')
    .trim();
}

export async function searchArchive(pagefind, term) {
  if (!/[\p{L}\p{N}]/u.test(term)) return {results:[]};
  // Submitted one-word searches must match a word, not shrink to an unrelated prefix.
  const singleWord = /^\S+$/.test(term) && !term.includes('"');
  const [regular, exactShip, exactTitle, strict] = await Promise.all([
    pagefind.search(term),
    pagefind.search(null, {filters:{ship:normalizeShipName(term)}}),
    pagefind.search(null, {filters:{title_key:normalizeSearchKey(term)}}),
    singleWord ? pagefind.search(`"${term}"`) : Promise.resolve(null)
  ]);
  const seen = new Set();
  const prioritized = [];
  for (const result of [...exactShip.results, ...exactTitle.results]) {
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
