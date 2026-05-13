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
          title: "What was the golden age of ocean liners?",
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
          meta: "Myth & evidence",
          title: "Why was Titanic called unsinkable?",
          desc:
            "How marketing, media language, engineering confidence, and later memory shaped the myth.",
          href: "/why-was-titanic-called-unsinkable"
        },
        {
          meta: "Leviathan · History",
          title: "What Is the SS Leviathan and Why Was It Important?",
          desc:
            "From German liner Vaterland to American flagship: why SS Leviathan mattered to wartime transport, Atlantic prestige, and U.S. liner ambition.",
          href: "/what-is-the-ss-leviathan-and-why-was-it-important"
        }
      ]
    },

    titanic: {
      eyebrow: "Titanic pathways",
      heading: "Start with Titanic",
      intro:
        "A curated path through Titanic myths, sister ships, life aboard, artifacts, film history, and the voyage itself.",
      links: [
        {
          meta: "Myth & evidence",
          title: "Why was Titanic called unsinkable?",
          desc:
            "How marketing, engineering confidence, media language, and later memory shaped the myth.",
          href: "/why-was-titanic-called-unsinkable"
        },
        {
          meta: "Sister ships",
          title: "What is the difference between Titanic and Olympic?",
          desc:
            "How the Olympic-class sister ships differed in design, interiors, lifeboats, and service history.",
          href: "/titanic-vs-olympic"
        },
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
        },
        {
          meta: "Titanic · Interiors",
          title: "What happened to Titanic’s grand staircase?",
          desc:
            "What likely happened to the famous staircase during the sinking, what the wreck shows, and why certainty is limited.",
          href: "/what-happened-to-titanics-grand-staircase"
        },
        {
          meta: "Titanic · Sinking",
          title: "How long did it take Titanic to sink?",
          desc:
            "A clear timeline from the iceberg collision to the final plunge, with careful notes on timing and evidence.",
          href: "/how-long-did-it-take-titanic-to-sink"
        }
      ]
    },

    queenMary: {
      eyebrow: "Queen Mary pathways",
      heading: "Start with Queen Mary",
      intro:
        "A curated path through RMS Queen Mary’s Atlantic service, wartime transformation, interiors, preservation story, and continuing public memory.",
      links: [
        {
          meta: "Overview · Legacy",
          title: "What made RMS Queen Mary famous?",
          desc:
            "Why Queen Mary became one of the defining ocean liners of the twentieth century.",
          href: "/what-made-rms-queen-mary-famous"
        },

        {
          meta: "Life aboard",
          title: "What was it like aboard Queen Mary?",
          desc:
            "Public rooms, routines, Atlantic crossings, and the social atmosphere aboard the liner.",
          href: "/rms-queen-mary-voyage-reconstructed"
        },

        {
          meta: "Atlantic speed",
          title: "What was the Blue Riband?",
          desc:
            "How Atlantic speed became one of the great prestige contests of the liner era.",
          href: "/what-was-the-blue-riband"
        },

        {
          meta: "Preservation",
          title: "Why is Queen Mary in Long Beach?",
          desc:
            "Why did RMS Queen Mary end up permanently moored in California? A quick guide to retirement, preservation, tourism, and the ship’s postwar legacy.",
          href: "/why-is-queen-mary-in-long-beach"
        },

        {
          meta: "Preservation",
          title: "Why Queen Mary Still Matters",
          desc:
            "How preservation, tourism, nostalgia, and public memory reshaped the ship after her liner career.",
          href: "/why-queen-mary-still-matters"
        },

        {
          meta: "Timeline",
          title: "RMS Queen Mary Timeline",
          desc:
            "Follow Queen Mary from construction and Atlantic service through war, retirement, and preservation.",
          href: "/ships/rms-queen-mary-timeline"
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
          meta: "Atlantic speed · Prestige",
          title: "What was the Blue Riband?",
          desc:
            "How Atlantic speed became one of the great prestige contests of the ocean liner era.",
          href: "/what-was-the-blue-riband"
        },
        {
          meta: "Life aboard",
          title: "A Voyage Aboard SS United States",
          desc:
            "Boarding, meals, public rooms, deck routines, and shipboard service during a typical crossing.",
          href: "/ss-united-states-voyage-aboard"
        },
        {
          meta: "Legacy",
          title: "Why SS United States Still Matters",
          desc:
            "Her design achievement, national symbolism, preservation debates, and continuing public memory.",
          href: "/why-ss-united-states-still-matters"
        }
      ]
    },
    
        exploreMore: {
  eyebrow: "Explore more",
  heading: "Additional entry points",
  intro:
    "Additional short-answer pages, comparisons, and exploratory topics connected to ocean liner history and interpretation.",
  links: [
    {
      meta: "Basics · Ships",
      title: "Ocean Liners Are Ships — But Not All Ships Are Ocean Liners",
      desc:
        "Ocean liners are ships-—but a specific kind of passenger ship.",
      href: "/ocean-liners-are-ships"
    },

{
      meta: "Basics · Ships",
      title: "What are Ocean Liners?",
      desc:
        "Purpose-built machines for the open ocean—scheduled, long-distance transport that shaped design, culture, and the objects that survive today.",
      href: "/what-are-ocean-liners"
    },

    {
      meta: "Basics · Ships",
      title: "Ocean Liner vs Cruise Ship: What’s the Difference?",
      desc:
        "It all comes down to function!",
      href: "/ocean-liner-vs-cruise-ship"
    }
  ]
}
    
  };

  /* Expose globally for homepage rotating cards */
  window.OLC_ENTRY_SETS = ENTRY_SETS;

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