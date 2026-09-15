(function () {
  'use strict';

  const state = { lines: [], query: '', letter: 'All', summary: null };
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function serviceSpan(line) {
    const years = line.ships.map(ship => Number(ship.serviceStartYear || ship.launchYear)).filter(Number.isFinite).sort((a, b) => a - b);
    if (!years.length) return 'Service years vary';
    if (years[0] === years[years.length - 1]) return String(years[0]);
    return `${years[0]}–${years[years.length - 1]}`;
  }

  function builderSummary(line) {
    const builders = [...new Set(line.ships.flatMap(ship => ship.builders || []).filter(Boolean))].sort();
    if (!builders.length) return 'Builders vary by ship record';
    if (builders.length <= 2) return builders.join(' · ');
    return `${builders.slice(0, 2).join(' · ')} · +${builders.length - 2} more`;
  }

  function shipList(line) {
    return line.ships.map(ship => {
      const builders = (ship.builders || []).join(' · ');
      const year = ship.serviceStartYear || ship.launchYear;
      const meta = [year, builders].filter(Boolean).join(' · ');
      const raw = ship.operatorRaw && normalize(ship.operatorRaw) !== normalize(line.name)
        ? `<span class="line-raw">Recorded operator: ${escapeHtml(ship.operatorRaw)}</span>`
        : '';
      return `<li><a href="${escapeHtml(ship.url)}">${escapeHtml(ship.name)}</a>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}${raw}</li>`;
    }).join('');
  }

  function card(line) {
    const variants = (line.rawValues || []).filter(value => normalize(value) !== normalize(line.name));
    return `<article class="line-card" id="line-${escapeHtml(line.id)}">
      <button class="line-head" type="button" aria-expanded="false">
        <span>
          <strong>${escapeHtml(line.name)}</strong>
          <small>${escapeHtml(builderSummary(line))}</small>
        </span>
        <span class="line-count">${line.shipCount} ${line.shipCount === 1 ? 'ship' : 'ships'}</span>
      </button>
      <div class="line-body" hidden>
        <div class="line-meta"><span>Archive span: ${escapeHtml(serviceSpan(line))}</span><span>${line.shipCount} documented ${line.shipCount === 1 ? 'liner' : 'liners'}</span>${variants.length ? `<span>${variants.length} historical/name ${variants.length === 1 ? 'variant' : 'variants'}</span>` : ''}</div>
        <ul>${shipList(line)}</ul>
      </div>
    </article>`;
  }

  function openHashTarget() {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const button = target.querySelector('.line-head');
    const body = target.querySelector('.line-body');
    if (button && body) {
      button.setAttribute('aria-expanded', 'true');
      body.hidden = false;
    }
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function render() {
    const query = normalize(state.query.trim());
    const lines = state.lines.filter(line => {
      if (state.letter !== 'All' && line.name.charAt(0).toUpperCase() !== state.letter) return false;
      if (!query) return true;
      const haystack = normalize([
        line.name,
        ...(line.rawValues || []),
        ...line.ships.flatMap(ship => [ship.name, ship.operatorRaw, ...(ship.builders || [])])
      ].filter(Boolean).join(' '));
      return haystack.includes(query);
    });

    $('line-results').innerHTML = lines.length ? lines.map(card).join('') : '<p class="empty">No shipping lines match that search.</p>';
    $('result-count').textContent = `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`;

    document.querySelectorAll('.line-head').forEach(button => {
      button.addEventListener('click', () => {
        const body = button.nextElementSibling;
        const open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
      });
    });
    openHashTarget();
  }

  function renderLetters(lines) {
    const letters = [...new Set(lines.map(line => line.name.charAt(0).toUpperCase()).filter(letter => /[A-Z]/.test(letter)))].sort();
    $('letter-filter').innerHTML = ['All', ...letters].map(letter => `<button type="button" data-letter="${letter}" class="${letter === 'All' ? 'active' : ''}">${letter}</button>`).join('');
    $('letter-filter').addEventListener('click', event => {
      const button = event.target.closest('button[data-letter]');
      if (!button) return;
      state.letter = button.dataset.letter;
      document.querySelectorAll('#letter-filter button').forEach(item => item.classList.toggle('active', item === button));
      render();
    });
  }

  Promise.all([
    fetch('/data/curatoros-operators.json', { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`Operator data HTTP ${response.status}`);
      return response.json();
    }),
    fetch('/data/curatoros-builders.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : null),
    fetch('/data/curatoros-eras.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : null)
  ])
    .then(([operators, builders, eras]) => {
      const builderByPath = new Map((builders?.ships || []).map(ship => [ship.path, (ship.builders || []).map(builder => builder.name).filter(Boolean)]));
      const eraByPath = new Map((eras?.ships || []).map(ship => [ship.path, ship]));
      const shipsByOperator = new Map();

      for (const ship of operators.ships || []) {
        if (!shipsByOperator.has(ship.operator)) shipsByOperator.set(ship.operator, []);
        const era = eraByPath.get(ship.path) || {};
        shipsByOperator.get(ship.operator).push({
          ...ship,
          builders: builderByPath.get(ship.path) || [],
          serviceStartYear: era.serviceStartYear || ship.launchYear || null
        });
      }

      state.lines = (operators.operators || []).map(line => ({
        ...line,
        ships: (shipsByOperator.get(line.name) || []).sort((a, b) => {
          const ay = Number(a.serviceStartYear || 9999);
          const by = Number(b.serviceStartYear || 9999);
          return ay - by || a.name.localeCompare(b.name);
        })
      }));
      state.summary = operators.summary || {};
      $('line-total').textContent = state.summary.canonicalOperators || state.lines.length;
      $('ship-total').textContent = state.summary.guidesWithOperator || (operators.ships || []).length;
      renderLetters(state.lines);
      render();
    })
    .catch(error => {
      console.error('[OceanLiners.net] Shipping Lines index failed:', error);
      $('line-results').innerHTML = '<p class="empty">The shipping-lines index is temporarily unavailable.</p>';
    });

  $('line-search').addEventListener('input', event => {
    state.query = event.target.value;
    render();
  });
  window.addEventListener('hashchange', openHashTarget);
})();
