document.addEventListener("DOMContentLoaded", async () => {
  // ---- Footer star homepage link ----
  const copyright = document.querySelector(".copyright");

  if (copyright) {
    const existing = document.querySelector(".footer-star");

    if (existing) {
      if (existing.tagName.toLowerCase() !== "a") {
        const link = document.createElement("a");
        link.className = existing.className;
        link.href = "/";
        link.setAttribute("aria-label", "Return to OceanLiners.net homepage");
        link.textContent = existing.textContent || "★";

        existing.replaceWith(link);
      }
    } else {
      const star = document.createElement("a");
      star.className = "footer-star";
      star.href = "/";
      star.setAttribute("aria-label", "Return to OceanLiners.net homepage");
      star.textContent = "★";

      copyright.insertAdjacentElement("afterend", star);
    }
  }


  // ---- Simple Analytics ----
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

  if (mount) {
    try {
      const res = await fetch("/partials/header.html", { cache: "no-cache" });
      if (!res.ok) throw new Error("Header fetch failed: " + res.status);
      mount.innerHTML = await res.text();
    } catch (err) {
      console.warn(err);
    }
  }
});