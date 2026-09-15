/* Ocean Liner Curator — Ship Archive search/filter jump + Shipbuilders path card */
(function () {
  "use strict";

  if (window.location.pathname !== "/ships/ships" && window.location.pathname !== "/ships/ships/") return;

  function installSearchJump() {
    if (document.getElementById("archive-search-jump")) return;

    const guide = document.getElementById("guide");
    const archiveScale = document.getElementById("archiveScale");
    if (!guide || !archiveScale || !archiveScale.parentNode) return;

    const style = document.createElement("style");
    style.id = "archive-search-jump-style";
    style.textContent = `
      .archive-search-jump-wrap{
        text-align:center;
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
    archiveScale.insertAdjacentElement("afterend", wrap);
  }

  function installShipbuildersPathCard() {
    if (document.getElementById("archive-shipbuilders-path")) return;

    const row = document.querySelector(".hub-links-grid .archive-feature-row");
    if (!row) return;

    const block = document.createElement("div");
    block.className = "archive-feature-block";
    block.id = "archive-shipbuilders-path";
    block.innerHTML = `
      <a class="hub-card" href="/shipbuilders">
        <div class="hub-card-top">
          <span class="hub-card-title">Shipbuilders</span>
          <span class="hub-card-meta">Reference Index</span>
        </div>
        <p class="hub-card-desc">
          Browse the archive by the yards and companies that built the ships, with documented vessels, launch years, operators, and ship-specific yard context.
        </p>
      </a>
    `;

    const collectionLink = Array.from(row.querySelectorAll("a.hub-card")).find(function (link) {
      return link.getAttribute("href") === "/collections";
    });
    const collectionBlock = collectionLink && collectionLink.closest(".archive-feature-block");

    if (collectionBlock) collectionBlock.insertAdjacentElement("afterend", block);
    else row.insertBefore(block, row.firstChild);
  }

  function initialize() {
    installSearchJump();
    installShipbuildersPathCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
