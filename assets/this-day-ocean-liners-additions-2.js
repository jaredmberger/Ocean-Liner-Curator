/* Ocean Liner Curator — additional verified late-August entries.
   This file is intended to be loaded after the primary This Day database. */
(function () {
  window.OCEAN_LINER_THIS_DAY = window.OCEAN_LINER_THIS_DAY || {};

  const additions = {
    "08-16": [
      {
        year: 1917,
        title: "White Star liner SS Delphic is sunk during wartime service",
        ship: "SS Delphic",
        category: "Wartime Loss",
        summary: "The White Star passenger-and-cargo liner Delphic was torpedoed and sunk by the German submarine UC-72 while under wartime requisition and sailing from Cardiff toward Montevideo.",
        whyItMatters: "Delphic's loss shows how civilian liner fleets were absorbed into wartime transport systems and exposed to submarine warfare far beyond their normal passenger routes.",
        relatedUrl: "",
        significance: "high",
        tags: ["delphic", "white-star-line", "world-war-i", "wartime-loss"],
        sources: ["Uboat.net World War I ship-loss database", "Shipwrecked Mariners' Society"]
      }
    ],

    "08-19": [
      {
        year: 1915,
        title: "White Star liner SS Arabic is torpedoed and sunk",
        ship: "SS Arabic",
        category: "Wartime Loss",
        summary: "Arabic was torpedoed by a German submarine off Ireland while on a wartime Atlantic voyage, causing civilian deaths including American passengers.",
        whyItMatters: "The sinking intensified diplomatic tensions over unrestricted submarine warfare only months after Lusitania and became part of the escalating dispute between Germany and the United States.",
        relatedUrl: "",
        significance: "high",
        tags: ["arabic", "white-star-line", "world-war-i", "submarine-warfare"],
        sources: ["Library of Congress", "Contemporary United States diplomatic and newspaper records"]
      }
    ],

    "08-22": [
      {
        year: 1925,
        title: "RMS Carinthia begins her maiden voyage",
        ship: "RMS Carinthia",
        category: "Maiden Voyage",
        summary: "Cunard's new Carinthia departed Liverpool for New York on her maiden voyage, entering service as part of the company's postwar passenger fleet.",
        whyItMatters: "Carinthia represents Cunard's 1920s generation of intermediate liners, ships that carried the Atlantic trade between the prewar express era and the later prestige ships of the 1930s.",
        relatedUrl: "",
        significance: "medium",
        tags: ["carinthia", "cunard-line", "maiden-voyage", "interwar-liners"],
        sources: ["Chatham Marconi RMS Carinthia history", "Cunard fleet histories"]
      }
    ],

    "08-27": [
      {
        year: 1870,
        title: "White Star's first SS Oceanic is launched",
        ship: "SS Oceanic",
        category: "Launch",
        summary: "Oceanic was launched at Belfast as the first new steamship built for Thomas Ismay's reorganized White Star Line and the first of the line's ships built by Harland & Wolff.",
        whyItMatters: "Oceanic began the long White Star–Harland & Wolff relationship and introduced passenger-accommodation ideas that helped redefine Atlantic liner design in the 1870s.",
        relatedUrl: "",
        significance: "high",
        tags: ["oceanic", "white-star-line", "harland-and-wolff", "launch"],
        sources: ["White Star Line History chronology", "Historical steam-navigation references"]
      }
    ],

    "08-30": [
      {
        year: 1939,
        title: "RMS Queen Mary departs on her final peacetime voyage before World War II",
        ship: "RMS Queen Mary",
        category: "Final Peacetime Voyage",
        summary: "Queen Mary departed Southampton on what became her final peacetime voyage before the outbreak of the Second World War transformed her career.",
        whyItMatters: "Within weeks the great express liner would leave normal passenger service and eventually become one of the most important Allied troop transports of the war.",
        relatedUrl: "/ships/rms-queen-mary",
        significance: "high",
        tags: ["queen-mary", "cunard-white-star", "world-war-ii", "wartime-transition"],
        sources: ["Queen Mary official historical timeline", "Cunard wartime histories"]
      }
    ],

    "08-31": [
      {
        year: 1936,
        title: "RMS Queen Mary wins the Blue Riband",
        ship: "RMS Queen Mary",
        category: "Record Crossing",
        summary: "At the end of her sixth round-trip voyage, Queen Mary secured the Blue Riband from Normandie with record North Atlantic crossing performances.",
        whyItMatters: "The achievement established Queen Mary as a true speed rival to Normandie and intensified one of the most famous competitive periods in transatlantic liner history.",
        relatedUrl: "/ships/rms-queen-mary",
        significance: "high",
        tags: ["queen-mary", "blue-riband", "cunard-white-star", "record-crossing"],
        sources: ["Queen Mary official historical timeline", "Cunard and transatlantic speed-record histories"]
      }
    ]
  };

  Object.entries(additions).forEach(([dateKey, events]) => {
    const existing = Array.isArray(window.OCEAN_LINER_THIS_DAY[dateKey])
      ? window.OCEAN_LINER_THIS_DAY[dateKey]
      : [];

    const seen = new Set(existing.map(event => `${event.year}|${event.title}`));
    const fresh = events.filter(event => !seen.has(`${event.year}|${event.title}`));
    window.OCEAN_LINER_THIS_DAY[dateKey] = existing.concat(fresh);
  });
})();
