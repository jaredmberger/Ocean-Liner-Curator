/* Ocean Liner Curator — centralized ship-guide research handoff.
   The plugin cannot currently be assumed to accept a prefilled prompt via URL.
   Keep the prompt on the visitor's clipboard and offer a manual-copy fallback. */
(function () {
  "use strict";
  if (window.OLCShipGPT && window.OLCShipGPT.initialized) return;

  const PLUGIN_URL = "https://chatgpt.com/plugins/plugin_asdk_app_6ae3cef4f504819195e28d3175d3bd66";
  const BUTTON_SELECTOR = "button.ask-gpt, button#ask-gpt-btn";
  let overlay = null;
  let promptField = null;
  let statusText = null;
  let lastTrigger = null;

  function guideTitle() {
    const heading = document.querySelector("main h1") || document.querySelector("h1");
    return (heading && heading.textContent.trim()) || document.title.split("|")[0].trim() || "this ocean liner";
  }

  function guideURL() {
    const canonical = document.querySelector('link[rel="canonical"]');
    try {
      const url = new URL((canonical && canonical.href) || location.href, location.href);
      if (url.origin === location.origin) return url.href;
    } catch (_) {}
    return location.href;
  }

  function buildPrompt() {
    return "I'm reading Ocean Liner Curator's guide to " + guideTitle() + ":\n" +
      guideURL() + "\n\n" +
      "Help me explore this ship further using Ocean Liner Curator's archive where relevant. " +
      "Distinguish documented facts, reasonable inferences, and unresolved questions. " +
      "Identify relevant primary or scholarly sources and explain what evidence supports important claims. " +
      "Do not invent sources or treat speculation as established history.";
  }

  function ensureDialog() {
    if (overlay) return;
    const style = document.createElement("style");
    style.id = "olc-ship-gpt-style";
    style.textContent = [
      ".olc-gpt-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(4,11,12,.8);display:none;align-items:center;justify-content:center;padding:1rem}",
      ".olc-gpt-overlay.is-open{display:flex}",
      ".olc-gpt-dialog{box-sizing:border-box;width:min(100%,580px);max-height:90vh;overflow:auto;background:#13201e;color:#f0e9d7;border:1px solid #bfa46a;border-radius:14px;padding:1.35rem;box-shadow:0 16px 60px rgba(0,0,0,.55);font-family:Spectral,Georgia,serif}",
      ".olc-gpt-dialog h2{margin:0 0 .5rem;font-family:'Libre Baskerville',Georgia,serif;font-size:1.18rem;color:#e1c78d}",
      ".olc-gpt-dialog p{margin:.5rem 0 1rem;line-height:1.5}",
      ".olc-gpt-dialog textarea{box-sizing:border-box;width:100%;min-height:115px;max-height:28vh;resize:vertical;background:#081210;color:#f7f2e8;border:1px solid #746747;border-radius:7px;padding:.7rem;font:14px/1.45 system-ui,sans-serif}",
      ".olc-gpt-actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}",
      ".olc-gpt-actions button,.olc-gpt-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.6rem .85rem;border:1px solid #bfa46a;border-radius:7px;font:600 14px system-ui,sans-serif;cursor:pointer;text-decoration:none}",
      ".olc-gpt-actions a{background:#bfa46a;color:#10201c}",
      ".olc-gpt-actions button{background:transparent;color:#f0e9d7}",
      ".olc-gpt-status{font-size:.92rem;color:#d7ccb5}"
    ].join("");
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.className = "olc-gpt-overlay";
    overlay.innerHTML =
      '<section class="olc-gpt-dialog" role="dialog" aria-modal="true" aria-labelledby="olc-gpt-title" tabindex="-1">' +
      '<h2 id="olc-gpt-title">★ Continue your ship research</h2>' +
      '<p class="olc-gpt-status" role="status" aria-live="polite"></p>' +
      '<label for="olc-gpt-prompt">Research prompt</label>' +
      '<textarea id="olc-gpt-prompt" readonly aria-label="Research prompt to paste in ChatGPT"></textarea>' +
      '<div class="olc-gpt-actions">' +
      '<button type="button" data-gpt-copy>Copy prompt</button>' +
      '<a href="' + PLUGIN_URL + '" target="_blank" rel="noopener noreferrer">Open Ocean Liner GPT ↗</a>' +
      '<button type="button" data-gpt-close>Cancel</button>' +
      '</div>' +
      '<p style="font-size:.9rem">Paste the copied prompt into ChatGPT after opening the plugin. Ocean Liner GPT is a research assistant, not an authority.</p>' +
      '</section>';
    document.body.appendChild(overlay);
    promptField = overlay.querySelector("textarea");
    statusText = overlay.querySelector(".olc-gpt-status");
    overlay.querySelector("[data-gpt-copy]").addEventListener("click", function () {
      copyPrompt(promptField.value).then(function (copied) {
        statusText.textContent = copied ? "Prompt copied. Open the plugin and paste it into ChatGPT." :
          "Automatic copying is unavailable. Select the prompt above and copy it manually.";
        if (!copied) { promptField.focus(); promptField.select(); }
      });
    });
    overlay.querySelector("[data-gpt-close]").addEventListener("click", closeDialog);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeDialog();
    });
    document.addEventListener("keydown", function (event) {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") { event.preventDefault(); closeDialog(); }
      if (event.key === "Tab") {
        const focusables = Array.from(overlay.querySelectorAll("textarea,button,a"));
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
  }

  function closeDialog() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  }

  async function copyPrompt(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(value); return true; } catch (_) {}
    }
    const input = document.createElement("textarea");
    input.value = value;
    input.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(input);
    input.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (_) {}
    input.remove();
    return copied;
  }

  async function launch(trigger) {
    lastTrigger = trigger || document.activeElement;
    ensureDialog();
    promptField.value = buildPrompt();
    overlay.classList.add("is-open");
    statusText.textContent = "Preparing your research prompt…";
    overlay.querySelector(".olc-gpt-dialog").focus();
    const copied = await copyPrompt(promptField.value);
    statusText.textContent = copied ?
      "Prompt copied. Open Ocean Liner GPT, then paste it into ChatGPT." :
      "Automatic copying is unavailable. Select and copy the prompt below before opening ChatGPT.";
    if (!copied) { promptField.focus(); promptField.select(); }
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest(BUTTON_SELECTOR);
    if (!button || !location.pathname.startsWith("/ships/")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    launch(button);
  }, true);

  window.OLCShipGPT = { initialized: true, url: PLUGIN_URL, buildPrompt: buildPrompt, open: launch };
  window.askOceanLinerGPT = function () { launch(document.activeElement); };
})();