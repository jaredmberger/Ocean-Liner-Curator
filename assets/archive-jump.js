/* Ocean Liner Curator — Ship Archive search/filter jump links */
(function () {
  "use strict";

  if (window.location.pathname !== "/ships/ships" && window.location.pathname !== "/ships/ships/") return;
  if (document.getElementById("archive-search-jump")) return;

  const guide = document.getElementById("guide");
  const archiveScale = document.getElementById("archiveScale");
  if (!guide || !archiveScale || !archiveScale.parentNode) return;

  const style = document.createElement("style");
  style.id = "archive-search-jump-style";
  style.textContent = `
    .archive-search-jump-wrap{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:.5rem;
      flex-wrap:wrap;
      margin:.55rem auto 1.35rem;
    }
    .archive-search-jump{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:.38rem;
      padding:.42rem .82rem;
      border:1px solid rgba(191,164,106,.24);
      border-radius:999px;
      background:rgba(10,17,16,.20);
      color:rgba(209,187,134,.92);
      font-size:.82rem;
      line-height:1.2;
      letter-spacing:.025em;
      text-decoration:none;
      box-shadow:0 6px 16px rgba(0,0,0,.14);
    }
    .archive-search-jump:hover{
      border-color:rgba(191,164,106,.52);
      color:rgba(230,223,207,.98);
    }
    .archive-search-jump:focus-visible{
      outline:2px solid rgba(191,164,106,.58);
      outline-offset:3px;
    }
    .archive-search-jump__arrow{
      font-size:.9em;
      opacity:.8;
    }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "archive-search-jump-wrap";

  const jump = document.createElement("a");
  jump.id = "archive-search-jump";
  jump.className = "archive-search-jump";
  jump.href = "#guide";
  jump.innerHTML = 'Jump to search &amp; filters <span class="archive-search-jump__arrow" aria-hidden="true">↓</span>';

  jump.addEventListener("click", function (event) {
    event.preventDefault();
    guide.scrollIntoView({ behavior: "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#guide");
  });

  const builders = document.createElement("a");
  builders.className = "archive-search-jump";
  builders.href = "/shipbuilders";
  builders.textContent = "Browse by shipbuilder";

  wrap.append(jump, builders);
  archiveScale.insertAdjacentElement("afterend", wrap);
})();
