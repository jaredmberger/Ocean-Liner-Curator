// /assets/related-liners.js
(() =&gt; {
  /* =========================================================
     Related Liners injector
     - No new CSS: uses existing &lt;h2&gt;, .note, and .sources styles
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
    document.querySelector(&quot;.guide&quot;) ||
    document.querySelector(&quot;main&quot;) ||
    document.querySelector(&quot;article&quot;) ||
    document.querySelector(&quot;.container&quot;);

  if (!guide) {
    console.warn(&quot;[related-liners] No guide container found.&quot;);
    return;
  }

  const h2s = Array.from(guide.querySelectorAll(&quot;h2&quot;));
  const sourcesH2 =
    h2s.find((h) =&gt; /sources/i.test((h.textContent || &quot;&quot;).trim())) || null;

  /* =========================
     Slug
  ========================= */
  const lastSeg = window.location.pathname.split(&quot;/&quot;).filter(Boolean).pop() || &quot;&quot;;
  const slug = lastSeg.replace(/\.html?$/i, &quot;&quot;);
  if (!slug) {
    console.warn(&quot;[related-liners] Could not derive slug from pathname.&quot;);
    return;
  }
  
  /* =========================
     Historical context + random archive ship
     Uses the existing URL list maintained by /assets/random-ship.js.
  ========================= */
  function normalizePath(value) {
    try {
      return new URL(value, window.location.origin).pathname
        .replace(/\/+$/, &quot;&quot;)
        .replace(/\.html?$/i, &quot;&quot;);
    } catch {
      return String(value || &quot;&quot;)
        .split(&quot;?&quot;)[0]
        .split(&quot;#&quot;)[0]
        .replace(/\/+$/, &quot;&quot;)
        .replace(/\.html?$/i, &quot;&quot;);
    }
  }

  function shipNameFromURL(value) {
    const path = normalizePath(value);
    const file = path.split(&quot;/&quot;).filter(Boolean).pop() || &quot;another ocean liner&quot;;

    const prefixes = new Set([
      &quot;ss&quot;, &quot;rms&quot;, &quot;ms&quot;, &quot;mv&quot;, &quot;hmhs&quot;, &quot;hms&quot;, &quot;rmmv&quot;, &quot;ts&quot;, &quot;tss&quot;, &quot;qsmv&quot;
    ]);

    const romanNumerals = new Set([
      &quot;i&quot;, &quot;ii&quot;, &quot;iii&quot;, &quot;iv&quot;, &quot;v&quot;, &quot;vi&quot;, &quot;vii&quot;, &quot;viii&quot;, &quot;ix&quot;, &quot;x&quot;
    ]);

    return file
      .split(&quot;-&quot;)
      .filter(Boolean)
      .map(function (word, index) {
        const lower = word.toLowerCase();

        if (prefixes.has(lower)) return lower.toUpperCase();
        if (romanNumerals.has(lower)) return lower.toUpperCase();
        if (/^\d{4}$/.test(lower)) return lower;

        if (
          index &gt; 0 &amp;&amp;
          [&quot;of&quot;, &quot;the&quot;, &quot;de&quot;, &quot;del&quot;, &quot;di&quot;, &quot;la&quot;, &quot;le&quot;, &quot;von&quot;, &quot;der&quot;].includes(lower)
        ) {
          return lower;
        }

        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(&quot; &quot;);
  }

  function getRandomArchiveShip() {
    const ships = Array.isArray(window.OLC_SHIP_URLS)
      ? window.OLC_SHIP_URLS
      : [];

    const currentPath = normalizePath(window.location.pathname);

    const eligible = ships
      .map(function (item) {
        if (typeof item === &quot;string&quot;) {
          return {
            href: item,
            label: shipNameFromURL(item)
          };
        }

        if (item &amp;&amp; typeof item === &quot;object&quot;) {
          const href = item.href || item.url || item.path || &quot;&quot;;
          const label =
            item.label ||
            item.title ||
            item.name ||
            shipNameFromURL(href);

          return { href: href, label: label };
        }

        return null;
      })
      .filter(function (item) {
        return (
          item &amp;&amp;
          item.href &amp;&amp;
          normalizePath(item.href) !== currentPath
        );
      });

    if (!eligible.length) return null;

    return eligible[Math.floor(Math.random() * eligible.length)];
  }

  function loadRandomShipData() {
    if (Array.isArray(window.OLC_SHIP_URLS) &amp;&amp; window.OLC_SHIP_URLS.length) {
      return Promise.resolve();
    }

    const existingScript = document.querySelector(
      &#x27;script[src*=&quot;/assets/random-ship.js&quot;]&#x27;
    );

    if (existingScript) {
      return new Promise(function (resolve, reject) {
        if (Array.isArray(window.OLC_SHIP_URLS) &amp;&amp; window.OLC_SHIP_URLS.length) {
          resolve();
          return;
        }

        existingScript.addEventListener(&quot;load&quot;, resolve, { once: true });
        existingScript.addEventListener(&quot;error&quot;, reject, { once: true });

        window.setTimeout(resolve, 3000);
      });
    }

    return new Promise(function (resolve, reject) {
      const script = document.createElement(&quot;script&quot;);
      script.src = &quot;/assets/random-ship.js&quot;;
      script.async = true;
      script.dataset.loadedBy = &quot;related-liners&quot;;
      script.addEventListener(&quot;load&quot;, resolve, { once: true });
      script.addEventListener(&quot;error&quot;, reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function populateRandomArchiveLink(box) {
    const link = box.querySelector(&quot;[data-random-archive-link]&quot;);
    if (!link) return;

    loadRandomShipData()
      .then(function () {
        const ship = getRandomArchiveShip();

        if (!ship) {
          throw new Error(&quot;No eligible ships were available.&quot;);
        }

        link.href = ship.href;
        link.textContent = ship.label;
        link.removeAttribute(&quot;aria-busy&quot;);
      })
      .catch(function (error) {
        console.warn(&quot;[related-liners] Random archive ship unavailable:&quot;, error);

        link.href = &quot;/ships/ships&quot;;
        link.textContent = &quot;the Ship Archive&quot;;
        link.removeAttribute(&quot;aria-busy&quot;);
      });
  }

  function injectHistoryContext() {
    if (document.getElementById(&quot;history-of-ocean-liners-context&quot;)) return;

    const box = document.createElement(&quot;section&quot;);
    box.id = &quot;history-of-ocean-liners-context&quot;;
    box.setAttribute(&quot;aria-label&quot;, &quot;Historical context and archive exploration&quot;);

    box.innerHTML = `
      &lt;h2&gt;Historical Context&lt;/h2&gt;
      &lt;p class=&quot;note&quot;&gt;
        This ship formed part of the broader ocean liner era. Explore the technological,
        social, and historical forces that shaped transoceanic travel.
      &lt;/p&gt;
      &lt;ul class=&quot;sources&quot;&gt;
        &lt;li&gt;&lt;a href=&quot;/history-of-ocean-liners&quot;&gt;Read &lt;em&gt;The History of Ocean Liners&lt;/em&gt; »&lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;

      &lt;h2&gt;From the Archives&lt;/h2&gt;
      &lt;p class=&quot;note&quot;&gt;
        Looking for another ship? Explore
        &lt;a
          href=&quot;/ships/ships&quot;
          data-random-archive-link
          aria-busy=&quot;true&quot;
        &gt;the Ship Archive&lt;/a&gt;.
      &lt;/p&gt;
    `;

    if (sourcesH2) {
      guide.insertBefore(box, sourcesH2);
    } else {
      guide.appendChild(box);
    }

    populateRandomArchiveLink(box);
  }

  injectHistoryContext();

  /* =========================
     Deterministic “cluster rotation” headings
  ========================= */
  const CLUSTER_HEADINGS = [
    &quot;Related Liners&quot;,
    &quot;Associated Liners&quot;,
    &quot;Related Ships&quot;,
    &quot;Connected Liners&quot;,
    &quot;In the Same Orbit&quot;,
    &quot;See Also&quot;
  ];

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i &lt; str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h &gt;&gt;&gt; 0;
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
      const path = (href || &quot;&quot;).split(&quot;?&quot;)[0].split(&quot;#&quot;)[0];
      const file = path.split(&quot;/&quot;).filter(Boolean).pop() || &quot;&quot;;
      return file.replace(/\.html?$/i, &quot;&quot;);
    } catch {
      return &quot;&quot;;
    }
  }

  function filterItemsForPage(items, pageSlug) {
    const list = Array.isArray(items) ? items : [];
    return list.filter((i) =&gt; hrefToSlug(i?.href) !== pageSlug);
  }

  function renderClusterHTML(clusterKey, pageSlug, def) {
    const heading = rotatedHeading(pageSlug, clusterKey);
    const items = filterItemsForPage(def.items, pageSlug);

    if (items.length &lt; (def.allowSingle ? 1 : 2)) return &quot;&quot;;

    const noteBits = [];
    if (def.noteStrong) noteBits.push(`&lt;strong&gt;${def.noteStrong}&lt;/strong&gt;`);
    if (def.note) noteBits.push(def.note);

    const noteHTML = noteBits.length
      ? `&lt;p class=&quot;note&quot;&gt;${noteBits.join(&quot; &quot;)}&lt;/p&gt;`
      : &quot;&quot;;

    return `
      &lt;section aria-label=&quot;${(def.ariaLabel || def.noteStrong || heading).replace(/&quot;/g, &quot;&amp;quot;&quot;)}&quot;&gt;
        &lt;h2&gt;${heading}&lt;/h2&gt;
        ${noteHTML}
        &lt;ul class=&quot;sources&quot;&gt;
          ${items
            .map(
              (i) =&gt;
                `&lt;li&gt;&lt;a href=&quot;${i.href}&quot;&gt;${i.label}&lt;/a&gt;${i.tail ? ` — ${i.tail}` : &quot;&quot;}&lt;/li&gt;`
            )
            .join(&quot;&quot;)}
        &lt;/ul&gt;
      &lt;/section&gt;
    `;
  }

  const cluster = (
  noteStrong,
  note,
  items,
  ariaLabel,
  allowSingle = false
) =&gt; ({
  noteStrong,
  note,
  items,
  ariaLabel,
  allowSingle
});

  /* =========================
     Clusters
  ========================= */
  const CLUSTERS = {
    imperator_class: cluster(
      &quot;Related Liners.&quot;,
      &quot;Hamburg America Line’s “Imperator-class” trio—later redistributed after World War I.&quot;,
      [
        { href: &quot;/ships/ss-imperator&quot;, label: &quot;SS &lt;em&gt;Imperator&lt;/em&gt;&quot;, tail: &quot;later Cunard’s &lt;em&gt;RMS Berengaria&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-vaterland&quot;, label: &quot;SS &lt;em&gt;Vaterland&lt;/em&gt;&quot;, tail: &quot;later United States Lines’ &lt;em&gt;SS Leviathan&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-bismarck-1914&quot;, label: &quot;SS &lt;em&gt;Bismarck&lt;/em&gt;&quot;, tail: &quot;completed as White Star’s &lt;em&gt;RMS Majestic&lt;/em&gt;&quot; }
      ],
      &quot;Imperator-class trio&quot;
    ),

    big_four: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star Line’s “Big Four”—capacity-first Atlantic liners.&quot;,
      [
        { href: &quot;/ships/rms-celtic&quot;, label: &quot;RMS &lt;em&gt;Celtic&lt;/em&gt;&quot;, tail: &quot;Big Four (1901)&quot; },
        { href: &quot;/ships/rms-cedric&quot;, label: &quot;RMS &lt;em&gt;Cedric&lt;/em&gt;&quot;, tail: &quot;Big Four (1903)&quot; },
        { href: &quot;/ships/rms-baltic&quot;, label: &quot;RMS &lt;em&gt;Baltic&lt;/em&gt;&quot;, tail: &quot;Big Four (1904)&quot; },
        { href: &quot;/ships/rms-adriatic&quot;, label: &quot;RMS &lt;em&gt;Adriatic&lt;/em&gt;&quot;, tail: &quot;Big Four (1907)&quot; }
      ],
      &quot;White Star Big Four&quot;
    ),

    olympic_class: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star Line’s Olympic-class liners and associated tenders.&quot;,
      [
        { href: &quot;/ships/rms-olympic&quot;, label: &quot;RMS &lt;em&gt;Olympic&lt;/em&gt;&quot;, tail: &quot;lead ship (1911)&quot; },
        { href: &quot;/ships/rms-titanic&quot;, label: &quot;RMS &lt;em&gt;Titanic&lt;/em&gt;&quot;, tail: &quot;sister ship (1912)&quot; },
        { href: &quot;/ships/rms-britannic&quot;, label: &quot;RMS/HMHS &lt;em&gt;Britannic&lt;/em&gt;&quot;, tail: &quot;third ship (1914)&quot; },
        { href: &quot;/ships/ss-nomadic&quot;, label: &quot;SS &lt;em&gt;Nomadic&lt;/em&gt;&quot;, tail: &quot;Cherbourg tender&quot; },
        { href: &quot;/ships/ss-traffic&quot;, label: &quot;SS &lt;em&gt;Traffic&lt;/em&gt;&quot;, tail: &quot;White Star tender&quot; }
      ],
      &quot;Olympic-class and tenders&quot;
    ),

    cunard_queens: cluster(
      &quot;Related Liners.&quot;,
      &quot;Cunard’s flagship “Queens,” spanning three generations of prestige service.&quot;,
      [
        { href: &quot;/ships/rms-queen-mary&quot;, label: &quot;RMS &lt;em&gt;Queen Mary&lt;/em&gt;&quot;, tail: &quot;entered service 1936&quot; },
        { href: &quot;/ships/rms-queen-elizabeth&quot;, label: &quot;RMS &lt;em&gt;Queen Elizabeth&lt;/em&gt;&quot;, tail: &quot;entered service 1940&quot; },
        { href: &quot;/ships/queen-elizabeth-2&quot;, label: &quot;RMS &lt;em&gt;Queen Elizabeth 2&lt;/em&gt;&quot;, tail: &quot;entered service 1969&quot; }
      ],
      &quot;Cunard Queens&quot;
    ),

    german_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;German express liners of the interwar era associated with renewed Atlantic prestige competition.&quot;,
      [
        { href: &quot;/ships/ss-bremen&quot;, label: &quot;SS &lt;em&gt;Bremen&lt;/em&gt;&quot;, tail: &quot;Norddeutscher Lloyd express liner (1929)&quot; },
        { href: &quot;/ships/ss-europa&quot;, label: &quot;SS &lt;em&gt;Europa&lt;/em&gt;&quot;, tail: &quot;sister ship (1930)&quot; }
      ],
      &quot;Interwar German express pair&quot;
    ),

    usl_flagships: cluster(
      &quot;Related Liners.&quot;,
      &quot;United States Lines liners associated with the company’s flagship transatlantic service.&quot;,
      [
        { href: &quot;/ships/ss-leviathan&quot;, label: &quot;SS &lt;em&gt;Leviathan&lt;/em&gt;&quot;, tail: &quot;former HAPAG &lt;em&gt;Vaterland&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-manhattan&quot;, label: &quot;SS &lt;em&gt;Manhattan&lt;/em&gt;&quot;, tail: &quot;entered service 1932&quot; },
        { href: &quot;/ships/ss-us&quot;, label: &quot;SS &lt;em&gt;United States&lt;/em&gt;&quot;, tail: &quot;entered service 1952&quot; }
      ],
      &quot;United States Lines flagships&quot;
    ),

    greyhounds: cluster(
      &quot;Related Liners.&quot;,
      &quot;Speed-prestige “express” liners often framed as national or company statements (terminology varies by era and source).&quot;,
      [
        { href: &quot;/ships/rms-lusitania&quot;, label: &quot;RMS &lt;em&gt;Lusitania&lt;/em&gt;&quot;, tail: &quot;Cunard’s early-1900s greyhound era&quot; },
        { href: &quot;/ships/rms-mauretania&quot;, label: &quot;RMS &lt;em&gt;Mauretania&lt;/em&gt;&quot;, tail: &quot;long-running speed/reliability reputation&quot; },
        { href: &quot;/ships/ss-kaiser-wilhelm-der-grosse&quot;, label: &quot;SS &lt;em&gt;Kaiser Wilhelm der Grosse&lt;/em&gt;&quot;, tail: &quot;four-funnel German express moment&quot; },
        { href: &quot;/ships/ss-deutschland&quot;, label: &quot;SS &lt;em&gt;Deutschland&lt;/em&gt;&quot;, tail: &quot;HAPAG express-era four-funnel statement&quot; },
        { href: &quot;/ships/ss-bremen&quot;, label: &quot;SS &lt;em&gt;Bremen&lt;/em&gt;&quot;, tail: &quot;interwar German headline ship&quot; },
        { href: &quot;/ships/ss-europa&quot;, label: &quot;SS &lt;em&gt;Europa&lt;/em&gt;&quot;, tail: &quot;interwar sister/rival narrative pair&quot; }
      ],
      &quot;Express liners and greyhounds&quot;
    ),

    italian_prestige_pair: cluster(
      &quot;Italian Line Atlantic liners.&quot;,
      &quot;A group of notable Italian Line ships spanning the late 1920s and early 1930s, representing Italy’s renewed presence in North Atlantic passenger service.&quot;,
      [
        { href: &quot;/ships/ms-saturnia&quot;, label: &quot;MS &lt;em&gt;Saturnia&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1927&quot; },
        { href: &quot;/ships/ms-vulcania&quot;, label: &quot;MS &lt;em&gt;Vulcania&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1928&quot; },
        { href: &quot;/ships/ss-rex&quot;, label: &quot;SS &lt;em&gt;Rex&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1932&quot; },
        { href: &quot;/ships/ss-conte-di-savoia&quot;, label: &quot;SS &lt;em&gt;Conte di Savoia&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1932&quot; }
      ],
      &quot;Italian Line Atlantic liners&quot;
    ),

    white_star_victorian_duo: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star Line’s late-Victorian running mates—built by Harland &amp;amp; Wolff and often paired in period discussion.&quot;,
      [
        { href: &quot;/ships/rms-teutonic&quot;, label: &quot;RMS &lt;em&gt;Teutonic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1889&quot; },
        { href: &quot;/ships/ss-majestic-1889&quot;, label: &quot;SS &lt;em&gt;Majestic&lt;/em&gt; (1889)&quot;, tail: &quot;White Star Line · 1889&quot; }
      ],
      &quot;White Star late-Victorian duo&quot;
    ),

    campania_lucania: cluster(
      &quot;Related Liners.&quot;,
      &quot;Cunard’s paired 1890s express liners—often treated together in sources and collecting context.&quot;,
      [
        { href: &quot;/ships/rms-campania&quot;, label: &quot;RMS &lt;em&gt;Campania&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1893&quot; },
        { href: &quot;/ships/rms-lucania&quot;, label: &quot;RMS &lt;em&gt;Lucania&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1893&quot; }
      ],
      &quot;Campania and Lucania&quot;
    ),

    manhattan_washington: cluster(
      &quot;Related Liners.&quot;,
      &quot;United States Lines’ Manhattan-class sisters (often paired in company material and schedules).&quot;,
      [
        { href: &quot;/ships/ss-manhattan&quot;, label: &quot;SS &lt;em&gt;Manhattan&lt;/em&gt;&quot;, tail: &quot;United States Lines · 1932&quot; },
        { href: &quot;/ships/ss-washington&quot;, label: &quot;SS &lt;em&gt;Washington&lt;/em&gt;&quot;, tail: &quot;United States Lines · 1933&quot; }
      ],
      &quot;Manhattan-class sisters&quot;
    ),

    michelangelo_raffaello: cluster(
      &quot;Related Liners.&quot;,
      &quot;Italian Line’s late superliner duo—frequently discussed together in design, technology, and decline-era context.&quot;,
      [
        { href: &quot;/ships/ss-michelangelo-1965&quot;, label: &quot;SS &lt;em&gt;Michelangelo&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1965&quot; },
        { href: &quot;/ships/ss-raffaello-1965&quot;, label: &quot;SS &lt;em&gt;Raffaello&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1965&quot; }
      ],
      &quot;Michelangelo and Raffaello&quot;
    ),

    britannic_georgic: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star Line’s interwar running mates on the Liverpool–New York service.&quot;,
      [
        { href: &quot;/ships/mv-britannic&quot;, label: &quot;MV &lt;em&gt;Britannic&lt;/em&gt; (1930)&quot;, tail: &quot;White Star Line · 1930&quot; },
        { href: &quot;/ships/mv-georgic&quot;, label: &quot;MV &lt;em&gt;Georgic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1932&quot; }
      ],
      &quot;Britannic and Georgic&quot;
    ),

    interwar_prestige: cluster(
      &quot;Interwar Atlantic prestige liners.&quot;,
      &quot;Several European liners of the early 1930s became symbols of national prestige and technological ambition during renewed North Atlantic competition.&quot;,
      [
        { href: &quot;/ships/ss-normandie&quot;, label: &quot;SS &lt;em&gt;Normandie&lt;/em&gt;&quot;, tail: &quot;French Line · 1935&quot; },
        { href: &quot;/ships/ss-rex&quot;, label: &quot;SS &lt;em&gt;Rex&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1932&quot; },
        { href: &quot;/ships/ss-conte-di-savoia&quot;, label: &quot;SS &lt;em&gt;Conte di Savoia&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1932&quot; },
        { href: &quot;/ships/ss-bremen&quot;, label: &quot;SS &lt;em&gt;Bremen&lt;/em&gt;&quot;, tail: &quot;Norddeutscher Lloyd · 1929&quot; },
        { href: &quot;/ships/ss-europa&quot;, label: &quot;SS &lt;em&gt;Europa&lt;/em&gt;&quot;, tail: &quot;Norddeutscher Lloyd · 1930&quot; }
      ],
      &quot;Interwar Atlantic prestige liners&quot;
    ),

    french_line_atlantic: cluster(
      &quot;French Line Atlantic Liners.&quot;,
      &quot;A through-line of French Atlantic prestige: prewar luxury, Art Deco influence, and postwar superliner scale.&quot;,
      [
        { href: &quot;/ships/ss-france-1912&quot;, label: &quot;SS &lt;em&gt;France&lt;/em&gt; (1912)&quot; },
        { href: &quot;/ships/ss-ile-de-france&quot;, label: &quot;SS &lt;em&gt;Île de France&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-normandie&quot;, label: &quot;SS &lt;em&gt;Normandie&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-france&quot;, label: &quot;SS &lt;em&gt;France&lt;/em&gt; (1962)&quot; }
      ],
      &quot;French Line Atlantic Liners&quot;
    ),

    saxonia_class: cluster(
      &quot;Related Liners.&quot;,
      &quot;Cunard’s postwar Saxonia-class quartet—mid-sized liners built primarily around Canadian service and later cruising flexibility.&quot;,
      [
        { href: &quot;/ships/rms-saxonia&quot;, label: &quot;RMS &lt;em&gt;Saxonia&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1954&quot; },
        { href: &quot;/ships/rms-ivernia&quot;, label: &quot;RMS &lt;em&gt;Ivernia&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1955&quot; },
        { href: &quot;/ships/rms-carinthia&quot;, label: &quot;RMS &lt;em&gt;Carinthia&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1956&quot; },
        { href: &quot;/ships/rms-sylvania&quot;, label: &quot;RMS &lt;em&gt;Sylvania&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1957&quot; }
      ],
      &quot;Cunard Saxonia-class liners&quot;
    ),

    kaiser_class: cluster(
      &quot;Related Liners.&quot;,
      &quot;Norddeutscher Lloyd’s Kaiser-class express liners—the famous German four-funnel prestige group before the First World War.&quot;,
      [
        { href: &quot;/ships/ss-kaiser-wilhelm-der-grosse&quot;, label: &quot;SS &lt;em&gt;Kaiser Wilhelm der Grosse&lt;/em&gt;&quot;, tail: &quot;entered service 1897&quot; },
        { href: &quot;/ships/ss-kronprinz-wilhelm&quot;, label: &quot;SS &lt;em&gt;Kronprinz Wilhelm&lt;/em&gt;&quot;, tail: &quot;entered service 1901&quot; },
        { href: &quot;/ships/ss-kaiser-wilhelm-ii&quot;, label: &quot;SS &lt;em&gt;Kaiser Wilhelm II&lt;/em&gt;&quot;, tail: &quot;entered service 1903&quot; },
        { href: &quot;/ships/ss-kronprinzessin-cecilie&quot;, label: &quot;SS &lt;em&gt;Kronprinzessin Cecilie&lt;/em&gt;&quot;, tail: &quot;entered service 1907&quot; }
      ],
      &quot;Kaiser-class liners&quot;
    ),

    white_star_motor_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star’s interwar motor-ship pair—important late-company running mates and among the line’s last major new liners.&quot;,
      [
        { href: &quot;/ships/mv-britannic&quot;, label: &quot;MV &lt;em&gt;Britannic&lt;/em&gt; (1930)&quot;, tail: &quot;motor liner&quot; },
        { href: &quot;/ships/mv-georgic&quot;, label: &quot;MV &lt;em&gt;Georgic&lt;/em&gt;&quot;, tail: &quot;motor liner&quot; }
      ],
      &quot;White Star motor pair&quot;
    ),

    matson_white_ships: cluster(
      &quot;Related Liners.&quot;,
      &quot;Matson’s interwar Pacific passenger group—ships closely tied to the line’s luxury Hawaii and South Pacific identity.&quot;,
      [
        { href: &quot;/ships/ss-lurline-1932&quot;, label: &quot;SS &lt;em&gt;Lurline&lt;/em&gt;&quot;, tail: &quot;Matson Line · 1932&quot; },
        { href: &quot;/ships/ss-mariposa&quot;, label: &quot;SS &lt;em&gt;Mariposa&lt;/em&gt;&quot;, tail: &quot;Matson Lines · 1932&quot; },
        { href: &quot;/ships/ss-monterey&quot;, label: &quot;SS &lt;em&gt;Monterey&lt;/em&gt;&quot;, tail: &quot;Matson Lines · 1932&quot; }
      ],
      &quot;Matson Pacific liners&quot;
    ),

    nyk_pacific_trio: cluster(
      &quot;Related Liners.&quot;,
      &quot;NYK’s premier interwar Pacific liners associated with the high-profile trans-Pacific route between Japan, Hawaii, and the U.S. West Coast.&quot;,
      [
        { href: &quot;/ships/asama-maru-1929&quot;, label: &quot;Asama Maru&quot;, tail: &quot;NYK Line · 1929&quot; },
        { href: &quot;/ships/tatsuta-maru-1929&quot;, label: &quot;Tatsuta Maru&quot;, tail: &quot;NYK Line · 1929&quot; },
        { href: &quot;/ships/nyk-hikawa-maru&quot;, label: &quot;Hikawa Maru&quot;, tail: &quot;NYK Line · 1930&quot; }
      ],
      &quot;NYK Pacific liners&quot;
    ),

    swedish_american_diesel: cluster(
      &quot;Related Liners.&quot;,
      &quot;Swedish American Line ships often noted in discussions of diesel propulsion, Scandinavian Atlantic style, and mid-century continuity.&quot;,
      [
        { href: &quot;/ships/ms-gripsholm-1925&quot;, label: &quot;MS &lt;em&gt;Gripsholm&lt;/em&gt;&quot;, tail: &quot;entered service 1925&quot; },
        { href: &quot;/ships/ms-kungsholm-1928&quot;, label: &quot;MS &lt;em&gt;Kungsholm&lt;/em&gt;&quot;, tail: &quot;entered service 1928&quot; },
        { href: &quot;/ships/ms-stockholm&quot;, label: &quot;MS &lt;em&gt;Stockholm&lt;/em&gt;&quot;, tail: &quot;entered service 1946&quot; }
      ],
      &quot;Swedish American Line ships&quot;
    ),

    holland_america_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;Holland America Line ships associated with interwar rebuilding, long-haul Atlantic service, and the line’s evolving flagship profile.&quot;,
      [
        { href: &quot;/ships/ss-veendam&quot;, label: &quot;SS &lt;em&gt;Veendam&lt;/em&gt;&quot;, tail: &quot;Holland America Line · 1923&quot; },
        { href: &quot;/ships/ss-volendam&quot;, label: &quot;SS &lt;em&gt;Volendam&lt;/em&gt;&quot;, tail: &quot;Holland America Line · 1922&quot; },
        { href: &quot;/ships/ss-statendam-1929&quot;, label: &quot;SS &lt;em&gt;Statendam&lt;/em&gt;&quot;, tail: &quot;Holland America Line · 1929&quot; },
        { href: &quot;/ships/ss-nieuw-amsterdam&quot;, label: &quot;SS &lt;em&gt;Nieuw Amsterdam&lt;/em&gt;&quot;, tail: &quot;Holland America Line · 1937&quot; }
      ],
      &quot;Holland America interwar liners&quot;
    ),

    rotterdam_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;Two major Holland America flagships carrying the Rotterdam name in very different eras of liner history.&quot;,
      [
        { href: &quot;/ships/ss-rotterdam-1908&quot;, label: &quot;SS &lt;em&gt;Rotterdam&lt;/em&gt; (1908)&quot;, tail: &quot;prewar flagship&quot; },
        { href: &quot;/ships/ss-rotterdam-1959&quot;, label: &quot;SS &lt;em&gt;Rotterdam&lt;/em&gt; (1959)&quot;, tail: &quot;late-era flagship&quot; }
      ],
      &quot;Rotterdam pair&quot;
    ),

    anchor_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;Anchor Line’s interwar and postwar-replacement passenger ships—solid working liners rather than record-breakers.&quot;,
      [
        { href: &quot;/ships/rms-cameronia&quot;, label: &quot;RMS &lt;em&gt;Cameronia&lt;/em&gt;&quot;, tail: &quot;Anchor Line · 1921&quot; },
        { href: &quot;/ships/rms-caledonia&quot;, label: &quot;RMS &lt;em&gt;Caledonia&lt;/em&gt;&quot;, tail: &quot;Anchor Line · 1925&quot; },
        { href: &quot;/ships/rms-lancastria&quot;, label: &quot;RMS &lt;em&gt;Lancastria&lt;/em&gt;&quot;, tail: &quot;Anchor Line · 1920&quot; },
        { href: &quot;/ships/rms-transylvania&quot;, label: &quot;RMS &lt;em&gt;Transylvania&lt;/em&gt;&quot;, tail: &quot;Anchor Line · 1925&quot; },
        { href: &quot;/ships/ss-tuscania-1921&quot;, label: &quot;SS &lt;em&gt;Tuscania&lt;/em&gt;&quot;, tail: &quot;Anchor Line · 1921&quot; }
      ],
      &quot;Anchor Line interwar liners&quot;
    ),

    french_line_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;French Line ships spanning the ambitious interwar Atlantic period—prestige, Art Deco styling, and varying scales of service.&quot;,
      [
        { href: &quot;/ships/ss-champlain&quot;, label: &quot;SS &lt;em&gt;Champlain&lt;/em&gt;&quot;, tail: &quot;French Line · 1932&quot; },
        { href: &quot;/ships/ss-paris&quot;, label: &quot;SS &lt;em&gt;Paris&lt;/em&gt;&quot;, tail: &quot;French Line · 1921&quot; },
        { href: &quot;/ships/ss-ile-de-france&quot;, label: &quot;SS &lt;em&gt;Île de France&lt;/em&gt;&quot;, tail: &quot;French Line · 1927&quot; },
        { href: &quot;/ships/ss-normandie&quot;, label: &quot;SS &lt;em&gt;Normandie&lt;/em&gt;&quot;, tail: &quot;French Line · 1935&quot; }
      ],
      &quot;French Line interwar liners&quot;
    ),

    sud_atlantique_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;French South Atlantic liners associated with prestige service between France and South America.&quot;,
      [
        { href: &quot;/ships/ss-latlantique&quot;, label: &quot;SS &lt;em&gt;L’Atlantique&lt;/em&gt;&quot;, tail: &quot;1931&quot; },
        { href: &quot;/ships/ss-pasteur&quot;, label: &quot;SS &lt;em&gt;Pasteur&lt;/em&gt;&quot;, tail: &quot;1939&quot; }
      ],
      &quot;Compagnie de Navigation Sud-Atlantique liners&quot;
    ),

    italian_ngi_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;A paired Italian program of the 1920s—large modern liners associated with the Rome/Augustus design moment.&quot;,
      [
        { href: &quot;/ships/ms-augustus&quot;, label: &quot;MS &lt;em&gt;Augustus&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1927&quot; },
        { href: &quot;/ships/ss-roma&quot;, label: &quot;SS &lt;em&gt;Roma&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1926&quot; }
      ],
      &quot;Augustus and Roma&quot;
    ),

    italian_south_america: cluster(
      &quot;Related Liners.&quot;,
      &quot;Italian liners strongly associated with South American emigrant and passenger routes.&quot;,
      [
        { href: &quot;/ships/ss-principessa-mafalda&quot;, label: &quot;SS &lt;em&gt;Principessa Mafalda&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1909&quot; },
        { href: &quot;/ships/ss-giulio-cesare&quot;, label: &quot;SS &lt;em&gt;Giulio Cesare&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1922&quot; },
        { href: &quot;/ships/ss-duilio&quot;, label: &quot;SS &lt;em&gt;Duilio&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1922&quot; }
      ],
      &quot;Italian South America route liners&quot;
    ),

    empress_pacific: cluster(
      &quot;Related Liners.&quot;,
      &quot;Canadian Pacific’s Empress ships associated especially with Pacific and trans-Pacific service.&quot;,
      [
        { href: &quot;/ships/rms-empress-of-australia&quot;, label: &quot;RMS &lt;em&gt;Empress of Australia&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1922&quot; },
        { href: &quot;/ships/rms-empress-of-japan-1929&quot;, label: &quot;RMS &lt;em&gt;Empress of Japan&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1929&quot; },
        { href: &quot;/ships/rms-empress-of-russia&quot;, label: &quot;RMS &lt;em&gt;Empress of Russia&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1913&quot; }
      ],
      &quot;Canadian Pacific Empress Pacific liners&quot;
    ),

    empress_canada_atlantic: cluster(
      &quot;Related Liners.&quot;,
      &quot;Canadian Pacific liners closely tied to the Atlantic and Canadian route story.&quot;,
      [
        { href: &quot;/ships/rms-empress-of-ireland&quot;, label: &quot;RMS &lt;em&gt;Empress of Ireland&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1906&quot; },
        { href: &quot;/ships/rms-empress-of-britain&quot;, label: &quot;RMS &lt;em&gt;Empress of Britain&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1930&quot; }
      ],
      &quot;Canadian Pacific Atlantic Empress liners&quot;
    ),

    bermuda_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;Furness Bermuda Line’s paired New York–Bermuda flagships—closely linked in route identity and collecting context.&quot;,
      [
        { href: &quot;/ships/monarch-of-bermuda&quot;, label: &quot;Monarch of Bermuda&quot;, tail: &quot;1931&quot; },
        { href: &quot;/ships/ss-queen-of-bermuda&quot;, label: &quot;SS &lt;em&gt;Queen of Bermuda&lt;/em&gt;&quot;, tail: &quot;1933&quot; }
      ],
      &quot;Furness Bermuda pair&quot;
    ),

    white_star_1870s: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star’s early post-Oceanic generation in the 1870s—important for the line’s growing prestige before the later express era.&quot;,
      [
        { href: &quot;/ships/ss-atlantic-1873&quot;, label: &quot;RMS &lt;em&gt;Atlantic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1873&quot; },
        { href: &quot;/ships/rms-britannic-1874&quot;, label: &quot;RMS &lt;em&gt;Britannic&lt;/em&gt; (1874)&quot;, tail: &quot;White Star Line · 1874&quot; },
        { href: &quot;/ships/ss-germanic&quot;, label: &quot;SS &lt;em&gt;Germanic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1874&quot; }
      ],
      &quot;White Star 1870s liners&quot;
    ),

    white_star_canadian_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star’s Megantic/Laurentic pair—closely linked in design comparison and Canadian-service discussion.&quot;,
      [
        { href: &quot;/ships/rms-laurentic&quot;, label: &quot;RMS &lt;em&gt;Laurentic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1909&quot; },
        { href: &quot;/ships/rms-megantic-1909&quot;, label: &quot;RMS &lt;em&gt;Megantic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1909&quot; }
      ],
      &quot;Laurentic and Megantic&quot;
    ),

    cunard_1880s_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;Cunard’s paired mid-1880s express liners—major ships of the pre-Campania/Lucania era.&quot;,
      [
        { href: &quot;/ships/rms-etruria-1884&quot;, label: &quot;RMS &lt;em&gt;Etruria&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1884&quot; },
        { href: &quot;/ships/rms-umbria-1884&quot;, label: &quot;RMS &lt;em&gt;Umbria&lt;/em&gt;&quot;, tail: &quot;Cunard Line · 1884&quot; }
      ],
      &quot;Etruria and Umbria&quot;
    ),

    cunard_franconia_pair: cluster(
      &quot;Related Liners.&quot;,
      &quot;Two Cunard ships carrying the Franconia name in very different service contexts and eras.&quot;,
      [
        { href: &quot;/ships/rms-franconia-1910&quot;, label: &quot;RMS &lt;em&gt;Franconia&lt;/em&gt; (1910)&quot;, tail: &quot;Cunard Line · 1910&quot; },
        { href: &quot;/ships/rms-franconia&quot;, label: &quot;RMS &lt;em&gt;Franconia&lt;/em&gt; (1923)&quot;, tail: &quot;Cunard Line · 1923&quot; }
      ],
      &quot;Franconia pair&quot;
    ),

    union_castle_pair_1921: cluster(
      &quot;Related Liners.&quot;,
      &quot;Union-Castle liners associated with the Cape Mail story and the postwar continuation of long-distance South Africa service.&quot;,
      [
        { href: &quot;/ships/rms-arundel-castle-1921&quot;, label: &quot;RMS &lt;em&gt;Arundel Castle&lt;/em&gt;&quot;, tail: &quot;Union-Castle Line · 1921&quot; },
        { href: &quot;/ships/rms-windsor-castle-1921&quot;, label: &quot;RMS &lt;em&gt;Windsor Castle&lt;/em&gt; (1921)&quot;, tail: &quot;Union-Castle Line · 1921&quot; }
      ],
      &quot;Union-Castle 1921 liners&quot;
    ),

    pando_flagships: cluster(
      &quot;Related Liners.&quot;,
      &quot;P&amp;amp;O ships representing different scales of the line’s imperial and long-distance passenger service.&quot;,
      [
        { href: &quot;/ships/rms-moldavia&quot;, label: &quot;RMS &lt;em&gt;Moldavia&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1903&quot; },
        { href: &quot;/ships/rms-strathnaver&quot;, label: &quot;RMS &lt;em&gt;Strathnaver&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1931&quot; },
        { href: &quot;/ships/rms-viceroy-of-india&quot;, label: &quot;RMS &lt;em&gt;Viceroy of India&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1929&quot; },
        { href: &quot;/ships/ss-canberra&quot;, label: &quot;SS &lt;em&gt;Canberra&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1961&quot; }
      ],
      &quot;P&amp;O liners&quot;
    ),

    red_star_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;Red Star Line ships tied to the line’s interwar and IMM-era Atlantic identity.&quot;,
      [
        { href: &quot;/ships/ss-belgenland&quot;, label: &quot;SS &lt;em&gt;Belgenland&lt;/em&gt;&quot;, tail: &quot;Red Star Line · 1923&quot; },
        { href: &quot;/ships/ss-pennland&quot;, label: &quot;SS &lt;em&gt;Pennland&lt;/em&gt;&quot;, tail: &quot;Red Star Line · 1922&quot; },
        { href: &quot;/ships/ss-westernland-red-star&quot;, label: &quot;SS &lt;em&gt;Westernland&lt;/em&gt;&quot;, tail: &quot;Red Star Line · 1929&quot; }
      ],
      &quot;Red Star interwar liners&quot;
    ),

    berlin_arabic_republic: cluster(
      &quot;Related Liners.&quot;,
      &quot;A linked identity trail involving German origins, transfer, and later postwar Anglo-American service under different names.&quot;,
      [
        { href: &quot;/ships/ss-berlin-1909&quot;, label: &quot;SS &lt;em&gt;Berlin&lt;/em&gt; (1909)&quot;, tail: &quot;later White Star’s &lt;em&gt;Arabic&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-arabic-1920&quot;, label: &quot;SS &lt;em&gt;Arabic&lt;/em&gt;&quot;, tail: &quot;ex-&lt;em&gt;Berlin&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-republic&quot;, label: &quot;SS &lt;em&gt;Republic&lt;/em&gt;&quot;, tail: &quot;ex-HAPAG &lt;em&gt;President Grant&lt;/em&gt;, later USL&quot; }
      ],
      &quot;Berlin/Arabic/Republic identity chain&quot;
    ),

    reliance_resolute: cluster(
      &quot;Related Liners.&quot;,
      &quot;A paired interwar cruise-and-transatlantic discussion set—often treated together in later HAPAG service history.&quot;,
      [
        { href: &quot;/ships/ss-reliance&quot;, label: &quot;SS &lt;em&gt;Reliance&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1914&quot; },
        { href: &quot;/ships/ss-resolute&quot;, label: &quot;SS &lt;em&gt;Resolute&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1914&quot; }
      ],
      &quot;Reliance and Resolute&quot;
    ),

    white_star_oceanic_family: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star Line ships associated with the company’s pre-Olympic Atlantic development—large liners that bridged the gap between the Victorian era and the Olympic-class generation.&quot;,
      [
        { href: &quot;/ships/rms-oceanic&quot;, label: &quot;RMS &lt;em&gt;Oceanic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1899&quot; },
        { href: &quot;/ships/ss-cymric&quot;, label: &quot;SS &lt;em&gt;Cymric&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1898&quot; },
        { href: &quot;/ships/ss-republic-1903&quot;, label: &quot;SS &lt;em&gt;Republic&lt;/em&gt; (1903)&quot;, tail: &quot;White Star Line · 1903&quot; },
        { href: &quot;/ships/rms-laurentic&quot;, label: &quot;RMS &lt;em&gt;Laurentic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1909&quot; },
        { href: &quot;/ships/rms-megantic-1909&quot;, label: &quot;RMS &lt;em&gt;Megantic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1909&quot; }
      ],
      &quot;White Star pre-Olympic Atlantic liners&quot;
    ),

    hapag_atlantic: cluster(
      &quot;Related Liners.&quot;,
      &quot;Major Hamburg America Line ships associated with the company’s Atlantic presence across the late imperial and interwar eras.&quot;,
      [
        { href: &quot;/ships/ss-amerika&quot;, label: &quot;SS &lt;em&gt;Amerika&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1905&quot; },
        { href: &quot;/ships/ss-deutschland&quot;, label: &quot;SS &lt;em&gt;Deutschland&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1900&quot; },
        { href: &quot;/ships/ss-george-washington&quot;, label: &quot;SS &lt;em&gt;George Washington&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1909&quot; },
        { href: &quot;/ships/ss-reliance&quot;, label: &quot;SS &lt;em&gt;Reliance&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1914&quot; },
        { href: &quot;/ships/ss-resolute&quot;, label: &quot;SS &lt;em&gt;Resolute&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1914&quot; },
        { href: &quot;/ships/ss-hamburg-1925&quot;, label: &quot;SS &lt;em&gt;Hamburg&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1925&quot; }
      ],
      &quot;Hamburg America Line Atlantic liners&quot;
    ),

    white_star_jubilee: cluster(
      &quot;Related Liners.&quot;,
      &quot;White Star Line’s Jubilee-class group and close running mates associated especially with the Australian trade and the line’s late-19th-century expansion beyond the North Atlantic.&quot;,
      [
        { href: &quot;/ships/ss-runic&quot;, label: &quot;SS &lt;em&gt;Runic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1900&quot; },
        { href: &quot;/ships/ss-medic&quot;, label: &quot;SS &lt;em&gt;Medic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1898&quot; },
        { href: &quot;/ships/ss-persic&quot;, label: &quot;SS &lt;em&gt;Persic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1899&quot; },
        { href: &quot;/ships/ss-afric&quot;, label: &quot;SS &lt;em&gt;Afric&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1899&quot; },
        { href: &quot;/ships/ss-romanic&quot;, label: &quot;SS &lt;em&gt;Romanic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1898&quot; },
        { href: &quot;/ships/ss-suevic&quot;, label: &quot;SS &lt;em&gt;Suevic&lt;/em&gt;&quot;, tail: &quot;White Star Line · 1901&quot; }
      ],
      &quot;White Star Jubilee-class and Australian-service liners&quot;
    ),

    french_line_prewar: cluster(
      &quot;Related Liners.&quot;,
      &quot;French liners tracing the line from Belle Époque prestige into the interwar Atlantic luxury tradition.&quot;,
      [
        { href: &quot;/ships/ss-la-provence&quot;, label: &quot;SS &lt;em&gt;La Provence&lt;/em&gt;&quot;, tail: &quot;French Line · 1906&quot; },
        { href: &quot;/ships/ss-france-1912&quot;, label: &quot;SS &lt;em&gt;France&lt;/em&gt; (1912)&quot;, tail: &quot;French Line · 1912&quot; },
        { href: &quot;/ships/ss-paris&quot;, label: &quot;SS &lt;em&gt;Paris&lt;/em&gt;&quot;, tail: &quot;French Line · 1921&quot; },
        { href: &quot;/ships/ss-ile-de-france&quot;, label: &quot;SS &lt;em&gt;Île de France&lt;/em&gt;&quot;, tail: &quot;French Line · 1927&quot; },
        { href: &quot;/ships/ss-de-grasse&quot;, label: &quot;SS &lt;em&gt;De Grasse&lt;/em&gt;&quot;, tail: &quot;French Line · 1924&quot; },
        { href: &quot;/ships/ss-bretagne&quot;, label: &quot;SS &lt;em&gt;Bretagne&lt;/em&gt;&quot;, tail: &quot;French Line · 1912&quot; }
      ],
      &quot;French Line prewar and interwar liners&quot;
    ),

    italian_broad_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;Italian liners associated with the merger-era and interwar rebuilding of Italy’s long-distance passenger fleet.&quot;,
      [
        { href: &quot;/ships/ss-conte-grande&quot;, label: &quot;SS &lt;em&gt;Conte Grande&lt;/em&gt;&quot;, tail: &quot;Lloyd Sabaudo / Italian Line · 1928&quot; },
        { href: &quot;/ships/ss-conte-rosso&quot;, label: &quot;SS &lt;em&gt;Conte Rosso&lt;/em&gt;&quot;, tail: &quot;Lloyd Sabaudo · 1921&quot; },
        { href: &quot;/ships/ss-roma&quot;, label: &quot;SS &lt;em&gt;Roma&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1926&quot; },
        { href: &quot;/ships/ms-augustus&quot;, label: &quot;MS &lt;em&gt;Augustus&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1927&quot; },
        { href: &quot;/ships/ms-saturnia&quot;, label: &quot;MS &lt;em&gt;Saturnia&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1927&quot; },
        { href: &quot;/ships/ms-vulcania&quot;, label: &quot;MS &lt;em&gt;Vulcania&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1928&quot; },
        { href: &quot;/ships/ss-giulio-cesare&quot;, label: &quot;SS &lt;em&gt;Giulio Cesare&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1922&quot; },
        { href: &quot;/ships/ss-duilio&quot;, label: &quot;SS &lt;em&gt;Duilio&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1922&quot; }
      ],
      &quot;Italian interwar liners&quot;
    ),

    italian_prestige_late: cluster(
      &quot;Related Liners.&quot;,
      &quot;Italian prestige liners of the interwar and late-superliner eras—ships often discussed as statements of national style and ambition.&quot;,
      [
        { href: &quot;/ships/ss-rex&quot;, label: &quot;SS &lt;em&gt;Rex&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1932&quot; },
        { href: &quot;/ships/ss-conte-di-savoia&quot;, label: &quot;SS &lt;em&gt;Conte di Savoia&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1932&quot; },
        { href: &quot;/ships/ss-michelangelo-1965&quot;, label: &quot;SS &lt;em&gt;Michelangelo&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1965&quot; },
        { href: &quot;/ships/ss-raffaello-1965&quot;, label: &quot;SS &lt;em&gt;Raffaello&lt;/em&gt;&quot;, tail: &quot;Italian Line · 1965&quot; }
      ],
      &quot;Italian prestige liners across eras&quot;
    ),

    duchess_quartet: cluster(
      &quot;Related Liners.&quot;,
      &quot;Canadian Pacific’s interwar “Duchess” quartet—large Britain–Canada cabin liners often treated together in fleet history.&quot;,
      [
        { href: &quot;/ships/ss-duchess-of-bedford&quot;, label: &quot;SS &lt;em&gt;Duchess of Bedford&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1928&quot; },
        { href: &quot;/ships/ss-duchess-of-richmond&quot;, label: &quot;SS &lt;em&gt;Duchess of Richmond&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1928&quot; },
        { href: &quot;/ships/ss-duchess-of-york&quot;, label: &quot;SS &lt;em&gt;Duchess of York&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1929&quot; },
        { href: &quot;/ships/ss-duchess-of-atholl&quot;, label: &quot;SS &lt;em&gt;Duchess of Atholl&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1928&quot; }
      ],
      &quot;Canadian Pacific Duchess quartet&quot;
    ),

    canadian_pacific_atlantic_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;Canadian Pacific Atlantic liners of the interwar era—ships tied to Britain–Canada service, prestige, and wartime transformation.&quot;,
      [
        { href: &quot;/ships/ss-duchess-of-bedford&quot;, label: &quot;SS &lt;em&gt;Duchess of Bedford&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1928&quot; },
        { href: &quot;/ships/ss-duchess-of-richmond&quot;, label: &quot;SS &lt;em&gt;Duchess of Richmond&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1928&quot; },
        { href: &quot;/ships/ss-duchess-of-york&quot;, label: &quot;SS &lt;em&gt;Duchess of York&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1929&quot; },
        { href: &quot;/ships/ss-duchess-of-atholl&quot;, label: &quot;SS &lt;em&gt;Duchess of Atholl&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1928&quot; },
        { href: &quot;/ships/rms-empress-of-britain&quot;, label: &quot;RMS &lt;em&gt;Empress of Britain&lt;/em&gt;&quot;, tail: &quot;Canadian Pacific · 1931&quot; }
      ],
      &quot;Canadian Pacific interwar Atlantic liners&quot;
    ),

    orient_interwar: cluster(
      &quot;Related Liners.&quot;,
      &quot;Orient Line ships associated with the interwar England–Australia service and the line’s modernized passenger fleet.&quot;,
      [
        { href: &quot;/ships/ss-orion&quot;, label: &quot;SS &lt;em&gt;Orion&lt;/em&gt;&quot;, tail: &quot;Orient Line · 1935&quot; },
        { href: &quot;/ships/ss-orontes&quot;, label: &quot;SS &lt;em&gt;Orontes&lt;/em&gt;&quot;, tail: &quot;Orient Line · 1929&quot; },
        { href: &quot;/ships/ss-otranto&quot;, label: &quot;SS &lt;em&gt;Otranto&lt;/em&gt;&quot;, tail: &quot;Orient Line · 1925&quot; },
        { href: &quot;/ships/ss-oronsay&quot;, label: &quot;SS &lt;em&gt;Oronsay&lt;/em&gt;&quot;, tail: &quot;Orient Line · 1925&quot; }
      ],
      &quot;Orient Line interwar liners&quot;
    ),

    po_strath_group: cluster(
      &quot;Related Liners.&quot;,
      &quot;P&amp;amp;O’s interwar and early postwar Strath liners—important to Britain–Australia imperial passenger service.&quot;,
      [
        { href: &quot;/ships/rms-strathaird&quot;, label: &quot;RMS &lt;em&gt;Strathaird&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1932&quot; },
        { href: &quot;/ships/rms-strathnaver&quot;, label: &quot;RMS &lt;em&gt;Strathnaver&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1931&quot; },
        { href: &quot;/ships/ss-strathmore&quot;, label: &quot;SS &lt;em&gt;Strathmore&lt;/em&gt;&quot;, tail: &quot;P&amp;amp;O · 1935&quot; }
      ],
      &quot;P&amp;O Strath liners&quot;
    ),

    union_castle_named_group: cluster(
      &quot;Related Liners.&quot;,
      &quot;Union-Castle liners associated with the Cape route and the line’s distinctive named passenger fleet.&quot;,
      [
        { href: &quot;/ships/ss-warwick-castle&quot;, label: &quot;Warwick Castle&quot;, tail: &quot;Union-Castle Line · 1931&quot; },
        { href: &quot;/ships/ss-winchester-castle&quot;, label: &quot;Winchester Castle&quot;, tail: &quot;Union-Castle Line · 1930&quot; },
        { href: &quot;/ships/ss-carnarvon-castle&quot;, label: &quot;Carnarvon Castle&quot;, tail: &quot;Union-Castle Line · 1926&quot; },
        { href: &quot;/ships/rms-arundel-castle-1921&quot;, label: &quot;RMS &lt;em&gt;Arundel Castle&lt;/em&gt;&quot;, tail: &quot;Union-Castle Line · 1921&quot; },
        { href: &quot;/ships/rms-windsor-castle-1921&quot;, label: &quot;RMS &lt;em&gt;Windsor Castle&lt;/em&gt; (1921)&quot;, tail: &quot;Union-Castle Line · 1921&quot; }
      ],
      &quot;Union-Castle passenger liners&quot;
    ),

    hapag_ballin_group: cluster(
      &quot;Related Liners.&quot;,
      &quot;Hamburg America Line ships associated with HAPAG’s prewar and interwar Atlantic prestige profile.&quot;,
      [
        { href: &quot;/ships/ss-albert-ballin&quot;, label: &quot;SS &lt;em&gt;Albert Ballin&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1923&quot; },
        { href: &quot;/ships/ss-deutschland&quot;, label: &quot;SS &lt;em&gt;Deutschland&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1900&quot; },
        { href: &quot;/ships/ss-amerika&quot;, label: &quot;SS &lt;em&gt;Amerika&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1905&quot; },
        { href: &quot;/ships/ss-imperator&quot;, label: &quot;SS &lt;em&gt;Imperator&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1913&quot; },
        { href: &quot;/ships/ss-hamburg-1925&quot;, label: &quot;SS &lt;em&gt;Hamburg&lt;/em&gt;&quot;, tail: &quot;HAPAG · 1925&quot; }
      ],
      &quot;HAPAG Atlantic prestige ships&quot;
    ),

    minnewaska_atlantic_transport: cluster(
      &quot;Related Liners.&quot;,
      &quot;Atlantic Transport Line ships associated with the company’s large early-20th-century passenger service.&quot;,
      [
        { href: &quot;/ships/ss-minnewaska&quot;, label: &quot;SS &lt;em&gt;Minnewaska&lt;/em&gt;&quot;, tail: &quot;Atlantic Transport Line · 1909&quot; },
        { href: &quot;/ships/ss-minneapolis&quot;, label: &quot;SS &lt;em&gt;Minneapolis&lt;/em&gt;&quot;, tail: &quot;Atlantic Transport Line · 1900&quot; }
      ],
      &quot;Atlantic Transport Line passenger ships&quot;
    ),

    canadian_pacific_duchess_empress: cluster(
      &quot;Related Liners.&quot;,
      &quot;Canadian Pacific ships spanning the line’s better-known Atlantic passenger identities: Empress prestige and Duchess cabin-liner service.&quot;,
      [
        { href: &quot;/ships/ss-duchess-of-bedford&quot;, label: &quot;SS &lt;em&gt;Duchess of Bedford&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-duchess-of-richmond&quot;, label: &quot;SS &lt;em&gt;Duchess of Richmond&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-duchess-of-york&quot;, label: &quot;SS &lt;em&gt;Duchess of York&lt;/em&gt;&quot; },
        { href: &quot;/ships/ss-duchess-of-atholl&quot;, label: &quot;SS &lt;em&gt;Duchess of Atholl&lt;/em&gt;&quot; },
        { href: &quot;/ships/rms-empress-of-britain&quot;, label: &quot;RMS &lt;em&gt;Empress of Britain&lt;/em&gt;&quot; },
        { href: &quot;/ships/rms-empress-of-ireland&quot;, label: &quot;RMS &lt;em&gt;Empress of Ireland&lt;/em&gt;&quot; }
      ],
      &quot;Canadian Pacific Atlantic passenger ships&quot;
    ),

    hal_early_generation: cluster(
      &quot;Related Liners.&quot;,
      &quot;Early-20th-century Holland America Line ships associated with immigrant service, Atlantic continuity, and the line’s pre-interwar profile.&quot;,
      [
        { href: &quot;/ships/ss-kroonland&quot;, label: &quot;SS &lt;em&gt;Kroonland&lt;/em&gt;&quot;, tail: &quot;Holland America Line · 1902&quot; },
        { href: &quot;/ships/ss-zeeland&quot;, label: &quot;SS &lt;em&gt;Zeeland&lt;/em&gt;&quot;, tail: &quot;Red Star / HAL orbit · 1901&quot; },
        { href: &quot;/ships/ss-nieuw-amsterdam-1906&quot;, label: &quot;SS &lt;em&gt;Nieuw Amsterdam&lt;/em&gt; (1906)&quot;, tail: &quot;Holland America Line · 1906&quot; },
        { href: &quot;/ships/ss-rotterdam-1908&quot;, label: &quot;SS &lt;em&gt;Rotterdam&lt;/em&gt; (1908)&quot;, tail: &quot;Holland America Line · 1908&quot; }
      ],
      &quot;Early Holland America liners&quot;
    )
  };

  /* =========================
     Slug -&gt; cluster keys
  ========================= */
  const MAP = {
    &quot;ss-imperator&quot;: [&quot;imperator_class&quot;, &quot;hapag_ballin_group&quot;],
    &quot;ss-vaterland&quot;: [&quot;imperator_class&quot;],
    &quot;ss-bismarck-1914&quot;: [&quot;imperator_class&quot;],
    &quot;rms-berengaria&quot;: [&quot;imperator_class&quot;],
    &quot;ss-leviathan&quot;: [&quot;imperator_class&quot;, &quot;usl_flagships&quot;],
    &quot;rms-majestic&quot;: [&quot;imperator_class&quot;],

    &quot;rms-celtic&quot;: [&quot;big_four&quot;],
    &quot;rms-cedric&quot;: [&quot;big_four&quot;],
    &quot;rms-baltic&quot;: [&quot;big_four&quot;],
    &quot;rms-adriatic&quot;: [&quot;big_four&quot;],

    &quot;rms-olympic&quot;: [&quot;olympic_class&quot;],
    &quot;rms-titanic&quot;: [&quot;olympic_class&quot;],
    &quot;rms-britannic&quot;: [&quot;olympic_class&quot;],
    &quot;ss-nomadic&quot;: [&quot;olympic_class&quot;],
    &quot;ss-traffic&quot;: [&quot;olympic_class&quot;],

    &quot;ss-runic&quot;: [&quot;white_star_jubilee&quot;],
    &quot;ss-medic&quot;: [&quot;white_star_jubilee&quot;],
    &quot;ss-persic&quot;: [&quot;white_star_jubilee&quot;],
    &quot;ss-afric&quot;: [&quot;white_star_jubilee&quot;],
    &quot;ss-romanic&quot;: [&quot;white_star_jubilee&quot;],
    &quot;ss-suevic&quot;: [&quot;white_star_jubilee&quot;],

    &quot;rms-queen-mary&quot;: [&quot;cunard_queens&quot;],
    &quot;rms-queen-elizabeth&quot;: [&quot;cunard_queens&quot;],
    &quot;queen-elizabeth-2&quot;: [&quot;cunard_queens&quot;],

    &quot;ss-bremen&quot;: [&quot;german_interwar&quot;, &quot;greyhounds&quot;, &quot;interwar_prestige&quot;],
    &quot;ss-europa&quot;: [&quot;german_interwar&quot;, &quot;greyhounds&quot;, &quot;interwar_prestige&quot;],

    &quot;ss-manhattan&quot;: [&quot;usl_flagships&quot;, &quot;manhattan_washington&quot;],
    &quot;ss-us&quot;: [&quot;usl_flagships&quot;],
    &quot;ss-washington&quot;: [&quot;manhattan_washington&quot;],

    &quot;rms-lusitania&quot;: [&quot;greyhounds&quot;],
    &quot;rms-mauretania&quot;: [&quot;greyhounds&quot;],
    &quot;ss-kaiser-wilhelm-der-grosse&quot;: [&quot;greyhounds&quot;, &quot;kaiser_class&quot;],
    &quot;ss-deutschland&quot;: [&quot;greyhounds&quot;, &quot;hapag_atlantic&quot;, &quot;hapag_ballin_group&quot;],
    &quot;ss-kronprinz-wilhelm&quot;: [&quot;kaiser_class&quot;],
    &quot;ss-kaiser-wilhelm-ii&quot;: [&quot;kaiser_class&quot;],
    &quot;ss-kronprinzessin-cecilie&quot;: [&quot;kaiser_class&quot;],

    &quot;ss-rex&quot;: [&quot;italian_prestige_pair&quot;, &quot;interwar_prestige&quot;, &quot;italian_prestige_late&quot;],
    &quot;ss-conte-di-savoia&quot;: [&quot;italian_prestige_pair&quot;, &quot;interwar_prestige&quot;, &quot;italian_prestige_late&quot;],
    &quot;ms-saturnia&quot;: [&quot;italian_prestige_pair&quot;, &quot;italian_broad_interwar&quot;],
    &quot;ms-vulcania&quot;: [&quot;italian_prestige_pair&quot;, &quot;italian_broad_interwar&quot;],

    &quot;rms-teutonic&quot;: [&quot;white_star_victorian_duo&quot;],
    &quot;ss-majestic-1889&quot;: [&quot;white_star_victorian_duo&quot;],

    &quot;rms-campania&quot;: [&quot;campania_lucania&quot;],
    &quot;rms-lucania&quot;: [&quot;campania_lucania&quot;],

    &quot;ss-michelangelo-1965&quot;: [&quot;michelangelo_raffaello&quot;, &quot;italian_prestige_late&quot;],
    &quot;ss-raffaello-1965&quot;: [&quot;michelangelo_raffaello&quot;, &quot;italian_prestige_late&quot;],

    &quot;mv-britannic&quot;: [&quot;britannic_georgic&quot;, &quot;white_star_motor_pair&quot;],
    &quot;mv-georgic&quot;: [&quot;britannic_georgic&quot;, &quot;white_star_motor_pair&quot;],

    &quot;ss-normandie&quot;: [&quot;french_line_atlantic&quot;, &quot;interwar_prestige&quot;, &quot;french_line_interwar&quot;],
    &quot;ss-france-1912&quot;: [&quot;french_line_atlantic&quot;, &quot;french_line_prewar&quot;],
    &quot;ss-ile-de-france&quot;: [&quot;french_line_atlantic&quot;, &quot;french_line_interwar&quot;, &quot;french_line_prewar&quot;],
    &quot;ss-france&quot;: [&quot;french_line_atlantic&quot;],
    &quot;ss-champlain&quot;: [&quot;french_line_interwar&quot;],
    &quot;ss-paris&quot;: [&quot;french_line_interwar&quot;, &quot;french_line_prewar&quot;],
    &quot;ss-la-provence&quot;: [&quot;french_line_prewar&quot;],
    &quot;ss-de-grasse&quot;: [&quot;french_line_prewar&quot;],
    &quot;ss-bretagne&quot;: [&quot;french_line_prewar&quot;],

    &quot;rms-saxonia&quot;: [&quot;saxonia_class&quot;],
    &quot;rms-ivernia&quot;: [&quot;saxonia_class&quot;],
    &quot;rms-carinthia&quot;: [&quot;saxonia_class&quot;],
    &quot;rms-sylvania&quot;: [&quot;saxonia_class&quot;],

    &quot;ss-lurline-1932&quot;: [&quot;matson_white_ships&quot;],
    &quot;ss-mariposa&quot;: [&quot;matson_white_ships&quot;],
    &quot;ss-monterey&quot;: [&quot;matson_white_ships&quot;],

    &quot;asama-maru-1929&quot;: [&quot;nyk_pacific_trio&quot;],
    &quot;tatsuta-maru-1929&quot;: [&quot;nyk_pacific_trio&quot;],
    &quot;nyk-hikawa-maru&quot;: [&quot;nyk_pacific_trio&quot;],

    &quot;ms-gripsholm-1925&quot;: [&quot;swedish_american_diesel&quot;],
    &quot;ms-kungsholm-1928&quot;: [&quot;swedish_american_diesel&quot;],
    &quot;ms-stockholm&quot;: [&quot;swedish_american_diesel&quot;],

    &quot;ss-veendam&quot;: [&quot;holland_america_interwar&quot;],
    &quot;ss-volendam&quot;: [&quot;holland_america_interwar&quot;],
    &quot;ss-statendam-1929&quot;: [&quot;holland_america_interwar&quot;],
    &quot;ss-nieuw-amsterdam&quot;: [&quot;holland_america_interwar&quot;],
    &quot;ss-rotterdam-1908&quot;: [&quot;rotterdam_pair&quot;, &quot;hal_early_generation&quot;],
    &quot;ss-rotterdam-1959&quot;: [&quot;rotterdam_pair&quot;],
    &quot;ss-kroonland&quot;: [&quot;hal_early_generation&quot;],
    &quot;ss-zeeland&quot;: [&quot;hal_early_generation&quot;],
    &quot;ss-nieuw-amsterdam-1906&quot;: [&quot;hal_early_generation&quot;],

    &quot;rms-cameronia&quot;: [&quot;anchor_interwar&quot;],
    &quot;rms-caledonia&quot;: [&quot;anchor_interwar&quot;],
    &quot;rms-lancastria&quot;: [&quot;anchor_interwar&quot;],
    &quot;rms-transylvania&quot;: [&quot;anchor_interwar&quot;],
    &quot;ss-tuscania-1921&quot;: [&quot;anchor_interwar&quot;],

    &quot;ss-latlantique&quot;: [&quot;sud_atlantique_pair&quot;],
    &quot;ss-pasteur&quot;: [&quot;sud_atlantique_pair&quot;],

    &quot;ms-augustus&quot;: [&quot;italian_ngi_pair&quot;, &quot;italian_broad_interwar&quot;],
    &quot;ss-roma&quot;: [&quot;italian_ngi_pair&quot;, &quot;italian_broad_interwar&quot;],
    &quot;ss-principessa-mafalda&quot;: [&quot;italian_south_america&quot;],
    &quot;ss-giulio-cesare&quot;: [&quot;italian_south_america&quot;, &quot;italian_broad_interwar&quot;],
    &quot;ss-duilio&quot;: [&quot;italian_south_america&quot;, &quot;italian_broad_interwar&quot;],
    &quot;ss-conte-grande&quot;: [&quot;italian_broad_interwar&quot;],
    &quot;ss-conte-rosso&quot;: [&quot;italian_broad_interwar&quot;],

    &quot;rms-empress-of-australia&quot;: [&quot;empress_pacific&quot;],
    &quot;rms-empress-of-japan-1929&quot;: [&quot;empress_pacific&quot;],
    &quot;rms-empress-of-russia&quot;: [&quot;empress_pacific&quot;],
    &quot;rms-empress-of-ireland&quot;: [&quot;empress_canada_atlantic&quot;, &quot;canadian_pacific_duchess_empress&quot;],
    &quot;rms-empress-of-britain&quot;: [&quot;empress_canada_atlantic&quot;, &quot;canadian_pacific_atlantic_interwar&quot;, &quot;canadian_pacific_duchess_empress&quot;],

    &quot;monarch-of-bermuda&quot;: [&quot;bermuda_pair&quot;],
    &quot;ss-queen-of-bermuda&quot;: [&quot;bermuda_pair&quot;],

    &quot;ss-atlantic-1873&quot;: [&quot;white_star_1870s&quot;],
    &quot;rms-britannic-1874&quot;: [&quot;white_star_1870s&quot;],
    &quot;ss-germanic&quot;: [&quot;white_star_1870s&quot;],
    &quot;rms-laurentic&quot;: [&quot;white_star_canadian_pair&quot;, &quot;white_star_oceanic_family&quot;],
    &quot;rms-megantic-1909&quot;: [&quot;white_star_canadian_pair&quot;, &quot;white_star_oceanic_family&quot;],
    &quot;rms-oceanic&quot;: [&quot;white_star_oceanic_family&quot;],
    &quot;ss-cymric&quot;: [&quot;white_star_oceanic_family&quot;],
    &quot;ss-republic-1903&quot;: [&quot;white_star_oceanic_family&quot;],

    &quot;rms-etruria-1884&quot;: [&quot;cunard_1880s_pair&quot;],
    &quot;rms-umbria-1884&quot;: [&quot;cunard_1880s_pair&quot;],
    &quot;rms-franconia-1910&quot;: [&quot;cunard_franconia_pair&quot;],
    &quot;rms-franconia&quot;: [&quot;cunard_franconia_pair&quot;],

    &quot;rms-arundel-castle-1921&quot;: [&quot;union_castle_pair_1921&quot;, &quot;union_castle_named_group&quot;],
    &quot;rms-windsor-castle-1921&quot;: [&quot;union_castle_pair_1921&quot;, &quot;union_castle_named_group&quot;],
    &quot;rms-moldavia&quot;: [&quot;pando_flagships&quot;],
    &quot;rms-strathnaver&quot;: [&quot;pando_flagships&quot;, &quot;po_strath_group&quot;],
    &quot;rms-viceroy-of-india&quot;: [&quot;pando_flagships&quot;],
    &quot;ss-canberra&quot;: [&quot;pando_flagships&quot;],

    &quot;ss-belgenland&quot;: [&quot;red_star_interwar&quot;],
    &quot;ss-pennland&quot;: [&quot;red_star_interwar&quot;],
    &quot;ss-westernland-red-star&quot;: [&quot;red_star_interwar&quot;],

    &quot;ss-berlin-1909&quot;: [&quot;berlin_arabic_republic&quot;],
    &quot;ss-arabic-1920&quot;: [&quot;berlin_arabic_republic&quot;],
    &quot;ss-republic&quot;: [&quot;berlin_arabic_republic&quot;],

    &quot;ss-reliance&quot;: [&quot;reliance_resolute&quot;, &quot;hapag_atlantic&quot;],
    &quot;ss-resolute&quot;: [&quot;reliance_resolute&quot;, &quot;hapag_atlantic&quot;],
    &quot;ss-amerika&quot;: [&quot;hapag_atlantic&quot;, &quot;hapag_ballin_group&quot;],
    &quot;ss-george-washington&quot;: [&quot;hapag_atlantic&quot;],
    &quot;ss-hamburg-1925&quot;: [&quot;hapag_atlantic&quot;, &quot;hapag_ballin_group&quot;],

    &quot;ss-duchess-of-bedford&quot;: [&quot;duchess_quartet&quot;, &quot;canadian_pacific_atlantic_interwar&quot;, &quot;canadian_pacific_duchess_empress&quot;],
    &quot;ss-duchess-of-richmond&quot;: [&quot;duchess_quartet&quot;, &quot;canadian_pacific_atlantic_interwar&quot;, &quot;canadian_pacific_duchess_empress&quot;],
    &quot;ss-duchess-of-york&quot;: [&quot;duchess_quartet&quot;, &quot;canadian_pacific_atlantic_interwar&quot;, &quot;canadian_pacific_duchess_empress&quot;],
    &quot;ss-duchess-of-atholl&quot;: [&quot;duchess_quartet&quot;, &quot;canadian_pacific_atlantic_interwar&quot;, &quot;canadian_pacific_duchess_empress&quot;],

    &quot;ss-orion&quot;: [&quot;orient_interwar&quot;],
    &quot;ss-orontes&quot;: [&quot;orient_interwar&quot;],
    &quot;ss-otranto&quot;: [&quot;orient_interwar&quot;],
    &quot;ss-oronsay&quot;: [&quot;orient_interwar&quot;],

    &quot;rms-strathaird&quot;: [&quot;po_strath_group&quot;],
    &quot;ss-strathmore&quot;: [&quot;po_strath_group&quot;],

    &quot;ss-warwick-castle&quot;: [&quot;union_castle_named_group&quot;],
    &quot;ss-winchester-castle&quot;: [&quot;union_castle_named_group&quot;],
    &quot;ss-carnarvon-castle&quot;: [&quot;union_castle_named_group&quot;],

    &quot;ss-albert-ballin&quot;: [&quot;hapag_ballin_group&quot;],

    &quot;ss-minnewaska&quot;: [&quot;minnewaska_atlantic_transport&quot;],
    &quot;ss-minneapolis&quot;: [&quot;minnewaska_atlantic_transport&quot;]
  };

  const keys = MAP[slug];
  if (!keys || !keys.length) {
    console.warn(&quot;[related-liners] No clusters mapped for slug:&quot;, slug);
    return;
  }

  const html = keys
    .map((k) =&gt; (CLUSTERS[k] ? renderClusterHTML(k, slug, CLUSTERS[k]) : &quot;&quot;))
    .filter(Boolean)
    .join(&quot;\n&quot;);

  if (!html) {
    console.warn(
      &quot;[related-liners] Mapped keys produced no HTML after filtering:&quot;,
      keys,
      &quot;slug:&quot;,
      slug
    );
    return;
  }

  const wrapper = document.createElement(&quot;div&quot;);
  wrapper.innerHTML = html;

  if (sourcesH2) {
    guide.insertBefore(wrapper, sourcesH2);
  } else {
    guide.appendChild(wrapper);
  }
})();

