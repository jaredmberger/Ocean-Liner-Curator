/*
  Ocean Liner Curator — hardened shared header/footer script
  Purpose: keep header/nav/footer/feedback/analytics isolated so one failure does not
  prevent the rest of the page from initializing, with Safari/iOS-friendly header retry.
*/
(function () {
  "use strict";

  window.OLC = window.OLC || {};

  if (typeof window.OLC.runFeature !== "function") {
    window.OLC.runFeature = function runFeature(name, fn) {
      try {
        if (typeof fn === "function") return fn();
      } catch (err) {
        console.error("[OceanLiners.net] " + name + " failed:", err);
      }
      return undefined;
    };
  }

  if (!window.OLC.__errorLoggingBound) {
    window.OLC.__errorLoggingBound = true;

    window.addEventListener("error", function (event) {
      console.error(
        "[OceanLiners.net JS error]",
        event.message,
        event.filename,
        event.lineno,
        event.colno
      );
    });

    window.addEventListener("unhandledrejection", function (event) {
      console.error("[OceanLiners.net Promise error]", event.reason);
    });
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function dispatchHeaderReady(detail) {
    document.dispatchEvent(new CustomEvent("olc:header-ready", { detail: detail || {} }));
  }

  function dispatchHeaderFailed(error) {
    document.dispatchEvent(new CustomEvent("olc:header-failed", { detail: { error: error } }));
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  async function fetchTextWithRetry(url, options, tries) {
    let lastError = null;
    const totalTries = tries || 3;

    for (let attempt = 1; attempt <= totalTries; attempt++) {
      try {
        const res = await fetch(url, options || {});
        if (!res.ok) throw new Error("Fetch failed: " + res.status + " " + res.statusText);
        return await res.text();
      } catch (err) {
        lastError = err;
        if (attempt < totalTries) await sleep(150 * attempt);
      }
    }

    throw lastError || new Error("Fetch failed: " + url);
  }

  async function injectHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) {
      dispatchHeaderFailed(new Error("Header mount #site-header not found"));
      return;
    }

    if (mount.dataset.olcHeaderLoaded === "true") {
      dispatchHeaderReady({ mount: mount, alreadyLoaded: true });
      return;
    }

    try {
      const html = await fetchTextWithRetry(
        "/partials/header.html",
        {
          cache: "no-cache",
          credentials: "same-origin"
        },
        3
      );

      mount.innerHTML = html;
      mount.dataset.olcHeaderLoaded = "true";
      dispatchHeaderReady({ mount: mount, source: "/partials/header.html" });
    } catch (err) {
      console.warn("[OceanLiners.net] Header fetch failed after retries:", err);

      /* Minimal fail-safe navigation. This only appears if /partials/header.html cannot load. */
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
            '</nav>' +
          '</div>' +
        '</header>';

      mount.dataset.olcHeaderLoaded = "fallback";
      dispatchHeaderFailed(err);
      dispatchHeaderReady({ mount: mount, fallback: true, error: err });
    }
  }

  function ensureFooterCopyright() {
    let copyright = document.querySelector(".copyright");

    if (!copyright) {
      let footer = document.querySelector("footer");

      if (!footer) {
        footer = document.createElement("footer");
        footer.className = "page-footer";
        document.body.appendChild(footer);
      }

      copyright = document.createElement("p");
      copyright.className = "copyright";
      copyright.textContent = "© 2026 Ocean Liner Curator LLC. All rights reserved.";

      footer.appendChild(copyright);
    }

    return copyright;
  }

  function ensureSupportLink(copyright) {
    if (!copyright) return null;

    let supportLink = document.querySelector(".footer-support-link");

    if (!supportLink) {
      supportLink = document.createElement("a");
      supportLink.className = "footer-support-link";
      supportLink.href = "/support";
      supportLink.textContent = "Support the Project";

      copyright.insertAdjacentElement("afterend", supportLink);
    }

    return supportLink;
  }

  function ensureFooterStar(supportLink) {
    const existing = document.querySelector(".footer-star");

    if (existing) {
      if (existing.tagName && existing.tagName.toLowerCase() !== "a") {
        const link = document.createElement("a");
        link.className = existing.className;
        link.href = "/";
        link.setAttribute("aria-label", "Return to OceanLiners.net homepage");
        link.textContent = existing.textContent || "★";

        existing.replaceWith(link);
      }
      return;
    }

    if (!supportLink) return;

    const star = document.createElement("a");
    star.className = "footer-star";
    star.href = "/";
    star.setAttribute("aria-label", "Return to OceanLiners.net homepage");
    star.textContent = "★";

    supportLink.insertAdjacentElement("afterend", star);
  }

  function injectPageFeedback(copyright) {
    const excludedPages = ["/"];

    if (excludedPages.includes(location.pathname)) return;
    if (!copyright || document.querySelector(".olc-feedback")) return;

    const feedback = document.createElement("section");
    feedback.className = "olc-feedback";
    feedback.setAttribute("aria-label", "Page feedback");

    feedback.innerHTML = `
      <p class="olc-feedback-title">Was this page worth exploring?</p>

      <div class="olc-feedback-actions">
        <button type="button" data-feedback="up" aria-label="Thumbs up">↑</button>
        <button type="button" data-feedback="down" aria-label="Thumbs down">↓</button>
      </div>
      
      <a href="/suggestions" class="satisfaction-suggest-link">
        Have an idea or correction? Send a suggestion →
      </a>

      <a href="/bot-trap"
         class="bot-trap"
         aria-hidden="true"
         tabindex="-1">
         hidden
      </a>

      <div class="olc-feedback-detail" hidden>
        <label for="olc-feedback-reason">Why?</label>
        <textarea
          id="olc-feedback-reason"
          placeholder="Tell the curator what was missing or could be improved..."
        ></textarea>

        <button type="button" class="olc-feedback-submit">
          Send Feedback
        </button>
      </div>

      <p class="olc-feedback-response" hidden>
        Thank you — your feedback was sent.
      </p>
    `;

    copyright.insertAdjacentElement("beforebegin", feedback);

    async function sendFeedback(vote, reason) {
      if (typeof window.gtag === "function") {
        window.gtag("event", "page_feedback", {
          feedback_vote: vote,
          feedback_reason: reason || "",
          page_path: window.location.pathname,
          page_title: document.title
        });
      }

      try {
        await fetch("https://formspree.io/f/xykagjgl", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            vote: vote,
            reason: reason || "",
            page: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn("Feedback email failed:", err);
      }

      const response = feedback.querySelector(".olc-feedback-response");
      if (response) response.hidden = false;
    }

    let selectedVote = null;

    feedback.addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-feedback]");
      if (!btn) return;

      selectedVote = btn.dataset.feedback;

      feedback.querySelectorAll("button[data-feedback]").forEach(function (b) {
        b.classList.toggle("selected", b === btn);
      });

      const detail = feedback.querySelector(".olc-feedback-detail");
      const textarea = feedback.querySelector("#olc-feedback-reason");

      if (detail) detail.hidden = false;

      if (textarea) {
        textarea.required = selectedVote === "down";
        textarea.removeAttribute("aria-invalid");
        textarea.classList.remove("feedback-error");

        textarea.placeholder =
          selectedVote === "up"
            ? "What made this page useful or worth exploring?"
            : "Tell the curator what was missing or could be improved...";

        textarea.focus();
      }
    });

    const submit = feedback.querySelector(".olc-feedback-submit");

    if (submit) {
      submit.addEventListener("click", async function () {
        const textarea = feedback.querySelector("#olc-feedback-reason");
        const reason = textarea ? textarea.value.trim() : "";

        if (!selectedVote) return;

        if (selectedVote === "down" && !reason) {
          if (textarea) {
            textarea.required = true;
            textarea.setAttribute("aria-invalid", "true");
            textarea.classList.add("feedback-error");
            textarea.placeholder = "* Please tell the curator what was missing or could be improved...";
            textarea.focus();
          }
          return;
        }

        if (textarea) {
          textarea.removeAttribute("aria-invalid");
          textarea.classList.remove("feedback-error");
        }

        submit.disabled = true;

        await sendFeedback(selectedVote === "up" ? "⬆" : "⬇", reason);

        const detail = feedback.querySelector(".olc-feedback-detail");
        if (detail) detail.hidden = true;

        feedback.querySelectorAll("button[data-feedback]").forEach(function (b) {
          b.disabled = true;
        });
      });
    }
  }

  function injectGA() {
    const GA_SRC = "https://www.googletagmanager.com/gtag/js?id=G-JPZ291Q3RB";

    if (document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return;

    const s = document.createElement("script");
    s.src = GA_SRC;
    s.async = true;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", "G-JPZ291Q3RB");
  }

  function injectSimpleAnalytics() {
    const SRC = "https://scripts.simpleanalyticscdn.com/latest.js";

    if (document.querySelector('script[src="' + SRC + '"]')) return;

    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    document.head.appendChild(s);
  }

  onReady(function () {
    /* Header first: this is the most visible shared dependency. */
    window.OLC.runFeature("Header injection", function () {
      injectHeader();
    });

    const copyright = window.OLC.runFeature("Footer copyright", ensureFooterCopyright);
    const supportLink = window.OLC.runFeature("Footer support link", function () {
      return ensureSupportLink(copyright);
    });

    window.OLC.runFeature("Footer star", function () {
      ensureFooterStar(supportLink);
    });

    window.OLC.runFeature("Page feedback widget", function () {
      injectPageFeedback(copyright);
    });

    window.OLC.runFeature("Google Analytics", injectGA);
    window.OLC.runFeature("Simple Analytics", injectSimpleAnalytics);
  });
})();
