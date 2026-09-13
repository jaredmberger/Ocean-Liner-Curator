/* Ocean Liner Curator — Ship Archive search/filter jump link */
(function () {
  "use strict";

  if (window.location.pathname !== "/ships/ships" && window.location.pathname !== "/ships/ships/") return;
  if (document.getElementById("archive-search-jump")) return;

  const guide = document.getElementById("guide");
  const featuredGrid = document.querySelector(".featured-grid");
  if (!guide || !featuredGrid || !featuredGrid.parentNode) return;

  const style = document.createElement("style");
  style.id = "archive-search-jump-style";
  style.textContent = `
    .archive-search-jump{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:.38rem;
      margin:.15rem auto 1.35rem;
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
  wrap.style.textAlign = "center";

  const link = document.createElement("a");
  link.id = "archive-search-jump";
  link.className = "archive-search-jump";
  link.href = "#guide";
  link.innerHTML = 'Jump to search &amp; filters <span class="archive-search-jump__arrow" aria-hidden="true">↓</span>';

  link.addEventListener("click", function (event) {
    event.preventDefault();
    guide.scrollIntoView({ behavior: "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#guide");
  });

  wrap.appendChild(link);
  featuredGrid.parentNode.insertBefore(wrap, featuredGrid);
})();
