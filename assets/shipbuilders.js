(function () {
  'use strict';

  const state = { data: null, query: '', letter: 'All' };
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function yearRange(builder) {
    if (!builder.firstLaunchYear && !builder.lastLaunchYear) return 'Launch years vary';
    if (builder.firstLaunchYear === builder.lastLaunchYear) return String(builder.firstLaunchYear);
    return [builder.firstLaunchYear, builder.lastLaunchYear].filter(Boolean).join('–');
  }

  function locationSummary(builder) {
    const locations = (builder.locations || []).filter(Boolean);
    if (!locations.length) return 'Yard location varies by ship record';
    if (locations.length <= 2) return locations.join(' · ');
    return locations.slice(0, 2).join(' · ') + ` · +${locations.length - 2} more`;
  }

  function shipList(builder) {
    return builder.ships.map(ship => {
      const meta = [ship.launchYear, ship.operator].filter(Boolean).join(' · ');
      const raw = ship.builderRaw && ship.builderRaw !== builder.name
        ? `<span class="builder-raw">Recorded builder: ${escapeHtml(ship.builderRaw)}</span>`
        : '';
      return `<li><a href="${escapeHtml(ship.url)}">${escapeHtml(ship.name)}</a>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}${raw}</li>`;
    }).join('');
  }

  function card(builder) {
    return `<article class="builder-card" id="builder-${escapeHtml(builder.id)}">
      <button class="builder-head" type="button" aria-expanded="false">
        <span>
          <strong>${escapeHtml(builder.name)}</strong>
          <small>${escapeHtml(locationSummary(builder))}</small>
        </span>
        <span class="builder-count">${builder.shipCount} ${builder.shipCount === 1 ? 'ship' : 'ships'}</span>
      </button>
      <div class="builder-body" hidden>
        <div class="builder-meta"><span>Archive span: ${escapeHtml(yearRange(builder))}</span><span>${builder.shipCount} documented ${builder.shipCount === 1 ? 'liner' : 'liners'}</span></div>
        <ul>${shipList(builder)}</ul>
      </div>
    </article>`;
  }

  function openHashTarget() {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const button = target.querySelector('.builder-head');
    const body = target.querySelector('.builder-body');
    if (button && body) {
      button.setAttribute('aria-expanded', 'true');
      body.hidden = false;
    }
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function render() {
    if (!state.data) return;
    const query = normalize(state.query.trim());
    const builders = state.data.builders.filter(builder => {
      if (state.letter !== 'All' && builder.name.charAt(0).toUpperCase() !== state.letter) return false;
      if (!query) return true;
      const haystack = normalize([
        builder.name,
        ...(builder.locations || []),
        ...builder.ships.flatMap(ship => [ship.name, ship.operator, ship.builderRaw])
      ].filter(Boolean).join(' '));
      return haystack.includes(query);
    });

    $('builder-results').innerHTML = builders.length ? builders.map(card).join('') : '<p class="empty">No builders match that search.</p>';
    $('result-count').textContent = `${builders.length} ${builders.length === 1 ? 'builder' : 'builders'}`;

    document.querySelectorAll('.builder-head').forEach(button => {
      button.addEventListener('click', () => {
        const body = button.nextElementSibling;
        const open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
      });
    });
    openHashTarget();
  }

  function renderLetters(builders) {
    const letters = [...new Set(builders.map(builder => builder.name.charAt(0).toUpperCase()).filter(letter => /[A-Z]/.test(letter)))].sort();
    $('letter-filter').innerHTML = ['All', ...letters].map(letter => `<button type="button" data-letter="${letter}" class="${letter === 'All' ? 'active' : ''}">${letter}</button>`).join('');
    $('letter-filter').addEventListener('click', event => {
      const button = event.target.closest('button[data-letter]');
      if (!button) return;
      state.letter = button.dataset.letter;
      document.querySelectorAll('#letter-filter button').forEach(item => item.classList.toggle('active', item === button));
      render();
    });
  }

  fetch('/tools/search/builders-data.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Builder data HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      state.data = data;
      $('builder-total').textContent = data.summary.canonicalBuilders;
      $('ship-total').textContent = data.summary.guidesWithBuilder;
      renderLetters(data.builders);
      render();
    })
    .catch(error => {
      console.error('[OceanLiners.net] Shipbuilders index failed:', error);
      $('builder-results').innerHTML = '<p class="empty">The shipbuilder index is temporarily unavailable.</p>';
    });

  $('builder-search').addEventListener('input', event => {
    state.query = event.target.value;
    render();
  });
  window.addEventListener('hashchange', openHashTarget);
})();
