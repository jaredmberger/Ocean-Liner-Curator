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
  ,
    "rms-alcantara-1926": [
      {
        heading: "Sister Ship",
        note: "Alcantara and Asturias were closely paired Royal Mail liners built for the company’s South American service and represented the same interwar modernization program.",
        items: [["/ships/ss-asturias-1925", "SS <em>Asturias</em> (1925)", "sister ship"]]
      }
    ],
    "ss-asturias-1925": [
      {
        heading: "Sister Ship",
        note: "Asturias and Alcantara were closely paired Royal Mail liners built for the company’s South American service and represented the same interwar modernization program.",
        items: [["/ships/rms-alcantara-1926", "RMS <em>Alcantara</em>", "sister ship"]]
      }
    ],
    "ss-montcalm": [
      {
        heading: "Canadian Pacific “Mont” Group",
        note: "Montcalm, Montclare, and Montrose belonged to Canadian Pacific’s closely related postwar “Mont” group for the Britain–Canada passenger and emigrant trade.",
        items: [
          ["/ships/ss-montclare", "SS <em>Montclare</em>", "sister / near-sister"],
          ["/ships/ss-montrose", "SS <em>Montrose</em>", "sister / near-sister"]
        ]
      }
    ],
    "ss-montclare": [
      {
        heading: "Canadian Pacific “Mont” Group",
        note: "Montclare, Montcalm, and Montrose belonged to Canadian Pacific’s closely related postwar “Mont” group for the Britain–Canada passenger and emigrant trade.",
        items: [
          ["/ships/ss-montcalm", "SS <em>Montcalm</em>", "sister / near-sister"],
          ["/ships/ss-montrose", "SS <em>Montrose</em>", "sister / near-sister"]
        ]
      }
    ],
    "ss-montrose": [
      {
        heading: "Canadian Pacific “Mont” Group",
        note: "Montrose, Montcalm, and Montclare belonged to Canadian Pacific’s closely related postwar “Mont” group for the Britain–Canada passenger and emigrant trade.",
        items: [
          ["/ships/ss-montcalm", "SS <em>Montcalm</em>", "sister / near-sister"],
          ["/ships/ss-montclare", "SS <em>Montclare</em>", "sister / near-sister"]
        ]
      }
    ],
    "ss-mongolia": [
      {
        heading: "Sister Ship",
        note: "Mongolia and Manchuria were sister passenger-and-cargo liners built in the United States for Pacific Mail’s ambitious trans-Pacific service.",
        items: [["/ships/ss-manchuria", "SS <em>Manchuria</em>", "sister ship"]]
      }
    ],
    "ss-manchuria": [
      {
        heading: "Sister Ship",
        note: "Manchuria and Mongolia were sister passenger-and-cargo liners built in the United States for Pacific Mail’s ambitious trans-Pacific service.",
        items: [["/ships/ss-mongolia", "SS <em>Mongolia</em>", "sister ship"]]
      }
    ]
  ,
    "neptunia": [
      {
        heading: "Sister Ship",
        note: "Neptunia and Oceania were sister motor liners of the same Italian interwar generation. Both later served as troop transports and were sunk during the same convoy attack on 18 September 1941.",
        items: [["/ships/oceania", "MS <em>Oceania</em>", "sister ship"]]
      }
    ],
    "oceania": [
      {
        heading: "Sister Ship",
        note: "Oceania and Neptunia were sister motor liners of the same Italian interwar generation. Both later served as troop transports and were sunk during the same convoy attack on 18 September 1941.",
        items: [["/ships/neptunia", "MS <em>Neptunia</em>", "sister ship"]]
      }
    ],
    "ss-orama": [
      {
        heading: "Orient Line Sisters",
        note: "Orama, Orford, and Orontes belonged to the closely related Orient Line group built for the long Britain–Australia service through the Mediterranean and Suez.",
        items: [
          ["/ships/ss-orford", "SS <em>Orford</em>", "sister ship"],
          ["/ships/rms-orontes", "RMS <em>Orontes</em>", "sister ship"]
        ]
      }
    ],
    "ss-orford": [
      {
        heading: "Orient Line Sisters",
        note: "Orford, Orama, and Orontes belonged to the closely related Orient Line group built for the long Britain–Australia service through the Mediterranean and Suez.",
        items: [
          ["/ships/ss-orama", "SS <em>Orama</em>", "sister ship"],
          ["/ships/rms-orontes", "RMS <em>Orontes</em>", "sister ship"]
        ]
      }
    ],
    "rms-orontes": [
      {
        heading: "Orient Line Sisters",
        note: "Orontes, Orama, and Orford belonged to the closely related Orient Line group built for the long Britain–Australia service through the Mediterranean and Suez.",
        items: [
          ["/ships/ss-orama", "SS <em>Orama</em>", "sister ship"],
          ["/ships/ss-orford", "SS <em>Orford</em>", "sister ship"]
        ]
      }
    ]
  ,
    "ss-columbus-1924": [
      {
        heading: "North German Lloyd Flagship Succession",
        note: "Columbus was North German Lloyd’s principal large postwar liner before the arrival of the faster Bremen and Europa at the end of the 1920s.",
        items: [
          ["/ships/ss-bremen", "SS <em>Bremen</em>", "later NDL express flagship"],
          ["/ships/ss-europa", "SS <em>Europa</em>", "later NDL express flagship"]
        ]
      }
    ],
    "rms-queen-mary-2": [
      {
        heading: "Cunard Transatlantic Succession",
        note: "Queen Mary 2 entered service in 2004 as Cunard’s new flagship and direct transatlantic successor to Queen Elizabeth 2, while carrying forward the name and prestige tradition established by Queen Mary.",
        items: [
          ["/ships/queen-elizabeth-2", "RMS <em>Queen Elizabeth 2</em>", "immediate Cunard flagship predecessor"],
          ["/ships/rms-queen-mary", "RMS <em>Queen Mary</em>", "namesake and earlier Cunard flagship"]
        ]
      }
    ],
    "ss-cap-trafalgar": [
      {
        heading: "Hamburg Süd South Atlantic Flagships",
        note: "Cap Trafalgar, Cap Polonio, and Cap Arcona represent successive generations of Hamburg Süd prestige liners built for the Germany–South America passenger trade.",
        items: [
          ["/ships/ss-cap-polonio", "SS <em>Cap Polonio</em>", "later Hamburg Süd South Atlantic flagship"],
          ["/ships/ss-cap-arcona", "SS <em>Cap Arcona</em>", "later Hamburg Süd South Atlantic flagship"]
        ]
      }
    ],
    "ss-cap-polonio": [
      {
        heading: "Hamburg Süd South Atlantic Flagships",
        note: "Cap Polonio followed Cap Trafalgar in Hamburg Süd’s South American passenger tradition and was later superseded as the company’s prestige ship by Cap Arcona.",
        items: [
          ["/ships/ss-cap-trafalgar", "SS <em>Cap Trafalgar</em>", "earlier Hamburg Süd prestige liner"],
          ["/ships/ss-cap-arcona", "SS <em>Cap Arcona</em>", "later Hamburg Süd flagship"]
        ]
      }
    ],
    "ss-cap-arcona": [
      {
        heading: "Hamburg Süd South Atlantic Flagships",
        note: "Cap Arcona became Hamburg Süd’s leading South Atlantic prestige liner in 1927, succeeding the earlier Cap Polonio and continuing a flagship tradition that had included Cap Trafalgar before the First World War.",
        items: [
          ["/ships/ss-cap-polonio", "SS <em>Cap Polonio</em>", "immediate earlier Hamburg Süd prestige liner"],
          ["/ships/ss-cap-trafalgar", "SS <em>Cap Trafalgar</em>", "prewar Hamburg Süd flagship generation"]
        ]
      }
    ]
  ,
    "rms-andania": [
      {
        heading: "Cunard 1913 Canadian-service Trio",
        note: "Andania, Alaunia, and Aurania formed a closely related Cunard trio built for Canadian and St. Lawrence service immediately before the First World War.",
        items: [
          ["/ships/rms-alaunia", "RMS <em>Alaunia</em>", "same 1913 Cunard Canadian-service group"],
          ["/ships/rms-aurania", "RMS <em>Aurania</em>", "same 1913 Cunard Canadian-service group"]
        ]
      },
      {
        heading: "Namesake Across Eras",
        note: "Cunard reused the Andania name after the First World War for a new 1922 cabin liner, creating a direct namesake link between two different generations of Canadian-service ships.",
        items: [["/ships/rms-andania-1922", "RMS <em>Andania</em> (1922)", "later Cunard namesake"]]
      }
    ],
    "rms-andania-1922": [
      {
        heading: "Namesake Across Eras",
        note: "The 1922 Andania revived a Cunard name previously carried by the 1913 liner lost during the First World War.",
        items: [["/ships/rms-andania", "RMS <em>Andania</em> (1913)", "earlier Cunard namesake"]]
      }
    ],
    "ss-liberte": [
      {
        heading: "Linked Identity",
        note: "Liberté was the former German liner Europa, transferred to France after the Second World War and rebuilt for French Line service under a new name.",
        items: [["/ships/ss-europa", "SS <em>Europa</em>", "same ship before transfer and rebuilding"]]
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
