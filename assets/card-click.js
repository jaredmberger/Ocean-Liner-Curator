document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".guide-card").forEach(card => {

    const link = card.querySelector(".guide-title[href]");
    if (!link) return;

    // cursor hint
    card.style.cursor = "pointer";

    card.addEventListener("click", (e) => {

      // ignore real links / buttons
      if (e.target.closest("a, button")) return;

      window.location.href = link.href;
    });

    // keyboard accessibility
    card.setAttribute("tabindex", "0");

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = link.href;
      }
    });

  });

});