window.askOceanLinerGPT = function () {
  const pageURL = window.location.href;

  const prompt = `I&#x27;m reading this Ocean Liner Curator page: ${pageURL}.
Please expand on this topic while maintaining evidence-first standards.
Clearly distinguish between documented fact, scholarly consensus, and interpretation.`;

  navigator.clipboard.writeText(prompt)
    .then(() =&gt; {
      const modal = document.getElementById(&quot;gpt-modal&quot;);
      if (modal) modal.classList.add(&quot;show&quot;);
    })
    .catch(() =&gt; {
      window.open(
        &quot;https://chatgpt.com/g/g-693e5f55929481918bc76271fc403bea-ocean-liner-gpt&quot;,
        &quot;_blank&quot;
      );
    });
};

document.addEventListener(&quot;DOMContentLoaded&quot;, function () {
  const modal = document.getElementById(&quot;gpt-modal&quot;);
  const continueBtn = document.getElementById(&quot;gpt-continue&quot;);
  const cancelBtn = document.getElementById(&quot;gpt-cancel&quot;);

  if (continueBtn) {
    continueBtn.addEventListener(&quot;click&quot;, function () {
      window.open(
        &quot;https://chatgpt.com/g/g-693e5f55929481918bc76271fc403bea-ocean-liner-gpt&quot;,
        &quot;_blank&quot;
      );

      if (modal) modal.classList.remove(&quot;show&quot;);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener(&quot;click&quot;, function () {
      if (modal) modal.classList.remove(&quot;show&quot;);
    });
  }
});
