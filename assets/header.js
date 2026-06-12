document.addEventListener("DOMContentLoaded", async () => {
  // ---- Ensure footer/copyright exists ----
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
    copyright.textContent = "© 2026 Ocean Liner Curator. All rights reserved.";

    footer.appendChild(copyright);
  }

  // ---- Footer star homepage link ----
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

  // ---- Page feedback widget ----
  (function injectPageFeedback() {
    const excludedPages = [
      "/"
    ];

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

    async function sendFeedback(vote, reason = "") {
      if (typeof gtag === "function") {
        gtag("event", "page_feedback", {
          feedback_vote: vote,
          feedback_reason: reason,
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
            vote,
            reason,
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

    feedback.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-feedback]");
      if (!btn) return;

      const vote = btn.dataset.feedback;

      feedback.querySelectorAll("button[data-feedback]").forEach((b) => {
        b.disabled = true;
        b.classList.toggle("selected", b === btn);
      });

      if (vote === "down") {
        const detail = feedback.querySelector(".olc-feedback-detail");
        const textarea = feedback.querySelector("#olc-feedback-reason");

        if (detail) detail.hidden = false;
        if (textarea) textarea.focus();

        return;
      }

      await sendFeedback("⬆", "");
    });

    const submit = feedback.querySelector(".olc-feedback-submit");

    if (submit) {
      submit.addEventListener("click", async () => {
        const textarea = feedback.querySelector("#olc-feedback-reason");
        const reason = textarea ? textarea.value.trim() : "";

        submit.disabled = true;
        await sendFeedback("⬇", reason);

        const detail = feedback.querySelector(".olc-feedback-detail");
        if (detail) detail.hidden = true;
      });
    }
  })();

  // ---- Google Analytics ----
  (function injectGA() {
    const GA_SRC = "https://www.googletagmanager.com/gtag/js?id=G-JPZ291Q3RB";

    if (document.querySelector(`script[src^="https://www.googletagmanager.com/gtag/js"]`)) return;

    const s = document.createElement("script");
    s.src = GA_SRC;
    s.async = true;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      dataLayer.push(arguments);
    };

    gtag("js", new Date());
    gtag("config", "G-JPZ291Q3RB");
  })();

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