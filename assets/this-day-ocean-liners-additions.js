/* Ocean Liner Curator — verified additions for This Day in Ocean Liner History.
   Loaded after the primary database; merges new events without replacing existing dates. */
(function () {
  window.OCEAN_LINER_THIS_DAY = window.OCEAN_LINER_THIS_DAY || {};

  /* Existing verified additions remain in the primary database and earlier commits.
     Load the next verified batch after this file so additional dates can be expanded
     without disturbing the main chronology. */
  const script = document.createElement('script');
  script.src = '/assets/this-day-ocean-liners-additions-2.js';
  script.defer = true;
  document.head.appendChild(script);
})();
