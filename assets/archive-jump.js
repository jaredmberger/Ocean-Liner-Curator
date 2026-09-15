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

  function polishGuideDescriptions() {
    if (document.documentElement.dataset.olcArchiveCopyPolished === "true") return;

    const replacements = {
      "/ships/ss-adriatic-1872.html": "An early White Star North Atlantic liner from the company’s formative 1870s expansion, combining iron construction, screw propulsion, auxiliary sail, and heavy emigrant traffic.",
      "/ships/ss-albert-ballin.html": "A postwar German liner built as HAPAG rebuilt transatlantic service under the very different commercial conditions of the 1920s.",
      "/ships/rms-andania.html": "A Cunard passenger-cargo liner for the Canadian and St. Lawrence trade, designed for practical North Atlantic service rather than the prestige express route.",
      "/ships/rms-andania-1922.html": "One of Cunard’s early-1920s A-class cabin liners, built to restore dependable North Atlantic service after the First World War.",
      "/ships/ss-armadale-castle.html": "The first new ship ordered by the newly formed Union-Castle Mail Steamship Company, marking the combined line’s early fleet identity.",
      "/ships/ss-ascania-1911.html": "A medium-sized Cunard liner for the Canadian route, aimed at emigrant and general passenger traffic rather than the prestige express trade.",
      "/ships/ss-arcadia-1954.html": "A postwar P&amp;O liner for the Britain–Australia route, reflecting the transitional character of long-distance passenger shipping in the 1950s.",
      "/ships/ss-athenic.html": "The first of White Star’s Athenic-class trio, built for mixed passenger, cargo, and emigrant traffic between Britain and New Zealand.",
      "/ships/athlone-castle.html": "A fast diesel-powered Union-Castle mail ship for the Britain–South Africa route, embodying the line’s mature interwar identity.",
      "/ships/ss-barbarossa.html": "Namesake of a substantial North German Lloyd class of twin-screw liners combining freight capacity with three classes of passenger accommodation.",
      "/ships/ss-batavia.html": "One of HAPAG’s high-capacity B steamers, built primarily for emigrant and freight traffic rather than prestige express service.",
      "/ships/ss-belgravia.html": "One of HAPAG’s high-capacity emigrant steamers, built to carry passengers and freight between continental Europe and North America.",
      "/ships/ss-belgia.html": "Intended as the fifth and final member of HAPAG’s B-class emigrant steamers, following the same broad design family as <em>Brasilia</em>, <em>Bulgaria</em>, <em>Batavia</em>, and <em>Belgravia</em>.",
      "/ships/ss-bergensfjord.html": "A foundational Norwegian America Line ship, built for direct Norway–New York service when many Scandinavian emigrants still traveled through continental ports.",
      "/ships/ss-berlin-1909.html": "A substantial mid-sized North German Lloyd liner for steady Bremen–New York service, carrying cabin and emigrant passengers.",
      "/ships/ms-bermuda.html": "An interwar diesel liner built specifically for the New York–Bermuda tourist trade rather than migration or Atlantic speed competition.",
      "/ships/ss-bothnia.html": "A Cunard iron-hulled transatlantic steamer from the compound-engine era, still rigged for sail while relying on steam for scheduled service.",
      "/ships/ss-brasilia.html": "A HAPAG emigrant steamer designed for high-capacity passenger and freight traffic between continental Europe and the United States.",
      "/ships/ss-bretagne.html": "A postwar French passenger liner for SGTM, representative of long-distance French passenger shipping beyond the prestige transatlantic flagships.",
      "/ships/ss-briton.html": "A major Union Steam Ship Company liner for Southampton–South Africa service and the first Union vessel to exceed 10,000 gross tons.",
      "/ships/ss-canada-1896.html": "A Dominion Line liner for Britain–Canada service, built around regular passenger, emigrant, mail, and cargo traffic rather than prestige speed.",
      "/ships/ss-cap-polonio.html": "A large Hamburg Süd liner for the South Atlantic, combining substantial passenger accommodation with refrigerated cargo capacity.",
      "/ships/ss-carnarvon-castle.html": "Union-Castle’s first regular Cape-route motor ship and the first of the line’s mail ships to exceed 20,000 gross tons.",
      "/ships/rms-carpathia.html": "A Cunard liner best remembered for rescuing <em>Titanic</em>’s survivors on 15 April 1912; she was later torpedoed and sunk by U-55 in 1918.",
      "/ships/ss-catalonia.html": "A Cunard transatlantic steamship of the early 1880s, representative of the line’s practical passenger-and-cargo service.",
      "/ships/ss-chicago-1908.html": "A practical French Line vessel for Le Havre–New York and later Bordeaux–New York service, carrying passengers and migrant traffic below the flagship tier.",
      "/ships/ss-cleveland.html": "A large intermediate HAPAG liner built for mixed passenger, emigrant, and cargo traffic rather than Blue Riband competition.",
      "/ships/ss-conte-grande.html": "A Lloyd Sabaudo liner from the period when Italian companies were expanding international passenger service and major emigrant routes.",
      "/ships/ss-conte-verde.html": "A major Italian interwar liner that served South American and later Asian routes under changing Italian operators.",
      "/ships/ss-coptic.html": "A White Star passenger-cargo liner whose career ranged across Atlantic, New Zealand, and Pacific service, including refrigerated cargo work.",
      "/ships/ss-corinthic.html": "The second of White Star’s Athenic-class trio, built for mixed passenger, cargo, and emigrant traffic between Britain and New Zealand.",
      "/ships/ss-corsican.html": "An Allan Line passenger-cargo liner for Canadian service, representative of the practical mail, migration, and seasonal traffic of the North Atlantic.",
      "/ships/ss-cuba.html": "A mid-Victorian Cunard iron screw steamer that helped bridge the line from its early paddle ships to later express liners.",
      "/ships/ss-de-grasse.html": "A French Line liner whose career spanned prewar Atlantic service, wartime disruption, and a substantial postwar return.",
      "/ships/ss-drottningholm.html": "Built as Allan Line’s <em>Virginian</em> and later transformed into Swedish American Line’s <em>Drottningholm</em> for Gothenburg–New York service.",
      "/ships/ss-duchess-of-atholl.html": "One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.",
      "/ships/ss-duchess-of-bedford.html": "One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.",
      "/ships/ss-duchess-of-richmond.html": "One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.",
      "/ships/ss-duchess-of-york.html": "One of Canadian Pacific’s interwar Duchess-class liners for seasonal Montreal–Liverpool service.",
      "/ships/ss-espagne.html": "A versatile French Line vessel whose career ranged across Caribbean, Central American, Mediterranean-adjacent, and transatlantic service.",
      "/ships/ss-finland.html": "A Red Star Line vessel for the New York–Antwerp trade, serving the early-twentieth-century mix of cabin passengers and mass migration.",
      "/ships/ss-george-washington-ngl.html": "A major North German Lloyd Bremen–New York liner emphasizing passenger comfort and immigrant traffic rather than outright speed.",
      "/ships/ss-gothic-white-star-line.html": "A White Star passenger-cargo liner rooted in the company’s imperial and refrigerated-cargo network rather than the North Atlantic express trade.",
      "/ships/ss-grosser-kurfurst.html": "A North German Lloyd cargo-passenger liner built for long-distance mail, migration, and freight service rather than express-liner speed.",
      "/ships/rms-kenilworth-castle.html": "An early Union-Castle mail liner for the Britain–South Africa route, part of the newly consolidated company’s formative fleet.",
      "/ships/ss-konigin-luise.html": "A substantial North German Lloyd passenger-and-freight liner from the Barbarossa-class generation, built for long-distance service rather than record-breaking express speed.",
      "/ships/ss-la-normandie.html": "An early French Line express steamer that helped modernize CGT’s North Atlantic fleet in the 1880s.",
      "/ships/ss-lake-michigan.html": "Built for the Beaver Line and soon absorbed into Canadian Pacific’s North Atlantic system for Liverpool–Quebec–Montreal service.",
      "/ships/ss-letitia.html": "An Anchor-Donaldson liner for Britain–Canada service, built for practical interwar passenger and emigrant traffic rather than record-breaking speed.",
      "/ships/ss-malta.html": "A mid-Victorian Cunard iron screw steamer from the transitional generation before the much larger late-nineteenth-century express liners.",
      "/ships/ss-manchuria.html": "A large American-built Pacific Mail liner for the San Francisco–Honolulu–Yokohama–Hong Kong–Manila route, sister to <em>Mongolia</em>.",
      "/ships/ss-marnix-van-st-aldegonde.html": "A Dutch motor liner for Netherlands–East Indies service, built for long-range passenger, cargo, and imperial-route operations rather than Atlantic speed.",
      "/ships/ss-marquette.html": "Built as <em>Boadicea</em> and later renamed <em>Marquette</em> for Atlantic Transport Line service on the North Atlantic.",
      "/ships/ss-mayflower.html": "Launched as Leyland Line’s <em>Hanoverian</em> and briefly renamed <em>Mayflower</em> for Dominion Line service on the North Atlantic.",
      "/ships/ss-minnesota.html": "A large American-built liner for James J. Hill’s Great Northern Steamship Company, created for passenger-and-cargo service between Seattle and East Asia.",
      "/ships/ss-mongolia.html": "A large American-built Pacific Mail liner for San Francisco–Far East service, sister to <em>Manchuria</em>.",
      "/ships/ss-montcalm.html": "A Canadian Pacific liner from the postwar Mont group, built for Britain–Canada passenger and emigrant service.",
      "/ships/ss-montclare.html": "A Canadian Pacific liner from the postwar Mont group, built for Britain–Canada passenger and emigrant service.",
      "/ships/ss-montrose.html": "A Canadian Pacific liner from the postwar Mont group, built for Britain–Canada passenger and emigrant service.",
      "/ships/ss-noordam.html": "A Holland America liner for Rotterdam–New York service, combining cabin travel, mail and cargo with very large third-class capacity.",
      "/ships/ss-norge.html": "Built in Scotland and later transferred into Danish service, <em>Norge</em> became part of the established Scandinavian route to New York.",
      "/ships/ss-oriana.html": "A major postwar P&amp;O liner built as traditional long-distance passenger shipping confronted the rapid rise of air travel.",
      "/ships/ss-orontes.html": "A substantial interwar Orient Line liner for England–Australia service via the Mediterranean and Suez.",
      "/ships/ss-pasteur.html": "Completed on the eve of war, <em>Pasteur</em>’s planned prestige career was overtaken by military service before normal civilian operations could develop.",
      "/ships/ss-poland.html": "A long-lived passenger-cargo steamer that changed names and operators repeatedly, including service as <em>Victoria</em>, <em>Manitou</em>, and later under Red Star Line.",
      "/ships/ss-president-coolidge.html": "A flagship-scale Dollar Line liner for Pacific service between the U.S. West Coast, Hawaii, East Asia, and the Philippines.",
      "/ships/ss-president-hoover.html": "A flagship-scale Dollar Line liner for Pacific service, pairing modern passenger accommodations with the ambitions of a major American route.",
      "/ships/ss-pretoria.html": "A Pennsylvania-class North German Lloyd steamer built for heavy emigrant traffic, freight, and a smaller cabin complement.",
      "/ships/ss-prinz-friedrich-wilhelm.html": "A substantial North German Lloyd Bremen–New York liner built for steady passenger service rather than the record-breaking Kaiser-class role.",
      "/ships/ss-reliance.html": "A HAPAG-built liner with a complex international career, later becoming influential as a purpose-marketed cruise ship.",
      "/ships/ss-republic-1903.html": "A White Star liner remembered especially for the 1909 collision that demonstrated the practical value of wireless distress signaling at sea.",
      "/ships/ss-resolute.html": "A HAPAG liner whose interwar career increasingly shifted toward cruising, often paired with sister ship <em>Reliance</em>.",
      "/ships/ss-rijndam-1901.html": "A Holland America liner for Rotterdam–New York service, combining cabin passengers, mail, cargo, and very large third-class capacity.",
      "/ships/rms-scythia.html": "One of Cunard’s postwar intermediate liners, built to restore dependable North Atlantic service rather than chase express-liner records.",
      "/ships/rms-servia-1881.html": "A major early-1880s Cunard liner and an important transitional ship, notable as the first large ocean liner built of steel rather than iron.",
      "/ships/ss-sirius.html": "A wooden paddle steamer that became historically important in 1838 by completing the first transatlantic passenger crossing entirely under steam.",
      "/ships/ss-st-louis.html": "Best remembered for the 1939 refugee voyage in which more than 900 passengers, most of them Jewish refugees, were denied refuge in the Americas before returning to Europe.",
      "/ships/stirling-castle.html": "A fast diesel Union-Castle mail ship for the South African run, representing the line’s mature interwar service model.",
      "/ships/ss-strathaird.html": "A P&amp;O Strath-class liner for Britain–Australia service, combining large scale, white-hulled styling, and long-distance travel via Suez.",
      "/ships/ss-strathmore.html": "A P&amp;O liner for Britain–India–Australia service, combining large scale, modern accommodations, and the line’s distinctive 1930s white-hulled appearance.",
      "/ships/rms-walmer-castle.html": "An early Union-Castle twin-screw mail liner, built for dependable scheduled service rather than North Atlantic speed competition.",
      "/ships/ss-winchester-castle.html": "A major Union-Castle motor liner for the Southampton–South Africa mail-and-passenger service."
    };

    const links = Array.from(document.querySelectorAll(".guide-card .guide-title[href]"));
    links.forEach(function (link) {
      const href = link.getAttribute("href");
      const replacement = replacements[href];
      if (!replacement) return;
      const card = link.closest(".guide-card");
      const desc = card && card.querySelector(".guide-desc");
      if (desc) desc.innerHTML = replacement;
    });

    document.documentElement.dataset.olcArchiveCopyPolished = "true";
  }

  function initialize(){installFloatingControls();installCollapsibleFilters();installSearchJump();installReferencePathCards();polishGuideDescriptions();}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true }); else initialize();
})();
