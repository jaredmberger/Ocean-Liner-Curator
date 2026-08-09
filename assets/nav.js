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
      reporter.src = "https://errors.oceanliners.net/client-reporter.js?v=20260809-public-1";
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

  /*
   * Return all current navigation dropdowns.
   */
  function getDropdowns() {
    return Array.from(
      document.querySelectorAll(".nav-dropdown")
    );
  }

  /*
   * Close every navigation dropdown except an optional
   * dropdown that should remain open.
   */
  function closeOtherDropdowns(exception) {
    getDropdowns().forEach(function (dropdown) {
      if (dropdown !== exception) {
        dropdown.open = false;
      }
    });
  }

  /*
   * Wire one dropdown only once.
   */
  function wireDropdown(dropdown) {
    if (!(dropdown instanceof HTMLElement)) {
      return;
    }

    if (
      dropdown.dataset.olcNavWired === "true" ||
      dropdown.dataset.wired === "true"
    ) {
      dropdown.dataset.olcNavWired = "true";
      dropdown.dataset.wired = "true";
      return;
    }

    dropdown.dataset.olcNavWired = "true";
    dropdown.dataset.wired = "true";

    dropdown.addEventListener(
      "toggle",
      function () {
        if (!dropdown.open) {
          return;
        }

        closeOtherDropdowns(dropdown);
      }
    );
  }

  /*
   * Bind the page-level outside-click handler once.
   */
  function bindOutsideClickHandler() {
    if (outsideClickBound) {
      return;
    }

    outsideClickBound = true;

    document.addEventListener(
      "click",
      function (event) {
        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        if (target.closest(".nav-dropdown")) {
          return;
        }

        closeOtherDropdowns(null);
      }
    );
  }

  /*
   * Close dropdowns with Escape.
   */
  function bindEscapeHandler() {
    if (escapeKeyBound) {
      return;
    }

    escapeKeyBound = true;

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key !== "Escape") {
          return;
        }

        const openDropdown =
          document.querySelector(
            ".nav-dropdown[open]"
          );

        closeOtherDropdowns(null);

        if (openDropdown) {
          const summary =
            openDropdown.querySelector(
              "summary"
            );

          if (
            summary &&
            typeof summary.focus === "function"
          ) {
            summary.focus();
          }
        }
      }
    );
  }

  /*
   * Initialize all currently available dropdowns.
   */
  function wireNavDropdowns() {
    const header =
      document.querySelector(".site-header");

    const nav =
      document.querySelector(".site-nav");

    const dropdowns = getDropdowns();

    if (!header || !nav) {
      console.warn(
        "[OceanLiners.net] Navigation could not initialize because the shared header is not present."
      );

      return false;
    }

    dropdowns.forEach(wireDropdown);

    bindOutsideClickHandler();
    bindEscapeHandler();

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    document.documentElement.dataset.olcNavReady =
      "true";

    console.info(
      "[OceanLiners.net] Navigation initialized:",
      dropdowns.length,
      "dropdown(s)"
    );

    document.dispatchEvent(
      new CustomEvent(
        "olc:nav-ready",
        {
          detail: {
            header: header,
            nav: nav,
            dropdownCount:
              dropdowns.length
          }
        }
      )
    );

    return true;
  }

  /*
   * Begin observing the page only when the header
   * has not yet been injected.
   */
  function startHeaderObserver() {
    if (
      observer ||
      typeof MutationObserver !== "function"
    ) {
      return;
    }

    observer = new MutationObserver(
      function () {
        if (
          document.querySelector(
            ".site-header"
          )
        ) {
          wireNavDropdowns();
        }
      }
    );

    observer.observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );
  }

  /*
   * Initialize immediately when possible.
   * Otherwise wait for header.js.
   */
  function initializeNavigation() {
    if (!wireNavDropdowns()) {
      startHeaderObserver();
    }
  }

  /*
   * The preferred initialization route.
   *
   * header.js dispatches this after the shared
   * header has been downloaded and inserted.
   */
  document.addEventListener(
    "olc:header-ready",
    function () {
      window.requestAnimationFrame(
        function () {
          wireNavDropdowns();
        }
      );
    }
  );

  /*
   * If header injection fails, keep observing in
   * case the fallback header is installed.
   */
  document.addEventListener(
    "olc:header-failed",
    function () {
      startHeaderObserver();
    }
  );

  /*
   * Public console repair command.
   *
   * Run:
   * OLC.reloadNav()
   */
  window.OLC.reloadNav =
    function reloadNav() {
      document.documentElement.removeAttribute(
        "data-olc-nav-ready"
      );

      const dropdowns = getDropdowns();

      dropdowns.forEach(
        function (dropdown) {
          dropdown.open = false;

          /*
           * We retain the existing event listeners.
           * The wiring flags prevent duplicate listeners.
           */
          if (
            dropdown.dataset.olcNavWired !==
            "true"
          ) {
            wireDropdown(dropdown);
          }
        }
      );

      const result = wireNavDropdowns();

      if (!result) {
        startHeaderObserver();
      }

      return result;
    };

  /*
   * Public console status command.
   *
   * Run:
   * OLC.navStatus()
   */
  window.OLC.navStatus =
    function navStatus() {
      const dropdowns = getDropdowns();

      const wiredDropdowns =
        dropdowns.filter(
          function (dropdown) {
            return (
              dropdown.dataset
                .olcNavWired === "true" ||
              dropdown.dataset.wired ===
                "true"
            );
          }
        );

      const status = {
        headerExists: Boolean(
          document.querySelector(
            ".site-header"
          )
        ),

        navExists: Boolean(
          document.querySelector(
            ".site-nav"
          )
        ),

        dropdownCount:
          dropdowns.length,

        wiredDropdownCount:
          wiredDropdowns.length,

        openDropdownCount:
          dropdowns.filter(
            function (dropdown) {
              return dropdown.open;
            }
          ).length,

        navReady:
          document.documentElement.dataset
            .olcNavReady === "true",

        observerActive:
          Boolean(observer),

        errorBusReporterRequested:
          Boolean(window.OLC.__errorBusReporterRequested)
      };

      console.table(status);

      return status;
    };

  /*
   * Initialize after the current document has been parsed.
   *
   * The deferred script will normally execute before
   * DOMContentLoaded, so this safely covers either state.
   */
  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializeNavigation,
      {
        once: true
      }
    );
  } else {
    initializeNavigation();
  }
})();