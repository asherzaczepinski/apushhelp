(function () {
  const U = (window.APUSH || {}).units || [];
  const C = (window.APUSH || {}).chapters || {};
  const app = document.getElementById('app');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
      ${mapFigure(n)}
      <h2>The big ideas</h2>
      <ul class="ideas">${(c.big_ideas || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Timeline</h2>
      <ol class="tl">${(c.timeline || []).map(t => `<li><span class="yr">${esc(t.year)}</span><span>${esc(t.event)}</span></li>`).join('')}</ol>
      <h2 class="terms-head">Key terms <button class="btn small" id="toggledefs" aria-pressed="false">Hide definitions</button></h2>
      <dl class="terms" id="terms">
        ${(c.key_terms || []).map(t => `<div class="trow" id="term-${slug(t.term)}"><dt tabindex="0">${esc(t.term)}</dt><dd>${esc(t.def)}</dd></div>`).join('')}
      </dl>
      ${(c.themes || []).length ? `<h2>Course themes</h2><ul class="themes">${c.themes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${chapterQuizHtml(n)}
      <nav class="pager">
        ${prev ? `<a href="#/ch/${prev}">‹ Ch ${prev}. ${esc(chTitle(prev))}</a>` : '<span></span>'}
        ${next ? `<a href="#/ch/${next}">Ch ${next}. ${esc(chTitle(next))} ›</a>` : ''}
      </nav>
    </article>`;
  }

  // ---------------------------------------------------------- fact maps

  // Plot every located fact for a chapter on an auto-fitted map. Pins whose
  // label matches a key term are clickable and jump to that definition.
  function mapFigure(n) {
    const spec = (window.LOCATED_FACTS || {})[String(n)];
    const B = window.MAP_BASES;
    if (!spec || !B || !spec.pins || !spec.pins.length) return '';
    const chTerms = (chap(n) || {}).key_terms || [];
    const resolveTerm = pin => {
      if (pin.term) {
        const exact = chTerms.find(t => t.term === pin.term);
        if (exact) return exact.term;
      }
      const base = pin.label.replace(/\s*\d.*$/, '').trim().toLowerCase();
      const hit = chTerms.find(t => t.term.toLowerCase() === base);
      return hit ? hit.term : null;
    };

    const P = (lon, lat) => [lon * 0.8, -lat];

    // auto-fit the view box to the pins, padded, with a minimum span
    const xs = spec.pins.map(p => p.lon * 0.8);
    const ys = spec.pins.map(p => -p.lat);
    let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const padX = Math.max(6, (maxX - minX) * 0.22);
    const padY = Math.max(5, (maxY - minY) * 0.22);
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    // keep a readable aspect ratio (width : height between 1.2 and 1.8);
    // taller maps give stacked labels vertical room to de-collide
    let w = maxX - minX, h = maxY - minY;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    if (w / h < 1.2) { w = h * 1.2; minX = cx - w / 2; maxX = cx + w / 2; }
    else if (w / h > 1.8) { h = w / 1.8; minY = cy - h / 2; maxY = cy + h / 2; }
    const midX = (minX + maxX) / 2;
    const fs = Math.max(w / 52, Math.min(w / 30, h / 13));
    const lw = w / 240;
    const path = pts => pts.map((p, i) =>
      (i ? 'L' : 'M') + P(p[0], p[1]).map(v => v.toFixed(2)).join(',')).join('') + 'Z';

    let out = '';
    if (spec.scope === 'colonial') {
      const fills = { newengland: '#33506b', middle: '#8b6f47', southern: '#8c1c13' };
      Object.values(B.colonies).forEach(c => {
        out += `<path d="${c.polys.map(r => r.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ',' + (-p[1]).toFixed(2)).join('') + 'Z').join('')}" fill="${fills[c.region] || '#8b6f47'}" stroke="#5f4f35" stroke-width="${lw}"/>`;
      });
    } else {
      B.world.forEach(s => {
        out += `<path d="${path(s)}" fill="#e7dcc2" stroke="#8b6f47" stroke-width="${lw}"/>`;
      });
    }

    // place each dot, then lay out labels so none overlap (greedy nudging)
    const halo = (fs * 0.16).toFixed(2);
    const items = spec.pins.map(pin => {
      const [x, y] = P(pin.lon, pin.lat);
      return { pin, x, y, lk: resolveTerm(pin) };
    }).sort((a, b) => a.y - b.y);

    const placed = [];
    const hits = box => placed.some(q =>
      box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0);
    let dots = '', labels = '', leaders = '';

    items.forEach(it => {
      const label = it.pin.label;
      const wEst = label.length * fs * 0.56;
      const hEst = fs * 1.2;
      const baseY = it.y + fs * 0.32;
      const margin = fs * 0.4;
      const inBounds = b => b.x0 >= minX + margin && b.x1 <= maxX - margin
        && b.y0 >= minY + margin && b.y1 <= maxY - margin;
      let best = null;
      const sides = it.x > midX ? [-1, 1] : [1, -1];
      outer:
      for (const dy of [0, hEst, -hEst, 2 * hEst, -2 * hEst, 3 * hEst, -3 * hEst, 4 * hEst, -4 * hEst, 5 * hEst, -5 * hEst, 6 * hEst]) {
        for (const s of sides) {
          const ax = it.x + s * fs * 0.75;
          const x0 = s > 0 ? ax : ax - wEst;
          const box = { x0, x1: x0 + wEst, y0: baseY + dy - hEst, y1: baseY + dy };
          if (inBounds(box) && !hits(box)) { best = { s, ax, ly: baseY + dy, box }; break outer; }
        }
      }
      if (!best) {
        // clamp into bounds on whichever side has more room
        const s = it.x < midX ? 1 : -1;
        let ax = it.x + s * fs * 0.75;
        if (s > 0) ax = Math.min(ax, maxX - margin - wEst);
        else ax = Math.max(ax, minX + margin + wEst);
        const x0 = s > 0 ? ax : ax - wEst;
        best = { s, ax, ly: baseY, box: { x0, x1: x0 + wEst, y0: baseY - hEst, y1: baseY } };
      }
      placed.push(best.box);
      const hot = it.lk ? ` class="map-hot" data-term="${esc(it.lk)}"` : '';
      dots += `<circle cx="${it.x.toFixed(2)}" cy="${it.y.toFixed(2)}" r="${(fs / 2.8).toFixed(2)}" fill="${it.lk ? '#8c1c13' : '#2b2118'}" stroke="#fffaf0" stroke-width="${lw}"${hot}/>`;
      if (Math.abs(best.ly - baseY) > hEst * 0.6) {
        leaders += `<line x1="${it.x.toFixed(2)}" y1="${it.y.toFixed(2)}" x2="${best.ax.toFixed(2)}" y2="${(best.ly - fs * 0.3).toFixed(2)}" stroke="#8b6f47" stroke-width="${(lw * 0.8).toFixed(2)}"/>`;
      }
      const cls = it.lk ? 'map-label map-hot' : 'map-label';
      labels += `<text x="${best.ax.toFixed(2)}" y="${best.ly.toFixed(2)}" font-size="${fs.toFixed(2)}" text-anchor="${best.s > 0 ? 'start' : 'end'}" stroke="#f0e6cd" stroke-width="${halo}" paint-order="stroke" class="${cls}"${it.lk ? ` data-term="${esc(it.lk)}"` : ''}>${esc(label)}</text>`;
    });
    out += leaders + dots + labels;

    return `<figure class="ch-map">
      <svg viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="${esc(spec.caption)}">${out}</svg>
      <figcaption>${esc(spec.caption)} <span class="map-hint">Underlined places link to their definition.</span></figcaption>
    </figure>`;
  }

  // ---------------------------------------------------------- chapter quiz

  const cq = { n: null, deck: [], i: 0, score: 0, answered: false };

  function chapterQuizHtml(n) {
    const c = chap(n);
    if (!c || (c.key_terms || []).length < 4) return '';
    return `<section class="ch-quiz" id="ch-quiz"><h2>Quiz yourself</h2><div id="cq-body"></div></section>`;
  }

  function startChapterQuiz(n) {
    const terms = ((chap(n) || {}).key_terms || []).slice();
    shuffle(terms);
    cq.n = n;
    cq.deck = terms.slice(0, Math.min(8, terms.length));
    cq.i = 0; cq.score = 0; cq.answered = false;
    renderChapterQuiz();
  }

  function renderChapterQuiz() {
    const body = document.getElementById('cq-body');
    if (!body) return;
    if (cq.i >= cq.deck.length) {
      const pct = Math.round(100 * cq.score / cq.deck.length);
      body.innerHTML = `<p class="cq-score">${cq.score} / ${cq.deck.length} right — ${pct}%</p>
        <button class="btn" id="cq-restart">Quiz again</button>`;
      return;
    }
    const q = cq.deck[cq.i];
    const all = (chap(cq.n) || {}).key_terms || [];
    const wrong = [];
    let guard = 0;
    while (wrong.length < 3 && guard++ < 60) {
      const w = all[Math.floor(Math.random() * all.length)];
      if (w.term !== q.term && wrong.indexOf(w) === -1) wrong.push(w);
    }
    const opts = [q].concat(wrong).sort(() => Math.random() - 0.5);
    cq.answered = false;
    body.innerHTML = `<p class="cq-count">Question ${cq.i + 1} of ${cq.deck.length} · score ${cq.score}</p>
      <p class="quiz-q">What is <strong>${esc(q.term)}</strong>?</p>
      <div class="cq-opts">${opts.map(o => `<button class="quiz-opt" data-term="${esc(o.term)}">${esc(o.def)}</button>`).join('')}</div>`;
  }

  function answerChapterQuiz(btn) {
    if (cq.answered) return;
    cq.answered = true;
    const q = cq.deck[cq.i];
    if (btn.dataset.term === q.term) cq.score += 1;
    const body = document.getElementById('cq-body');
    body.querySelectorAll('.quiz-opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.term === q.term) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    const nav = document.createElement('div');
    nav.className = 'cq-next';
    nav.innerHTML = `<button class="btn small" id="cq-advance">${cq.i + 1 < cq.deck.length ? 'Next question' : 'See score'}</button>`;
    body.appendChild(nav);
  }

  function wireChapter(n) {
    n = Number(n);
    if (chap(n)) startChapterQuiz(n);
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

  // map location -> jump straight to that term's definition
  app.addEventListener('click', e => {
    const hot = e.target.closest('.ch-map [data-term]');
    if (hot) {
      const row = document.getElementById('term-' + slug(hot.getAttribute('data-term')));
      if (row) {
        const dl = document.getElementById('terms');
        if (dl && dl.classList.contains('hidden')) row.classList.add('revealed');
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        row.classList.add('flash');
        setTimeout(() => row.classList.remove('flash'), 1600);
      }
      return;
    }
    const opt = e.target.closest('.ch-quiz .quiz-opt');
    if (opt) { answerChapterQuiz(opt); return; }
    if (e.target.closest('#cq-advance')) { cq.i += 1; renderChapterQuiz(); return; }
    if (e.target.closest('#cq-restart')) { startChapterQuiz(cq.n); return; }
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
    let html;
    if (!view) html = home();
    else if (view === 'unit') html = unit(arg);
    else if (view === 'ch') html = chapter(arg);
    else if (view === 'quiz') html = quiz(arg);
    else if (view === 'find') html = find(decodeURIComponent(h.slice(5)));
    else html = notFound();
    app.innerHTML = html;
    if (view === 'quiz') renderCard();
    if (view === 'ch') wireChapter(arg);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', render);
  render();
})();
