/* Ocean Liner Curator — compact homepage archive search */
(function () {
  "use strict";

  if (window.location.pathname !== "/") return;
  if (document.getElementById("home-archive-search")) return;

  const archiveNote = document.querySelector(".archive-note");
  if (!archiveNote || !archiveNote.parentNode) return;
  const archiveCta = archiveNote.querySelector(".archive-cta-stack");
  if (!archiveCta) return;

  const style = document.createElement("style");
  style.id = "home-archive-search-style";
  style.textContent = `
    .home-archive-search{
      width:min(700px,100%);
      margin:1rem auto 1.5rem;
      padding:1rem 1rem 1.05rem;
      border:1px solid rgba(191,164,106,.24);
      border-radius:18px;
      background:
        linear-gradient(180deg,rgba(255,255,255,.026),rgba(255,255,255,.01)),
        rgba(10,17,16,.42);
      box-shadow:
        0 12px 28px rgba(0,0,0,.20),
        inset 0 1px 0 rgba(255,255,255,.03);
      backdrop-filter:blur(2px);
      -webkit-backdrop-filter:blur(2px);
      text-align:center;
    }
    .home-archive-search__label{
      display:block;
      margin:0 0 .55rem;
      color:rgba(230,223,207,.88);
      font-size:.82rem;
      font-variant:small-caps;
      letter-spacing:.08em;
    }
    .home-archive-search__form{
      display:flex;
      align-items:stretch;
      gap:.5rem;
      width:100%;
    }
    .home-archive-search__field{
      position:relative;
      min-width:0;
      flex:1 1 auto;
    }
    .home-archive-search__glyph{
      position:absolute;
      left:.9rem;
      top:50%;
      transform:translateY(-50%);
      color:rgba(191,164,106,.78);
      font-size:1.05rem;
      line-height:1;
      pointer-events:none;
      z-index:1;
    }
    .home-archive-search__input{
      width:100%;
      min-width:0;
      padding:.82rem .95rem .82rem 2.35rem;
      border:1px solid rgba(191,164,106,.32);
      border-radius:12px;
      background:rgba(10,17,16,.56);
      color:#e6dfcf;
      font:inherit;
      font-size:.95rem;
      line-height:1.2;
      outline:none;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 8px 20px rgba(0,0,0,.18);
      -webkit-appearance:none;
      appearance:none;
    }
    .home-archive-search__input::placeholder{color:rgba(182,174,156,.68)}
    .home-archive-search__input:focus{
      border-color:rgba(191,164,106,.68);
      box-shadow:0 0 0 3px rgba(191,164,106,.09),0 8px 20px rgba(0,0,0,.18);
    }
    .home-archive-search__button{
      flex:0 0 auto;
      padding:.78rem 1rem;
      border:1px solid rgba(191,164,106,.42);
      border-radius:12px;
      background:linear-gradient(180deg,rgba(191,164,106,.14),rgba(10,17,16,.30));
      color:rgba(230,223,207,.94);
      font:inherit;
      font-size:.9rem;
      cursor:pointer;
    }
    .home-archive-search__button:hover{border-color:rgba(191,164,106,.7);color:#fff}
    .home-archive-search__button:focus-visible,
    .home-archive-search__input:focus-visible,
    .home-archive-search__close:focus-visible{
      outline:2px solid rgba(191,164,106,.58);
      outline-offset:2px;
    }
    .home-archive-search__state{
      position:relative;
      margin:.8rem 0 0;
      padding:.75rem 0 0;
      border-top:1px solid rgba(191,164,106,.15);
      text-align:left;
    }
    .home-archive-search__close{
      position:absolute;
      top:.48rem;
      right:0;
      width:1.75rem;
      height:1.75rem;
      padding:0;
      border:1px solid rgba(191,164,106,.24);
      border-radius:999px;
      background:rgba(10,17,16,.42);
      color:rgba(182,174,156,.82);
      font:inherit;
      font-size:1rem;
      line-height:1;
      cursor:pointer;
    }
    .home-archive-search__close:hover{
      color:#fff;
      border-color:rgba(191,164,106,.58);
    }
    .home-archive-search__status{
      margin:0 2.15rem .55rem;
      color:rgba(182,174,156,.82);
      font-size:.78rem;
      letter-spacing:.035em;
      text-align:center;
    }
    .home-archive-search__results{
      list-style:none;
      margin:0;
      padding:0;
    }
    .home-archive-search__result{
      margin:0;
      padding:.7rem .1rem;
      border-bottom:1px solid rgba(191,164,106,.12);
    }
    .home-archive-search__result:last-child{border-bottom:0}
    .home-archive-search__type{
      margin:0 0 .12rem;
      color:rgba(182,174,156,.68);
      font-size:.68rem;
      letter-spacing:.08em;
      text-transform:uppercase;
    }
    .home-archive-search__title{
      margin:0 0 .2rem;
      font-size:1rem;
      line-height:1.3;
      letter-spacing:-.01em;
    }
    .home-archive-search__title a{
      color:rgba(209,187,134,.98);
      text-decoration:none;
      border-bottom:1px solid rgba(191,164,106,.28);
    }
    .home-archive-search__title a:hover{border-bottom-color:rgba(191,164,106,.72)}
    .home-archive-search__excerpt{
      margin:0;
      color:rgba(182,174,156,.86);
      font-size:.82rem;
      line-height:1.48;
    }
    .home-archive-search__all{
      display:block;
      width:max-content;
      max-width:100%;
      margin:.7rem auto 0;
      color:rgba(209,187,134,.92);
      font-size:.8rem;
      text-decoration:none;
      border-bottom:1px solid rgba(191,164,106,.32);
    }
    .home-archive-search__all:hover{border-bottom-color:rgba(191,164,106,.72)}
    @media(max-width:520px){
      .home-archive-search{padding:.85rem .8rem .9rem;border-radius:16px}
      .home-archive-search__form{gap:.42rem}
      .home-archive-search__glyph{left:.78rem}
      .home-archive-search__input{padding:.78rem .82rem .78rem 2.12rem;font-size:.9rem}
      .home-archive-search__button{padding:.75rem .85rem;font-size:.84rem}
    }
    @media(prefers-reduced-motion:reduce){
      .home-archive-search__button,.home-archive-search__input{transition:none}
    }
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "home-archive-search";
  section.className = "home-archive-search";
  section.setAttribute("aria-label", "Search the Ocean Liner Curator archive");
  section.innerHTML = `
    <label class="home-archive-search__label" for="home-archive-query">Search the archive</label>
    <form class="home-archive-search__form" id="home-archive-search-form" role="search">
      <div class="home-archive-search__field">
        <span class="home-archive-search__glyph" aria-hidden="true">⌕</span>
        <input class="home-archive-search__input" id="home-archive-query" type="search" autocomplete="off" spellcheck="false" placeholder="Ships, lines, people, places, topics…" aria-label="Search the archive">
      </div>
      <button class="home-archive-search__button" type="submit">Search</button>
    </form>
    <div class="home-archive-search__state" id="home-archive-search-state" hidden>
      <button class="home-archive-search__close" id="home-archive-search-close" type="button" aria-label="Close search results">×</button>
      <p class="home-archive-search__status" id="home-archive-search-status" aria-live="polite"></p>
      <ol class="home-archive-search__results" id="home-archive-search-results"></ol>
      <a class="home-archive-search__all" id="home-archive-search-all" href="/tools/search">View all search results »</a>
    </div>
  `;

  archiveNote.insertBefore(section, archiveCta);

  const form = section.querySelector("#home-archive-search-form");
  const input = section.querySelector("#home-archive-query");
  const state = section.querySelector("#home-archive-search-state");
  const status = section.querySelector("#home-archive-search-status");
  const list = section.querySelector("#home-archive-search-results");
  const closeButton = section.querySelector("#home-archive-search-close");
  const allLink = section.querySelector("#home-archive-search-all");
  let generation = 0;
  let enginePromise;
  let searchArchivePromise;

  function getEngine() {
    if (!enginePromise) {
      enginePromise = import("/tools/search/pagefind/pagefind.js").catch(function (error) {
        enginePromise = undefined;
        throw error;
      });
    }
    return enginePromise;
  }

  function getSearchArchive() {
    if (!searchArchivePromise) {
      searchArchivePromise = import("/tools/search/search-engine.js").then(function (module) {
        return module.searchArchive;
      }).catch(function (error) {
        searchArchivePromise = undefined;
        throw error;
      });
    }
    return searchArchivePromise;
  }

  function hideResults(clearQuery) {
    generation += 1;
    list.replaceChildren();
    state.hidden = true;
    status.textContent = "";
    if (clearQuery) input.value = "";
  }

  async function runSearch() {
    const term = input.value.trim();
    if (!term) {
      hideResults(true);
      return;
    }

    const id = ++generation;
    allLink.href = "/tools/search?q=" + encodeURIComponent(term);
    state.hidden = false;
    list.replaceChildren();
    status.textContent = "Searching the archive…";

    try {
      const values = await Promise.all([getEngine(), getSearchArchive()]);
      const pagefind = values[0];
      const searchArchive = values[1];
      const searchResult = await searchArchive(pagefind, term);
      if (id !== generation) return;

      const top = searchResult.results.slice(0, 4);
      if (!top.length) {
        status.textContent = "No results. Try a ship name or fewer words.";
        return;
      }

      const resultData = await Promise.all(top.map(function (result) { return result.data(); }));
      if (id !== generation) return;

      const fragment = document.createDocumentFragment();
      resultData.forEach(function (result) {
        const url = new URL(result.url, "https://oceanliners.net");
        if (url.origin !== "https://oceanliners.net") return;

        const item = document.createElement("li");
        item.className = "home-archive-search__result";

        const type = document.createElement("p");
        type.className = "home-archive-search__type";
        type.textContent = (result.meta && result.meta.type) || "Reference";

        const heading = document.createElement("h2");
        heading.className = "home-archive-search__title";
        const link = document.createElement("a");
        link.href = url.href;
        link.textContent = (result.meta && result.meta.title) || "Untitled reference";
        heading.appendChild(link);

        const excerpt = document.createElement("p");
        excerpt.className = "home-archive-search__excerpt";
        const parsed = new DOMParser().parseFromString(result.excerpt || "", "text/html");
        excerpt.textContent = parsed.body.textContent || "";

        item.append(type, heading, excerpt);
        fragment.appendChild(item);
      });

      list.appendChild(fragment);
      status.textContent = searchResult.results.length + " result" + (searchResult.results.length === 1 ? "" : "s") + " · Showing " + resultData.length;
    } catch (error) {
      if (id !== generation) return;
      console.warn("[OceanLiners.net] Homepage search could not load:", error);
      status.textContent = "Search could not load. Open the full search page below.";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch();
  });

  closeButton.addEventListener("click", function () {
    hideResults(false);
    input.focus();
  });

  input.addEventListener("input", function () {
    if (!input.value) hideResults(true);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hideResults(true);
      input.blur();
    }
  });
})();
