/*
  Ocean Liner Curator — hardened shared navigation script

  Purpose:
  - Initialize dropdown navigation after the shared header is injected.
  - Prefer the explicit "olc:header-ready" event.
  - Retain a MutationObserver as a fallback.
  - Prevent duplicate event listeners when navigation is reinitialized.
  - Allow manual repair and diagnostics from the browser console.
  - Load the CuratorOS Error Bus browser reporter site-wide.
*/

(function () {
  "use strict";

  window.OLC = window.OLC || {};

  /*
   * Public-site failsafe reporting.
   *
   * This single shared loader means pages using nav.js automatically gain
   * client-side exception, promise, resource, and fetch failure reporting.
   * It is intentionally independent of the navigation initialization below.
   */
  if (!window.OLC.__errorBusReporterRequested) {
    window.OLC.__errorBusReporterRequested = true;

    try {
      const reporter = document.createElement("script");
      reporter.src = "https://errors.oceanliners.net/client-reporter.js?v=20260809-public-2";
      reporter.async = true;
      reporter.dataset.curatorErrorReporter = "public-site";
      reporter.onerror = function () {
        console.warn("[OceanLiners.net] Error Bus browser reporter could not be loaded.");
      };
      document.head.appendChild(reporter);
    } catch (error) {
      console.warn("[OceanLiners.net] Error Bus reporter loader failed:", error);
    }
  }

  let observer = null;
  let outsideClickBound = false;
  let escapeKeyBound = false;

  function getDropdowns() {
    return Array.from(document.querySelectorAll(".nav-dropdown"));
  }

  function closeOtherDropdowns(exception) {
    getDropdowns().forEach(function (dropdown) {
      if (dropdown !== exception) dropdown.open = false;
    });
  }

  function wireDropdown(dropdown) {
    if (!(dropdown instanceof HTMLElement)) return;

    if (dropdown.dataset.olcNavWired === "true" || dropdown.dataset.wired === "true") {
      dropdown.dataset.olcNavWired = "true";
      dropdown.dataset.wired = "true";
      return;
    }

    dropdown.dataset.olcNavWired = "true";
    dropdown.dataset.wired = "true";

    dropdown.addEventListener("toggle", function () {
      if (!dropdown.open) return;
      closeOtherDropdowns(dropdown);
    });
  }

  function bindOutsideClickHandler() {
    if (outsideClickBound) return;
    outsideClickBound = true;

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".nav-dropdown")) return;
      closeOtherDropdowns(null);
    });
  }

  function bindEscapeHandler() {
    if (escapeKeyBound) return;
    escapeKeyBound = true;

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      const openDropdown = document.querySelector(".nav-dropdown[open]");
      closeOtherDropdowns(null);

      if (openDropdown) {
        const summary = openDropdown.querySelector("summary");
        if (summary && typeof summary.focus === "function") summary.focus();
      }
    });
  }

  function wireNavDropdowns() {
    const header = document.querySelector(".site-header");
    const nav = document.querySelector(".site-nav");
    const dropdowns = getDropdowns();

    if (!header || !nav) return false;

    dropdowns.forEach(wireDropdown);
    bindOutsideClickHandler();
    bindEscapeHandler();

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    document.documentElement.dataset.olcNavReady = "true";

    console.info(
      "[OceanLiners.net] Navigation initialized:",
      dropdowns.length,
      "dropdown(s)"
    );

    document.dispatchEvent(new CustomEvent("olc:nav-ready", {
      detail: { header: header, nav: nav, dropdownCount: dropdowns.length }
    }));

    return true;
  }

  function startHeaderObserver() {
    if (observer || typeof MutationObserver !== "function") return;

    observer = new MutationObserver(function () {
      if (document.querySelector(".site-header")) wireNavDropdowns();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function initializeNavigation() {
    if (!wireNavDropdowns()) startHeaderObserver();
  }

  document.addEventListener("olc:header-ready", function () {
    window.requestAnimationFrame(function () {
      wireNavDropdowns();
    });
  });

  document.addEventListener("olc:header-failed", function () {
    startHeaderObserver();
  });

  window.OLC.reloadNav = function reloadNav() {
    document.documentElement.removeAttribute("data-olc-nav-ready");

    const dropdowns = getDropdowns();
    dropdowns.forEach(function (dropdown) {
      dropdown.open = false;
      if (dropdown.dataset.olcNavWired !== "true") wireDropdown(dropdown);
    });

    const result = wireNavDropdowns();
    if (!result) startHeaderObserver();
    return result;
  };

  window.OLC.navStatus = function navStatus() {
    const dropdowns = getDropdowns();
    const wiredDropdowns = dropdowns.filter(function (dropdown) {
      return dropdown.dataset.olcNavWired === "true" || dropdown.dataset.wired === "true";
    });

    const status = {
      headerExists: Boolean(document.querySelector(".site-header")),
      navExists: Boolean(document.querySelector(".site-nav")),
      dropdownCount: dropdowns.length,
      wiredDropdownCount: wiredDropdowns.length,
      openDropdownCount: dropdowns.filter(function (dropdown) { return dropdown.open; }).length,
      navReady: document.documentElement.dataset.olcNavReady === "true",
      observerActive: Boolean(observer),
      errorBusReporterRequested: Boolean(window.OLC.__errorBusReporterRequested)
    };

    console.table(status);
    return status;
  };

  /*
   * Homepage CuratorOS status lamp.
   *
   * This is intentionally binary and independent of Site Health or tool
   * warnings. Green means CuratorOS itself answered its health endpoint.
   * Red is used only when CuratorOS cannot be reached or fails the heartbeat.
   */
  function installCuratorOSStatusLamp() {
    if (window.location.pathname !== "/") return;
    if (document.getElementById("curatoros-status")) return;

    const style = document.createElement("style");
    style.id = "curatoros-status-style";
    style.textContent = [
      ".curatoros-status{display:flex;align-items:center;justify-content:center;gap:.42rem;width:max-content;margin:1.15rem auto 0;color:rgba(182,174,156,.50);font-size:.64rem;line-height:1;letter-spacing:.11em;text-transform:uppercase;text-decoration:none;transition:color 160ms ease,opacity 160ms ease}",
      ".curatoros-status:hover{color:rgba(209,187,134,.76)}",
      ".curatoros-status:focus-visible{outline:1px solid rgba(191,164,106,.58);outline-offset:4px;border-radius:3px}",
      ".curatoros-status__light{width:6px;height:6px;border-radius:50%;background:#63c174;box-shadow:0 0 6px rgba(99,193,116,.60);flex:0 0 auto;transition:background 160ms ease,box-shadow 160ms ease}",
      ".curatoros-status.is-offline .curatoros-status__light{background:#b95353;box-shadow:0 0 6px rgba(185,83,83,.58)}",
      ".curatoros-status.is-offline{color:rgba(182,174,156,.44)}",
      "@media (prefers-reduced-motion:reduce){.curatoros-status,.curatoros-status__light{transition:none}}"
    ].join("");
    document.head.appendChild(style);

    const lamp = document.createElement("a");
    lamp.id = "curatoros-status";
    lamp.className = "curatoros-status";
    lamp.href = "https://curatoros.app";
    lamp.target = "_blank";
    lamp.rel = "noopener";
    lamp.setAttribute("aria-label", "CuratorOS status: online");
    lamp.innerHTML = '<span class="curatoros-status__light" aria-hidden="true"></span><span class="curatoros-status__text">Curator★OS Online</span>';

    const endCap = document.querySelector(".hero.end-cap");
    if (endCap) {
      endCap.insertAdjacentElement("afterend", lamp);
    } else {
      document.body.appendChild(lamp);
    }

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = window.setTimeout(function () {
      if (controller) controller.abort();
    }, 5000);

    fetch("https://curator.oceanliners.net/health", {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error("CuratorOS heartbeat HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) throw new Error("CuratorOS heartbeat invalid");
        lamp.classList.remove("is-offline");
        lamp.querySelector(".curatoros-status__text").textContent = "Curator★OS Online";
        lamp.setAttribute("aria-label", "CuratorOS status: online");
      })
      .catch(function () {
        lamp.classList.add("is-offline");
        lamp.querySelector(".curatoros-status__text").textContent = "Curator★OS Offline";
        lamp.setAttribute("aria-label", "CuratorOS status: offline");
      })
      .finally(function () {
        window.clearTimeout(timeout);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initializeNavigation();
      installCuratorOSStatusLamp();
    }, { once: true });
  } else {
    initializeNavigation();
    installCuratorOSStatusLamp();
  }
})();
