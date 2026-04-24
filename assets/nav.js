(function initNavDropdowns() {

  function wireNavDropdowns() {
    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach((d) => {

      // Prevent double wiring
      if (d.dataset.wired === "true") return;
      d.dataset.wired = "true";

      // Only allow one open at a time
      d.addEventListener("toggle", () => {
        if (!d.open) return;
        dropdowns.forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });

    // Close when clicking outside
    if (!document.body.dataset.navOutsideBound) {
      document.body.dataset.navOutsideBound = "true";

      document.addEventListener("click", (e) => {
        const clickedInside = e.target.closest(".nav-dropdown");
        if (!clickedInside) {
          dropdowns.forEach((d) => d.open = false);
        }
      });
    }
  }

  // Because header is injected, wait until it exists
  const obs = new MutationObserver(() => {
    if (document.querySelector(".site-header")) {
      obs.disconnect();
      wireNavDropdowns();
    }
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });

})();