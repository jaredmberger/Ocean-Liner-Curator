/* Ocean Liner Curator — Ship Archive search/filter jump + reference path cards */
(function () {
  "use strict";

  if (window.location.pathname !== "/ships/ships" && window.location.pathname !== "/ships/ships/") return;

  function installFloatingControls() {
    if (document.getElementById("archive-floating-controls-style")) return;
    const style = document.createElement("style");
    style.id = "archive-floating-controls-style";
    style.textContent = `
      .container{overflow:visible!important}
      .container::before,.container::after{border-radius:inherit}
      .controls-card{
        position:sticky!important;
        top:.5rem;
        z-index:40;
        background:rgba(10,17,16,.94)!important;
        backdrop-filter:blur(8px)!important;
        -webkit-backdrop-filter:blur(8px)!important;
        box-shadow:0 14px 34px rgba(0,0,0,.34),0 0 0 1px rgba(191,164,106,.05);
      }
      @media(max-width:620px){.controls-card{top:.25rem}}
    `;
    document.head.appendChild(style);
  }

  function installCollapsibleFilters() {
    if (document.getElementById("archive-advanced-filters")) return;

    const controls = document.querySelector(".controls-card .ship-controls");
    const az = controls && controls.querySelector(".ship-az");
    const lineDisclosure = controls && controls.querySelector(".line-disclosure");
    if (!controls || !az || !lineDisclosure) return;

    if (!document.getElementById("archive-collapsible-filters-style")) {
      const style = document.createElement("style");
      style.id = "archive-collapsible-filters-style";
      style.textContent = `
        .controls-card{
          padding-top:.5rem!important;
          padding-bottom:.78rem!important;
        }
        .controls-card .controls-head{
          margin-bottom:.58rem!important;
        }
        .controls-card .ship-search-hint{
          margin:.42rem 0 .42rem!important;
          line-height:1.35;
        }
        .archive-advanced-filters{
          margin:.34rem 0 0;
          border:1px solid rgba(191,164,106,.20);
          border-radius:12px;
          background:rgba(255,255,255,.018);
          overflow:hidden;
        }
        .archive-advanced-filters__summary{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:.8rem;
          cursor:pointer;
          list-style:none;
          padding:.48rem .72rem;
          color:rgba(209,187,134,.94);
          font-size:.84rem;
          line-height:1.2;
          letter-spacing:.02em;
          -webkit-tap-highlight-color:transparent;
        }
        .archive-advanced-filters__summary::-webkit-details-marker{display:none}
        .archive-advanced-filters__summary::after{
          content:"+";
          color:rgba(230,223,207,.72);
          font-size:1.05rem;
          line-height:1;
          transition:transform 160ms ease;
        }
        .archive-advanced-filters[open]>.archive-advanced-filters__summary::after{content:"−"}
        .archive-advanced-filters[open]>.archive-advanced-filters__summary{
          border-bottom:1px solid rgba(191,164,106,.16);
        }
        .archive-advanced-filters__body{padding:.03rem .72rem .7rem}
        .archive-advanced-filters__body .ship-az{margin-top:.62rem}
        .archive-advanced-filters__body .line-disclosure{margin-top:.62rem}
        .controls-card .ship-actions .reset-chip{
          margin-top:.42rem!important;
        }
        .controls-card .ship-results{
          margin-top:.3rem!important;
          line-height:1.3;
        }
        .controls-card .ship-results:empty{
          display:none;
        }
        @media(max-width:620px){
          .controls-card{padding-top:.42rem!important;padding-bottom:.62rem!important}
          .controls-card .controls-head{gap:.5rem!important;margin-bottom:.5rem!important}
          .controls-card .section-title{margin-bottom:0!important}
          .controls-card .ship-search-hint{margin:.38rem 0 .36rem!important}
          .archive-advanced-filters{margin-top:.28rem}
          .archive-advanced-filters__summary{padding:.45rem .64rem}
          .archive-advanced-filters__body{padding:.02rem .64rem .62rem}
          .controls-card .ship-actions .reset-chip{margin-top:.36rem!important}
          .controls-card .ship-results{margin-top:.24rem!important}
        }
        @media(prefers-reduced-motion:reduce){.archive-advanced-filters__summary::after{transition:none}}
      `;
      document.head.appendChild(style);
    }

    const disclosure = document.createElement("details");
    disclosure.className = "archive-advanced-filters";
    disclosure.id = "archive-advanced-filters";

    const summary = document.createElement("summary");
    summary.className = "archive-advanced-filters__summary";
    summary.innerHTML = '<span>Browse &amp; filter by letter or shipping line</span>';

    const body = document.createElement("div");
    body.className = "archive-advanced-filters__body";

    const first = az.compareDocumentPosition(lineDisclosure) & Node.DOCUMENT_POSITION_FOLLOWING ? az : lineDisclosure;
    first.parentNode.insertBefore(disclosure, first);
    disclosure.appendChild(summary);
    disclosure.appendChild(body);
    body.appendChild(az);
    body.appendChild(lineDisclosure);
  }

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

  function initialize(){installFloatingControls();installCollapsibleFilters();installSearchJump();installReferencePathCards();}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true }); else initialize();
})();
