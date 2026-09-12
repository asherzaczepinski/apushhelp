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

  // ---------------------------------------------------------- sketch maps

  function mapFigure(n) {
    const spec = (window.CHAPTER_MAPS || {})[n];
    const B = window.MAP_BASES;
    if (!spec || !B) return '';
    const chTerms = (chap(n) || {}).key_terms || [];
    const resolveTerm = L => {
      if (L.term) return L.term;
      if (!L.label) return null;
      const base = L.label.text.replace(/\s*\d.*$/, '').trim().toLowerCase();
      const hit = chTerms.find(t => t.term.toLowerCase() === base);
      return hit ? hit.term : null;
    };
    const P = spec.space === 'colonial'
      ? (x, y) => [x, -y]
      : (lon, lat) => [lon * 0.8, -lat];
    const [ax, ay] = P(spec.view[0], spec.view[3]);
    const [bx, by] = P(spec.view[2], spec.view[1]);
    const w = bx - ax, h = by - ay;
    const fs = Math.min(w / 30, h / 12);
    const lw = w / 170;
    const path = (pts, close) => pts.map((p, i) =>
      (i ? 'L' : 'M') + P(p[0], p[1]).map(v => v.toFixed(2)).join(',')).join('') + (close ? 'Z' : '');

    let out = '';
    if (spec.base === 'colonies') {
      const fills = { newengland: '#33506b', middle: '#8b6f47', southern: '#8c1c13' };
      Object.values(B.colonies).forEach(c => {
        out += `<path d="${c.polys.map(r => path(r, true)).join('')}" fill="${fills[c.region]}" stroke="#5f4f35" stroke-width="${lw}"/>`;
      });
    } else {
      const shapes = (spec.base || []).flatMap(k => k === 'world' ? B.world : [B[k]]);
      shapes.forEach(s => {
        out += `<path d="${path(s, true)}" fill="#e7dcc2" stroke="#8b6f47" stroke-width="${lw}"/>`;
      });
    }
    (spec.layers || []).forEach(L => {
      if (L.t === 'region') {
        out += `<path d="${path(L.pts, true)}" fill="${L.color}" opacity="0.5" stroke="${L.color}" stroke-width="${lw}"/>`;
      }
      if (L.t === 'line' || L.t === 'arrow') {
        out += `<path d="${path(L.pts)}" fill="none" stroke="${L.color}" stroke-width="${lw * 2.4}"` +
          (L.dash ? ` stroke-dasharray="${(fs / 2).toFixed(2)} ${(fs / 3).toFixed(2)}"` : '') +
          (L.t === 'arrow' ? ' marker-end="url(#mapArrow)"' : '') + '/>';
      }
      const lk = resolveTerm(L);
      const hot = lk ? ` class="map-hot" data-term="${esc(lk)}"` : '';
      if (L.t === 'dot') {
        const [x, y] = P(L.at[0], L.at[1]);
        out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(fs / 2.6).toFixed(2)}" fill="#2b2118" stroke="#fffaf0" stroke-width="${lw}"${hot}/>`;
      }
      if (L.label) {
        const at = L.label.at || (L.t === 'dot' ? L.at : L.pts[Math.floor(L.pts.length / 2)]);
        const [x, y] = P(at[0], at[1]);
        const west = L.label.side === 'w';
        const cls = lk ? 'map-label map-hot' : 'map-label';
        out += `<text x="${(x + (west ? -fs / 2 : fs / 2)).toFixed(2)}" y="${(y - fs / 3).toFixed(2)}" font-size="${fs.toFixed(2)}" text-anchor="${west ? 'end' : 'start'}" class="${cls}"${lk ? ` data-term="${esc(lk)}"` : ''}>${esc(L.label.text)}</text>`;
      }
    });
    return `<figure class="ch-map">
      <svg viewBox="${ax.toFixed(1)} ${ay.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="${esc(spec.caption)}">
        <defs><marker id="mapArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#2b2118"/></marker></defs>
        ${out}
      </svg>
      <figcaption>${esc(spec.caption)}</figcaption>
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
