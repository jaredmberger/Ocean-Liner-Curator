// /assets/related-liners-phase2.js
(() => {
  "use strict";

  const slug = (window.location.pathname.split("/").filter(Boolean).pop() || "")
    .replace(/\.html?$/i, "");

  if (!slug) return;

  const guide =
    document.querySelector(".guide") ||
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector(".container");

  if (!guide) return;

  // Phase two is intentionally narrow: only strong, curated sister/class
  // relationships. Broad fleet, era, rival, and same-line proximity belong
  // in the base relationship layer.
  //
  // Groups are declared once and expanded per page at runtime. This keeps
  // reciprocal links symmetrical and makes future additions low-risk.
  const group = (heading, note, members) => ({ heading, note, members });

  const GROUPS = [
    group(
      "Sister Ships",
      "President Hoover and President Coolidge were identical sister ships built for Dollar Line’s large interwar trans-Pacific passenger service.",
      [
        ["ss-president-hoover", "/ships/ss-president-hoover", "SS <em>President Hoover</em>", "sister ship"],
        ["ss-president-coolidge", "/ships/ss-president-coolidge", "SS <em>President Coolidge</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Duilio and Giulio Cesare were sister ships built for Navigazione Generale Italiana and later served within the consolidated Italian Line fleet.",
      [
        ["ss-duilio", "/ships/ss-duilio", "SS <em>Duilio</em>", "sister ship"],
        ["ss-giulio-cesare", "/ships/ss-giulio-cesare", "SS <em>Giulio Cesare</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Saturnia and Vulcania were sister motor ships built at Monfalcone for Cosulich Line, with long interwar and postwar careers in Italian passenger service.",
      [
        ["ms-saturnia", "/ships/ms-saturnia", "MS <em>Saturnia</em>", "sister ship"],
        ["ms-vulcania", "/ships/ms-vulcania", "MS <em>Vulcania</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Arundel Castle and Windsor Castle were sister Cape Mail liners whose original four-funnel profiles and later modernizations closely paralleled one another.",
      [
        ["rms-arundel-castle-1921", "/ships/rms-arundel-castle-1921", "RMS <em>Arundel Castle</em>", "sister ship"],
        ["rms-windsor-castle-1921", "/ships/rms-windsor-castle-1921", "RMS <em>Windsor Castle</em> (1921)", "sister ship"]
      ]
    ),
    group(
      "Near-Sister Express Pair",
      "City of New York and City of Paris were closely related Inman express liners built as a paired late-1880s challenge in the North Atlantic speed trade.",
      [
        ["ss-city-of-new-york-1888", "/ships/ss-city-of-new-york-1888", "SS <em>City of New York</em> (1888)", "near-sister and express running mate"],
        ["ss-city-of-paris", "/ships/ss-city-of-paris", "SS <em>City of Paris</em>", "near-sister and express running mate"]
      ]
    ),
    group(
      "Athenic-class Sisters",
      "Athenic, Corinthic, and Ionic formed White Star Line’s three-ship Athenic class for the Britain–New Zealand passenger and cargo service.",
      [
        ["ss-athenic", "/ships/ss-athenic", "SS <em>Athenic</em>", "Athenic-class sister"],
        ["ss-corinthic", "/ships/ss-corinthic", "SS <em>Corinthic</em>", "Athenic-class sister"],
        ["ss-ionic", "/ships/ss-ionic", "SS <em>Ionic</em>", "Athenic-class sister"]
      ]
    ),
    group(
      "Jubilee-class Sisters",
      "Afric, Medic, Persic, Runic, and Suevic formed White Star Line’s five-ship Jubilee class for the Liverpool–Cape Town–Australia service.",
      [
        ["ss-afric", "/ships/ss-afric", "SS <em>Afric</em>", "Jubilee-class sister"],
        ["ss-medic", "/ships/ss-medic", "SS <em>Medic</em>", "Jubilee-class sister"],
        ["ss-persic", "/ships/ss-persic", "SS <em>Persic</em>", "Jubilee-class sister"],
        ["ss-runic", "/ships/ss-runic", "SS <em>Runic</em>", "Jubilee-class sister"],
        ["ss-suevic", "/ships/ss-suevic", "SS <em>Suevic</em>", "Jubilee-class sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Britannic and Germanic were White Star sister ships of the 1870s, nearly identical when built and central to the company’s early North Atlantic expansion.",
      [
        ["rms-britannic-1874", "/ships/rms-britannic-1874", "SS <em>Britannic</em> (1874)", "sister ship"],
        ["ss-germanic", "/ships/ss-germanic", "SS <em>Germanic</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Carmania and Caronia were near-identical Cunard sister ships deliberately fitted with different machinery so the company could compare turbine and reciprocating propulsion at full liner scale.",
      [
        ["rms-carmania", "/ships/rms-carmania", "RMS <em>Carmania</em>", "turbine-powered sister"],
        ["ss-caronia", "/ships/ss-caronia", "RMS <em>Caronia</em>", "reciprocating-powered sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Independence and Constitution were nearly identical sister liners built in the United States for American Export Lines’ postwar New York–Mediterranean service.",
      [
        ["ss-independence", "/ships/ss-independence", "SS <em>Independence</em>", "sister ship"],
        ["ss-constitution", "/ships/ss-constitution", "SS <em>Constitution</em>", "sister ship"]
      ]
    ),
    group(
      "Holland America Sisters",
      "Rijndam and Noordam were sister ships in Holland America Line’s early-1900s group that also included Potsdam; the two represented here share the same class relationship.",
      [
        ["ss-rijndam-1901", "/ships/ss-rijndam-1901", "SS <em>Rijndam</em> (1901)", "sister ship"],
        ["ss-noordam", "/ships/ss-noordam", "SS <em>Noordam</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Veendam and Volendam were Holland America Line sister ships and the company’s largest turbine steamships before Statendam entered service.",
      [
        ["ss-veendam", "/ships/ss-veendam", "SS <em>Veendam</em>", "sister ship"],
        ["ss-volendam", "/ships/ss-volendam", "SS <em>Volendam</em>", "sister ship"]
      ]
    ),
    group(
      "Asama Maru-class Sisters",
      "Asama Maru and Tatsuta Maru were sister ships in NYK’s three-ship Asama Maru class, built for the company’s premier trans-Pacific service; Chichibu Maru completed the trio.",
      [
        ["asama-maru-1929", "/ships/asama-maru-1929", "MS <em>Asama Maru</em>", "Asama Maru-class sister"],
        ["tatsuta-maru-1929", "/ships/tatsuta-maru-1929", "MS <em>Tatsuta Maru</em>", "Asama Maru-class sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Andrea Doria and Cristoforo Colombo were Italian Line sister ships built as a paired postwar flagship generation for the North Atlantic.",
      [
        ["ss-andrea-doria", "/ships/ss-andrea-doria", "SS <em>Andrea Doria</em>", "sister ship"],
        ["ss-cristoforo-colombo", "/ships/ss-cristoforo-colombo", "SS <em>Cristoforo Colombo</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Augustus and Roma were sister ships for Navigazione Generale Italiana, unusual for pairing diesel machinery in Augustus with steam turbines in Roma.",
      [
        ["ms-augustus", "/ships/ms-augustus", "MS <em>Augustus</em>", "diesel-powered sister"],
        ["ss-roma", "/ships/ss-roma", "SS <em>Roma</em>", "steam-turbine sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Conte Biancamano and Conte Grande were sister liners built for Lloyd Sabaudo and later absorbed into the consolidated Italian Line fleet.",
      [
        ["ss-conte-biancamano", "/ships/ss-conte-biancamano", "SS <em>Conte Biancamano</em>", "sister ship"],
        ["ss-conte-grande", "/ships/ss-conte-grande", "SS <em>Conte Grande</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Johan van Oldenbarnevelt and Marnix van St. Aldegonde were sister motor liners built for the Netherlands–East Indies passenger service.",
      [
        ["ss-johan-van-oldenbarnevelt", "/ships/ss-johan-van-oldenbarnevelt", "MS <em>Johan van Oldenbarnevelt</em>", "sister ship"],
        ["ss-marnix-van-st-aldegonde", "/ships/ss-marnix-van-st-aldegonde", "MS <em>Marnix van St. Aldegonde</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Britannic and Georgic were White Star Line’s final pair of newly built motor liners and the last two ships completed for the company before the Cunard merger.",
      [
        ["mv-britannic", "/ships/mv-britannic", "MV <em>Britannic</em>", "sister ship"],
        ["mv-georgic", "/ships/mv-georgic", "MV <em>Georgic</em>", "sister ship"]
      ]
    ),

    // Phase-two expansion: additional high-confidence class and sister groups.
    group(
      "Oceanic-class Sisters",
      "Oceanic, Atlantic, Baltic, and Adriatic belonged to White Star Line’s pioneering six-ship Oceanic class; Republic and Celtic completed the original class but are not currently represented by matching first-generation guides in the archive.",
      [
        ["ss-oceanic-1871", "/ships/ss-oceanic-1871", "SS <em>Oceanic</em> (1871)", "Oceanic-class sister"],
        ["ss-atlantic-1873", "/ships/ss-atlantic-1873", "SS <em>Atlantic</em>", "Oceanic-class sister"],
        ["ss-baltic-1871", "/ships/ss-baltic-1871", "SS <em>Baltic</em> (1871)", "Oceanic-class sister"],
        ["ss-adriatic-1872", "/ships/ss-adriatic-1872", "SS <em>Adriatic</em> (1872)", "Oceanic-class sister"]
      ]
    ),
    group(
      "Cunard A-class Sisters",
      "Aurania, Alaunia, and Ascania formed Cunard’s second postwar trio of A-class intermediate liners in the mid-1920s.",
      [
        ["rms-aurania", "/ships/rms-aurania", "RMS <em>Aurania</em>", "A-class sister"],
        ["rms-alaunia", "/ships/rms-alaunia", "RMS <em>Alaunia</em>", "A-class sister"],
        ["rms-ascania", "/ships/rms-ascania", "RMS <em>Ascania</em>", "A-class sister"]
      ]
    ),
    group(
      "Strath-class Sisters",
      "Strathnaver, Strathaird, and Strathmore belonged to P&O’s five-ship Strath class, the celebrated white-hulled generation built for the Britain–Australia route; Strathallan and Stratheden completed the class.",
      [
        ["rms-strathnaver", "/ships/rms-strathnaver", "RMS <em>Strathnaver</em>", "Strath-class sister"],
        ["ss-strathaird", "/ships/ss-strathaird", "SS <em>Strathaird</em>", "Strath-class sister"],
        ["ss-strathmore", "/ships/ss-strathmore", "SS <em>Strathmore</em>", "Strath-class sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Athlone Castle and Stirling Castle were sister motor liners built for Union-Castle’s accelerated Southampton–Cape Town mail service.",
      [
        ["athlone-castle", "/ships/athlone-castle", "RMMV <em>Athlone Castle</em>", "sister ship"],
        ["stirling-castle", "/ships/stirling-castle", "RMMV <em>Stirling Castle</em>", "sister ship"]
      ]
    ),
    group(
      "Matson White Ship Sisters",
      "Lurline, Mariposa, and Monterey were members of Matson’s celebrated interwar White Ship family for Hawai‘i and South Pacific service; Malolo, later Matsonia, was the fourth member of the original group.",
      [
        ["ss-lurline-1932", "/ships/ss-lurline-1932", "SS <em>Lurline</em>", "Matson White Ship sister"],
        ["ss-mariposa", "/ships/ss-mariposa", "SS <em>Mariposa</em>", "Matson White Ship sister"],
        ["ss-monterey", "/ships/ss-monterey", "SS <em>Monterey</em>", "Matson White Ship sister"]
      ]
    ),
    group(
      "Barbarossa-class Family",
      "Friedrich der Grosse, Barbarossa, Königin Luise, and Prinzess Irene belonged to Norddeutscher Lloyd’s Barbarossa-class family of Reichspostdampfer; Grosser Kurfürst was a larger half-sister developed from the same design family.",
      [
        ["ss-friedrich-der-grosse", "/ships/ss-friedrich-der-grosse", "SS <em>Friedrich der Grosse</em>", "Barbarossa-class sister"],
        ["ss-barbarossa", "/ships/ss-barbarossa", "SS <em>Barbarossa</em>", "Barbarossa-class sister"],
        ["ss-konigin-luise", "/ships/ss-konigin-luise", "SS <em>Königin Luise</em>", "Barbarossa-class sister"],
        ["ss-prinzess-irene", "/ships/ss-prinzess-irene", "SS <em>Prinzess Irene</em>", "Barbarossa-class sister"],
        ["ss-grosser-kurfurst", "/ships/ss-grosser-kurfurst", "SS <em>Grosser Kurfürst</em>", "enlarged half-sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Campania and Lucania were Cunard sister express liners of the 1890s, built as a closely matched pair for the company’s premier North Atlantic service.",
      [
        ["rms-campania", "/ships/rms-campania", "RMS <em>Campania</em>", "sister ship"],
        ["rms-lucania", "/ships/rms-lucania", "RMS <em>Lucania</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships",
      "Etruria and Umbria were closely matched Cunard sister express liners of the mid-1880s, representing the company’s leading North Atlantic generation before Campania and Lucania.",
      [
        ["rms-etruria-1884", "/ships/rms-etruria-1884", "RMS <em>Etruria</em>", "sister ship"],
        ["rms-umbria-1884", "/ships/rms-umbria-1884", "RMS <em>Umbria</em>", "sister ship"]
      ]
    ),
    group(
      "Sister Ships — Propulsion Comparison",
      "Laurentic and Megantic were closely matched sister liners whose differing machinery arrangements gave their operators a practical comparison between propulsion systems in otherwise closely related ships.",
      [
        ["rms-laurentic", "/ships/rms-laurentic", "RMS <em>Laurentic</em>", "sister ship with differing machinery"],
        ["rms-megantic-1909", "/ships/rms-megantic-1909", "RMS <em>Megantic</em>", "sister ship with differing machinery"]
      ]
    ),
    group(
      "Manhattan-class Sisters",
      "Manhattan and Washington were sister liners built for United States Lines in the early 1930s, forming the company’s principal American-built transatlantic pair before the postwar era.",
      [
        ["ss-manhattan", "/ships/ss-manhattan", "SS <em>Manhattan</em>", "Manhattan-class sister"],
        ["ss-washington", "/ships/ss-washington", "SS <em>Washington</em>", "Manhattan-class sister"]
      ]
    ),
    group(
      "Sister Ships",
      "Bremen and Europa were Norddeutscher Lloyd sister express liners conceived as a paired interwar flagship generation; they were built by different yards and were closely related rather than literal duplicates.",
      [
        ["ss-bremen", "/ships/ss-bremen", "SS <em>Bremen</em>", "sister express liner"],
        ["ss-europa", "/ships/ss-europa", "SS <em>Europa</em>", "sister express liner"]
      ]
    )
  ];

  const definitions = GROUPS
    .filter((group) => group.members.some((member) => member[0] === slug))
    .map((group) => ({
      heading: group.heading,
      note: group.note,
      items: group.members
        .filter((member) => member[0] !== slug)
        .map((member) => member.slice(1))
    }));

  if (!definitions.length) return;

  function normalizePath(href) {
    try {
      return new URL(href, window.location.origin).pathname
        .replace(/\.html?$/i, "")
        .replace(/\/$/, "");
    } catch {
      return String(href || "")
        .split("?")[0]
        .split("#")[0]
        .replace(/\.html?$/i, "")
        .replace(/\/$/, "");
    }
  }

  function sectionShipLinks(section) {
    return Array.from(section.querySelectorAll('a[href^="/ships/"]'))
      .map((link) => normalizePath(link.getAttribute("href")))
      .filter(Boolean)
      .sort();
  }

  function exactExistingSection(definition) {
    const wanted = definition.items
      .map((item) => normalizePath(item[0]))
      .filter(Boolean)
      .sort();

    return Array.from(guide.querySelectorAll("section")).find((section) => {
      if (section.id === "history-of-ocean-liners-context") return false;
      const links = sectionShipLinks(section);
      if (links.length !== wanted.length) return false;
      return links.every((href, index) => href === wanted[index]);
    }) || null;
  }

  function upgradeExistingSection(section, definition) {
    const heading = section.querySelector(":scope > h2");
    const note = section.querySelector(":scope > .note");

    if (heading) heading.textContent = definition.heading;
    if (note) note.textContent = definition.note;
    section.classList.add("olc-curated-relationship", "olc-curated-relationship-phase2");
    section.setAttribute("aria-label", definition.heading);
  }

  function buildSection(definition) {
    const section = document.createElement("section");
    section.className = "olc-curated-relationship olc-curated-relationship-phase2";
    section.setAttribute("aria-label", definition.heading);

    section.innerHTML = `
      <h2>${definition.heading}</h2>
      <p class="note">${definition.note}</p>
      <ul class="sources">
        ${definition.items.map(([href, label, tail]) =>
          `<li><a href="${href}">${label}</a>${tail ? ` — ${tail}` : ""}</li>`
        ).join("")}
      </ul>
    `;

    return section;
  }

  function insertSection(section, history) {
    const firstSourcesHeading = Array.from(guide.querySelectorAll("h2"))
      .find((heading) => /^sources$/i.test((heading.textContent || "").trim()));

    if (history && history.parentNode) {
      history.parentNode.insertBefore(section, history);
    } else if (firstSourcesHeading && firstSourcesHeading.parentNode) {
      firstSourcesHeading.parentNode.insertBefore(section, firstSourcesHeading);
    } else {
      guide.appendChild(section);
    }
  }

  function run() {
    if (guide.dataset.olcRelationshipPhase2 === "done") return true;

    // Wait until the base related-liners layer has completed its placement work.
    const history = document.getElementById("history-of-ocean-liners-context");
    if (!history) return false;

    definitions.forEach((definition) => {
      const existing = exactExistingSection(definition);
      if (existing) {
        upgradeExistingSection(existing, definition);
      } else {
        insertSection(buildSection(definition), history);
      }
    });

    guide.dataset.olcRelationshipPhase2 = "done";
    return true;
  }

  if (run()) return;

  const observer = new MutationObserver(() => {
    if (!run()) return;
    observer.disconnect();
  });

  observer.observe(guide, { childList: true, subtree: true });

  window.setTimeout(() => {
    run();
    observer.disconnect();
  }, 4000);
})();
