// /assets/related-liners-enhancements.js
(() => {
  "use strict";

  const GENERIC_HEADINGS = new Set([
    "Related Liners",
    "Associated Liners",
    "Related Ships",
    "Connected Liners",
    "In the Same Orbit",
    "See Also"
  ]);

  const slug = (window.location.pathname.split("/").filter(Boolean).pop() || "")
    .replace(/\.html?$/i, "");

  if (!slug) return;

  const guide =
    document.querySelector(".guide") ||
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector(".container");

  if (!guide) return;

  const headingRules = [
    [/Olympic-class liners and associated tenders/i, "Olympic-class Sisters & Tenders"],
    [/Imperator-class.*trio/i, "Imperator-class Sisters & Successor Identities"],
    [/Campania.*Lucania|paired 1890s express liners/i, "Sister Ships"],
    [/Manhattan-class sisters/i, "Sister Ships"],
    [/German express liners of the interwar era/i, "Sister Ships"],
    [/Michelangelo.*Raffaello|late superliner duo/i, "Sister Ships"],
    [/Saxonia-class quartet/i, "Saxonia-class Sisters"],
    [/Kaiser-class express liners/i, "Kaiser-class Sisters"],
    [/Duchess.*quartet/i, "Duchess-class Sisters"],
    [/Megantic\/Laurentic pair|Laurentic and Megantic/i, "Sister Ships"],
    [/Etruria and Umbria|paired mid-1880s express liners/i, "Sister Ships"],
    [/Britannic.*Georgic|interwar motor-ship pair/i, "Running Mates"],
    [/Teutonic.*Majestic|late-Victorian running mates/i, "Running Mates"],
    [/Reliance and Resolute|paired interwar cruise-and-transatlantic/i, "Running Mates"],
    [/Furness Bermuda Line.*paired|Monarch of Bermuda.*Queen of Bermuda/i, "Running Mates"],
    [/Cunard.*flagship.*Queens/i, "Cunard Queens"],
    [/identity trail involving German origins/i, "Linked Identities"],
    [/two major Holland America flagships carrying the Rotterdam name/i, "Namesakes Across Eras"],
    [/two Cunard ships carrying the Franconia name/i, "Namesakes Across Eras"]
  ];

  const aliasSelfLinks = {
    "ss-leviathan": "/ships/ss-vaterland",
    "rms-berengaria": "/ships/ss-imperator",
    "rms-majestic": "/ships/ss-bismarck-1914"
  };

  const manualRelationships = {
    "rms-lusitania": [
      {
        heading: "Cunard Flagship Generation",
        note: "Lusitania and Mauretania were sister ships; Aquitania followed as a larger Cunard running mate in the same prewar flagship generation.",
        items: [
          ["/ships/rms-mauretania", "RMS <em>Mauretania</em>", "sister ship"],
          ["/ships/rms-aquitania", "RMS <em>Aquitania</em>", "later Cunard running mate"]
        ]
      }
    ],
    "rms-mauretania": [
      {
        heading: "Cunard Flagship Generation",
        note: "Mauretania and Lusitania were sister ships; Aquitania followed as a larger Cunard running mate in the same prewar flagship generation.",
        items: [
          ["/ships/rms-lusitania", "RMS <em>Lusitania</em>", "sister ship"],
          ["/ships/rms-aquitania", "RMS <em>Aquitania</em>", "later Cunard running mate"]
        ]
      }
    ],
    "rms-aquitania": [
      {
        heading: "Cunard Flagship Generation",
        note: "Aquitania followed Lusitania and Mauretania as Cunard’s larger prewar flagship, linking the famous express pair with a remarkably long-lived successor.",
        items: [
          ["/ships/rms-lusitania", "RMS <em>Lusitania</em>", "earlier Cunard flagship"],
          ["/ships/rms-mauretania", "RMS <em>Mauretania</em>", "earlier Cunard flagship and long-running contemporary"]
        ]
      }
    ],
    "rms-queen-mary": [
      {
        heading: "Atlantic Rival",
        note: "Queen Mary and Normandie became the defining prestige rivals of the mid-1930s North Atlantic.",
        items: [["/ships/ss-normandie", "SS <em>Normandie</em>", "French Line rival"]]
      },
      {
        heading: "Postwar Atlantic Competition",
        note: "After the war, Queen Mary shared the North Atlantic with the new American speed champion SS United States.",
        items: [["/ships/ss-us", "SS <em>United States</em>", "United States Lines rival"]]
      }
    ],
    "ss-normandie": [
      {
        heading: "Atlantic Rival",
        note: "Normandie and Queen Mary became the defining prestige rivals of the mid-1930s North Atlantic.",
        items: [["/ships/rms-queen-mary", "RMS <em>Queen Mary</em>", "Cunard rival"]]
      }
    ],
    "rms-queen-elizabeth": [
      {
        heading: "Postwar Atlantic Competition",
        note: "Queen Elizabeth’s postwar express service placed her in the same competitive Atlantic world as the later SS United States.",
        items: [["/ships/ss-us", "SS <em>United States</em>", "United States Lines rival"]]
      }
    ],
    "ss-us": [
      {
        heading: "Postwar Atlantic Rivals",
        note: "United States entered service against Cunard’s established postwar Queens, combining American speed prestige with direct North Atlantic competition.",
        items: [
          ["/ships/rms-queen-mary", "RMS <em>Queen Mary</em>", "Cunard rival"],
          ["/ships/rms-queen-elizabeth", "RMS <em>Queen Elizabeth</em>", "Cunard rival"]
        ]
      }
    ],
    "ss-leviathan": [
      {
        heading: "1920s Atlantic Giants",
        note: "Leviathan, Berengaria, and Majestic were former German giants recast under American and British flags after the First World War and became prominent rivals in the 1920s Atlantic trade.",
        items: [
          ["/ships/rms-berengaria", "RMS <em>Berengaria</em>", "Cunard rival; ex-<em>Imperator</em>"],
          ["/ships/rms-majestic", "RMS <em>Majestic</em>", "White Star rival; ex-<em>Bismarck</em>"]
        ]
      }
    ],
    "rms-berengaria": [
      {
        heading: "1920s Atlantic Giants",
        note: "Berengaria, Leviathan, and Majestic were former German giants redistributed after the First World War and became prominent rivals in the 1920s Atlantic trade.",
        items: [
          ["/ships/ss-leviathan", "SS <em>Leviathan</em>", "United States Lines rival; ex-<em>Vaterland</em>"],
          ["/ships/rms-majestic", "RMS <em>Majestic</em>", "White Star rival; ex-<em>Bismarck</em>"]
        ]
      }
    ],
    "rms-majestic": [
      {
        heading: "1920s Atlantic Giants",
        note: "Majestic, Berengaria, and Leviathan were former German giants redistributed after the First World War and became prominent rivals in the 1920s Atlantic trade.",
        items: [
          ["/ships/rms-berengaria", "RMS <em>Berengaria</em>", "Cunard rival; ex-<em>Imperator</em>"],
          ["/ships/ss-leviathan", "SS <em>Leviathan</em>", "United States Lines rival; ex-<em>Vaterland</em>"]
        ]
      }
    ]
  ,
    "rms-carpathia": [
      {
        heading: "Titanic Rescue",
        note: "Carpathia is inseparable from Titanic’s loss: the Cunard liner reached the disaster area on 15 April 1912 and took aboard the survivors from Titanic’s lifeboats.",
        items: [["/ships/rms-titanic", "RMS <em>Titanic</em>", "ship whose survivors Carpathia rescued"]]
      }
    ],
    "rms-titanic": [
      {
        heading: "Rescue Ship",
        note: "Carpathia reached Titanic’s lifeboats on the morning of 15 April 1912 and carried the survivors onward to New York.",
        items: [["/ships/rms-carpathia", "RMS <em>Carpathia</em>", "rescued Titanic’s survivors"]]
      }
    ],
    "rms-empress-of-ireland": [
      {
        heading: "Collision Counterpart",
        note: "Empress of Ireland and the Norwegian collier Storstad collided in dense fog in the St. Lawrence River on 29 May 1914, a disaster that caused the liner to sink rapidly.",
        items: [["/ships/ss-storstad", "SS <em>Storstad</em>", "colliding vessel in the 1914 disaster"]]
      }
    ],
    "ss-storstad": [
      {
        heading: "Collision Counterpart",
        note: "Storstad is historically linked to Empress of Ireland through their collision in dense fog in the St. Lawrence River on 29 May 1914.",
        items: [["/ships/rms-empress-of-ireland", "RMS <em>Empress of Ireland</em>", "liner lost after the collision"]]
      }
    ],
    "rms-homeric": [
      {
        heading: "White Star’s 1920s Flagship Trio",
        note: "Homeric operated with Olympic and Majestic as White Star Line’s principal three-ship North Atlantic combination during much of the 1920s.",
        items: [
          ["/ships/rms-olympic", "RMS <em>Olympic</em>", "White Star running mate"],
          ["/ships/rms-majestic", "RMS <em>Majestic</em>", "White Star running mate"]
        ]
      }
    ],
    "rms-olympic": [
      {
        heading: "White Star’s 1920s Flagship Trio",
        note: "During the 1920s Olympic operated with the newly acquired Majestic and Homeric as White Star Line’s principal North Atlantic flagship combination.",
        items: [
          ["/ships/rms-homeric", "RMS <em>Homeric</em>", "White Star running mate"],
          ["/ships/rms-majestic", "RMS <em>Majestic</em>", "White Star running mate"]
        ]
      }
    ],
    "rms-majestic": [
      {
        heading: "White Star’s 1920s Flagship Trio",
        note: "During the 1920s Majestic operated with Olympic and Homeric as White Star Line’s principal North Atlantic flagship combination.",
        items: [
          ["/ships/rms-olympic", "RMS <em>Olympic</em>", "White Star running mate"],
          ["/ships/rms-homeric", "RMS <em>Homeric</em>", "White Star running mate"]
        ]
      }
    ],
    "ss-monarch-of-bermuda": [
      {
        heading: "Bermuda Running Mate",
        note: "Monarch of Bermuda and Queen of Bermuda formed Furness Bermuda Line’s celebrated purpose-built pair for the New York–Bermuda passenger trade.",
        items: [["/ships/ss-queen-of-bermuda", "SS <em>Queen of Bermuda</em>", "Furness Bermuda Line running mate"]]
      }
    ],
    "ss-queen-of-bermuda": [
      {
        heading: "Bermuda Running Mate",
        note: "Queen of Bermuda joined Monarch of Bermuda in Furness Bermuda Line’s purpose-built luxury service between New York and Bermuda.",
        items: [["/ships/ss-monarch-of-bermuda", "<em>Monarch of Bermuda</em>", "Furness Bermuda Line running mate"]]
      }
    ],
    "ss-great-western": [
      {
        heading: "1838 Steam Atlantic Breakthrough",
        note: "Sirius and Great Western made the breakthrough transatlantic steam passages of April 1838; Sirius arrived first, while Great Western demonstrated the practicality of a purpose-built Atlantic steamer.",
        items: [
          ["/ships/ss-sirius", "SS <em>Sirius</em>", "fellow pioneer of the April 1838 steam crossings"],
          ["/ships/ss-great-britain-1843", "SS <em>Great Britain</em>", "later Great Western Steamship Company successor"]
        ]
      }
    ],
    "ss-sirius": [
      {
        heading: "1838 Steam Atlantic Breakthrough",
        note: "Sirius and Great Western made the breakthrough transatlantic steam passages of April 1838, establishing an enduring historical link between the two pioneering vessels.",
        items: [["/ships/ss-great-western", "SS <em>Great Western</em>", "fellow pioneer of the April 1838 steam crossings"]]
      }
    ],
    "ss-great-britain-1843": [
      {
        heading: "Great Western Steamship Lineage",
        note: "Great Britain followed Great Western for the same company and pushed ocean-going steamship design further through her iron hull and screw propulsion.",
        items: [["/ships/ss-great-western", "SS <em>Great Western</em>", "earlier company pioneer"]]
      }
    ]
  };

  function normalizePath(href) {
    try {
      return new URL(href, window.location.origin).pathname.replace(/\/$/, "");
    } catch {
      return String(href || "").split("?")[0].split("#")[0].replace(/\/$/, "");
    }
  }

  function relatedSections() {
    return Array.from(guide.querySelectorAll("section")).filter((section) => {
      if (section.id === "history-of-ocean-liners-context") return false;
      const h2 = section.querySelector(":scope > h2");
      const shipLinks = section.querySelectorAll('ul.sources a[href^="/ships/"]');
      return Boolean(h2 && shipLinks.length && GENERIC_HEADINGS.has((h2.textContent || "").trim()));
    });
  }

  function strengthenHeadings() {
    relatedSections().forEach((section) => {
      const h2 = section.querySelector(":scope > h2");
      const note = section.querySelector(":scope > .note");
      if (!h2 || !note) return;

      const text = note.textContent || "";
      const match = headingRules.find(([pattern]) => pattern.test(text));
      if (match) h2.textContent = match[1];
    });
  }

  function removeAliasSelfLink() {
    const aliasPath = aliasSelfLinks[slug];
    if (!aliasPath) return;

    Array.from(guide.querySelectorAll('ul.sources a[href^="/ships/"]')).forEach((link) => {
      if (normalizePath(link.getAttribute("href")) !== aliasPath) return;
      const li = link.closest("li");
      const section = link.closest("section");
      if (li) li.remove();
      if (section && section.querySelectorAll('ul.sources li').length === 0) section.remove();
    });
  }

  function dedupeEquivalentSections() {
    const seen = new Set();

    relatedSections().forEach((section) => {
      const links = Array.from(section.querySelectorAll('ul.sources a[href^="/ships/"]'))
        .map((a) => normalizePath(a.getAttribute("href")))
        .sort();

      if (!links.length) return;
      const signature = links.join("|");
      if (seen.has(signature)) {
        section.remove();
        return;
      }
      seen.add(signature);
    });
  }

  function relationshipAlreadyPresent(def) {
    const wanted = new Set(def.items.map((item) => normalizePath(item[0])));
    const existing = new Set(
      Array.from(guide.querySelectorAll('ul.sources a[href^="/ships/"]'))
        .map((a) => normalizePath(a.getAttribute("href")))
    );
    return Array.from(wanted).every((href) => existing.has(href));
  }

  function buildManualSection(def) {
    const section = document.createElement("section");
    section.className = "olc-curated-relationship";
    section.setAttribute("aria-label", def.heading);

    section.innerHTML = `
      <h2>${def.heading}</h2>
      <p class="note">${def.note}</p>
      <ul class="sources">
        ${def.items.map(([href, label, tail]) =>
          `<li><a href="${href}">${label}</a>${tail ? ` — ${tail}` : ""}</li>`
        ).join("")}
      </ul>
    `;

    return section;
  }

  function injectManualRelationships() {
    const defs = manualRelationships[slug] || [];
    if (!defs.length) return;

    const history = document.getElementById("history-of-ocean-liners-context");
    const firstSourcesHeading = Array.from(guide.querySelectorAll("h2"))
      .find((h) => /^sources$/i.test((h.textContent || "").trim()));

    defs.forEach((def) => {
      if (relationshipAlreadyPresent(def)) return;
      const section = buildManualSection(def);

      if (history && history.parentNode) {
        history.parentNode.insertBefore(section, history);
      } else if (firstSourcesHeading && firstSourcesHeading.parentNode) {
        firstSourcesHeading.parentNode.insertBefore(section, firstSourcesHeading);
      } else {
        guide.appendChild(section);
      }
    });
  }

  function run() {
    if (guide.dataset.olcRelationshipEnhancements === "done") return true;

    // related-liners.js injects this marker after its cluster work begins.
    const history = document.getElementById("history-of-ocean-liners-context");
    if (!history) return false;

    removeAliasSelfLink();
    dedupeEquivalentSections();
    strengthenHeadings();
    injectManualRelationships();

    guide.dataset.olcRelationshipEnhancements = "done";
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
