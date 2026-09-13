import { searchArchive } from './search-engine.js';
const form = document.querySelector('#search-form');
const query = document.querySelector('#query');
const state = document.querySelector('#search-state');
const status = document.querySelector('#status');
const list = document.querySelector('#results');
const more = document.querySelector('#more');
let engine;
let generation = 0;
let matches = [];
let shown = 0;
const batchSize = 6;

async function getEngine() {
  if (!engine) engine = import('./pagefind/pagefind.js').catch(error => {engine = undefined; throw error;});
  return engine;
}
function closeResults() {
  generation++;
  matches = []; shown = 0;
  state.hidden = true; list.replaceChildren(); more.hidden = true;
  query.value = ''; query.focus();
}
async function showBatch(id) {
  more.disabled = true;
  const batch = await Promise.all(matches.slice(shown, shown + batchSize).map(result => result.data()));
  if (id !== generation) return;
  const fragment = document.createDocumentFragment();
  for (const result of batch) {
    const url = new URL(result.url, 'https://oceanliners.net');
    if (url.origin !== 'https://oceanliners.net') continue;
    const item = document.createElement('li');
    const category = document.createElement('p'); category.className = 'type'; category.textContent = result.meta.type || 'Reference';
    const title = document.createElement('h2');
    const link = document.createElement('a'); link.href = url.href; link.textContent = result.meta.title; title.append(link);
    const excerpt = document.createElement('p');
    // Pagefind excerpts may contain highlight tags; display as plain text.
    const parsed = new DOMParser().parseFromString(result.excerpt || '', 'text/html');
    excerpt.textContent = parsed.body.textContent;
    item.append(category, title, excerpt); fragment.append(item);
  }
  list.append(fragment); shown += batch.length;
  more.hidden = shown >= matches.length; more.disabled = false;
  status.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} · Showing ${shown}`;
}
async function search() {
  const term = query.value.trim();
  if (!term) {closeResults(); return;}
  const id = ++generation;
  state.hidden = false; list.replaceChildren(); more.hidden = true;
  status.textContent = 'Searching the archive…';
  try {
    const pagefind = await getEngine();
    const result = await searchArchive(pagefind, term);
    if (id !== generation) return;
    matches = result.results; shown = 0;
    if (!matches.length) {status.textContent = 'No results. Try a ship name or fewer words.'; return;}
    await showBatch(id);
  } catch(error) {
    if (id !== generation) return;
    status.textContent = 'Search could not load. Please try again, or browse the Ship Archive below.';
  }
}
form.addEventListener('submit', event => {event.preventDefault(); search();});
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {query.value = button.dataset.query; search();}));
document.querySelector('#close-results').addEventListener('click', closeResults);
query.addEventListener('keydown', event => {if(event.key === 'Escape') closeResults();});
query.addEventListener('input', () => {if (!query.value) closeResults();});
more.addEventListener('click', () => {showBatch(generation).catch(() => {status.textContent = 'Could not load more results. Please try again.'; more.disabled = false;});});
