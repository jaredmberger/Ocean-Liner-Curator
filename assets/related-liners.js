// /assets/related-liners.js
(() => {
  /* =========================================================
     Related Liners injector
     - No new CSS: uses existing <h2>, .note, and .sources styles
     - Robust container + insertion point detection
     - Stable “cluster rotation” headings (deterministic per page/cluster)
     - Fixes:
       (1) Remove the current ship from its own cluster list
       (2) Suppress clusters that would display only ONE ship after filtering
     - Safe logging to help diagnose silent failures
  ========================================================= */

  /* =========================
     Locate container + insertion point (robust)
  ========================= */
  const guide =
    document.querySelector(".guide") ||
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector(".container");

  if (!guide) {
    console.warn("[related-liners] No guide container found.");
    return;
  }

  const h2s = Array.from(guide.querySelectorAll("h2"));
  const sourcesH2 =
    h2s.find((h) => /sources/i.test((h.textContent || "").trim())) || null;

  /* =========================
     Slug
  ========================= */
  const lastSeg = window.location.pathname.split("/").filter(Boolean).pop() || "";
  const slug = lastSeg.replace(/\.html?$/i, "");
  if (!slug) {
    console.warn("[related-liners] Could not derive slug from pathname.");
    return;
  }

  /* =========================
     Deterministic “cluster rotation” headings
  ========================= */
  const CLUSTER_HEADINGS = [
    "Related Liners",
    "Associated Liners",
    "Related Ships",
    "Connected Liners",
    "In the Same Orbit",
    "See Also"
  ];

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rotatedHeading(pageSlug, clusterKey) {
    const seed = `${pageSlug}::${clusterKey}`;
    const idx = hashString(seed) % CLUSTER_HEADINGS.length;
    return CLUSTER_HEADINGS[idx];
  }

  /* =========================
     Helpers
  ========================= */
  function hrefToSlug(href) {
    try {
      const path = (href || "").split("?")[0].split("#")[0];
      const file = path.split("/").filter(Boolean).pop() || "";
      return file.replace(/\.html?$/i, "");
    } catch {
      return "";
    }
  }

  function filterItemsForPage(items, pageSlug) {
    const list = Array.isArray(items) ? items : [];
    return list.filter((i) => hrefToSlug(i?.href) !== pageSlug);
  }

  function renderClusterHTML(clusterKey, pageSlug, def) {
    const heading = rotatedHeading(pageSlug, clusterKey);
    const items = filterItemsForPage(def.items, pageSlug);

    if (items.length < 2) return "";

    const noteBits = [];
    if (def.noteStrong) noteBits.push(`<strong>${def.noteStrong}</strong>`);
    if (def.note) noteBits.push(def.note);

    const noteHTML = noteBits.length
      ? `<p class="note">${noteBits.join(" ")}</p>`
      : "";

    return `
      <section aria-label="${(def.ariaLabel || def.noteStrong || heading).replace(/"/g, "&quot;")}">
        <h2>${heading}</h2>
        ${noteHTML}
        <ul class="sources">
          ${items
            .map(
              (i) =>
                `<li><a href="${i.href}">${i.label}</a>${i.tail ? ` — ${i.tail}` : ""}</li>`
            )
            .join("")}
        </ul>
      </section>
    `;
  }

  const cluster = (noteStrong, note, items, ariaLabel) => ({
    noteStrong,
    note,
    items,
    ariaLabel
  });

  /* =========================
     Clusters
  ========================= */
  const CLUSTERS = {
    imperator_class: cluster(
      "Related Liners.",
      "Hamburg America Line’s “Imperator-class” trio—later redistributed after World War I.",
      [
        { href: "/ships/ss-imperator", label: "SS <em>Imperator</em>", tail: "later Cunard’s <em>RMS Berengaria</em>" },
        { href: "/ships/ss-vaterland", label: "SS <em>Vaterland</em>", tail: "later United States Lines’ <em>SS Leviathan</em>" },
        { href: "/ships/ss-bismarck-1914", label: "SS <em>Bismarck</em>", tail: "completed as White Star’s <em>RMS Majestic</em>" }
      ],
      "Imperator-class trio"
    ),

    big_four: cluster(
      "Related Liners.",
      "White Star Line’s “Big Four”—capacity-first Atlantic liners.",
      [
        { href: "/ships/rms-celtic", label: "RMS <em>Celtic</em>", tail: "Big Four (1901)" },
        { href: "/ships/rms-cedric", label: "RMS <em>Cedric</em>", tail: "Big Four (1903)" },
        { href: "/ships/rms-baltic", label: "RMS <em>Baltic</em>", tail: "Big Four (1904)" },
        { href: "/ships/rms-adriatic", label: "RMS <em>Adriatic</em>", tail: "Big Four (1907)" }
      ],
      "White Star Big Four"
    ),

    olympic_class: cluster(
      "Related Liners.",
      "White Star Line’s Olympic-class liners and associated tenders.",
      [
        { href: "/ships/rms-olympic", label: "RMS <em>Olympic</em>", tail: "lead ship (1911)" },
        { href: "/ships/rms-titanic", label: "RMS <em>Titanic</em>", tail: "sister ship (1912)" },
        { href: "/ships/rms-britannic", label: "RMS/HMHS <em>Britannic</em>", tail: "third ship (1914)" },
        { href: "/ships/ss-nomadic", label: "SS <em>Nomadic</em>", tail: "Cherbourg tender" },
        { href: "/ships/ss-traffic", label: "SS <em>Traffic</em>", tail: "White Star tender" }
      ],
      "Olympic-class and tenders"
    ),

    cunard_queens: cluster(
      "Related Liners.",
      "Cunard’s flagship “Queens,” spanning three generations of prestige service.",
      [
        { href: "/ships/rms-queen-mary", label: "RMS <em>Queen Mary</em>", tail: "entered service 1936" },
        { href: "/ships/rms-queen-elizabeth", label: "RMS <em>Queen Elizabeth</em>", tail: "entered service 1940" },
        { href: "/ships/queen-elizabeth-2", label: "RMS <em>Queen Elizabeth 2</em>", tail: "entered service 1969" }
      ],
      "Cunard Queens"
    ),

    german_interwar: cluster(
      "Related Liners.",
      "German express liners of the interwar era associated with renewed Atlantic prestige competition.",
      [
        { href: "/ships/ss-bremen", label: "SS <em>Bremen</em>", tail: "Norddeutscher Lloyd express liner (1929)" },
        { href: "/ships/ss-europa", label: "SS <em>Europa</em>", tail: "sister ship (1930)" }
      ],
      "Interwar German express pair"
    ),

    usl_flagships: cluster(
      "Related Liners.",
      "United States Lines liners associated with the company’s flagship transatlantic service.",
      [
        { href: "/ships/ss-leviathan", label: "SS <em>Leviathan</em>", tail: "former HAPAG <em>Vaterland</em>" },
        { href: "/ships/ss-manhattan", label: "SS <em>Manhattan</em>", tail: "entered service 1932" },
        { href: "/ships/ss-us", label: "SS <em>United States</em>", tail: "entered service 1952" }
      ],
      "United States Lines flagships"
    ),

    greyhounds: cluster(
      "Related Liners.",
      "Speed-prestige “express” liners often framed as national or company statements (terminology varies by era and source).",
      [
        { href: "/ships/rms-lusitania", label: "RMS <em>Lusitania</em>", tail: "Cunard’s early-1900s greyhound era" },
        { href: "/ships/rms-mauretania", label: "RMS <em>Mauretania</em>", tail: "long-running speed/reliability reputation" },
        { href: "/ships/ss-kaiser-wilhelm-der-grosse", label: "SS <em>Kaiser Wilhelm der Grosse</em>", tail: "four-funnel German express moment" },
        { href: "/ships/ss-deutschland", label: "SS <em>Deutschland</em>", tail: "HAPAG express-era four-funnel statement" },
        { href: "/ships/ss-bremen", label: "SS <em>Bremen</em>", tail: "interwar German headline ship" },
        { href: "/ships/ss-europa", label: "SS <em>Europa</em>", tail: "interwar sister/rival narrative pair" }
      ],
      "Express liners and greyhounds"
    ),

    italian_prestige_pair: cluster(
      "Italian Line Atlantic liners.",
      "A group of notable Italian Line ships spanning the late 1920s and early 1930s, representing Italy’s renewed presence in North Atlantic passenger service.",
      [
        { href: "/ships/ms-saturnia", label: "MS <em>Saturnia</em>", tail: "Italian Line · 1927" },
        { href: "/ships/ms-vulcania", label: "MS <em>Vulcania</em>", tail: "Italian Line · 1928" },
        { href: "/ships/ss-rex", label: "SS <em>Rex</em>", tail: "Italian Line · 1932" },
        { href: "/ships/ss-conte-di-savoia", label: "SS <em>Conte di Savoia</em>", tail: "Italian Line · 1932" }
      ],
      "Italian Line Atlantic liners"
    ),

    white_star_victorian_duo: cluster(
      "Related Liners.",
      "White Star Line’s late-Victorian running mates—built by Harland &amp; Wolff and often paired in period discussion.",
      [
        { href: "/ships/rms-teutonic", label: "RMS <em>Teutonic</em>", tail: "White Star Line · 1889" },
        { href: "/ships/ss-majestic-1889", label: "SS <em>Majestic</em> (1889)", tail: "White Star Line · 1889" }
      ],
      "White Star late-Victorian duo"
    ),

    campania_lucania: cluster(
      "Related Liners.",
      "Cunard’s paired 1890s express liners—often treated together in sources and collecting context.",
      [
        { href: "/ships/rms-campania", label: "RMS <em>Campania</em>", tail: "Cunard Line · 1893" },
        { href: "/ships/rms-lucania", label: "RMS <em>Lucania</em>", tail: "Cunard Line · 1893" }
      ],
      "Campania and Lucania"
    ),

    manhattan_washington: cluster(
      "Related Liners.",
      "United States Lines’ Manhattan-class sisters (often paired in company material and schedules).",
      [
        { href: "/ships/ss-manhattan", label: "SS <em>Manhattan</em>", tail: "United States Lines · 1932" },
        { href: "/ships/ss-washington", label: "SS <em>Washington</em>", tail: "United States Lines · 1933" }
      ],
      "Manhattan-class sisters"
    ),

    michelangelo_raffaello: cluster(
      "Related Liners.",
      "Italian Line’s late superliner duo—frequently discussed together in design, technology, and decline-era context.",
      [
        { href: "/ships/ss-michelangelo-1965", label: "SS <em>Michelangelo</em>", tail: "Italian Line · 1965" },
        { href: "/ships/ss-raffaello-1965", label: "SS <em>Raffaello</em>", tail: "Italian Line · 1965" }
      ],
      "Michelangelo and Raffaello"
    ),

    britannic_georgic: cluster(
      "Related Liners.",
      "White Star Line’s interwar running mates on the Liverpool–New York service.",
      [
        { href: "/ships/mv-britannic", label: "MV <em>Britannic</em> (1930)", tail: "White Star Line · 1930" },
        { href: "/ships/mv-georgic", label: "MV <em>Georgic</em>", tail: "White Star Line · 1932" }
      ],
      "Britannic and Georgic"
    ),

    interwar_prestige: cluster(
      "Interwar Atlantic prestige liners.",
      "Several European liners of the early 1930s became symbols of national prestige and technological ambition during renewed North Atlantic competition.",
      [
        { href: "/ships/ss-normandie", label: "SS <em>Normandie</em>", tail: "French Line · 1935" },
        { href: "/ships/ss-rex", label: "SS <em>Rex</em>", tail: "Italian Line · 1932" },
        { href: "/ships/ss-conte-di-savoia", label: "SS <em>Conte di Savoia</em>", tail: "Italian Line · 1932" },
        { href: "/ships/ss-bremen", label: "SS <em>Bremen</em>", tail: "Norddeutscher Lloyd · 1929" },
        { href: "/ships/ss-europa", label: "SS <em>Europa</em>", tail: "Norddeutscher Lloyd · 1930" }
      ],
      "Interwar Atlantic prestige liners"
    ),

    french_line_atlantic: cluster(
      "French Line Atlantic Liners.",
      "A through-line of French Atlantic prestige: prewar luxury, Art Deco influence, and postwar superliner scale.",
      [
        { href: "/ships/ss-france-1912", label: "SS <em>France</em> (1912)" },
        { href: "/ships/ss-ile-de-france", label: "SS <em>Île de France</em>" },
        { href: "/ships/ss-normandie", label: "SS <em>Normandie</em>" },
        { href: "/ships/ss-france", label: "SS <em>France</em> (1962)" }
      ],
      "French Line Atlantic Liners"
    ),

    saxonia_class: cluster(
      "Related Liners.",
      "Cunard’s postwar Saxonia-class quartet—mid-sized liners built primarily around Canadian service and later cruising flexibility.",
      [
        { href: "/ships/rms-saxonia", label: "RMS <em>Saxonia</em>", tail: "Cunard Line · 1954" },
        { href: "/ships/rms-ivernia", label: "RMS <em>Ivernia</em>", tail: "Cunard Line · 1955" },
        { href: "/ships/rms-carinthia", label: "RMS <em>Carinthia</em>", tail: "Cunard Line · 1956" },
        { href: "/ships/rms-sylvania", label: "RMS <em>Sylvania</em>", tail: "Cunard Line · 1957" }
      ],
      "Cunard Saxonia-class liners"
    ),

    kaiser_class: cluster(
      "Related Liners.",
      "Norddeutscher Lloyd’s Kaiser-class express liners—the famous German four-funnel prestige group before the First World War.",
      [
        { href: "/ships/ss-kaiser-wilhelm-der-grosse", label: "SS <em>Kaiser Wilhelm der Grosse</em>", tail: "entered service 1897" },
        { href: "/ships/ss-kronprinz-wilhelm", label: "SS <em>Kronprinz Wilhelm</em>", tail: "entered service 1901" },
        { href: "/ships/ss-kaiser-wilhelm-ii", label: "SS <em>Kaiser Wilhelm II</em>", tail: "entered service 1903" },
        { href: "/ships/ss-kronprinzessin-cecilie", label: "SS <em>Kronprinzessin Cecilie</em>", tail: "entered service 1907" }
      ],
      "Kaiser-class liners"
    ),

    white_star_motor_pair: cluster(
      "Related Liners.",
      "White Star’s interwar motor-ship pair—important late-company running mates and among the line’s last major new liners.",
      [
        { href: "/ships/mv-britannic", label: "MV <em>Britannic</em> (1930)", tail: "motor liner" },
        { href: "/ships/mv-georgic", label: "MV <em>Georgic</em>", tail: "motor liner" }
      ],
      "White Star motor pair"
    ),

    matson_white_ships: cluster(
      "Related Liners.",
      "Matson’s interwar Pacific passenger group—ships closely tied to the line’s luxury Hawaii and South Pacific identity.",
      [
        { href: "/ships/ss-lurline-1932", label: "SS <em>Lurline</em>", tail: "Matson Line · 1932" },
        { href: "/ships/ss-mariposa", label: "SS <em>Mariposa</em>", tail: "Matson Lines · 1932" },
        { href: "/ships/ss-monterey", label: "SS <em>Monterey</em>", tail: "Matson Lines · 1932" }
      ],
      "Matson Pacific liners"
    ),

    nyk_pacific_trio: cluster(
      "Related Liners.",
      "NYK’s premier interwar Pacific liners associated with the high-profile trans-Pacific route between Japan, Hawaii, and the U.S. West Coast.",
      [
        { href: "/ships/asama-maru-1929", label: "Asama Maru", tail: "NYK Line · 1929" },
        { href: "/ships/tatsuta-maru-1929", label: "Tatsuta Maru", tail: "NYK Line · 1929" },
        { href: "/ships/nyk-hikawa-maru", label: "Hikawa Maru", tail: "NYK Line · 1930" }
      ],
      "NYK Pacific liners"
    ),

    swedish_american_diesel: cluster(
      "Related Liners.",
      "Swedish American Line ships often noted in discussions of diesel propulsion, Scandinavian Atlantic style, and mid-century continuity.",
      [
        { href: "/ships/ms-gripsholm-1925", label: "MS <em>Gripsholm</em>", tail: "entered service 1925" },
        { href: "/ships/ms-kungsholm-1928", label: "MS <em>Kungsholm</em>", tail: "entered service 1928" },
        { href: "/ships/ms-stockholm", label: "MS <em>Stockholm</em>", tail: "entered service 1946" }
      ],
      "Swedish American Line ships"
    ),

    holland_america_interwar: cluster(
      "Related Liners.",
      "Holland America Line ships associated with interwar rebuilding, long-haul Atlantic service, and the line’s evolving flagship profile.",
      [
        { href: "/ships/ss-veendam", label: "SS <em>Veendam</em>", tail: "Holland America Line · 1923" },
        { href: "/ships/ss-volendam", label: "SS <em>Volendam</em>", tail: "Holland America Line · 1922" },
        { href: "/ships/ss-statendam-1929", label: "SS <em>Statendam</em>", tail: "Holland America Line · 1929" },
        { href: "/ships/ss-nieuw-amsterdam", label: "SS <em>Nieuw Amsterdam</em>", tail: "Holland America Line · 1937" }
      ],
      "Holland America interwar liners"
    ),

    rotterdam_pair: cluster(
      "Related Liners.",
      "Two major Holland America flagships carrying the Rotterdam name in very different eras of liner history.",
      [
        { href: "/ships/ss-rotterdam-1908", label: "SS <em>Rotterdam</em> (1908)", tail: "prewar flagship" },
        { href: "/ships/ss-rotterdam-1959", label: "SS <em>Rotterdam</em> (1959)", tail: "late-era flagship" }
      ],
      "Rotterdam pair"
    ),

    anchor_interwar: cluster(
      "Related Liners.",
      "Anchor Line’s interwar and postwar-replacement passenger ships—solid working liners rather than record-breakers.",
      [
        { href: "/ships/rms-cameronia", label: "RMS <em>Cameronia</em>", tail: "Anchor Line · 1921" },
        { href: "/ships/rms-caledonia", label: "RMS <em>Caledonia</em>", tail: "Anchor Line · 1925" },
        { href: "/ships/rms-lancastria", label: "RMS <em>Lancastria</em>", tail: "Anchor Line · 1920" },
        { href: "/ships/rms-transylvania", label: "RMS <em>Transylvania</em>", tail: "Anchor Line · 1925" },
        { href: "/ships/ss-tuscania-1921", label: "SS <em>Tuscania</em>", tail: "Anchor Line · 1921" }
      ],
      "Anchor Line interwar liners"
    ),

    french_line_interwar: cluster(
      "Related Liners.",
      "French Line ships spanning the ambitious interwar Atlantic period—prestige, Art Deco styling, and varying scales of service.",
      [
        { href: "/ships/ss-champlain", label: "SS <em>Champlain</em>", tail: "French Line · 1932" },
        { href: "/ships/ss-paris", label: "SS <em>Paris</em>", tail: "French Line · 1921" },
        { href: "/ships/ss-ile-de-france", label: "SS <em>Île de France</em>", tail: "French Line · 1927" },
        { href: "/ships/ss-normandie", label: "SS <em>Normandie</em>", tail: "French Line · 1935" }
      ],
      "French Line interwar liners"
    ),

    sud_atlantique_pair: cluster(
      "Related Liners.",
      "French South Atlantic liners associated with prestige service between France and South America.",
      [
        { href: "/ships/ss-latlantique", label: "SS <em>L’Atlantique</em>", tail: "1931" },
        { href: "/ships/ss-pasteur", label: "SS <em>Pasteur</em>", tail: "1939" }
      ],
      "Compagnie de Navigation Sud-Atlantique liners"
    ),

    italian_ngi_pair: cluster(
      "Related Liners.",
      "A paired Italian program of the 1920s—large modern liners associated with the Rome/Augustus design moment.",
      [
        { href: "/ships/ms-augustus", label: "MS <em>Augustus</em>", tail: "Italian Line · 1927" },
        { href: "/ships/ss-roma", label: "SS <em>Roma</em>", tail: "Italian Line · 1926" }
      ],
      "Augustus and Roma"
    ),

    italian_south_america: cluster(
      "Related Liners.",
      "Italian liners strongly associated with South American emigrant and passenger routes.",
      [
        { href: "/ships/ss-principessa-mafalda", label: "SS <em>Principessa Mafalda</em>", tail: "Italian Line · 1909" },
        { href: "/ships/ss-giulio-cesare", label: "SS <em>Giulio Cesare</em>", tail: "Italian Line · 1922" },
        { href: "/ships/ss-duilio", label: "SS <em>Duilio</em>", tail: "Italian Line · 1922" }
      ],
      "Italian South America route liners"
    ),

    empress_pacific: cluster(
      "Related Liners.",
      "Canadian Pacific’s Empress ships associated especially with Pacific and trans-Pacific service.",
      [
        { href: "/ships/rms-empress-of-australia", label: "RMS <em>Empress of Australia</em>", tail: "Canadian Pacific · 1922" },
        { href: "/ships/rms-empress-of-japan-1929", label: "RMS <em>Empress of Japan</em>", tail: "Canadian Pacific · 1929" },
        { href: "/ships/rms-empress-of-russia", label: "RMS <em>Empress of Russia</em>", tail: "Canadian Pacific · 1913" }
      ],
      "Canadian Pacific Empress Pacific liners"
    ),

    empress_canada_atlantic: cluster(
      "Related Liners.",
      "Canadian Pacific liners closely tied to the Atlantic and Canadian route story.",
      [
        { href: "/ships/rms-empress-of-ireland", label: "RMS <em>Empress of Ireland</em>", tail: "Canadian Pacific · 1906" },
        { href: "/ships/rms-empress-of-britain", label: "RMS <em>Empress of Britain</em>", tail: "Canadian Pacific · 1930" }
      ],
      "Canadian Pacific Atlantic Empress liners"
    ),

    bermuda_pair: cluster(
      "Related Liners.",
      "Furness Bermuda Line’s paired New York–Bermuda flagships—closely linked in route identity and collecting context.",
      [
        { href: "/ships/monarch-of-bermuda", label: "Monarch of Bermuda", tail: "1931" },
        { href: "/ships/ss-queen-of-bermuda", label: "SS <em>Queen of Bermuda</em>", tail: "1933" }
      ],
      "Furness Bermuda pair"
    ),

    white_star_1870s: cluster(
      "Related Liners.",
      "White Star’s early post-Oceanic generation in the 1870s—important for the line’s growing prestige before the later express era.",
      [
        { href: "/ships/ss-atlantic-1873", label: "RMS <em>Atlantic</em>", tail: "White Star Line · 1873" },
        { href: "/ships/rms-britannic-1874", label: "RMS <em>Britannic</em> (1874)", tail: "White Star Line · 1874" },
        { href: "/ships/ss-germanic", label: "SS <em>Germanic</em>", tail: "White Star Line · 1874" }
      ],
      "White Star 1870s liners"
    ),

    white_star_canadian_pair: cluster(
      "Related Liners.",
      "White Star’s Megantic/Laurentic pair—closely linked in design comparison and Canadian-service discussion.",
      [
        { href: "/ships/rms-laurentic", label: "RMS <em>Laurentic</em>", tail: "White Star Line · 1909" },
        { href: "/ships/rms-megantic-1909", label: "RMS <em>Megantic</em>", tail: "White Star Line · 1909" }
      ],
      "Laurentic and Megantic"
    ),

    cunard_1880s_pair: cluster(
      "Related Liners.",
      "Cunard’s paired mid-1880s express liners—major ships of the pre-Campania/Lucania era.",
      [
        { href: "/ships/rms-etruria-1884", label: "RMS <em>Etruria</em>", tail: "Cunard Line · 1884" },
        { href: "/ships/rms-umbria-1884", label: "RMS <em>Umbria</em>", tail: "Cunard Line · 1884" }
      ],
      "Etruria and Umbria"
    ),

    cunard_franconia_pair: cluster(
      "Related Liners.",
      "Two Cunard ships carrying the Franconia name in very different service contexts and eras.",
      [
        { href: "/ships/rms-franconia-1910", label: "RMS <em>Franconia</em> (1910)", tail: "Cunard Line · 1910" },
        { href: "/ships/rms-franconia", label: "RMS <em>Franconia</em> (1923)", tail: "Cunard Line · 1923" }
      ],
      "Franconia pair"
    ),

    union_castle_pair_1921: cluster(
      "Related Liners.",
      "Union-Castle liners associated with the Cape Mail story and the postwar continuation of long-distance South Africa service.",
      [
        { href: "/ships/rms-arundel-castle-1921", label: "RMS <em>Arundel Castle</em>", tail: "Union-Castle Line · 1921" },
        { href: "/ships/rms-windsor-castle-1921", label: "RMS <em>Windsor Castle</em> (1921)", tail: "Union-Castle Line · 1921" }
      ],
      "Union-Castle 1921 liners"
    ),

    pando_flagships: cluster(
      "Related Liners.",
      "P&amp;O ships representing different scales of the line’s imperial and long-distance passenger service.",
      [
        { href: "/ships/rms-moldavia", label: "RMS <em>Moldavia</em>", tail: "P&amp;O · 1903" },
        { href: "/ships/rms-strathnaver", label: "RMS <em>Strathnaver</em>", tail: "P&amp;O · 1931" },
        { href: "/ships/rms-viceroy-of-india", label: "RMS <em>Viceroy of India</em>", tail: "P&amp;O · 1929" },
        { href: "/ships/ss-canberra", label: "SS <em>Canberra</em>", tail: "P&amp;O · 1961" }
      ],
      "P&O liners"
    ),

    red_star_interwar: cluster(
      "Related Liners.",
      "Red Star Line ships tied to the line’s interwar and IMM-era Atlantic identity.",
      [
        { href: "/ships/ss-belgenland", label: "SS <em>Belgenland</em>", tail: "Red Star Line · 1923" },
        { href: "/ships/ss-pennland", label: "SS <em>Pennland</em>", tail: "Red Star Line · 1922" },
        { href: "/ships/ss-westernland-red-star", label: "SS <em>Westernland</em>", tail: "Red Star Line · 1929" }
      ],
      "Red Star interwar liners"
    ),

    berlin_arabic_republic: cluster(
      "Related Liners.",
      "A linked identity trail involving German origins, transfer, and later postwar Anglo-American service under different names.",
      [
        { href: "/ships/ss-berlin-1909", label: "SS <em>Berlin</em> (1909)", tail: "later White Star’s <em>Arabic</em>" },
        { href: "/ships/ss-arabic-1920", label: "SS <em>Arabic</em>", tail: "ex-<em>Berlin</em>" },
        { href: "/ships/ss-republic", label: "SS <em>Republic</em>", tail: "ex-HAPAG <em>President Grant</em>, later USL" }
      ],
      "Berlin/Arabic/Republic identity chain"
    ),

    reliance_resolute: cluster(
      "Related Liners.",
      "A paired interwar cruise-and-transatlantic discussion set—often treated together in later HAPAG service history.",
      [
        { href: "/ships/ss-reliance", label: "SS <em>Reliance</em>", tail: "HAPAG · 1914" },
        { href: "/ships/ss-resolute", label: "SS <em>Resolute</em>", tail: "HAPAG · 1914" }
      ],
      "Reliance and Resolute"
    ),

    white_star_oceanic_family: cluster(
      "Related Liners.",
      "White Star Line ships associated with the company’s pre-Olympic Atlantic development—large liners that bridged the gap between the Victorian era and the Olympic-class generation.",
      [
        { href: "/ships/rms-oceanic", label: "RMS <em>Oceanic</em>", tail: "White Star Line · 1899" },
        { href: "/ships/ss-cymric", label: "SS <em>Cymric</em>", tail: "White Star Line · 1898" },
        { href: "/ships/ss-republic-1903", label: "SS <em>Republic</em> (1903)", tail: "White Star Line · 1903" },
        { href: "/ships/rms-laurentic", label: "RMS <em>Laurentic</em>", tail: "White Star Line · 1909" },
        { href: "/ships/rms-megantic-1909", label: "RMS <em>Megantic</em>", tail: "White Star Line · 1909" }
      ],
      "White Star pre-Olympic Atlantic liners"
    ),

    hapag_atlantic: cluster(
      "Related Liners.",
      "Major Hamburg America Line ships associated with the company’s Atlantic presence across the late imperial and interwar eras.",
      [
        { href: "/ships/ss-amerika", label: "SS <em>Amerika</em>", tail: "HAPAG · 1905" },
        { href: "/ships/ss-deutschland", label: "SS <em>Deutschland</em>", tail: "HAPAG · 1900" },
        { href: "/ships/ss-george-washington", label: "SS <em>George Washington</em>", tail: "HAPAG · 1909" },
        { href: "/ships/ss-reliance", label: "SS <em>Reliance</em>", tail: "HAPAG · 1914" },
        { href: "/ships/ss-resolute", label: "SS <em>Resolute</em>", tail: "HAPAG · 1914" },
        { href: "/ships/ss-hamburg-1925", label: "SS <em>Hamburg</em>", tail: "HAPAG · 1925" }
      ],
      "Hamburg America Line Atlantic liners"
    ),

    white_star_jubilee: cluster(
      "Related Liners.",
      "White Star Line’s Jubilee-class group and close running mates associated especially with the Australian trade and the line’s late-19th-century expansion beyond the North Atlantic.",
      [
        { href: "/ships/ss-runic", label: "SS <em>Runic</em>", tail: "White Star Line · 1900" },
        { href: "/ships/ss-medic", label: "SS <em>Medic</em>", tail: "White Star Line · 1898" },
        { href: "/ships/ss-persic", label: "SS <em>Persic</em>", tail: "White Star Line · 1899" },
        { href: "/ships/ss-afric", label: "SS <em>Afric</em>", tail: "White Star Line · 1899" },
        { href: "/ships/ss-romanic", label: "SS <em>Romanic</em>", tail: "White Star Line · 1898" },
        { href: "/ships/ss-suevic", label: "SS <em>Suevic</em>", tail: "White Star Line · 1901" }
      ],
      "White Star Jubilee-class and Australian-service liners"
    ),

    french_line_prewar: cluster(
      "Related Liners.",
      "French liners tracing the line from Belle Époque prestige into the interwar Atlantic luxury tradition.",
      [
        { href: "/ships/ss-la-provence", label: "SS <em>La Provence</em>", tail: "French Line · 1906" },
        { href: "/ships/ss-france-1912", label: "SS <em>France</em> (1912)", tail: "French Line · 1912" },
        { href: "/ships/ss-paris", label: "SS <em>Paris</em>", tail: "French Line · 1921" },
        { href: "/ships/ss-ile-de-france", label: "SS <em>Île de France</em>", tail: "French Line · 1927" },
        { href: "/ships/ss-de-grasse", label: "SS <em>De Grasse</em>", tail: "French Line · 1924" },
        { href: "/ships/ss-bretagne", label: "SS <em>Bretagne</em>", tail: "French Line · 1912" }
      ],
      "French Line prewar and interwar liners"
    ),

    italian_broad_interwar: cluster(
      "Related Liners.",
      "Italian liners associated with the merger-era and interwar rebuilding of Italy’s long-distance passenger fleet.",
      [
        { href: "/ships/ss-conte-grande", label: "SS <em>Conte Grande</em>", tail: "Lloyd Sabaudo / Italian Line · 1928" },
        { href: "/ships/ss-conte-rosso", label: "SS <em>Conte Rosso</em>", tail: "Lloyd Sabaudo · 1921" },
        { href: "/ships/ss-roma", label: "SS <em>Roma</em>", tail: "Italian Line · 1926" },
        { href: "/ships/ms-augustus", label: "MS <em>Augustus</em>", tail: "Italian Line · 1927" },
        { href: "/ships/ms-saturnia", label: "MS <em>Saturnia</em>", tail: "Italian Line · 1927" },
        { href: "/ships/ms-vulcania", label: "MS <em>Vulcania</em>", tail: "Italian Line · 1928" },
        { href: "/ships/ss-giulio-cesare", label: "SS <em>Giulio Cesare</em>", tail: "Italian Line · 1922" },
        { href: "/ships/ss-duilio", label: "SS <em>Duilio</em>", tail: "Italian Line · 1922" }
      ],
      "Italian interwar liners"
    ),

    italian_prestige_late: cluster(
      "Related Liners.",
      "Italian prestige liners of the interwar and late-superliner eras—ships often discussed as statements of national style and ambition.",
      [
        { href: "/ships/ss-rex", label: "SS <em>Rex</em>", tail: "Italian Line · 1932" },
        { href: "/ships/ss-conte-di-savoia", label: "SS <em>Conte di Savoia</em>", tail: "Italian Line · 1932" },
        { href: "/ships/ss-michelangelo-1965", label: "SS <em>Michelangelo</em>", tail: "Italian Line · 1965" },
        { href: "/ships/ss-raffaello-1965", label: "SS <em>Raffaello</em>", tail: "Italian Line · 1965" }
      ],
      "Italian prestige liners across eras"
    ),

    duchess_quartet: cluster(
      "Related Liners.",
      "Canadian Pacific’s interwar “Duchess” quartet—large Britain–Canada cabin liners often treated together in fleet history.",
      [
        { href: "/ships/ss-duchess-of-bedford", label: "SS <em>Duchess of Bedford</em>", tail: "Canadian Pacific · 1928" },
        { href: "/ships/ss-duchess-of-richmond", label: "SS <em>Duchess of Richmond</em>", tail: "Canadian Pacific · 1928" },
        { href: "/ships/ss-duchess-of-york", label: "SS <em>Duchess of York</em>", tail: "Canadian Pacific · 1929" },
        { href: "/ships/ss-duchess-of-atholl", label: "SS <em>Duchess of Atholl</em>", tail: "Canadian Pacific · 1928" }
      ],
      "Canadian Pacific Duchess quartet"
    ),

    canadian_pacific_atlantic_interwar: cluster(
      "Related Liners.",
      "Canadian Pacific Atlantic liners of the interwar era—ships tied to Britain–Canada service, prestige, and wartime transformation.",
      [
        { href: "/ships/ss-duchess-of-bedford", label: "SS <em>Duchess of Bedford</em>", tail: "Canadian Pacific · 1928" },
        { href: "/ships/ss-duchess-of-richmond", label: "SS <em>Duchess of Richmond</em>", tail: "Canadian Pacific · 1928" },
        { href: "/ships/ss-duchess-of-york", label: "SS <em>Duchess of York</em>", tail: "Canadian Pacific · 1929" },
        { href: "/ships/ss-duchess-of-atholl", label: "SS <em>Duchess of Atholl</em>", tail: "Canadian Pacific · 1928" },
        { href: "/ships/rms-empress-of-britain", label: "RMS <em>Empress of Britain</em>", tail: "Canadian Pacific · 1931" }
      ],
      "Canadian Pacific interwar Atlantic liners"
    ),

    orient_interwar: cluster(
      "Related Liners.",
      "Orient Line ships associated with the interwar England–Australia service and the line’s modernized passenger fleet.",
      [
        { href: "/ships/ss-orion", label: "SS <em>Orion</em>", tail: "Orient Line · 1935" },
        { href: "/ships/ss-orontes", label: "SS <em>Orontes</em>", tail: "Orient Line · 1929" },
        { href: "/ships/ss-otranto", label: "SS <em>Otranto</em>", tail: "Orient Line · 1925" },
        { href: "/ships/ss-oronsay", label: "SS <em>Oronsay</em>", tail: "Orient Line · 1925" }
      ],
      "Orient Line interwar liners"
    ),

    po_strath_group: cluster(
      "Related Liners.",
      "P&amp;O’s interwar and early postwar Strath liners—important to Britain–Australia imperial passenger service.",
      [
        { href: "/ships/rms-strathaird", label: "RMS <em>Strathaird</em>", tail: "P&amp;O · 1932" },
        { href: "/ships/rms-strathnaver", label: "RMS <em>Strathnaver</em>", tail: "P&amp;O · 1931" },
        { href: "/ships/ss-strathmore", label: "SS <em>Strathmore</em>", tail: "P&amp;O · 1935" }
      ],
      "P&O Strath liners"
    ),

    union_castle_named_group: cluster(
      "Related Liners.",
      "Union-Castle liners associated with the Cape route and the line’s distinctive named passenger fleet.",
      [
        { href: "/ships/ss-warwick-castle", label: "Warwick Castle", tail: "Union-Castle Line · 1931" },
        { href: "/ships/ss-winchester-castle", label: "Winchester Castle", tail: "Union-Castle Line · 1930" },
        { href: "/ships/ss-carnarvon-castle", label: "Carnarvon Castle", tail: "Union-Castle Line · 1926" },
        { href: "/ships/rms-arundel-castle-1921", label: "RMS <em>Arundel Castle</em>", tail: "Union-Castle Line · 1921" },
        { href: "/ships/rms-windsor-castle-1921", label: "RMS <em>Windsor Castle</em> (1921)", tail: "Union-Castle Line · 1921" }
      ],
      "Union-Castle passenger liners"
    ),

    hapag_ballin_group: cluster(
      "Related Liners.",
      "Hamburg America Line ships associated with HAPAG’s prewar and interwar Atlantic prestige profile.",
      [
        { href: "/ships/ss-albert-ballin", label: "SS <em>Albert Ballin</em>", tail: "HAPAG · 1923" },
        { href: "/ships/ss-deutschland", label: "SS <em>Deutschland</em>", tail: "HAPAG · 1900" },
        { href: "/ships/ss-amerika", label: "SS <em>Amerika</em>", tail: "HAPAG · 1905" },
        { href: "/ships/ss-imperator", label: "SS <em>Imperator</em>", tail: "HAPAG · 1913" },
        { href: "/ships/ss-hamburg-1925", label: "SS <em>Hamburg</em>", tail: "HAPAG · 1925" }
      ],
      "HAPAG Atlantic prestige ships"
    ),

    minnewaska_atlantic_transport: cluster(
      "Related Liners.",
      "Atlantic Transport Line ships associated with the company’s large early-20th-century passenger service.",
      [
        { href: "/ships/ss-minnewaska", label: "SS <em>Minnewaska</em>", tail: "Atlantic Transport Line · 1909" },
        { href: "/ships/ss-minneapolis", label: "SS <em>Minneapolis</em>", tail: "Atlantic Transport Line · 1900" }
      ],
      "Atlantic Transport Line passenger ships"
    ),

    canadian_pacific_duchess_empress: cluster(
      "Related Liners.",
      "Canadian Pacific ships spanning the line’s better-known Atlantic passenger identities: Empress prestige and Duchess cabin-liner service.",
      [
        { href: "/ships/ss-duchess-of-bedford", label: "SS <em>Duchess of Bedford</em>" },
        { href: "/ships/ss-duchess-of-richmond", label: "SS <em>Duchess of Richmond</em>" },
        { href: "/ships/ss-duchess-of-york", label: "SS <em>Duchess of York</em>" },
        { href: "/ships/ss-duchess-of-atholl", label: "SS <em>Duchess of Atholl</em>" },
        { href: "/ships/rms-empress-of-britain", label: "RMS <em>Empress of Britain</em>" },
        { href: "/ships/rms-empress-of-ireland", label: "RMS <em>Empress of Ireland</em>" }
      ],
      "Canadian Pacific Atlantic passenger ships"
    ),

    hal_early_generation: cluster(
      "Related Liners.",
      "Early-20th-century Holland America Line ships associated with immigrant service, Atlantic continuity, and the line’s pre-interwar profile.",
      [
        { href: "/ships/ss-kroonland", label: "SS <em>Kroonland</em>", tail: "Holland America Line · 1902" },
        { href: "/ships/ss-zeeland", label: "SS <em>Zeeland</em>", tail: "Red Star / HAL orbit · 1901" },
        { href: "/ships/ss-nieuw-amsterdam-1906", label: "SS <em>Nieuw Amsterdam</em> (1906)", tail: "Holland America Line · 1906" },
        { href: "/ships/ss-rotterdam-1908", label: "SS <em>Rotterdam</em> (1908)", tail: "Holland America Line · 1908" }
      ],
      "Early Holland America liners"
    )
  };

  /* =========================
     Slug -> cluster keys
  ========================= */
  const MAP = {
    "ss-imperator": ["imperator_class", "hapag_ballin_group"],
    "ss-vaterland": ["imperator_class"],
    "ss-bismarck-1914": ["imperator_class"],
    "rms-berengaria": ["imperator_class"],
    "ss-leviathan": ["imperator_class", "usl_flagships"],
    "rms-majestic": ["imperator_class"],

    "rms-celtic": ["big_four"],
    "rms-cedric": ["big_four"],
    "rms-baltic": ["big_four"],
    "rms-adriatic": ["big_four"],

    "rms-olympic": ["olympic_class"],
    "rms-titanic": ["olympic_class"],
    "rms-britannic": ["olympic_class"],
    "ss-nomadic": ["olympic_class"],
    "ss-traffic": ["olympic_class"],

    "ss-runic": ["white_star_jubilee"],
    "ss-medic": ["white_star_jubilee"],
    "ss-persic": ["white_star_jubilee"],
    "ss-afric": ["white_star_jubilee"],
    "ss-romanic": ["white_star_jubilee"],
    "ss-suevic": ["white_star_jubilee"],

    "rms-queen-mary": ["cunard_queens"],
    "rms-queen-elizabeth": ["cunard_queens"],
    "queen-elizabeth-2": ["cunard_queens"],

    "ss-bremen": ["german_interwar", "greyhounds", "interwar_prestige"],
    "ss-europa": ["german_interwar", "greyhounds", "interwar_prestige"],

    "ss-manhattan": ["usl_flagships", "manhattan_washington"],
    "ss-us": ["usl_flagships"],
    "ss-washington": ["manhattan_washington"],

    "rms-lusitania": ["greyhounds"],
    "rms-mauretania": ["greyhounds"],
    "ss-kaiser-wilhelm-der-grosse": ["greyhounds", "kaiser_class"],
    "ss-deutschland": ["greyhounds", "hapag_atlantic", "hapag_ballin_group"],
    "ss-kronprinz-wilhelm": ["kaiser_class"],
    "ss-kaiser-wilhelm-ii": ["kaiser_class"],
    "ss-kronprinzessin-cecilie": ["kaiser_class"],

    "ss-rex": ["italian_prestige_pair", "interwar_prestige", "italian_prestige_late"],
    "ss-conte-di-savoia": ["italian_prestige_pair", "interwar_prestige", "italian_prestige_late"],
    "ms-saturnia": ["italian_prestige_pair", "italian_broad_interwar"],
    "ms-vulcania": ["italian_prestige_pair", "italian_broad_interwar"],

    "rms-teutonic": ["white_star_victorian_duo"],
    "ss-majestic-1889": ["white_star_victorian_duo"],

    "rms-campania": ["campania_lucania"],
    "rms-lucania": ["campania_lucania"],

    "ss-michelangelo-1965": ["michelangelo_raffaello", "italian_prestige_late"],
    "ss-raffaello-1965": ["michelangelo_raffaello", "italian_prestige_late"],

    "mv-britannic": ["britannic_georgic", "white_star_motor_pair"],
    "mv-georgic": ["britannic_georgic", "white_star_motor_pair"],

    "ss-normandie": ["french_line_atlantic", "interwar_prestige", "french_line_interwar"],
    "ss-france-1912": ["french_line_atlantic", "french_line_prewar"],
    "ss-ile-de-france": ["french_line_atlantic", "french_line_interwar", "french_line_prewar"],
    "ss-france": ["french_line_atlantic"],
    "ss-champlain": ["french_line_interwar"],
    "ss-paris": ["french_line_interwar", "french_line_prewar"],
    "ss-la-provence": ["french_line_prewar"],
    "ss-de-grasse": ["french_line_prewar"],
    "ss-bretagne": ["french_line_prewar"],

    "rms-saxonia": ["saxonia_class"],
    "rms-ivernia": ["saxonia_class"],
    "rms-carinthia": ["saxonia_class"],
    "rms-sylvania": ["saxonia_class"],

    "ss-lurline-1932": ["matson_white_ships"],
    "ss-mariposa": ["matson_white_ships"],
    "ss-monterey": ["matson_white_ships"],

    "asama-maru-1929": ["nyk_pacific_trio"],
    "tatsuta-maru-1929": ["nyk_pacific_trio"],
    "nyk-hikawa-maru": ["nyk_pacific_trio"],

    "ms-gripsholm-1925": ["swedish_american_diesel"],
    "ms-kungsholm-1928": ["swedish_american_diesel"],
    "ms-stockholm": ["swedish_american_diesel"],

    "ss-veendam": ["holland_america_interwar"],
    "ss-volendam": ["holland_america_interwar"],
    "ss-statendam-1929": ["holland_america_interwar"],
    "ss-nieuw-amsterdam": ["holland_america_interwar"],
    "ss-rotterdam-1908": ["rotterdam_pair", "hal_early_generation"],
    "ss-rotterdam-1959": ["rotterdam_pair"],
    "ss-kroonland": ["hal_early_generation"],
    "ss-zeeland": ["hal_early_generation"],
    "ss-nieuw-amsterdam-1906": ["hal_early_generation"],

    "rms-cameronia": ["anchor_interwar"],
    "rms-caledonia": ["anchor_interwar"],
    "rms-lancastria": ["anchor_interwar"],
    "rms-transylvania": ["anchor_interwar"],
    "ss-tuscania-1921": ["anchor_interwar"],

    "ss-latlantique": ["sud_atlantique_pair"],
    "ss-pasteur": ["sud_atlantique_pair"],

    "ms-augustus": ["italian_ngi_pair", "italian_broad_interwar"],
    "ss-roma": ["italian_ngi_pair", "italian_broad_interwar"],
    "ss-principessa-mafalda": ["italian_south_america"],
    "ss-giulio-cesare": ["italian_south_america", "italian_broad_interwar"],
    "ss-duilio": ["italian_south_america", "italian_broad_interwar"],
    "ss-conte-grande": ["italian_broad_interwar"],
    "ss-conte-rosso": ["italian_broad_interwar"],

    "rms-empress-of-australia": ["empress_pacific"],
    "rms-empress-of-japan-1929": ["empress_pacific"],
    "rms-empress-of-russia": ["empress_pacific"],
    "rms-empress-of-ireland": ["empress_canada_atlantic", "canadian_pacific_duchess_empress"],
    "rms-empress-of-britain": ["empress_canada_atlantic", "canadian_pacific_atlantic_interwar", "canadian_pacific_duchess_empress"],

    "monarch-of-bermuda": ["bermuda_pair"],
    "ss-queen-of-bermuda": ["bermuda_pair"],

    "ss-atlantic-1873": ["white_star_1870s"],
    "rms-britannic-1874": ["white_star_1870s"],
    "ss-germanic": ["white_star_1870s"],
    "rms-laurentic": ["white_star_canadian_pair", "white_star_oceanic_family"],
    "rms-megantic-1909": ["white_star_canadian_pair", "white_star_oceanic_family"],
    "rms-oceanic": ["white_star_oceanic_family"],
    "ss-cymric": ["white_star_oceanic_family"],
    "ss-republic-1903": ["white_star_oceanic_family"],

    "rms-etruria-1884": ["cunard_1880s_pair"],
    "rms-umbria-1884": ["cunard_1880s_pair"],
    "rms-franconia-1910": ["cunard_franconia_pair"],
    "rms-franconia": ["cunard_franconia_pair"],

    "rms-arundel-castle-1921": ["union_castle_pair_1921", "union_castle_named_group"],
    "rms-windsor-castle-1921": ["union_castle_pair_1921", "union_castle_named_group"],
    "rms-moldavia": ["pando_flagships"],
    "rms-strathnaver": ["pando_flagships", "po_strath_group"],
    "rms-viceroy-of-india": ["pando_flagships"],
    "ss-canberra": ["pando_flagships"],

    "ss-belgenland": ["red_star_interwar"],
    "ss-pennland": ["red_star_interwar"],
    "ss-westernland-red-star": ["red_star_interwar"],

    "ss-berlin-1909": ["berlin_arabic_republic"],
    "ss-arabic-1920": ["berlin_arabic_republic"],
    "ss-republic": ["berlin_arabic_republic"],

    "ss-reliance": ["reliance_resolute", "hapag_atlantic"],
    "ss-resolute": ["reliance_resolute", "hapag_atlantic"],
    "ss-amerika": ["hapag_atlantic", "hapag_ballin_group"],
    "ss-george-washington": ["hapag_atlantic"],
    "ss-hamburg-1925": ["hapag_atlantic", "hapag_ballin_group"],

    "ss-duchess-of-bedford": ["duchess_quartet", "canadian_pacific_atlantic_interwar", "canadian_pacific_duchess_empress"],
    "ss-duchess-of-richmond": ["duchess_quartet", "canadian_pacific_atlantic_interwar", "canadian_pacific_duchess_empress"],
    "ss-duchess-of-york": ["duchess_quartet", "canadian_pacific_atlantic_interwar", "canadian_pacific_duchess_empress"],
    "ss-duchess-of-atholl": ["duchess_quartet", "canadian_pacific_atlantic_interwar", "canadian_pacific_duchess_empress"],

    "ss-orion": ["orient_interwar"],
    "ss-orontes": ["orient_interwar"],
    "ss-otranto": ["orient_interwar"],
    "ss-oronsay": ["orient_interwar"],

    "rms-strathaird": ["po_strath_group"],
    "ss-strathmore": ["po_strath_group"],

    "ss-warwick-castle": ["union_castle_named_group"],
    "ss-winchester-castle": ["union_castle_named_group"],
    "ss-carnarvon-castle": ["union_castle_named_group"],

    "ss-albert-ballin": ["hapag_ballin_group"],

    "ss-minnewaska": ["minnewaska_atlantic_transport"],
    "ss-minneapolis": ["minnewaska_atlantic_transport"]
  };

  const keys = MAP[slug];
  if (!keys || !keys.length) {
    console.warn("[related-liners] No clusters mapped for slug:", slug);
    return;
  }

  const html = keys
    .map((k) => (CLUSTERS[k] ? renderClusterHTML(k, slug, CLUSTERS[k]) : ""))
    .filter(Boolean)
    .join("\n");

  if (!html) {
    console.warn(
      "[related-liners] Mapped keys produced no HTML after filtering:",
      keys,
      "slug:",
      slug
    );
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  if (sourcesH2) {
    guide.insertBefore(wrapper, sourcesH2);
  } else {
    guide.appendChild(wrapper);
  }
})();