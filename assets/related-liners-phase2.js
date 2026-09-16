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
  // Groups are declared once here and expanded per page at runtime. This keeps
  // reciprocal links symmetrical and makes future class additions low-risk.
  const GROUPS = [
    {
      heading: "Sister Ships",
      note: "President Hoover and President Coolidge were identical sister ships built for Dollar Line’s large interwar trans-Pacific passenger service.",
      members: [
        ["ss-president-hoover", "/ships/ss-president-hoover", "SS <em>President Hoover</em>", "sister ship"],
        ["ss-president-coolidge", "/ships/ss-president-coolidge", "SS <em>President Coolidge</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Duilio and Giulio Cesare were sister ships built for Navigazione Generale Italiana and later served within the consolidated Italian Line fleet.",
      members: [
        ["ss-duilio", "/ships/ss-duilio", "SS <em>Duilio</em>", "sister ship"],
        ["ss-giulio-cesare", "/ships/ss-giulio-cesare", "SS <em>Giulio Cesare</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Saturnia and Vulcania were sister motor ships built at Monfalcone for Cosulich Line, with long interwar and postwar careers in Italian passenger service.",
      members: [
        ["ms-saturnia", "/ships/ms-saturnia", "MS <em>Saturnia</em>", "sister ship"],
        ["ms-vulcania", "/ships/ms-vulcania", "MS <em>Vulcania</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Arundel Castle and Windsor Castle were sister Cape Mail liners whose original four-funnel profiles and later modernizations closely paralleled one another.",
      members: [
        ["rms-arundel-castle-1921", "/ships/rms-arundel-castle-1921", "RMS <em>Arundel Castle</em>", "sister ship"],
        ["rms-windsor-castle-1921", "/ships/rms-windsor-castle-1921", "RMS <em>Windsor Castle</em> (1921)", "sister ship"]
      ]
    },
    {
      heading: "Near-Sister Express Pair",
      note: "City of New York and City of Paris were closely related Inman express liners built as a paired late-1880s challenge in the North Atlantic speed trade.",
      members: [
        ["ss-city-of-new-york-1888", "/ships/ss-city-of-new-york-1888", "SS <em>City of New York</em> (1888)", "near-sister and express running mate"],
        ["ss-city-of-paris", "/ships/ss-city-of-paris", "SS <em>City of Paris</em>", "near-sister and express running mate"]
      ]
    },
    {
      heading: "Athenic-class Sisters",
      note: "Athenic, Corinthic, and Ionic formed White Star Line’s three-ship Athenic class for the Britain–New Zealand passenger and cargo service.",
      members: [
        ["ss-athenic", "/ships/ss-athenic", "SS <em>Athenic</em>", "Athenic-class sister"],
        ["ss-corinthic", "/ships/ss-corinthic", "SS <em>Corinthic</em>", "Athenic-class sister"],
        ["ss-ionic", "/ships/ss-ionic", "SS <em>Ionic</em>", "Athenic-class sister"]
      ]
    },
    {
      heading: "Jubilee-class Sisters",
      note: "Afric, Medic, Persic, Runic, and Suevic formed White Star Line’s five-ship Jubilee class for the Liverpool–Cape Town–Australia service.",
      members: [
        ["ss-afric", "/ships/ss-afric", "SS <em>Afric</em>", "Jubilee-class sister"],
        ["ss-medic", "/ships/ss-medic", "SS <em>Medic</em>", "Jubilee-class sister"],
        ["ss-persic", "/ships/ss-persic", "SS <em>Persic</em>", "Jubilee-class sister"],
        ["ss-runic", "/ships/ss-runic", "SS <em>Runic</em>", "Jubilee-class sister"],
        ["ss-suevic", "/ships/ss-suevic", "SS <em>Suevic</em>", "Jubilee-class sister"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Britannic and Germanic were White Star sister ships of the 1870s, nearly identical when built and central to the company’s early North Atlantic expansion.",
      members: [
        ["rms-britannic-1874", "/ships/rms-britannic-1874", "SS <em>Britannic</em> (1874)", "sister ship"],
        ["ss-germanic", "/ships/ss-germanic", "SS <em>Germanic</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Carmania and Caronia were near-identical Cunard sister ships deliberately fitted with different machinery so the company could compare turbine and reciprocating propulsion at full liner scale.",
      members: [
        ["rms-carmania", "/ships/rms-carmania", "RMS <em>Carmania</em>", "turbine-powered sister"],
        ["ss-caronia", "/ships/ss-caronia", "RMS <em>Caronia</em>", "reciprocating-powered sister"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Independence and Constitution were nearly identical sister liners built in the United States for American Export Lines’ postwar New York–Mediterranean service.",
      members: [
        ["ss-independence", "/ships/ss-independence", "SS <em>Independence</em>", "sister ship"],
        ["ss-constitution", "/ships/ss-constitution", "SS <em>Constitution</em>", "sister ship"]
      ]
    },
    {
      heading: "Holland America Sisters",
      note: "Rijndam and Noordam were sister ships in Holland America Line’s early-1900s group that also included Potsdam; the two represented here share the same class relationship.",
      members: [
        ["ss-rijndam-1901", "/ships/ss-rijndam-1901", "SS <em>Rijndam</em> (1901)", "sister ship"],
        ["ss-noordam", "/ships/ss-noordam", "SS <em>Noordam</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Veendam and Volendam were Holland America Line sister ships and the company’s largest turbine steamships before Statendam entered service.",
      members: [
        ["ss-veendam", "/ships/ss-veendam", "SS <em>Veendam</em>", "sister ship"],
        ["ss-volendam", "/ships/ss-volendam", "SS <em>Volendam</em>", "sister ship"]
      ]
    },
    {
      heading: "Asama Maru-class Sisters",
      note: "Asama Maru and Tatsuta Maru were sister ships in NYK’s three-ship Asama Maru class, built for the company’s premier trans-Pacific service; Chichibu Maru completed the trio.",
      members: [
        ["asama-maru-1929", "/ships/asama-maru-1929", "MS <em>Asama Maru</em>", "Asama Maru-class sister"],
        ["tatsuta-maru-1929", "/ships/tatsuta-maru-1929", "MS <em>Tatsuta Maru</em>", "Asama Maru-class sister"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Andrea Doria and Cristoforo Colombo were Italian Line sister ships built as a paired postwar flagship generation for the North Atlantic.",
      members: [
        ["ss-andrea-doria", "/ships/ss-andrea-doria", "SS <em>Andrea Doria</em>", "sister ship"],
        ["ss-cristoforo-colombo", "/ships/ss-cristoforo-colombo", "SS <em>Cristoforo Colombo</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Augustus and Roma were sister ships for Navigazione Generale Italiana, unusual for pairing diesel machinery in Augustus with steam turbines in Roma.",
      members: [
        ["ms-augustus", "/ships/ms-augustus", "MS <em>Augustus</em>", "diesel-powered sister"],
        ["ss-roma", "/ships/ss-roma", "SS <em>Roma</em>", "steam-turbine sister"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Conte Biancamano and Conte Grande were sister liners built for Lloyd Sabaudo and later absorbed into the consolidated Italian Line fleet.",
      members: [
        ["ss-conte-biancamano", "/ships/ss-conte-biancamano", "SS <em>Conte Biancamano</em>", "sister ship"],
        ["ss-conte-grande", "/ships/ss-conte-grande", "SS <em>Conte Grande</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Johan van Oldenbarnevelt and Marnix van St. Aldegonde were sister motor liners built for the Netherlands–East Indies passenger service.",
      members: [
        ["ss-johan-van-oldenbarnevelt", "/ships/ss-johan-van-oldenbarnevelt", "MS <em>Johan van Oldenbarnevelt</em>", "sister ship"],
        ["ss-marnix-van-st-aldegonde", "/ships/ss-marnix-van-st-aldegonde", "MS <em>Marnix van St. Aldegonde</em>", "sister ship"]
      ]
    },
    {
      heading: "Sister Ships",
      note: "Britannic and Georgic were White Star Line’s final pair of newly built motor liners and the last two ships completed for the company before the Cunard merger.",
      members: [
        ["mv-britannic", "/ships/mv-britannic", "MV <em>Britannic</em>", "sister ship"],
        ["mv-georgic", "/ships/mv-georgic", "MV <em>Georgic</em>", "sister ship"]
      ]
    }
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
