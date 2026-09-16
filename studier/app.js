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
    <section class="home-intro">
      <h1>Give Me Liberty!</h1>
      <p>An illustrated study companion to Eric Foner's <em>Give Me Liberty! An American History</em> (Brief 5th edition). Every chapter is a <strong>visual timeline</strong>: each key term and turning point drawn as its own illustrated moment, in order. At the bottom you pick the concepts you want to drill for a <strong>ten-question quiz</strong> on each, then put the events in order in a <strong>date-sorting game</strong>. Pick a chapter to begin.</p>
    </section>
    <nav class="units">
      ${U.map(u => `
      <div class="band">
        <span class="era">${esc(u.years)}</span>
        <div class="band-main">
          <strong>Unit ${u.id}: ${esc(u.name)}</strong>
          <div class="band-chs">
            ${u.chapters.map(n => `<a class="band-ch" href="#/ch/${n}">Ch ${n}. ${esc(chTitle(n))}</a>`).join('')}
          </div>
        </div>
      </div>`).join('')}
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
      <p class="dash-cta"><a class="btn" href="#/review">${due ? 'Review ' + due + ' due term' + (due === 1 ? '' : 's') : (started ? 'Start a review session' : 'Start studying (mixed review)')}</a></p>
    </section>`;
  }

  function unit(id) {
    const u = U.find(x => x.id === Number(id));
    if (!u) return notFound();
    return `
    <p class="crumb"><a href="#/">All periods</a></p>
    <header class="unit-head">
      <p class="era big">${esc(u.years)}</p>
      <h1>Unit ${u.id}: ${esc(u.name)}</h1>
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
    <article class="chapter">
      <header class="ch-head">
        <h1><span class="ch-no big">${n}</span>${esc(c.title)}</h1>
      </header>
      <p class="ch-intro">${esc(chapterIntro(c))}</p>
      ${graphicNovel(n, c)}
      ${chapterQuizHtml(n)}
      <nav class="pager">
        ${prev ? `<a href="#/ch/${prev}">‹ Ch ${prev}. ${esc(chTitle(prev))}</a>` : '<span></span>'}
        ${next ? `<a href="#/ch/${next}">Ch ${next}. ${esc(chTitle(next))} ›</a>` : ''}
      </nav>
    </article>`;
  }

  // A short two-sentence lead-in for the top of a chapter, from its summary.
  function chapterIntro(c) {
    const s = ((c.summary || [])[0]) || '';
    const sents = s.match(/[^.!?]+[.!?]+/g) || [s];
    return sents.slice(0, 2).join(' ').trim();
  }

  // Hidden "remnant" view: the old key-terms / timeline / course-themes data,
  // kept off the live chapter page (reachable only at #/remnant/<n>).
  function remnant(n) {
    n = Number(n);
    const c = chap(n);
    if (!c) return notFound();
    return `<article class="chapter">
      <p class="crumb">Remnant · <a href="#/ch/${n}">back to Chapter ${n}</a></p>
      <h1>Ch ${n}: remnant (${esc(c.years)})</h1>
      <h2>The big ideas</h2>
      <ul class="ideas">${(c.big_ideas || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Timeline</h2>
      <ol class="tl-text-list">${(c.timeline || []).map(t => `<li><span class="yr">${esc(t.year)}</span> ${esc(t.event)}</li>`).join('')}</ol>
      <h2>Key terms</h2>
      <dl class="terms">${(c.key_terms || []).map(t => `<div class="trow"><div class="trow-txt"><dt>${esc(t.term)}</dt><dd>${esc(t.def)}</dd></div></div>`).join('')}</dl>
      ${(c.themes || []).length ? `<h2>Course themes</h2><ul class="themes">${c.themes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    </article>`;
  }

  // ---------------------------------------------------------- fact maps

  // The whole chapter told as one inline graphic novel: the story, then the
  // big ideas, the timeline, and the key terms, each an illustrated panel.
  let mapSeq = 0;
  function illustratedTimeline(n) {
    const tl = (window.TL || {})[String(n)];
    if (!tl || !tl.length) return '';
    const rows = tl.map((e, i) => `
      <div class="tl-entry" id="tle-${i}">
        <div class="tl-imgs">${e.imgs.map(src => `<img class="tl-img" src="${src}" alt="" loading="lazy">`).join('')}</div>
        <div class="tl-head"><span class="tl-date">${esc(e.date)}</span><h3 class="tl-title">${esc(e.title)}</h3></div>
        ${e.detail ? `<p class="tl-detail">${esc(e.detail)}</p>` : ''}
      </div>`).join('');
    return `<div class="tl">${rows}</div>`;
  }

  function graphicNovel(n, c) {
    // an illustrated timeline (each key term / event demonstrated) takes precedence
    const tl = illustratedTimeline(n);
    if (tl) return tl;
    const imgs = (window.CH_IMAGES || {})[String(n)] || {};
    // a hand-authored follow-along story (paired panels + narration), if any
    const story = (window.STORY || {})[String(n)];
    if (story && story.length) {
      const strips = story.map((s, i) => {
        // Cartoon-only: the comic itself carries the timeline; date is baked into the image.
        if (s.nocap) {
          return `<figure class="cstrip dated"><img class="cstrip-img" src="${s.img}" alt="" loading="lazy"></figure>`;
        }
        // New dated format: just the art + a date badge, no narration text.
        if (s.date) {
          const dmap = (window.Atlas && Atlas.spotsFor(s.cap).length)
            ? `<a class="strip-map" href="#/atlas/${n}/${i}">See these places on the map</a>` : '';
          // date is baked into the top-left of the image itself now, so no HTML badge
          return `<figure class="cstrip dated">
            <img class="cstrip-img" src="${s.img}" alt="" loading="lazy">
            <figcaption class="cstrip-cap"><p>${esc(s.cap).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>${dmap}</figcaption>
          </figure>`;
        }
        const hasPlaces = (window.Atlas && Atlas.spotsFor(s.cap).length);
        const map = hasPlaces ? `<a class="strip-map" href="#/atlas/${n}/${i}">See these places on the map</a>` : '';
        return `<figure class="cstrip">
          <img class="cstrip-img" src="${s.img}" alt="" loading="lazy">
          <figcaption class="cstrip-cap"><p>${esc(s.cap).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>${map}</figcaption>
        </figure>`;
      }).join('');
      return `<div class="comic-strips">${strips}</div>`;
    }
    const comic = Array.isArray(imgs.comic) ? imgs.comic : [];
    const cells = [];
    let si = 0;
    (c.summary || []).forEach(p => {
      Comic.splitPara(p).forEach(sen => {
        if (si >= 16) return;
        const src = comic[si];
        const art = src
          ? `<img class="strip-img" src="${src}" alt="" loading="lazy">`
          : (window.Comic ? Comic.mini(sen) : '');
        const hasPlaces = (window.Atlas && Atlas.spotsFor(sen).length);
        const map = hasPlaces ? `<a class="strip-map" href="#/atlas/${n}/${si}">See on map</a>` : '';
        cells.push(`<figure class="strip-cell">
          <div class="strip-art"><span class="strip-no">${si + 1}</span>${art}</div>
          <figcaption class="strip-cap"><span>${esc(sen)}</span>${map}</figcaption>
        </figure>`);
        si++;
      });
    });
    return `<div class="comic-page">${cells.join('')}</div>`;
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
      return ev ? ev.year + ': ' + ev.event : '';
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

  // Study & quiz: pick the sections above you want to lock in, skim a quick
  // recap of each, then get quizzed on just those concepts (never dates).
  const sq = { n: null, sections: [], selected: new Set(), phase: 'select', oi: 0, deck: [], i: 0, score: 0, answered: false, correct: '' };

  function firstSentence(s) {
    if (!s) return '';
    const m = String(s).match(/[^.!?]+[.!?]+/);
    return (m ? m[0] : String(s)).trim();
  }
  function conceptOf(e) {
    return (e && e.text && e.text.trim()) ? e.text.trim() : firstSentence(e && e.detail);
  }

  function chapterQuizHtml(n) {
    const tl = (window.TL || {})[String(n)] || [];
    if (tl.length < 2) return '';
    return `<section class="ch-quiz" id="ch-quiz"><h2>Study &amp; quiz</h2>
      <div id="cq-body"></div></section>`;
  }

  function startChapterQuiz(n) {
    n = Number(n);
    const tl = (window.TL || {})[String(n)] || [];
    sq.n = n;
    sq.sections = tl.map((e, i) => ({ i, date: e.date, title: e.title, detail: e.detail || '', concept: conceptOf(e) }));
    sq.selected = new Set();
    sq.phase = 'select'; sq.oi = 0; sq.deck = []; sq.i = 0; sq.score = 0; sq.answered = false;
    renderStudyQuiz();
  }

  function renderStudyQuiz() {
    const body = document.getElementById('cq-body');
    if (!body) return;
    if (!sq.sections.length) { body.innerHTML = ''; return; }
    if (sq.phase === 'quiz') return renderConceptQuiz(body);
    // ---- select phase: choose which concepts to drill
    const items = sq.sections.map(s => `
      <button class="sq-item${sq.selected.has(s.i) ? ' on' : ''}" data-sqsel="${s.i}" aria-pressed="${sq.selected.has(s.i)}">
        <span class="sq-check" aria-hidden="true"></span>
        <span class="sq-item-txt"><span class="sq-item-date">${esc(s.date)}</span> ${esc(s.title)}</span>
      </button>`).join('');
    const k = sq.selected.size;
    body.innerHTML = `
      <div class="sq-tools">
        <button class="btn small ghost" id="sq-all">${k === sq.sections.length ? 'Clear all' : 'Select all'}</button>
        <span class="sq-count">${k} selected</span>
      </div>
      <div class="sq-list">${items}</div>
      <button class="btn" id="sq-start"${k ? '' : ' disabled'}>Quiz me${k ? ` (${k * 10} questions)` : ''} →</button>`;
  }

  function pickedSections() {
    return sq.sections.filter(s => sq.selected.has(s.i));
  }

  // Ten questions per selected concept, alternating "name the definition" and
  // "name the concept" and cycling the wording so the reps don't feel identical.
  const FWD_PHRASE = [
    'Which best describes <strong>%</strong>?',
    'What was <strong>%</strong>?',
    'Which definition matches <strong>%</strong>?',
    'What does <strong>%</strong> refer to?',
    'Pick the correct account of <strong>%</strong>:',
  ];
  const REV_PHRASE = [
    'Which concept does this describe?',
    'This description fits which concept?',
    'Which term matches this?',
    'Identify the concept:',
  ];
  const QUESTIONS_PER_CONCEPT = 10;

  // One machine-generated fallback question (used only where no authored bank exists).
  function genQuestion(s, r) {
    const phrase = Math.floor(r / 2);
    let qHtml, answer, pool;
    if (r % 2) {
      qHtml = `${REV_PHRASE[phrase % REV_PHRASE.length]}<br><em class="quiz-desc">${esc(s.concept)}</em>`;
      answer = s.title;
      pool = [...new Set(sq.sections.map(x => x.title).filter(t => t && t !== answer))];
    } else {
      qHtml = FWD_PHRASE[phrase % FWD_PHRASE.length].replace('%', esc(s.title));
      answer = s.concept;
      pool = [...new Set(sq.sections.map(x => x.concept).filter(c => c && c !== answer))];
    }
    shuffle(pool);
    return { qHtml, choices: [answer].concat(pool.slice(0, 3)), answer };
  }

  function startQuizDeck() {
    const picked = pickedSections();
    const titles = new Set(picked.map(s => s.title));
    const bank = ((window.QUIZ || {})[String(sq.n)] || [])
      .filter(q => titles.has(q.concept) && Array.isArray(q.choices)
        && typeof q.answer === 'number' && q.choices[q.answer] != null);
    let deck;
    if (bank.length) {
      // authored, exam-style questions for the picked concepts
      deck = bank.map(q => ({ q: q.q, choices: q.choices.slice(), answer: q.choices[q.answer] }));
    } else {
      // fallback: machine-generated drill for chapters not yet authored
      deck = [];
      picked.filter(s => s.concept).forEach(s => {
        for (let r = 0; r < QUESTIONS_PER_CONCEPT; r++) deck.push(genQuestion(s, r));
      });
    }
    shuffle(deck);
    sq.deck = deck; sq.i = 0; sq.score = 0; sq.answered = false; sq.phase = 'quiz';
    renderStudyQuiz();
  }

  function renderConceptQuiz(body) {
    body = body || document.getElementById('cq-body');
    if (!body) return;
    if (!sq.deck.length) {
      body.innerHTML = `<p class="flag-hint">Those sections don't have a concept to quiz on.
        <button class="btn small" id="cq-restudy">Pick others</button></p>`;
      return;
    }
    if (sq.i >= sq.deck.length) {
      const pct = Math.round(100 * sq.score / sq.deck.length);
      body.innerHTML = `<p class="cq-score">${sq.score} / ${sq.deck.length} right (${pct}%)</p>
        <div class="ov-nav">
          <button class="btn small ghost" id="cq-restudy">Pick different concepts</button>
          <button class="btn" id="cq-restart">Retake these</button>
        </div>`;
      return;
    }
    const item = sq.deck[sq.i];
    const stem = item.qHtml || esc(item.q);
    const opts = shuffle(item.choices.slice());
    sq.correct = item.answer; sq.answered = false;
    body.innerHTML = `<div class="cq-top">
        <button class="btn small ghost" id="sq-back">‹ Back to sections</button>
        <span class="cq-count">Question ${sq.i + 1} of ${sq.deck.length} · score ${sq.score}</span>
      </div>
      <p class="quiz-q">${stem}</p>
      <div class="cq-opts">${opts.map(o => `<button class="quiz-opt" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  }

  function answerChapterQuiz(btn) {
    if (sq.answered) return;
    sq.answered = true;
    if (btn.dataset.opt === sq.correct) sq.score += 1;
    const body = document.getElementById('cq-body');
    body.querySelectorAll('.quiz-opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.opt === sq.correct) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    const nav = document.createElement('div');
    nav.className = 'cq-next';
    nav.innerHTML = `<button class="btn small" id="cq-advance">${sq.i + 1 < sq.deck.length ? 'Next question' : 'See score'}</button>`;
    body.appendChild(nav);
  }

  // ---------------------------------------------------------- date-sorting game
  // Drag (or nudge) the chapter's events into chronological order, then grade.
  const dg = { n: null, items: [], order: [], checked: false };
  let dgDrag = null;

  function dateGameHtml(n) {
    const c = chap(n);
    const pool = ((c && c.timeline) || []).filter(t => t.event && /\d/.test(String(t.year)));
    const years = new Set(pool.map(t => parseYear(t.year)));
    if (years.size < 3) return '';
    return `<section class="date-game" id="date-game"><h2>Put it in order</h2><div id="dg-body"></div></section>`;
  }

  function startDateGame(n) {
    n = Number(n);
    const c = chap(n) || {};
    const pool = [], seen = {};
    (c.timeline || []).forEach(t => {
      if (!t.event || !/\d/.test(String(t.year))) return;
      const y = parseYear(t.year);
      if (!(y in seen)) { seen[y] = 1; pool.push({ year: t.year, event: t.event, key: y }); }
    });
    if (pool.length < 3) { dg.items = []; renderDateGame(); return; }
    shuffle(pool);
    dg.items = pool.slice(0, Math.min(7, pool.length)).map((it, id) => ({ ...it, id }));
    dg.order = dg.items.map(it => it.id);
    for (let t = 0; t < 6 && dgSorted(); t++) shuffle(dg.order);   // don't start already-solved
    dg.n = n; dg.checked = false;
    renderDateGame();
  }

  function dgKey(id) { return dg.items.find(it => it.id === id).key; }
  function dgSorted() { return dg.order.every((id, p) => p === 0 || dgKey(dg.order[p - 1]) <= dgKey(id)); }

  function renderDateGame() {
    const body = document.getElementById('dg-body');
    if (!body) return;
    if (!dg.items.length) { body.innerHTML = ''; return; }
    const truth = [...dg.order].sort((a, b) => dgKey(a) - dgKey(b));
    const item = id => dg.items.find(it => it.id === id);
    const cards = dg.order.map((id, pos) => {
      const it = item(id);
      let cls = 'dg-card';
      let dateHtml = '';
      if (dg.checked) {
        cls += (dg.order[pos] === truth[pos]) ? ' ok' : ' bad';
        dateHtml = `<span class="dg-date">${esc(String(it.year))}</span>`;
      }
      return `<li class="${cls}" draggable="${dg.checked ? 'false' : 'true'}" data-id="${id}">
        <span class="dg-grip" aria-hidden="true">⋮⋮</span>
        <span class="dg-event">${esc(it.event)}</span>
        ${dateHtml}
        <span class="dg-move">
          <button class="dg-arrow" data-mv="up" aria-label="Move earlier"${pos === 0 || dg.checked ? ' disabled' : ''}>▲</button>
          <button class="dg-arrow" data-mv="down" aria-label="Move later"${pos === dg.order.length - 1 || dg.checked ? ' disabled' : ''}>▼</button>
        </span></li>`;
    }).join('');
    let foot;
    if (dg.checked) {
      const right = dg.order.reduce((a, id, p) => a + (id === truth[p] ? 1 : 0), 0);
      const perfect = right === dg.order.length;
      foot = `<p class="dg-result ${perfect ? 'win' : 'miss'}">${perfect
        ? `Perfect. All ${dg.order.length} in chronological order.`
        : `${right} of ${dg.order.length} in the right spot. The ones in red are out of place. Dates are shown now, so drag or replay to fix them.`}</p>
        <button class="btn" id="dg-again">Play again</button>`;
    } else {
      foot = `<div class="dg-actions"><button class="btn" id="dg-check">Check order</button>
        <button class="btn small ghost" id="dg-shuffle">Shuffle</button></div>`;
    }
    body.innerHTML = `<p class="dg-instr">Drag the events so the earliest sits at the top, then check your answer.</p>
      <ol class="dg-list" id="dg-list">${cards}</ol>${foot}`;
  }

  function dgAfterEl(list, y) {
    const els = [...list.querySelectorAll('.dg-card:not(.dragging)')];
    let best = { off: -Infinity, el: null };
    els.forEach(el => {
      const box = el.getBoundingClientRect();
      const off = y - box.top - box.height / 2;
      if (off < 0 && off > best.off) best = { off, el };
    });
    return best.el;
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
      <p class="cover-note">Terms mixed from every chapter and resurfaced on a spacing schedule: miss one and it returns sooner, get it right and it waits longer. Retrieval practice plus spacing are the two techniques the research backs most.</p>
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
    return `<p class="crumb"><a href="#/unit/${u.id}">Unit ${u.id}: ${esc(u.name)}</a></p>
      <h1>Timeline challenge</h1>
      <p class="cover-note">Click the events in order, earliest to latest. Sequencing events is exactly what the exam's causation and continuity-and-change questions test, and where students most often slip.</p>
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
      <p class="ord-instr">Choose #${ord.picked.length + 1}, earliest first:</p>
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

  // flashcards for one chapter, shown at the bottom of the chapter page:
  // key terms + timeline dates + any extra generated cards.
  function chapterCards(n) {
    const c = chap(n) || {};
    const cards = [];
    (c.key_terms || []).forEach(t => cards.push({ front: t.term, back: t.def }));
    (c.timeline || []).forEach(t => cards.push({ front: String(t.year), back: t.event }));
    ((window.EXTRA_CARDS || {})[String(n)] || []).forEach(x => cards.push({ front: x.q, back: x.a }));
    if (cards.length < 2) return '';
    deck = cards; pos = 0; flipped = false;
    return `
    <h2>Flashcards</h2>
    <div class="fc-stage"><div class="fcard" id="fcard" role="button" tabindex="0" aria-live="polite"></div></div>
    <nav class="quiz-nav">
      <button class="btn" id="qprev">Back</button>
      <span id="qcount" class="qcount"></span>
      <button class="btn" id="qnext">Next</button>
    </nav>`;
  }

  function renderCard() {
    const el = document.getElementById('fcard');
    if (!el || !deck.length) return;
    const t = deck[pos];
    el.innerHTML = flipped
      ? `<span class="fc-def">${esc(t.back)}</span>`
      : `<span class="fc-term">${esc(t.front)}</span>`;
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

    // Study & quiz: section select → recap overview → concept quiz
    const sel = e.target.closest('[data-sqsel]');
    if (sel) {
      const i = +sel.dataset.sqsel;
      if (sq.selected.has(i)) sq.selected.delete(i); else sq.selected.add(i);
      renderStudyQuiz(); return;
    }
    if (e.target.closest('#sq-all')) {
      if (sq.selected.size === sq.sections.length) sq.selected.clear();
      else sq.sections.forEach(s => sq.selected.add(s.i));
      renderStudyQuiz(); return;
    }
    if (e.target.closest('#sq-start')) { startQuizDeck(); return; }
    if (e.target.closest('#sq-back')) { sq.phase = 'select'; renderStudyQuiz(); return; }

    const opt = e.target.closest('.ch-quiz .quiz-opt');
    if (opt) { answerChapterQuiz(opt); return; }
    if (e.target.closest('#cq-advance')) { sq.i += 1; renderStudyQuiz(); return; }
    if (e.target.closest('#cq-restudy')) { sq.phase = 'select'; renderStudyQuiz(); return; }
    if (e.target.closest('#cq-restart')) { startQuizDeck(); return; }

    // date-sorting game: nudge / check / shuffle / replay
    const arrow = e.target.closest('.dg-arrow');
    if (arrow) {
      const id = +arrow.closest('.dg-card').dataset.id, pos = dg.order.indexOf(id);
      const np = pos + (arrow.dataset.mv === 'up' ? -1 : 1);
      if (np >= 0 && np < dg.order.length) { dg.order[pos] = dg.order[np]; dg.order[np] = id; renderDateGame(); }
      return;
    }
    if (e.target.closest('#dg-check')) { dg.checked = true; renderDateGame(); return; }
    if (e.target.closest('#dg-shuffle')) { shuffle(dg.order); renderDateGame(); return; }
    if (e.target.closest('#dg-again')) { startDateGame(dg.n); return; }

    const ropt = e.target.closest('#rv-body .quiz-opt');
    if (ropt) { answerReview(ropt); return; }
    if (e.target.closest('#rv-next')) { rv.i += 1; renderReview(); return; }
    if (e.target.closest('#rv-again')) { startReview(); return; }
  });

  // drag-and-drop reordering for the date-sorting game
  app.addEventListener('dragstart', e => {
    const card = e.target.closest('.dg-card');
    if (!card || dg.checked) return;
    dgDrag = card; e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  app.addEventListener('dragover', e => {
    const list = e.target.closest('#dg-list');
    if (!list || !dgDrag) return;
    e.preventDefault();
    const after = dgAfterEl(list, e.clientY);
    if (after == null) list.appendChild(dgDrag);
    else list.insertBefore(dgDrag, after);
  });
  app.addEventListener('drop', e => { if (e.target.closest('#dg-list')) e.preventDefault(); });
  app.addEventListener('dragend', () => {
    if (!dgDrag) return;
    dgDrag.classList.remove('dragging');
    const list = document.getElementById('dg-list');
    if (list) dg.order = [...list.children].map(c => +c.dataset.id);
    dgDrag = null;
    renderDateGame();
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
    const parts = h.split('/');
    const view = parts[0], arg = parts[1];
    if (window.Typer) Typer.destroy();
    if (window.Atlas && Atlas.destroy) Atlas.destroy();
    let html;
    if (!view) html = home();
    else if (view === 'unit') html = unit(arg);
    else if (view === 'ch') html = chapter(arg);
    else if (view === 'remnant') html = remnant(arg);
    else if (view === 'review') html = reviewHtml();
    else if (view === 'atlas') html = Atlas.html(parts[1], parts[2]);
    else if (view === 'find') html = find(decodeURIComponent(h.slice(5)));
    else html = notFound();
    app.innerHTML = (view ? '<button class="backbtn" id="backbtn">‹ Back</button>' : '') + html;
    if (view === 'ch') { startChapterQuiz(arg); startDateGame(arg); Comic.wire(arg); }
    if (view === 'review') startReview();
    if (view === 'atlas') Atlas.wire(parts[1], parts[2]);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  app.addEventListener('click', e => {
    if (e.target.closest('#backbtn')) {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.hash = '#/';
    }
  });

  window.addEventListener('hashchange', render);
  render();
})();
