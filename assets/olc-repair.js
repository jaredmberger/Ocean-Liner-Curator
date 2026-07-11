(function () {

  "use strict";

  if (window.__OLC_REPAIR_INSTALLED__) {

    return;

  }

  window.__OLC_REPAIR_INSTALLED__ = true;

(function () {
  "use strict";

  const REPAIR_DELAY = 1500;

  function fresh(path) {
    return path + (path.includes("?") ? "&" : "?") + "repair=" + Date.now();
  }

  function loadStyle(path) {
    return new Promise(function (resolve, reject) {
      const link = document.createElement("link");

      link.rel = "stylesheet";
      link.href = fresh(path);

      link.onload = resolve;
      link.onerror = function () {
        reject(new Error("Failed to reload " + path));
      };

      document.head.appendChild(link);
    });
  }

  function loadScript(path) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement("script");

      script.src = fresh(path);
      script.async = false;

      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("Failed to reload " + path));
      };

      document.head.appendChild(script);
    });
  }

  function headerHealthy() {
    return Boolean(
      window.OLC &&
      typeof window.OLC.reloadHeader === "function" &&
      document.querySelector("#site-header .site-header")
    );
  }

  function navHealthy() {
    return Boolean(
      window.OLC &&
      typeof window.OLC.reloadNav === "function" &&
      document.querySelector(".site-nav")
    );
  }

  async function repairSharedAssets() {
    if (window.__olcRepairRunning) return;

    window.__olcRepairRunning = true;

    console.warn("[OLC Repair] Reloading shared assets.");

    try {
      await loadStyle("/assets/nav.css");

      if (
        !window.OLC ||
        typeof window.OLC.reloadHeader !== "function"
      ) {
        await loadScript("/assets/header.js");
      }

      if (
        window.OLC &&
        typeof window.OLC.reloadHeader === "function"
      ) {
        await window.OLC.reloadHeader();
      }

      if (
        !window.OLC ||
        typeof window.OLC.reloadNav !== "function"
      ) {
        await loadScript("/assets/nav.js");
      }

      if (
        window.OLC &&
        typeof window.OLC.reloadNav === "function"
      ) {
        window.OLC.reloadNav();
      }

      await loadScript("/assets/random-ship.js");
      await loadScript("/assets/entry-links.js");

      /*
       * Refresh the homepage cards when present.
       */
      const shipButton =
        document.getElementById("ship-entry-refresh");

      const entryButton =
        document.getElementById("rotating-entry-refresh");

      if (shipButton) shipButton.click();
      if (entryButton) entryButton.click();

      console.info("[OLC Repair] Shared assets reloaded.");
    } catch (error) {
      console.error("[OLC Repair] Recovery failed:", error);
    } finally {
      window.__olcRepairRunning = false;
    }
  }

  /*
   * Available manually from the console:
   * OLCRepair()
   */
  window.OLCRepair = repairSharedAssets;

  /*
   * Allow normal deferred scripts to initialize first.
   */
  window.setTimeout(function () {
    if (!headerHealthy() || !navHealthy()) {
      repairSharedAssets();
    }
  }, REPAIR_DELAY);
})();