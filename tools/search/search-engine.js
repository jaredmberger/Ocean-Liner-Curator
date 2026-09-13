export function normalizeShipName(value) {
  return value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
    .replace(/^(?:(?:rms|ss|s\.s\.|hmhs|hmt|hms|mv|ms|ts|rmmv)(?:[\s/]+|$))+/,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
}
export async function searchArchive(pagefind, term) {
  if (!/[\p{L}\p{N}]/u.test(term)) return {results:[]};
  // Submitted one-word searches must match a word, not shrink to an unrelated prefix.
  const singleWord = /^\S+$/.test(term) && !term.includes('"');
  const [regular, exact, strict] = await Promise.all([
    pagefind.search(term),
    pagefind.search(null, {filters:{ship:normalizeShipName(term)}}),
    singleWord ? pagefind.search(`"${term}"`) : Promise.resolve(null)
  ]);
  const ids = new Set(exact.results.map(r=>r.id));
  const strictIds = strict && new Set(strict.results.map(r=>r.id));
  return {...regular,results:[...exact.results,...regular.results.filter(r=>!ids.has(r.id) && (!strictIds || strictIds.has(r.id)))]};
}
