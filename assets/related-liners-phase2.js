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
  // relationships. Broad fleet, era, and same-line proximity belongs elsewhere.
  const relationships = {
    "ss-president-hoover": {
      heading: "Sister Ships",
      note: "President Hoover and President Coolidge formed Dollar Line’s paired generation of large interwar trans-Pacific passenger liners.",
      items: [
        ["/ships/ss-president-coolidge", "SS <em>President Coolidge</em>", "sister ship"]
      ]
    },
    "ss-president-coolidge": {
      heading: "Sister Ships",
      note: "President Coolidge and President Hoover formed Dollar Line’s paired generation of large interwar trans-Pacific passenger liners.",
      items: [
        ["/ships/ss-president-hoover", "SS <em>President Hoover</em>", "sister ship"]
      ]
    },
    "ss-duilio": {
      heading: "Sister Ships",
      note: "Duilio and Giulio Cesare were sister ships built for Navigazione Generale Italiana and became an important pair in Italy’s interwar South America trade.",
      items: [
        ["/ships/ss-giulio-cesare", "SS <em>Giulio Cesare</em>", "sister ship"]
      ]
    },
    "ss-giulio-cesare": {
      heading: "Sister Ships",
      note: "Giulio Cesare and Duilio were sister ships built for Navigazione Generale Italiana and became an important pair in Italy’s interwar South America trade.",
      items: [
        ["/ships/ss-duilio", "SS <em>Duilio</em>", "sister ship"]
      ]
    },
    "ms-saturnia": {
      heading: "Sister Ships",
      note: "Saturnia and Vulcania were sister motor ships built at Monfalcone for Cosulich Line, sharing long interwar and postwar careers in Italian passenger service.",
      items: [
        ["/ships/ms-vulcania", "MS <em>Vulcania</em>", "sister ship"]
      ]
    },
    "ms-vulcania": {
      heading: "Sister Ships",
      note: "Vulcania and Saturnia were sister motor ships built at Monfalcone for Cosulich Line, sharing long interwar and postwar careers in Italian passenger service.",
      items: [
        ["/ships/ms-saturnia", "MS <em>Saturnia</em>", "sister ship"]
      ]
    }
  };

  const definition = relationships[slug];
  if (!definition) return;

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

  function relationshipAlreadyPresent() {
    const wanted = new Set(definition.items.map((item) => normalizePath(item[0])));
    const existing = new Set(
      Array.from(guide.querySelectorAll('a[href^="/ships/"]'))
        .map((link) => normalizePath(link.getAttribute("href")))
    );

    return Array.from(wanted).every((href) => existing.has(href));
  }

  function buildSection() {
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

  function run() {
    if (guide.dataset.olcRelationshipPhase2 === "done") return true;

    // Wait until the base related-liners layer has completed its placement work.
    const history = document.getElementById("history-of-ocean-liners-context");
    if (!history) return false;

    if (!relationshipAlreadyPresent()) {
      const section = buildSection();
      const firstSourcesHeading = Array.from(guide.querySelectorAll("h2"))
        .find((heading) => /^sources$/i.test((heading.textContent || "").trim()));

      if (history.parentNode) {
        history.parentNode.insertBefore(section, history);
      } else if (firstSourcesHeading && firstSourcesHeading.parentNode) {
        firstSourcesHeading.parentNode.insertBefore(section, firstSourcesHeading);
      } else {
        guide.appendChild(section);
      }
    }

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
