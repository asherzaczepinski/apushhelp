(function () {
  const U = (window.APUSH || {}).units || [];
  const C = (window.APUSH || {}).chapters || {};
  const app = document.getElementById('app');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const unitOf = n => U.find(u => u.chapters.includes(Number(n)));
  const chap = n => C[String(n)];
  const chTitle = n => (chap(n) ? chap(n).title : 'Chapter ' + n);

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  // ---------------------------------------------------------- views

  function home() {
    if (!U.length) {
      return '<h1>No data yet</h1><p>Run <code>python3 build_data.py</code> in the project folder, then reload.</p>';
    }
    return `
    <h1 class="cover">Nine periods.<br>Twenty-eight chapters.<br>One republic.</h1>
    <p class="cover-note">Summaries, big ideas, key terms, and timelines distilled from your ebook. Pick a period.</p>
    <a class="map-callout" href="#/map">The colonies map — open a colony, run its docks, train its militia.</a>
    <a class="map-callout play-callout" href="#/play">Become history — role-play a real figure: build a fortune, face the frontier, earn your rank.</a>
    <nav class="units">
      ${U.map(u => `
      <a class="band" href="#/unit/${u.id}">
        <span class="era">${esc(u.years)}</span>
        <span class="band-main">
          <strong>Unit ${u.id} — ${esc(u.name)}</strong>
          ${u.chapters.map(n => `<span class="band-ch">Ch ${n}. ${esc(chTitle(n))}</span>`).join('')}
        </span>
        <span class="weight">${esc(u.weight)}</span>
      </a>`).join('')}
    </nav>`;
  }

  function unit(id) {
    const u = U.find(x => x.id === Number(id));
    if (!u) return notFound();
    return `
    <p class="crumb"><a href="#/">All periods</a></p>
    <header class="unit-head">
      <p class="era big">${esc(u.years)}</p>
      <h1>Unit ${u.id} — ${esc(u.name)}</h1>
      <p><a class="btn" href="#/quiz/${u.id}">Quiz this unit's terms</a></p>
    </header>
    <ul class="ch-list">
      ${u.chapters.map(n => {
        const c = chap(n);
        return `<li><a href="#/ch/${n}">
          <span class="ch-no">${n}</span>
          <span class="ch-body"><strong>${esc(chTitle(n))}</strong>
          <span class="hook">${esc(c ? (c.big_ideas || [])[0] || '' : 'summary still generating')}</span></span>
        </a></li>`;
      }).join('')}
    </ul>`;
  }

  function chapter(n) {
    n = Number(n);
    const u = unitOf(n);
    if (!u) return notFound();
    const c = chap(n);
    if (!c) {
      return `<p class="crumb"><a href="#/unit/${u.id}">Unit ${u.id}</a></p>
        <h1>Chapter ${n}</h1>
        <p>This chapter's summary isn't built yet. Run <code>python3 build_data.py</code> once the summaries finish, then reload.</p>`;
    }
    const prev = chap(n - 1) ? n - 1 : null;
    const next = chap(n + 1) ? n + 1 : null;
    return `
    <p class="crumb"><a href="#/">All periods</a> / <a href="#/unit/${u.id}">Unit ${u.id} — ${esc(u.name)}</a></p>
    <article class="chapter">
      <header class="ch-head">
        <h1><span class="ch-no big">${n}</span>${esc(c.title)}</h1>
        <p class="ch-years">${esc(c.years)}</p>
      </header>
      <section class="prose">${(c.summary || []).map(p => `<p>${esc(p)}</p>`).join('')}</section>
      <h2>The big ideas</h2>
      <ul class="ideas">${(c.big_ideas || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Timeline</h2>
      <ol class="tl">${(c.timeline || []).map(t => `<li><span class="yr">${esc(t.year)}</span><span>${esc(t.event)}</span></li>`).join('')}</ol>
      <h2 class="terms-head">Key terms <button class="btn small" id="toggledefs" aria-pressed="false">Hide definitions</button></h2>
      <dl class="terms" id="terms">
        ${(c.key_terms || []).map(t => `<div class="trow"><dt tabindex="0">${esc(t.term)}</dt><dd>${esc(t.def)}</dd></div>`).join('')}
      </dl>
      ${(c.themes || []).length ? `<h2>Course themes</h2><ul class="themes">${c.themes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <nav class="pager">
        ${prev ? `<a href="#/ch/${prev}">‹ Ch ${prev}. ${esc(chTitle(prev))}</a>` : '<span></span>'}
        ${next ? `<a href="#/ch/${next}">Ch ${next}. ${esc(chTitle(next))} ›</a>` : ''}
      </nav>
    </article>`;
  }

  // ---------------------------------------------------------- colonies map

  function terPath(t) {
    return t.polys.map(r =>
      'M' + r.map(p => p[0].toFixed(2) + ',' + (-p[1]).toFixed(2)).join('L') + 'Z'
    ).join('');
  }

  function mapView() {
    const T = window.TERRITORIES || [];
    if (!T.length) return '<h1>Map data missing</h1><p>territories.js did not load.</p>';
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    T.forEach(t => t.polys.forEach(r => r.forEach(p => {
      const sy = -p[1];
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
    })));
    const pad = 1.2;
    const vb = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad]
      .map(v => v.toFixed(1)).join(' ');
    const shapes = T.map(t => {
      const cls = 'ter ' + t.kind + (t.region ? ' ' + t.region : '');
      const title = `<title>${esc(t.name)} — ${esc(t.good)}</title>`;
      const label = `<text class="ter-label${t.kind === 'colonial' ? '' : ' faint'}" x="${t.cx}" y="${-t.cy}">${t.id}</text>`;
      if (t.kind === 'colonial') {
        return `<a href="#/colony/${t.id}" class="ter-link" aria-label="${esc(t.name)}">` +
          `<path class="${cls}" d="${terPath(t)}">${title}</path>${label}</a>`;
      }
      return `<g class="${cls}"><path d="${terPath(t)}">${title}</path>${label}</g>`;
    }).join('');
    return `
    <p class="crumb"><a href="#/">All periods</a></p>
    <header class="map-head">
      <h1>The thirteen colonies, about 1750</h1>
      <p class="map-note">Click a colony to open it — the story, the money, the games.
        Treasury: <strong data-coins>${Games.coins()}</strong> coins.</p>
    </header>
    <div class="map-wrap">
      <svg viewBox="${vb}" role="img" aria-label="Map of the thirteen colonies and neighboring lands">${shapes}</svg>
    </div>
    <ul class="legend">
      <li><span class="swatch newengland"></span>New England — cod, timber, ships</li>
      <li><span class="swatch middle"></span>Middle — wheat, furs, ports</li>
      <li><span class="swatch southern"></span>Southern — tobacco, rice, indigo</li>
      <li><span class="swatch native"></span>Native nations</li>
      <li><span class="swatch crown"></span>Other crown lands</li>
    </ul>`;
  }

  function colonyView(id) {
    const t = (window.TERRITORIES || []).find(x => x.id === id && x.kind === 'colonial');
    const f = (window.COLONY_FACTS || {})[id];
    if (!t || !f) return notFound();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    t.polys.forEach(r => r.forEach(p => {
      const sy = -p[1];
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
    }));
    const vb = [minX - 0.5, minY - 0.5, maxX - minX + 1, maxY - minY + 1]
      .map(v => v.toFixed(1)).join(' ');
    return `
    <p class="crumb"><a href="#/">All periods</a> / <a href="#/map">Colonies map</a></p>
    <header class="colony-head">
      <svg class="colony-shape" viewBox="${vb}" aria-hidden="true"><path class="ter ${t.region}" d="${terPath(t)}"></path></svg>
      <div>
        <h1>${esc(t.name)}</h1>
        <p class="ch-years">${esc(f.founded)}</p>
      </div>
    </header>
    <dl class="facts">
      <div class="trow"><dt>Who and why</dt><dd>${esc(f.why)}</dd></div>
      <div class="trow"><dt>How it made money</dt><dd>${esc(f.economy)}</dd></div>
      <div class="trow"><dt>Watch for on the exam</dt><dd>${esc(f.exam)}</dd></div>
    </dl>
    <p class="colony-links">Read the full story:
      ${f.chapters.map(n => `<a class="btn small ghost" href="#/ch/${n}">Ch ${n}. ${esc(chTitle(n))}</a>`).join(' ')}</p>
    <h2>Dockside run — ship the ${esc(String(t.good).toLowerCase())}</h2>
    <p class="game-note">Click barrels to load them before they roll off the pier.
      Leave the crown customs crates alone — clicking one costs 3 coins (Navigation Acts).</p>
    <div class="game-box">
      <canvas id="game-export" width="640" height="380"></canvas>
      <button class="btn" id="start-export">Start the run</button>
    </div>
    <h2>Militia range — marksman drill</h2>
    <p class="game-note">Targets pop up and shrink. Bullseye scores 3; three hits in a row doubles your points.</p>
    <div class="game-box">
      <canvas id="game-range" width="640" height="380"></canvas>
      <button class="btn" id="start-range">Start the drill</button>
    </div>
    <p class="treasury">Treasury: <strong data-coins>${Games.coins()}</strong> coins
      · dockside best ${Games.best('export_' + id)}
      · range best ${Games.best('range_' + id)}</p>`;
  }

  function wireColony(id) {
    const t = (window.TERRITORIES || []).find(x => x.id === id);
    if (!t) return;
    const ex = document.getElementById('game-export');
    const rg = document.getElementById('game-range');
    const exBtn = document.getElementById('start-export');
    const rgBtn = document.getElementById('start-range');
    if (ex) Games.idle(ex, t.good, 'press Start the run');
    if (rg) Games.idle(rg, 'Militia drill', 'press Start the drill');
    if (exBtn) exBtn.addEventListener('click', () =>
      Games.start('export', ex, { key: 'export_' + id, good: t.good, button: exBtn }));
    if (rgBtn) rgBtn.addEventListener('click', () =>
      Games.start('range', rg, { key: 'range_' + id, good: t.good, button: rgBtn }));
  }

  // ---------------------------------------------------------- flashcards

  let deck = [], pos = 0, flipped = false;

  function quiz(id) {
    const u = U.find(x => x.id === Number(id));
    if (!u) return notFound();
    deck = u.chapters.flatMap(n =>
      ((chap(n) || {}).key_terms || []).map(t => ({ term: t.term, def: t.def, ch: n })));
    shuffle(deck);
    pos = 0; flipped = false;
    if (!deck.length) return '<p>No terms for this unit yet.</p>';
    return `
    <p class="crumb"><a href="#/unit/${u.id}">Unit ${u.id} — ${esc(u.name)}</a></p>
    <h1>Term quiz — Unit ${u.id}</h1>
    <p class="quiz-help">Click the card (or press space) to flip it.</p>
    <div class="fcard" id="fcard" role="button" tabindex="0" aria-live="polite"></div>
    <nav class="quiz-nav">
      <button class="btn" id="qprev">Back</button>
      <span id="qcount" class="qcount"></span>
      <button class="btn" id="qnext">Next</button>
      <button class="btn ghost" id="qshuffle">Reshuffle</button>
    </nav>`;
  }

  function renderCard() {
    const el = document.getElementById('fcard');
    if (!el || !deck.length) return;
    const t = deck[pos];
    el.classList.toggle('flipped', flipped);
    el.innerHTML = flipped
      ? `<span class="fc-term-sm">${esc(t.term)}</span>
         <span class="fc-def">${esc(t.def)}</span>
         <span class="fc-src">from chapter ${t.ch}</span>`
      : `<span class="fc-term">${esc(t.term)}</span>
         <span class="fc-hint">what is it?</span>`;
    const count = document.getElementById('qcount');
    if (count) count.textContent = (pos + 1) + ' / ' + deck.length;
  }

  // ---------------------------------------------------------- search

  function find(q) {
    const needle = q.toLowerCase();
    const chHits = Object.values(C).filter(c =>
      ((c.title || '') + ' ' + (c.years || '')).toLowerCase().includes(needle));
    const termHits = [];
    Object.values(C).forEach(c => (c.key_terms || []).forEach(t => {
      if ((t.term + ' ' + t.def).toLowerCase().includes(needle)) {
        termHits.push({ term: t.term, def: t.def, ch: c.chapter });
      }
    }));
    return `
    <p class="crumb"><a href="#/">All periods</a></p>
    <h1>Results for “${esc(q)}”</h1>
    ${chHits.length ? `<h2>Chapters</h2><ul class="hits">${chHits.map(c =>
      `<li><a href="#/ch/${c.chapter}">Ch ${c.chapter}. ${esc(c.title)}</a></li>`).join('')}</ul>` : ''}
    ${termHits.length ? `<h2>Terms</h2><dl class="terms">${termHits.map(t =>
      `<div class="trow"><dt>${esc(t.term)} <a class="tsrc" href="#/ch/${t.ch}">chapter ${t.ch}</a></dt><dd>${esc(t.def)}</dd></div>`).join('')}</dl>` : ''}
    ${(!chHits.length && !termHits.length) ? '<p>Nothing matched. Try a shorter word.</p>' : ''}`;
  }

  const notFound = () => '<h1>Not here</h1><p><a href="#/">Back to the periods</a></p>';

  // ---------------------------------------------------------- events

  app.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn) {
      if (btn.id === 'toggledefs') {
        const dl = document.getElementById('terms');
        const hidden = dl.classList.toggle('hidden');
        btn.textContent = hidden ? 'Show definitions' : 'Hide definitions';
        btn.setAttribute('aria-pressed', String(hidden));
        dl.querySelectorAll('.trow.revealed').forEach(r => r.classList.remove('revealed'));
        return;
      }
      if (btn.id === 'qnext') { pos = (pos + 1) % deck.length; flipped = false; renderCard(); return; }
      if (btn.id === 'qprev') { pos = (pos - 1 + deck.length) % deck.length; flipped = false; renderCard(); return; }
      if (btn.id === 'qshuffle') { shuffle(deck); pos = 0; flipped = false; renderCard(); return; }
    }
    if (e.target.closest('#fcard')) { flipped = !flipped; renderCard(); return; }
    const dt = e.target.closest('.terms.hidden dt');
    if (dt) dt.parentElement.classList.toggle('revealed');
  });

  app.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target.id === 'fcard') {
      e.preventDefault(); flipped = !flipped; renderCard();
    }
    if (e.key === 'Enter' && e.target.matches('.terms.hidden dt')) {
      e.target.parentElement.classList.toggle('revealed');
    }
  });

  document.getElementById('searchform').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('q').value.trim();
    if (q) location.hash = '#/find/' + encodeURIComponent(q);
  });

  // ---------------------------------------------------------- router

  function render() {
    const h = location.hash.replace(/^#\/?/, '');
    const [view, arg] = h.split('/');
    if (window.Games) Games.destroy();
    if (window.Harbor3D) Harbor3D.destroy();
    let html;
    if (!view) html = home();
    else if (view === 'unit') html = unit(arg);
    else if (view === 'ch') html = chapter(arg);
    else if (view === 'quiz') html = quiz(arg);
    else if (view === 'map') html = mapView();
    else if (view === 'colony') html = colonyView(arg);
    else if (view === 'play') html = Campaign.html(arg);
    else if (view === 'find') html = find(decodeURIComponent(h.slice(5)));
    else html = notFound();
    app.innerHTML = html;
    if (view === 'quiz') renderCard();
    if (view === 'colony') wireColony(arg);
    if (view === 'play') Campaign.wire(arg);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', render);
  render();
})();
