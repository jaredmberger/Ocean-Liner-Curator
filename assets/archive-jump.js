/* Ocean Liner Curator — Ship Archive search/filter jump + reference path cards */
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
    style.textContent = `.archive-search-jump-wrap{text-align:center;margin:.55rem auto 1.35rem}.archive-search-jump{display:inline-flex;align-items:center;justify-content:center;gap:.38rem;padding:.42rem .82rem;border:1px solid rgba(191,164,106,.24);border-radius:999px;background:rgba(10,17,16,.20);color:rgba(209,187,134,.92);font-size:.82rem;line-height:1.2;letter-spacing:.025em;text-decoration:none;box-shadow:0 6px 16px rgba(0,0,0,.14)}.archive-search-jump:hover{border-color:rgba(191,164,106,.52);color:rgba(230,223,207,.98)}.archive-search-jump:focus-visible{outline:2px solid rgba(191,164,106,.58);outline-offset:3px}.archive-search-jump__arrow{font-size:.9em;opacity:.8}`;
    document.head.appendChild(style);
    const wrap = document.createElement("div"); wrap.className = "archive-search-jump-wrap";
    const link = document.createElement("a"); link.id = "archive-search-jump"; link.className = "archive-search-jump"; link.href = "#guide"; link.innerHTML = 'Jump to search &amp; filters <span class="archive-search-jump__arrow" aria-hidden="true">↓</span>';
    link.addEventListener("click", function (event) { event.preventDefault(); guide.scrollIntoView({ behavior: "smooth", block: "start" }); if (history.replaceState) history.replaceState(null, "", "#guide"); });
    wrap.appendChild(link); archiveScale.insertAdjacentElement("afterend", wrap);
  }

  function installReferencePathCards() {
    const row = document.querySelector(".hub-links-grid .archive-feature-row");
    if (!row) return;
    let shipbuildersBlock = document.getElementById("archive-shipbuilders-path");
    if (!shipbuildersBlock) {
      shipbuildersBlock = document.createElement("div"); shipbuildersBlock.className = "archive-feature-block"; shipbuildersBlock.id = "archive-shipbuilders-path";
      shipbuildersBlock.innerHTML = `<a class="hub-card" href="/shipbuilders"><div class="hub-card-top"><span class="hub-card-title">Shipbuilders</span><span class="hub-card-meta">Reference Index</span></div><p class="hub-card-desc">Browse the archive by the yards and companies that built the ships, with documented vessels, launch years, operators, and ship-specific yard context.</p></a>`;
      const collectionLink = Array.from(row.querySelectorAll("a.hub-card")).find(link => link.getAttribute("href") === "/collections");
      const collectionBlock = collectionLink && collectionLink.closest(".archive-feature-block");
      if (collectionBlock) collectionBlock.insertAdjacentElement("afterend", shipbuildersBlock); else row.insertBefore(shipbuildersBlock, row.firstChild);
    }
    let shippingLinesBlock = document.getElementById("archive-shipping-lines-path");
    if (!shippingLinesBlock) {
      shippingLinesBlock = document.createElement("div"); shippingLinesBlock.className = "archive-feature-block"; shippingLinesBlock.id = "archive-shipping-lines-path";
      shippingLinesBlock.innerHTML = `<a class="hub-card" href="/shipping-lines"><div class="hub-card-top"><span class="hub-card-title">Shipping Lines</span><span class="hub-card-meta">Reference Index</span></div><p class="hub-card-desc">Browse the archive by shipping line and operator, with documented ships, service periods, associated builders, and preserved historical naming context.</p></a>`;
      shipbuildersBlock.insertAdjacentElement("afterend", shippingLinesBlock);
    }
    if (!document.getElementById("archive-shipyards-path")) {
      const block = document.createElement("div"); block.className = "archive-feature-block"; block.id = "archive-shipyards-path";
      block.innerHTML = `<a class="hub-card" href="/shipyards"><div class="hub-card-top"><span class="hub-card-title">Shipyards &amp; Building Places</span><span class="hub-card-meta">Reference Index</span></div><p class="hub-card-desc">Browse the archive geographically by documented shipyards, cities, and building places, with associated builders, launch spans, and individual ship records.</p></a>`;
      shippingLinesBlock.insertAdjacentElement("afterend", block);
    }
  }

  function initialize(){installSearchJump();installReferencePathCards();}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true }); else initialize();
})();
