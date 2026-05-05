(function () {
  const ENTRY_SETS = {
    general: {
      eyebrow: "Start here",
      heading: "Common questions",
      intro:
        "If you’re new to this topic, these quick-entry pages answer the most common questions and lead into deeper material.",
      links: [
  {
    meta: "Basics · Ships",
    title: "What is the difference between an ocean liner and a cruise ship?",
    desc:
      "Purpose, design, routes, and experience—why liners crossed oceans and cruise ships don’t have to.",
    href: "/ocean-liner-cruise-ship"
  },
  {
    meta: "Basics · Ships",
    title: "What Was the Golden Age of Ocean Liners?",
    desc:
      "The fastest, most reliable way to cross oceans, carry mail, and move people at scale.",
    href: "/what-was-the-golden-age-of-ocean-liners"
  },
  {
    meta: "Experience · Voyages",
    title: "What was it like to cross the Atlantic on an ocean liner?",
    desc:
      "Boarding, daily routines, weather, and life at sea during a transatlantic crossing.",
    href: "/what-was-it-like-to-cross-the-atlantic-on-an-ocean-liner"
  },
  {
    meta: "History · Transition",
    title: "Why did ocean liners disappear?",
    desc:
      "Jet travel, economics, and changing expectations reshaped transatlantic travel.",
    href: "/why-did-ocean-liners-disappear"
  },
  {
    meta: "Titanic · Artifacts",
    title: "What happened to Titanic artifacts?",
    desc:
      "What was recovered, what remains at the wreck site, and why preservation is complicated.",
    href: "/what-happened-to-titanic-artifacts"
  },
  {
    meta: "SS United States · Design",
    title: "Why was SS United States so fast?",
    desc:
      "Power, weight, and military-influenced engineering behind her record speed.",
    href: "/why-was-ss-united-states-so-fast"
  }
]
    },

    titanic: {
      eyebrow: "Titanic start here",
      heading: "Common Titanic questions",
      intro:
        "Quick-entry Titanic pages for readers who want a clear answer before moving into deeper evidence and collections.",
      links: [
  {
    meta: "Artifacts & evidence",
    title: "What happened to Titanic artifacts?",
    desc:
      "Recovered objects, what remains at the wreck site, conservation, and public memory.",
    href: "/what-happened-to-titanic-artifacts"
  },
  {
    meta: "Life aboard",
    title: "What was it like aboard Titanic?",
    desc:
      "Cabins, meals, routines, public rooms, and class differences during the voyage.",
    href: "/what-was-it-like-aboard-titanic"
  },
  {
    meta: "Film & history",
    title: "How accurate is the Titanic movie?",
    desc:
      "What the 1997 film gets right, what it simplifies, and where evidence matters.",
    href: "/how-accurate-is-the-titanic-movie"
  },
  {
    meta: "Timeline",
    title: "Titanic: Departure to Rescue",
    desc:
      "Follow the voyage from Southampton through the sinking and rescue by Carpathia.",
    href: "/ships/titanic-southampton-to-rescue-timeline"
  }
]
    },

    unitedStates: {
      eyebrow: "SS United States start here",
      heading: "Common SS United States questions",
      intro:
        "Quick-entry pages for understanding the ship’s speed, design, public rooms, preservation story, and legacy.",
      links: [
        {
          meta: "Speed & engineering",
          title: "Why was SS United States so fast?",
          desc:
            "Power, weight, fireproofing, and military-influenced engineering behind her record speed.",
          href: "/why-was-ss-united-states-so-fast"
        },
        {
          meta: "Life aboard",
          title: "A Voyage Aboard SS United States",
          desc:
            "Boarding, meals, public rooms, deck routines, and shipboard service during a typical crossing.",
          href: "/a-voyage-aboard-ss-united-states"
        },
        {
          meta: "Legacy",
          title: "Why SS United States Still Matters",
          desc:
            "Her design achievement, national symbolism, preservation debates, and continuing public memory.",
          href: "/why-ss-united-states-still-matters"
        }
      ]
    }
  };

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderEntryLinks(el) {
    const setName = el.dataset.entrySet || "general";
    const set = ENTRY_SETS[setName] || ENTRY_SETS.general;

    const headingId =
      "entry-links-heading-" + Math.random().toString(36).slice(2, 9);

    el.innerHTML = `
      <section class="entry-links-block" aria-labelledby="${headingId}">
        <div class="entry-links-inner">
          <div class="entry-links-header">
            <span class="entry-links-eyebrow">${escapeHTML(set.eyebrow)}</span>
            <h2 id="${headingId}">${escapeHTML(set.heading)}</h2>
            <p class="entry-links-intro">${escapeHTML(set.intro)}</p>
          </div>

          <div class="entry-links-grid">
            ${set.links
              .map(
                (link) => `
                  <a class="entry-link-card" href="${escapeHTML(link.href)}">
                    <span class="entry-link-meta">${escapeHTML(link.meta)}</span>
                    <b>${escapeHTML(link.title)}</b>
                    <span class="entry-link-desc">${escapeHTML(link.desc)}</span>
                  </a>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function initEntryLinks() {
    document.querySelectorAll(".olc-entry-links").forEach(renderEntryLinks);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEntryLinks);
  } else {
    initEntryLinks();
  }
})();