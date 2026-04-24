document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".footer-star")) return;

  const copyright = document.querySelector(".copyright");
  if (!copyright) return;

  const star = document.createElement("p");
  star.className = "footer-star";
  star.setAttribute("aria-hidden", "true");
  star.textContent = "★";

  copyright.insertAdjacentElement("afterend", star);
});

(async function () {

  // ---- Google Analytics (gtag site-wide guarded injection) ----
  (function injectGA() {

    const GA_SRC = "https://www.googletagmanager.com/gtag/js?id=G-JPZ291Q3RB";

    // Prevent double injection
    if (document.querySelector(`script[src^="https://www.googletagmanager.com/gtag/js"]`)) return;

    const s = document.createElement("script");
    s.src = GA_SRC;
    s.async = true;
    document.head.appendChild(s);

    // Config block
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };

    gtag('js', new Date());
    gtag('config', 'G-JPZ291Q3RB');

  })();


  // ---- Simple Analytics (site-wide, guarded) ----
  (function injectSimpleAnalytics() {
    const SRC = "https://scripts.simpleanalyticscdn.com/latest.js";

    if (document.querySelector(`script[src="${SRC}"]`)) return;

    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    document.head.appendChild(s);
  })();


  // ---- Header injection ----
  const mount = document.getElementById("site-header");
  if (!mount) return;

  try {
    const res = await fetch("/partials/header.html", { cache: "no-cache" });
    if (!res.ok) throw new Error("Header fetch failed: " + res.status);
    mount.innerHTML = await res.text();
  } catch (err) {
    console.warn(err);
  }

})();