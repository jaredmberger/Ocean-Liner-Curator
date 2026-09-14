import { searchArchive } from './search-engine.js';

const form = document.querySelector('#search-form');
const query = document.querySelector('#query');
const state = document.querySelector('#search-state');
const status = document.querySelector('#status');
const list = document.querySelector('#results');
const more = document.querySelector('#more');
const close = document.querySelector('#close-results');

let engine;
let generation = 0;
let matches = [];
let shown = 0;
const batchSize = 6;

async function getEngine() {
  if (!engine) {
    engine = import('./pagefind/pagefind.js').catch(error => {
      engine = undefined;
      throw error;
    });
  }
  return engine;
}

function setUrl(term, mode = 'replace') {
  const url = new URL(window.location.href);
  if (term) url.searchParams.set('q', term);
  else url.searchParams.delete('q');
  const method = mode === 'push' ? 'pushState' : 'replaceState';
  window.history[method]({}, '', url);
}

function setDocumentTitle(term) {
  document.title = term
    ? `${term} — Search — Ocean Liner Curator`
    : 'Search the Archive — Ocean Liner Curator';
}

function resetResults({ clearQuery = true, focus = true, updateUrl = true } = {}) {
  generation += 1;
  matches = [];
  shown = 0;
  state.hidden = true;
  list.replaceChildren();
  more.hidden = true;
  more.disabled = false;

  if (clearQuery) query.value = '';
  if (updateUrl) setUrl('', 'replace');
  setDocumentTitle('');
  if (focus) query.focus();
}

function plainText(html) {
  const parsed = new DOMParser().parseFromString(html || '', 'text/html');
  return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function resultType(meta) {
  return meta?.type || 'Reference';
}

async function showBatch(id) {
  more.disabled = true;
  const slice = matches.slice(shown, shown + batchSize);
  const batch = await Promise.all(slice.map(result => result.data()));
  if (id !== generation) return;

  const fragment = document.createDocumentFragment();
  let appended = 0;

  for (const result of batch) {
    const url = new URL(result.url, 'https://oceanliners.net');
    if (url.origin !== 'https://oceanliners.net') continue;

    const item = document.createElement('li');
    item.className = 'result-card';

    const category = document.createElement('p');
    category.className = 'type';
    category.textContent = resultType(result.meta);

    const title = document.createElement('h2');
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = result.meta?.title || url.pathname;
    title.append(link);

    const excerpt = document.createElement('p');
    excerpt.className = 'excerpt';
    excerpt.textContent = plainText(result.excerpt);

    const path = document.createElement('p');
    path.className = 'result-path';
    path.textContent = url.pathname === '/' ? 'oceanliners.net' : url.pathname;

    item.append(category, title);
    if (excerpt.textContent) item.append(excerpt);
    item.append(path);
    fragment.append(item);
    appended += 1;
  }

  list.append(fragment);
  shown += slice.length;
  more.hidden = shown >= matches.length;
  more.disabled = false;

  const visible = list.children.length;
  status.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} · Showing ${visible}`;

  if (!appended && shown >= matches.length && !visible) {
    status.textContent = 'No usable results were returned.';
  }
}

async function search({ historyMode = 'push' } = {}) {
  const term = query.value.trim();
  if (!term) {
    resetResults();
    return;
  }

  const id = ++generation;
  state.hidden = false;
  list.replaceChildren();
  more.hidden = true;
  status.textContent = 'Searching the archive…';
  setUrl(term, historyMode);
  setDocumentTitle(term);

  try {
    const pagefind = await getEngine();
    const result = await searchArchive(pagefind, term);
    if (id !== generation) return;

    matches = result.results;
    shown = 0;

    if (!matches.length) {
      status.textContent = `No results for “${term}”. Try a ship name, broader subject, or fewer words.`;
      return;
    }

    await showBatch(id);
  } catch (error) {
    if (id !== generation) return;
    console.error('[OceanLiners.net] Standalone search could not load:', error);
    status.textContent = 'Search could not load. Please try again, or browse the Ship Archive below.';
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  search();
});

document.querySelectorAll('[data-query]').forEach(button => {
  button.addEventListener('click', () => {
    query.value = button.dataset.query;
    search();
  });
});

close.addEventListener('click', () => resetResults());

query.addEventListener('keydown', event => {
  if (event.key === 'Escape') resetResults();
});

query.addEventListener('input', () => {
  if (!query.value) resetResults({ focus: false });
});

more.addEventListener('click', () => {
  showBatch(generation).catch(error => {
    console.error('[OceanLiners.net] Could not load more search results:', error);
    status.textContent = 'Could not load more results. Please try again.';
    more.disabled = false;
  });
});

window.addEventListener('popstate', () => {
  const term = new URLSearchParams(window.location.search).get('q')?.trim() || '';
  if (!term) {
    resetResults({ clearQuery: true, focus: false, updateUrl: false });
    return;
  }
  query.value = term;
  search({ historyMode: 'replace' });
});

const initialQuery = new URLSearchParams(window.location.search).get('q');
if (initialQuery && initialQuery.trim()) {
  query.value = initialQuery.trim();
  search({ historyMode: 'replace' });
}
