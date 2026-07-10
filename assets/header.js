/*
  Ocean Liner Curator — hardened shared header/footer script

  Purpose:
  - Load the shared header reliably.
  - Retry transient Safari/iOS fetch failures.
  - Prevent one feature from stopping unrelated features.
  - Correctly catch synchronous and asynchronous errors.
  - Dispatch explicit header-ready/header-failed events.
  - Provide a minimal fallback navigation if the shared header cannot load.
*/

(function () {
  "use strict";

  window.OLC = window.OLC || {};

  /*
   * Run a feature safely.
   *
   * This version handles both:
   * - synchronous exceptions
   * - rejected Promises from async functions
   */
  if (typeof window.OLC.runFeature !== "function") {
    window.OLC.runFeature = function runFeature(name, fn) {
      try {
        if (typeof fn !== "function") {
          return Promise.resolve(undefined);
        }

        const result = fn();

        if (result && typeof result.then === "function") {
          return result.catch(function (error) {
            console.error(
              "[OceanLiners.net] " + name + " failed:",
              error
            );

            return undefined;
          });
        }

        return Promise.resolve(result);
      } catch (error) {
        console.error(
          "[OceanLiners.net] " + name + " failed:",
          error
        );

        return Promise.resolve(undefined);
      }
    };
  }

  /*
   * Global error storage and reporting.
   *
   * Errors can later be inspected with:
   * OLC.__errors
   */
  window.OLC.__errors = Array.isArray(window.OLC.__errors)
    ? window.OLC.__errors
    : [];

  function storeError(type, error, details) {
    const entry = {
      type: type,
      time: new Date().toISOString(),
      message:
        error && error.message
          ? error.message
          : String(error || "Unknown error"),
      name:
        error && error.name
          ? error.name
          : "Error",
      stack:
        error && error.stack
          ? error.stack
          : null,
      page: window.location.href
    };

    if (details && typeof details === "object") {
      Object.assign(entry, details);
    }

    window.OLC.__errors.push(entry);

    if (window.OLC.__errors.length > 50) {
      window.OLC.__errors.splice(
        0,
        window.OLC.__errors.length - 50
      );
    }

    return entry;
  }

  if (!window.OLC.__errorLoggingBound) {
    window.OLC.__errorLoggingBound = true;

    window.addEventListener("error", function (event) {
      const error =
        event.error ||
        new Error(event.message || "Unknown JavaScript error");

      const entry = storeError(
        "error",
        error,
        {
          filename: event.filename || null,
          line: event.lineno || null,
          column: event.colno || null
        }
      );

      console.error(
        "[OceanLiners.net JS error]",
        entry
      );
    });

    window.addEventListener(
      "unhandledrejection",
      function (event) {
        const reason = event.reason;

        const error =
          reason instanceof Error
            ? reason
            : new Error(
                typeof reason === "string"
                  ? reason
                  : "Unhandled Promise rejection"
              );

        const entry = storeError(
          "promise",
          error,
          {
            reason: reason
          }
        );

        console.error(
          "[OceanLiners.net Promise error]",
          entry
        );
      }
    );
  }

  /*
   * Run a callback after the document is ready.
   */
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        fn,
        { once: true }
      );
    } else {
      fn();
    }
  }

  /*
   * Shared events.
   */
  function dispatchHeaderReady(detail) {
    document.dispatchEvent(
      new CustomEvent(
        "olc:header-ready",
        {
          detail: detail || {}
        }
      )
    );
  }

  function dispatchHeaderFailed(error) {
    document.dispatchEvent(
      new CustomEvent(
        "olc:header-failed",
        {
          detail: {
            error: error
          }
        }
      )
    );
  }

  /*
   * Small Promise-based delay.
   */
  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  /*
   * Allow Safari to complete an injected DOM update.
   */
  function nextAnimationFrame() {
    return new Promise(function (resolve) {
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(function () {
          resolve();
        });
      } else {
        window.setTimeout(resolve, 16);
      }
    });
  }

  /*
   * Fetch text with retry and increasing delay.
   */
  async function fetchTextWithRetry(
    url,
    options,
    tries
  ) {
    let lastError = null;

    const totalTries =
      Number.isInteger(tries) && tries > 0
        ? tries
        : 3;

    for (
      let attempt = 1;
      attempt <= totalTries;
      attempt += 1
    ) {
      try {
        console.info(
          "[OceanLiners.net] Fetch attempt " +
            attempt +
            " of " +
            totalTries +
            ":",
          url
        );

        const response = await fetch(
          url,
          options || {}
        );

        if (!response.ok) {
          throw new Error(
            "Fetch failed: HTTP " +
              response.status +
              " " +
              response.statusText
          );
        }

        const text = await response.text();

        if (!text || !text.trim()) {
          throw new Error(
            "Fetch returned an empty response: " +
              url
          );
        }

        return text;
      } catch (error) {
        lastError = error;

        console.warn(
          "[OceanLiners.net] Fetch attempt " +
            attempt +
            " failed:",
          error
        );

        if (attempt < totalTries) {
          await sleep(200 * attempt);
        }
      }
    }

    throw (
      lastError ||
      new Error("Fetch failed: " + url)
    );
  }

  /*
   * Minimal navigation used only when the shared
   * header cannot be downloaded or validated.
   */
  function installFallbackHeader(
    mount,
    originalError
  ) {
    mount.innerHTML =
      '<header class="site-header" data-olc-fallback-header="true">' +
        '<div class="header-inner">' +
          '<nav class="site-nav" aria-label="Primary navigation">' +
            '<a class="nav-link" href="/">Home</a>' +
            '<a class="nav-link" href="/ships/ships">Ship Archive</a>' +
            '<a class="nav-link" href="/collections">Collections</a>' +
            '<a class="nav-link" href="/photos">Photos</a>' +
            '<a class="nav-link" href="/about">About</a>' +
            '<a class="nav-link" href="/contact">Contact</a>' +
          "</nav>" +
        "</div>" +
      "</header>";

    mount.dataset.olcHeaderLoaded = "fallback";

    dispatchHeaderFailed(originalError);

    dispatchHeaderReady({
      mount: mount,
      fallback: true,
      error: originalError
    });

    console.warn(
      "[OceanLiners.net] Fallback header installed."
    );
  }

  /*
   * Load and inject the shared header.
   */
  async function injectHeader() {
    const mount =
      document.getElementById("site-header");

    if (!mount) {
      const error = new Error(
        "Header mount #site-header was not found"
      );

      storeError(
        "header",
        error,
        {
          phase: "locate-mount"
        }
      );

      dispatchHeaderFailed(error);

      console.warn(
        "[OceanLiners.net]",
        error
      );

      return false;
    }

    /*
     * If the full header is already present, do not
     * download or inject it again.
     */
    if (
      mount.dataset.olcHeaderLoaded === "true" &&
      mount.querySelector(".site-header")
    ) {
      dispatchHeaderReady({
        mount: mount,
        alreadyLoaded: true
      });

      return true;
    }

    mount.dataset.olcHeaderLoaded = "loading";

    /*
     * The timestamp temporarily bypasses Safari's
     * cached copy of the fetched partial.
     *
     * Once the iOS beta issue is resolved, this can
     * be replaced with a fixed version:
     *
     * /partials/header.html?v=20260710-1
     */
    const headerUrl =
      "/partials/header.html?olc=" +
      Date.now();

    try {
      console.info(
        "[OceanLiners.net] Header fetch starting:",
        headerUrl
      );

      const html =
        await fetchTextWithRetry(
          headerUrl,
          {
            cache: "no-store",
            credentials: "same-origin"
          },
          3
        );

      /*
       * Inject the downloaded HTML.
       */
      mount.innerHTML = html;

      /*
       * Give Safari two rendering frames to complete
       * construction of the newly injected DOM.
       */
      await nextAnimationFrame();
      await nextAnimationFrame();

      /*
       * Confirm the partial contained the expected
       * header element.
       */
      const injectedHeader =
        mount.querySelector(".site-header");

      if (!injectedHeader) {
        throw new Error(
          "Header HTML was downloaded, but .site-header was not found"
        );
      }

      const injectedNav =
        mount.querySelector(".site-nav");

      if (!injectedNav) {
        console.warn(
          "[OceanLiners.net] Header loaded, but .site-nav was not found."
        );
      }

      mount.dataset.olcHeaderLoaded = "true";

      dispatchHeaderReady({
        mount: mount,
        header: injectedHeader,
        nav: injectedNav,
        source: headerUrl,
        htmlLength: html.length
      });

      console.info(
        "[OceanLiners.net] Header injected successfully:",
        html.length,
        "characters"
      );

      return true;
    } catch (error) {
      storeError(
        "header",
        error,
        {
          phase: "fetch-or-inject",
          source: headerUrl
        }
      );

      console.warn(
        "[OceanLiners.net] Header failed after retries:",
        error
      );

      installFallbackHeader(
        mount,
        error
      );

      return false;
    }
  }

  /*
   * Footer copyright.
   */
  function ensureFooterCopyright() {
    let copyright =
      document.querySelector(".copyright");

    if (!copyright) {
      let footer =
        document.querySelector("footer");

      if (!footer) {
        footer =
          document.createElement("footer");

        footer.className = "page-footer";

        document.body.appendChild(footer);
      }

      copyright =
        document.createElement("p");

      copyright.className = "copyright";

      copyright.textContent =
        "© 2026 Ocean Liner Curator LLC. All rights reserved.";

      footer.appendChild(copyright);
    }

    return copyright;
  }

  /*
   * Support link.
   */
  function ensureSupportLink(copyright) {
    if (!copyright) {
      return null;
    }

    let supportLink =
      document.querySelector(
        ".footer-support-link"
      );

    if (!supportLink) {
      supportLink =
        document.createElement("a");

      supportLink.className =
        "footer-support-link";

      supportLink.href = "/support";

      supportLink.textContent =
        "Support the Project";

      copyright.insertAdjacentElement(
        "afterend",
        supportLink
      );
    }

    return supportLink;
  }

  /*
   * Footer homepage star.
   */
  function ensureFooterStar(supportLink) {
    const existing =
      document.querySelector(".footer-star");

    if (existing) {
      if (
        existing.tagName &&
        existing.tagName.toLowerCase() !== "a"
      ) {
        const link =
          document.createElement("a");

        link.className =
          existing.className;

        link.href = "/";

        link.setAttribute(
          "aria-label",
          "Return to OceanLiners.net homepage"
        );

        link.textContent =
          existing.textContent || "★";

        existing.replaceWith(link);
      }

      return;
    }

    if (!supportLink) {
      return;
    }

    const star =
      document.createElement("a");

    star.className = "footer-star";
    star.href = "/";

    star.setAttribute(
      "aria-label",
      "Return to OceanLiners.net homepage"
    );

    star.textContent = "★";

    supportLink.insertAdjacentElement(
      "afterend",
      star
    );
  }

  /*
   * Page feedback widget.
   */
  function injectPageFeedback(copyright) {
    const excludedPages = ["/"];

    if (
      excludedPages.includes(
        window.location.pathname
      )
    ) {
      return;
    }

    if (
      !copyright ||
      document.querySelector(".olc-feedback")
    ) {
      return;
    }

    const feedback =
      document.createElement("section");

    feedback.className = "olc-feedback";

    feedback.setAttribute(
      "aria-label",
      "Page feedback"
    );

    feedback.innerHTML = `
      <p class="olc-feedback-title">
        Was this page worth exploring?
      </p>

      <div class="olc-feedback-actions">
        <button
          type="button"
          data-feedback="up"
          aria-label="Thumbs up"
        >
          ↑
        </button>

        <button
          type="button"
          data-feedback="down"
          aria-label="Thumbs down"
        >
          ↓
        </button>
      </div>

      <a
        href="/suggestions"
        class="satisfaction-suggest-link"
      >
        Have an idea or correction? Send a suggestion →
      </a>

      <a
        href="/bot-trap"
        class="bot-trap"
        aria-hidden="true"
        tabindex="-1"
      >
        hidden
      </a>

      <div
        class="olc-feedback-detail"
        hidden
      >
        <label for="olc-feedback-reason">
          Why?
        </label>

        <textarea
          id="olc-feedback-reason"
          placeholder="Tell the curator what was missing or could be improved..."
        ></textarea>

        <button
          type="button"
          class="olc-feedback-submit"
        >
          Send Feedback
        </button>
      </div>

      <p
        class="olc-feedback-response"
        hidden
      >
        Thank you — your feedback was sent.
      </p>
    `;

    copyright.insertAdjacentElement(
      "beforebegin",
      feedback
    );

    async function sendFeedback(
      vote,
      reason
    ) {
      if (
        typeof window.gtag === "function"
      ) {
        window.gtag(
          "event",
          "page_feedback",
          {
            feedback_vote: vote,
            feedback_reason: reason || "",
            page_path:
              window.location.pathname,
            page_title:
              document.title
          }
        );
      }

      try {
        const response = await fetch(
          "https://formspree.io/f/xykagjgl",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "Accept":
                "application/json"
            },
            body: JSON.stringify({
              vote: vote,
              reason: reason || "",
              page: window.location.href,
              title: document.title,
              timestamp:
                new Date().toISOString()
            })
          }
        );

        if (!response.ok) {
          throw new Error(
            "Feedback request failed: HTTP " +
              response.status
          );
        }
      } catch (error) {
        storeError(
          "feedback",
          error,
          {
            phase: "submit"
          }
        );

        console.warn(
          "[OceanLiners.net] Feedback submission failed:",
          error
        );
      }

      const responseMessage =
        feedback.querySelector(
          ".olc-feedback-response"
        );

      if (responseMessage) {
        responseMessage.hidden = false;
      }
    }

    let selectedVote = null;

    feedback.addEventListener(
      "click",
      function (event) {
        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        const button =
          target.closest(
            "button[data-feedback]"
          );

        if (!button) {
          return;
        }

        selectedVote =
          button.dataset.feedback;

        feedback
          .querySelectorAll(
            "button[data-feedback]"
          )
          .forEach(function (item) {
            item.classList.toggle(
              "selected",
              item === button
            );
          });

        const detail =
          feedback.querySelector(
            ".olc-feedback-detail"
          );

        const textarea =
          feedback.querySelector(
            "#olc-feedback-reason"
          );

        if (detail) {
          detail.hidden = false;
        }

        if (textarea) {
          textarea.required =
            selectedVote === "down";

          textarea.removeAttribute(
            "aria-invalid"
          );

          textarea.classList.remove(
            "feedback-error"
          );

          textarea.placeholder =
            selectedVote === "up"
              ? "What made this page useful or worth exploring?"
              : "Tell the curator what was missing or could be improved...";

          textarea.focus();
        }
      }
    );

    const submit =
      feedback.querySelector(
        ".olc-feedback-submit"
      );

    if (submit) {
      submit.addEventListener(
        "click",
        async function () {
          const textarea =
            feedback.querySelector(
              "#olc-feedback-reason"
            );

          const reason =
            textarea
              ? textarea.value.trim()
              : "";

          if (!selectedVote) {
            return;
          }

          if (
            selectedVote === "down" &&
            !reason
          ) {
            if (textarea) {
              textarea.required = true;

              textarea.setAttribute(
                "aria-invalid",
                "true"
              );

              textarea.classList.add(
                "feedback-error"
              );

              textarea.placeholder =
                "* Please tell the curator what was missing or could be improved...";

              textarea.focus();
            }

            return;
          }

          if (textarea) {
            textarea.removeAttribute(
              "aria-invalid"
            );

            textarea.classList.remove(
              "feedback-error"
            );
          }

          submit.disabled = true;

          await sendFeedback(
            selectedVote === "up"
              ? "⬆"
              : "⬇",
            reason
          );

          const detail =
            feedback.querySelector(
              ".olc-feedback-detail"
            );

          if (detail) {
            detail.hidden = true;
          }

          feedback
            .querySelectorAll(
              "button[data-feedback]"
            )
            .forEach(function (button) {
              button.disabled = true;
            });
        }
      );
    }
  }

  /*
   * Google Analytics.
   */
  function injectGA() {
    const GA_SRC =
      "https://www.googletagmanager.com/gtag/js?id=G-JPZ291Q3RB";

    if (
      document.querySelector(
        'script[src^="https://www.googletagmanager.com/gtag/js"]'
      )
    ) {
      return;
    }

    const script =
      document.createElement("script");

    script.src = GA_SRC;
    script.async = true;

    document.head.appendChild(script);

    window.dataLayer =
      window.dataLayer || [];

    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(
          arguments
        );
      };

    window.gtag(
      "js",
      new Date()
    );

    window.gtag(
      "config",
      "G-JPZ291Q3RB"
    );
  }

  /*
   * Simple Analytics.
   */
  function injectSimpleAnalytics() {
    const SRC =
      "https://scripts.simpleanalyticscdn.com/latest.js";

    if (
      document.querySelector(
        'script[src="' + SRC + '"]'
      )
    ) {
      return;
    }

    const script =
      document.createElement("script");

    script.src = SRC;
    script.async = true;

    document.head.appendChild(script);
  }

  /*
   * Public repair command.
   *
   * From the console:
   * OLC.reloadHeader()
   */
  window.OLC.reloadHeader =
    async function reloadHeader() {
      const mount =
        document.getElementById(
          "site-header"
        );

      if (!mount) {
        console.error(
          "[OceanLiners.net] Cannot reload header: #site-header is missing."
        );

        return false;
      }

      mount.removeAttribute(
        "data-olc-header-loaded"
      );

      mount.replaceChildren();

      return window.OLC.runFeature(
        "Manual header reload",
        injectHeader
      );
    };

  /*
   * Public header status command.
   *
   * From the console:
   * OLC.headerStatus()
   */
  window.OLC.headerStatus =
    function headerStatus() {
      const mount =
        document.getElementById(
          "site-header"
        );

      const status = {
        mountExists: Boolean(mount),
        mountHtmlLength:
          mount
            ? mount.innerHTML.length
            : 0,
        loadState:
          mount
            ? mount.dataset
                .olcHeaderLoaded || null
            : null,
        headerExists:
          Boolean(
            document.querySelector(
              "#site-header .site-header"
            )
          ),
        navExists:
          Boolean(
            document.querySelector(
              "#site-header .site-nav"
            )
          ),
        dropdownCount:
          document.querySelectorAll(
            "#site-header .nav-dropdown"
          ).length
      };

      console.table(status);

      return status;
    };

  /*
   * Main initialization.
   */
  onReady(async function () {
    /*
     * Header is attempted first because it is the
     * most visible shared dependency.
     *
     * The rest of the page still initializes even
     * if the full header fetch fails.
     */
    await window.OLC.runFeature(
      "Header injection",
      injectHeader
    );

    const copyright =
      await window.OLC.runFeature(
        "Footer copyright",
        ensureFooterCopyright
      );

    const supportLink =
      await window.OLC.runFeature(
        "Footer support link",
        function () {
          return ensureSupportLink(
            copyright
          );
        }
      );

    await window.OLC.runFeature(
      "Footer star",
      function () {
        ensureFooterStar(
          supportLink
        );
      }
    );

    await window.OLC.runFeature(
      "Page feedback widget",
      function () {
        injectPageFeedback(
          copyright
        );
      }
    );

    await window.OLC.runFeature(
      "Google Analytics",
      injectGA
    );

    await window.OLC.runFeature(
      "Simple Analytics",
      injectSimpleAnalytics
    );

    console.info(
      "[OceanLiners.net] Shared header/footer initialization complete."
    );
  });
})();