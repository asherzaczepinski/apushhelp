(function () {
  const U = (window.APUSH || {}).units || [];
  const C = (window.APUSH || {}).chapters || {};
  const app = document.getElementById('app');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const unitOf = n => U.find(u => u.chapters.includes(Number(n)));

  // AI illustrations (studier/images.js). Returns a path or null.
  const chImg = (n, cat, idx) => {
    const m = (window.CH_IMAGES || {})[String(n)];
    if (!m) return null;
    if (cat === 'cover') return m.cover || null;
    const arr = m[cat];
    return arr && arr[idx] ? arr[idx] : null;
  };
  const imgTag = (src, cls, alt) =>
    src ? `<img class="${cls}" src="${src}" alt="${esc(alt || '')}" loading="lazy">` : '';
  const chap = n => C[String(n)];
  const chTitle = n => (chap(n) ? chap(n).title : 'Chapter ' + n);

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ------------------------------------------- progress + spaced retrieval
  // Leitner-style boxes: a missed term comes back today; each correct recall
  // pushes it to a longer interval. Retrieval practice + spacing, combined.
  const STORE = 'gml_progress';
  const DAY = 86400000;
  const BOX_DAYS = [0, 1, 3, 7, 16];
  const nowMs = () => Date.now();
  const loadProg = () => {
    try { return JSON.parse(localStorage.getItem(STORE)) || { terms: {} }; }
    catch (e) { return { terms: {} }; }
  };
  const saveProg = p => localStorage.setItem(STORE, JSON.stringify(p));
  const tKey = (ch, term) => ch + '::' + term;

  function recordTerm(ch, term, correct) {
    const p = loadProg();
    const k = tKey(ch, term);
    const t = p.terms[k] || { box: 0, correct: 0, wrong: 0 };
    if (correct) { t.correct++; t.box = Math.min(BOX_DAYS.length - 1, t.box + 1); }
    else { t.wrong++; t.box = 0; }
    t.due = nowMs() + BOX_DAYS[t.box] * DAY;
    t.seen = nowMs();
    p.terms[k] = t;
    saveProg(p);
  }

  function allTerms() {
    const list = [];
    Object.values(C).forEach(c => (c.key_terms || []).forEach(t =>
      list.push({ ch: c.chapter, term: t.term, def: t.def })));
    return list;
  }
  function masteryStats() {
    const p = loadProg();
    let known = 0, learning = 0, fresh = 0;
    allTerms().forEach(t => {
      const s = p.terms[tKey(t.ch, t.term)];
      if (!s) fresh++;
      else if (s.box >= 3) known++;
      else learning++;
    });
    return { known, learning, fresh, total: known + learning + fresh };
  }
  function unitMastery(u) {
    const p = loadProg();
    let known = 0, total = 0;
    u.chapters.forEach(n => ((chap(n) || {}).key_terms || []).forEach(t => {
      total++;
      const s = p.terms[tKey(n, t.term)];
      if (s && s.box >= 3) known++;
    }));
    return { known, total };
  }
  function dueCount() {
    const p = loadProg(), n = nowMs();
    return allTerms().filter(t => {
      const s = p.terms[tKey(t.ch, t.term)];
      return s && s.due <= n;
    }).length;
  }
  function dueQueue(limit) {
    const p = loadProg(), n = nowMs();
    const due = [], fresh = [];
    allTerms().forEach(t => {
      const s = p.terms[tKey(t.ch, t.term)];
      if (s) { if (s.due <= n) due.push(Object.assign({ due: s.due }, t)); }
      else fresh.push(t);
    });
    due.sort((a, b) => a.due - b.due);
    return shuffle(due.concat(shuffle(fresh)).slice(0, limit || 15));
  }

  // ---------------------------------------------------------- views

  function home() {
    if (!U.length) {
      return '<h1>No data yet</h1><p>Run <code>python3 build_data.py</code> in the project folder, then reload.</p>';
    }
    return `
    ${dashboard()}
    <nav class="units">
      ${U.map(u => {
        const m = unitMastery(u);
        const pct = m.total ? Math.round(100 * m.known / m.total) : 0;
        return `
      <a class="band" href="#/unit/${u.id}">
        <span class="era">${esc(u.years)}</span>
        <span class="band-main">
          <strong>Unit ${u.id} — ${esc(u.name)}</strong>
          ${u.chapters.map(n => `<span class="band-ch">Ch ${n}. ${esc(chTitle(n))}</span>`).join('')}
        </span>
        <span class="band-side">
          <span class="weight">${esc(u.weight)}</span>
          <span class="umini" title="${m.known} of ${m.total} terms mastered"><span style="width:${pct}%"></span></span>
        </span>
      </a>`;
      }).join('')}
    </nav>`;
  }

  function dashboard() {
    const m = masteryStats();
    if (!m.total) return '';
    const due = dueCount();
    const pct = k => Math.round(100 * k / m.total);
    const started = m.known + m.learning > 0;
    return `<section class="dash">
      <div class="dash-bar" role="img" aria-label="${m.known} known, ${m.learning} learning, ${m.fresh} not started">
        <span class="seg known" style="width:${pct(m.known)}%"></span>
        <span class="seg learning" style="width:${pct(m.learning)}%"></span>
      </div>
      <p class="dash-legend"><strong>${m.known}</strong> mastered · <strong>${m.learning}</strong> learning · <strong>${m.fresh}</strong> new · ${m.total} key terms</p>
      <p class="dash-cta"><a class="btn" href="#/review">${due ? 'Review ' + due + ' due term' + (due === 1 ? '' : 's') : (started ? 'Start a review session' : 'Start studying — mixed review')}</a></p>
    </section>`;
  }

  function unit(id) {
    const u = U.find(x => x.id === Number(id));
    if (!u) return notFound();
    return `
    <p class="crumb"><a href="#/">All periods</a></p>
    <header class="unit-head">
      <p class="era big">${esc(u.years)}</p>
      <h1>Unit ${u.id} — ${esc(u.name)}</h1>
      <p class="unit-actions"><a class="btn" href="#/quiz/${u.id}">Flashcards</a>
        <a class="btn ghost" href="#/order/${u.id}">Timeline challenge</a></p>
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
      ${graphicNovel(n, c)}
      <h2>The big ideas</h2>
      <ul class="ideas">${(c.big_ideas || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Timeline</h2>
      <ol class="tl">${(c.timeline || []).map(t => `<li><span class="yr">${esc(t.year)}</span><span>${esc(t.event)}</span></li>`).join('')}</ol>
      <h2 class="terms-head">Key terms <button class="btn small" id="toggledefs" aria-pressed="false">Hide definitions</button></h2>
      <dl class="terms" id="terms">
        ${(c.key_terms || []).map((t, idx) => `<div class="trow" id="term-${slug(t.term)}">${imgTag(chImg(n, 'terms', idx), 'thumb', esc(t.term))}<div class="trow-txt"><dt tabindex="0">${esc(t.term)}</dt><dd>${esc(t.def)}</dd></div></div>`).join('')}
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

  // The chapter summary told as an inline graphic novel: each sentence is a
  // comic panel (AI art when available), with a little map after any passage
  // that names places, so you still get the geography.
  let mapSeq = 0;
  function graphicNovel(n, c) {
    const spec = (window.LOCATED_FACTS || {})[String(n)];
    const pins = spec ? spec.pins : [];
    const parts = [];
    let gi = 0;
    (c.summary || []).forEach(p => {
      Comic.splitPara(p).forEach(sen => {
        if (gi < 16) { parts.push(Comic.panelHTML(n, sen, gi)); gi++; }
      });
      const lc = String(p).toLowerCase();
      const here = pins.filter(pin => {
        const base = pin.label.replace(/\s*\d.*$/, '').trim().toLowerCase();
        return base.length > 2 && lc.indexOf(base) !== -1;
      });
      if (here.length) {
        parts.push(mapFigure(n, { pins: here, caption: 'Places named in this passage.', inline: true }));
      }
    });
    return `<div class="comic-strip chapter-gn">${parts.join('')}</div>`;
  }

  // Plot located facts on an auto-fitted map. Pins matching a key term are
  // clickable for a popover. opts.pins overrides the chapter's full set.
  function mapFigure(n, opts) {
    const base = (window.LOCATED_FACTS || {})[String(n)];
    const B = window.MAP_BASES;
    const spec = {
      pins: (opts && opts.pins) || (base && base.pins) || [],
      caption: (opts && opts.caption) || (base && base.caption) || '',
      scope: (opts && opts.scope) || (base && base.scope) || 'us'
    };
    if (!B || !spec.pins.length) return '';
    const mapId = ++mapSeq;
    const chTerms = (chap(n) || {}).key_terms || [];
    const chTimeline = (chap(n) || {}).timeline || [];
    const resolveTerm = pin => {
      if (pin.term) {
        const exact = chTerms.find(t => t.term === pin.term);
        if (exact) return exact.term;
      }
      const base = pin.label.replace(/\s*\d.*$/, '').trim().toLowerCase();
      const hit = chTerms.find(t => t.term.toLowerCase() === base);
      return hit ? hit.term : null;
    };
    const detailOf = (pin, lk) => {
      if (lk) { const t = chTerms.find(x => x.term === lk); if (t) return t.def; }
      const base = pin.label.replace(/\s*\d.*$/, '').trim().toLowerCase();
      const yr = (pin.label.match(/\d{3,4}/) || [])[0];
      const ev = chTimeline.find(e =>
        (e.event || '').toLowerCase().includes(base) || (yr && String(e.year) === yr));
      return ev ? ev.year + ' — ' + ev.event : '';
    };

    const P = (lon, lat) => [lon * 0.8, -lat];

    // auto-fit the view box to the pins, padded, with a minimum span
    const xs = spec.pins.map(p => p.lon * 0.8);
    const ys = spec.pins.map(p => -p.lat);
    let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const padX = Math.max(16, (maxX - minX) * 0.25);
    const padY = Math.max(12, (maxY - minY) * 0.25);
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

    items.forEach((it, idx) => {
      const pinId = mapId + ':' + idx;
      MAP_PIN_DETAILS[pinId] = { label: it.pin.label, detail: detailOf(it.pin, it.lk) };
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
      const pd = ` class="map-pin${it.lk ? ' map-hot' : ''}" data-pin="${pinId}"`;
      dots += `<circle cx="${it.x.toFixed(2)}" cy="${it.y.toFixed(2)}" r="${(fs / 2.8).toFixed(2)}" fill="${it.lk ? '#8c1c13' : '#2b2118'}" stroke="#fffaf0" stroke-width="${lw}"${pd}/>`;
      if (Math.abs(best.ly - baseY) > hEst * 0.6) {
        leaders += `<line x1="${it.x.toFixed(2)}" y1="${it.y.toFixed(2)}" x2="${best.ax.toFixed(2)}" y2="${(best.ly - fs * 0.3).toFixed(2)}" stroke="#8b6f47" stroke-width="${(lw * 0.8).toFixed(2)}"/>`;
      }
      const cls = 'map-label map-pin' + (it.lk ? ' map-hot' : '');
      labels += `<text x="${best.ax.toFixed(2)}" y="${best.ly.toFixed(2)}" font-size="${fs.toFixed(2)}" text-anchor="${best.s > 0 ? 'start' : 'end'}" stroke="#f0e6cd" stroke-width="${halo}" paint-order="stroke" class="${cls}" data-pin="${pinId}">${esc(label)}</text>`;
    });
    out += leaders + dots + labels;

    return `<figure class="ch-map${opts && opts.inline ? ' ch-map-inline' : ''}">
      <svg viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="${esc(spec.caption)}">${out}</svg>
      <figcaption>${esc(spec.caption)} <span class="map-hint">Tap any pin to see its fact.</span></figcaption>
    </figure>`;
  }

  const MAP_PIN_DETAILS = {};

  function showMapPop(pinEl) {
    const d = MAP_PIN_DETAILS[pinEl.getAttribute('data-pin')];
    if (!d) return;
    const fig = pinEl.closest('.ch-map');
    if (!fig) return;
    let pop = document.getElementById('map-pop');
    if (pop) pop.remove();
    pop = document.createElement('div');
    pop.id = 'map-pop';
    pop.innerHTML = `<strong>${esc(d.label)}</strong>` +
      (d.detail ? `<span>${esc(d.detail)}</span>` : '<span class="map-pop-none">No detail for this place.</span>');
    fig.appendChild(pop);
    const pr = pinEl.getBoundingClientRect(), fr = fig.getBoundingClientRect();
    const x = pr.left - fr.left + pr.width / 2;
    const y = pr.top - fr.top;
    pop.style.left = Math.min(Math.max(70, x), fr.width - 70) + 'px';
    pop.style.top = Math.max(6, y - 6) + 'px';
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
    const correct = btn.dataset.term === q.term;
    if (correct) cq.score += 1;
    recordTerm(cq.n, q.term, correct);
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

  // ---------------------------------------------------------- spaced review

  const rv = { queue: [], i: 0, right: 0, answered: false };

  function reviewHtml() {
    return `<p class="crumb"><a href="#/">All periods</a></p>
      <h1>Spaced review</h1>
      <p class="cover-note">Terms mixed from every chapter and resurfaced on a spacing schedule — miss one and it returns sooner, get it right and it waits longer. Retrieval practice plus spacing are the two techniques the research backs most.</p>
      <div id="rv-body"></div>`;
  }
  function startReview() {
    rv.queue = dueQueue(15); rv.i = 0; rv.right = 0; rv.answered = false;
    renderReview();
  }
  function renderReview() {
    const body = document.getElementById('rv-body');
    if (!body) return;
    if (!rv.queue.length) {
      body.innerHTML = '<p class="cq-score">No terms to review yet.</p><p>Take a chapter quiz first, then your missed terms show up here.</p>';
      return;
    }
    if (rv.i >= rv.queue.length) {
      body.innerHTML = `<p class="cq-score">${rv.right} / ${rv.queue.length} right</p>
        <p>${dueCount()} term${dueCount() === 1 ? '' : 's'} still due.</p>
        <button class="btn" id="rv-again">Another round</button>
        <a class="btn ghost" href="#/">Back to periods</a>`;
      return;
    }
    const q = rv.queue[rv.i];
    const pool = shuffle(allTerms().filter(t => t.term !== q.term && t.def !== q.def));
    const opts = shuffle([q].concat(pool.slice(0, 3)));
    rv.answered = false;
    body.innerHTML = `<p class="cq-count">Card ${rv.i + 1} of ${rv.queue.length} · chapter ${q.ch}</p>
      <p class="quiz-q">What is <strong>${esc(q.term)}</strong>?</p>
      <div class="cq-opts">${opts.map(o => `<button class="quiz-opt" data-term="${esc(o.term)}">${esc(o.def)}</button>`).join('')}</div>`;
  }
  function answerReview(btn) {
    if (rv.answered) return;
    rv.answered = true;
    const q = rv.queue[rv.i];
    const correct = btn.dataset.term === q.term;
    if (correct) rv.right += 1;
    recordTerm(q.ch, q.term, correct);
    const body = document.getElementById('rv-body');
    body.querySelectorAll('.quiz-opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.term === q.term) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    const nav = document.createElement('div');
    nav.className = 'cq-next';
    nav.innerHTML = `<button class="btn small" id="rv-next">${rv.i + 1 < rv.queue.length ? 'Next' : 'Finish'}</button>
      <a class="rv-link" href="#/ch/${q.ch}">see chapter ${q.ch}</a>`;
    body.appendChild(nav);
  }

  // ------------------------------------------------ chronology challenge

  const ord = { events: [], picked: [], done: false, uid: null };
  function parseYear(s) {
    const m = String(s).match(/\d+/);
    const y = m ? parseInt(m[0], 10) : 0;
    return /bce?\b/i.test(String(s)) ? -y : y;
  }
  function orderHtml(uid) {
    const u = U.find(x => x.id === Number(uid));
    if (!u) return notFound();
    return `<p class="crumb"><a href="#/unit/${u.id}">Unit ${u.id} — ${esc(u.name)}</a></p>
      <h1>Timeline challenge</h1>
      <p class="cover-note">Click the events in order, earliest to latest. Sequencing events is exactly what the exam's causation and continuity-and-change questions test — and where students most often slip.</p>
      <div id="ord-body"></div>`;
  }
  function startOrder(uid) {
    const u = U.find(x => x.id === Number(uid));
    if (!u) return;
    ord.uid = uid; ord.picked = []; ord.done = false;
    const pool = [], seen = {};
    u.chapters.forEach(n => ((chap(n) || {}).timeline || []).forEach(e => {
      const y = parseYear(e.year);
      if (!(y in seen)) { seen[y] = 1; pool.push({ year: e.year, event: e.event, y: y }); }
    }));
    ord.events = shuffle(shuffle(pool).slice(0, Math.min(6, pool.length)));
    renderOrder();
  }
  function renderOrder() {
    const body = document.getElementById('ord-body');
    if (!body) return;
    if (!ord.events.length) { body.innerHTML = '<p>No timeline events for this unit.</p>'; return; }
    if (ord.done) {
      const truth = ord.events.slice().sort((a, b) => a.y - b.y);
      let correct = 0;
      ord.picked.forEach((p, i) => { if (p === truth[i]) correct += 1; });
      body.innerHTML = `<p class="cq-score">${correct} / ${ord.events.length} placed correctly</p>
        <p class="ord-instr">The real order:</p>
        <ol class="ord-truth">${truth.map(e =>
          `<li><span class="yr">${esc(e.year)}</span><span>${esc(e.event)}</span></li>`).join('')}</ol>
        <button class="btn" id="ord-again">Play again</button>
        <a class="btn ghost" href="#/unit/${ord.uid}">Back to unit</a>`;
      return;
    }
    body.innerHTML = `
      <ol class="ord-picked">${ord.picked.map((e, i) =>
        `<li><span class="ord-n">${i + 1}</span>${esc(e.event)}</li>`).join('')}</ol>
      <p class="ord-instr">Choose #${ord.picked.length + 1} — earliest first:</p>
      <div class="ord-choices">${ord.events.map((e, i) =>
        ord.picked.indexOf(e) === -1
          ? `<button class="btn ghost ord-choice" data-i="${i}">${esc(e.event)}</button>` : ''
      ).join('')}</div>`;
  }
  function pickOrder(i) {
    const e = ord.events[i];
    if (!e || ord.picked.indexOf(e) !== -1) return;
    ord.picked.push(e);
    if (ord.picked.length === ord.events.length) ord.done = true;
    renderOrder();
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
    <div class="fc-stage"><div class="fcard" id="fcard" role="button" tabindex="0" aria-live="polite"></div></div>
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
      : `<div class="fc-scene">${window.Comic ? Comic.mini(t.term + ' ' + (t.def || '')) : ''}</div>
         <span class="fc-term">${esc(t.term)}</span>
         <span class="fc-hint">what is it?</span>`;
    el.classList.remove('fcflip'); void el.offsetWidth; el.classList.add('fcflip');
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
    if (dt) dt.closest('.trow').classList.toggle('revealed');
  });

  // map pin -> popover with that fact; chapter quiz + review controls
  app.addEventListener('click', e => {
    const pin = e.target.closest('.ch-map [data-pin]');
    if (pin) { showMapPop(pin); return; }
    const pop = document.getElementById('map-pop');
    if (pop && !e.target.closest('#map-pop')) pop.remove();

    const opt = e.target.closest('.ch-quiz .quiz-opt');
    if (opt) { answerChapterQuiz(opt); return; }
    if (e.target.closest('#cq-advance')) { cq.i += 1; renderChapterQuiz(); return; }
    if (e.target.closest('#cq-restart')) { startChapterQuiz(cq.n); return; }

    const ropt = e.target.closest('#rv-body .quiz-opt');
    if (ropt) { answerReview(ropt); return; }
    if (e.target.closest('#rv-next')) { rv.i += 1; renderReview(); return; }
    if (e.target.closest('#rv-again')) { startReview(); return; }

    const oc = e.target.closest('.ord-choice');
    if (oc) { pickOrder(Number(oc.dataset.i)); return; }
    if (e.target.closest('#ord-again')) { startOrder(ord.uid); return; }
  });

  app.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target.id === 'fcard') {
      e.preventDefault(); flipped = !flipped; renderCard();
    }
    if (e.key === 'Enter' && e.target.matches('.terms.hidden dt')) {
      e.target.closest('.trow').classList.toggle('revealed');
    }
  });

  const searchForm = document.getElementById('searchform');
  if (searchForm) searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('q').value.trim();
    if (q) location.hash = '#/find/' + encodeURIComponent(q);
  });

  // ---------------------------------------------------------- router

  function render() {
    const h = location.hash.replace(/^#\/?/, '');
    const [view, arg] = h.split('/');
    if (window.Typer) Typer.destroy();
    let html;
    if (!view) html = home();
    else if (view === 'unit') html = unit(arg);
    else if (view === 'ch') html = chapter(arg);
    else if (view === 'quiz') html = quiz(arg);
    else if (view === 'review') html = reviewHtml();
    else if (view === 'order') html = orderHtml(arg);
    else if (view === 'find') html = find(decodeURIComponent(h.slice(5)));
    else html = notFound();
    app.innerHTML = html;
    if (view === 'quiz') renderCard();
    if (view === 'ch') { wireChapter(arg); Comic.wire(arg); }
    if (view === 'review') startReview();
    if (view === 'order') startOrder(arg);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', render);
  render();
})();
