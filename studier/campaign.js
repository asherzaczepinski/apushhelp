// Become History — role-play campaign engine.
// One action per season, three years per run. Money from exports,
// legacy from choices, knowledge from the book's own key terms.
window.Campaign = (function () {
  const LS = 'gml_campaign';
  const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
  let S = null;
  let abandonArmed = false;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function load() {
    try { S = JSON.parse(localStorage.getItem(LS)); } catch (e) { S = null; }
  }
  function save() { localStorage.setItem(LS, JSON.stringify(S)); }
  function fresh(figId) {
    const F = FIGURES[figId];
    S = {
      fig: figId, turn: 0, cash: F.startCash, legacy: 0, know: 0,
      ready: 0, stock: 0, bonus: 1, pending: null, done: false,
      log: ['You are ' + F.name + '. ' + F.blurb]
    };
    save();
  }
  function log(msg) { S.log.unshift(msg); S.log = S.log.slice(0, 40); }
  function fig() { return FIGURES[S.fig]; }
  function year() { return fig().startYear + Math.floor(S.turn / 4); }
  function season() { return SEASONS[S.turn % 4]; }

  function applyEffect(ef) {
    if (ef.cash) S.cash = Math.max(0, S.cash + ef.cash);
    if (ef.legacy) S.legacy += ef.legacy;
    if (ef.note) log(ef.note);
  }
  function advance() {
    S.turn += 1;
    if (S.turn >= 12) { S.done = true; save(); paint(); return; }
    const ev = fig().events[S.turn];
    if (ev) { S.pending = S.turn; }
    save(); paint();
  }

  // ---------------------------------------------------------- shell

  function html(arg) {
    if (arg && !FIGURES[arg]) return '<h1>No such figure</h1><p><a href="#/play">Choose a figure</a></p>';
    return '<div id="camp-root" data-fig="' + esc(arg || '') + '"></div>';
  }

  function wire(arg) {
    load();
    const root = document.getElementById('camp-root');
    if (!root) return;
    if (!arg) { root.innerHTML = chooseHtml(); return; }
    if (!S || S.fig !== arg) fresh(arg);
    abandonArmed = false;
    paint();
  }

  // ---------------------------------------------------------- choose

  function chooseHtml() {
    const resumable = S && !S.done ? S.fig : null;
    return '<p class="crumb"><a href="#/">All periods</a></p>' +
      '<h1>Become history</h1>' +
      '<p class="cover-note">Choose a figure. Twelve seasons. Make your fortune, make your name — then see what the real one did.</p>' +
      '<div class="fig-grid">' +
      Object.entries(FIGURES).map(([id, F]) =>
        '<a class="fig-card" href="#/play/' + id + '">' +
        (resumable === id ? '<span class="fig-resume">resume</span>' : '') +
        '<strong>' + esc(F.name) + '</strong>' +
        '<span class="fig-role">' + esc(F.role) + '</span>' +
        '<span class="fig-blurb">' + esc(F.blurb) + '</span>' +
        '<span class="fig-meta">' + F.startYear + ' · ' + esc(F.good) + '</span>' +
        '</a>').join('') +
      '</div>';
  }

  // ---------------------------------------------------------- campaign

  function paint() {
    const root = document.getElementById('camp-root');
    if (!root) return;
    if (window.Games) Games.destroy();
    if (window.Harbor3D) Harbor3D.destroy();
    const F = fig();
    if (S.done) { root.innerHTML = headHtml(F) + endHtml(F) + logHtml(); return; }

    root.innerHTML = headHtml(F) +
      '<div class="camp-status">' +
      '<span><strong>' + season() + ' ' + year() + '</strong> · season ' + (S.turn + 1) + ' of 12</span>' +
      '<span>purse <strong>' + S.cash + '</strong></span>' +
      '<span>legacy <strong>' + S.legacy + '</strong></span>' +
      '<span>knowledge <strong>' + S.know + '</strong></span>' +
      '<span>readiness <strong>' + S.ready + '</strong></span>' +
      '<span>cargo <strong>' + S.stock + '</strong>' + (S.bonus > 1 ? ' · counsel ×' + S.bonus.toFixed(2) : '') + '</span>' +
      '</div>' +
      (S.pending ? eventHtml(F.events[S.pending]) :
        '<div class="camp-actions">' +
        '<button class="btn" id="act-produce">Work the ' + esc(F.good.toLowerCase()) + '</button>' +
        '<button class="btn" id="act-ship"' + (S.stock < 1 ? ' disabled' : '') + '>Ship the cargo</button>' +
        '<button class="btn" id="act-drill">' + esc(F.drillTitle) + '</button>' +
        '<button class="btn" id="act-counsel">Take counsel (study)</button>' +
        '<button class="btn ghost" id="act-abandon">Abandon run</button>' +
        '</div>') +
      '<div class="camp-stage" id="camp-stage"></div>' +
      logHtml();
    bind();
  }

  function headHtml(F) {
    return '<p class="crumb"><a href="#/">All periods</a> / <a href="#/play">Become history</a></p>' +
      '<header class="camp-head"><h1>' + esc(F.name) + '</h1>' +
      '<p class="ch-years">' + esc(F.role) + '</p></header>';
  }
  function logHtml() {
    return '<h2 class="camp-log-head">The record</h2><ol class="camp-log">' +
      S.log.map(l => '<li>' + esc(l) + '</li>').join('') + '</ol>';
  }

  function bind() {
    const g = id => document.getElementById(id);
    if (g('act-produce')) g('act-produce').addEventListener('click', doProduce);
    if (g('act-ship')) g('act-ship').addEventListener('click', doShip);
    if (g('act-drill')) g('act-drill').addEventListener('click', doDrill);
    if (g('act-counsel')) g('act-counsel').addEventListener('click', doCounsel);
    if (g('act-abandon')) g('act-abandon').addEventListener('click', function () {
      if (!abandonArmed) { abandonArmed = true; this.textContent = 'Really abandon?'; return; }
      localStorage.removeItem(LS); S = null; location.hash = '#/play';
    });
    document.querySelectorAll('[data-choice]').forEach(btn =>
      btn.addEventListener('click', () => pickChoice(Number(btn.dataset.choice))));
    document.querySelectorAll('[data-endnav]').forEach(btn =>
      btn.addEventListener('click', () => { fresh(S ? S.fig : btn.dataset.endnav); paint(); }));
  }

  function lockActions() {
    document.querySelectorAll('.camp-actions .btn').forEach(b => { b.disabled = true; });
  }

  // ---------------------------------------------------------- actions

  function doProduce() {
    if (S.stock >= 5) { log('The warehouse is full — ship something.'); }
    else { S.stock += 1; S.cash += 2; log(season() + ' ' + year() + ': the ' + fig().good.toLowerCase() + ' comes in. Cargo +1, purse +2.'); }
    advance();
  }

  function doShip() {
    const stage = document.getElementById('camp-stage');
    lockActions();
    const stockAtLaunch = S.stock, bonusAtLaunch = S.bonus;
    const finish = score => {
      const profit = Math.round(score * (1 + 0.35 * stockAtLaunch) * bonusAtLaunch);
      S.cash += profit; S.stock = 0; S.bonus = 1;
      log(season() + ' ' + year() + ': the run pays ' + profit + ' coins (' + score + ' loaded, cargo ×' + stockAtLaunch + (bonusAtLaunch > 1 ? ', counsel bonus' : '') + ').');
      advance();
    };
    if (window.Harbor3D && Harbor3D.supported()) {
      stage.innerHTML = '<div class="h3d-host" id="h3d-host"></div>';
      Harbor3D.start(document.getElementById('h3d-host'),
        { good: fig().good, title: 'Ship the ' + fig().good.toLowerCase(), onScore: s => setTimeout(() => finish(s), 900) });
    } else {
      stage.innerHTML = '<canvas id="camp-canvas" width="640" height="380"></canvas>';
      Games.start('export', document.getElementById('camp-canvas'),
        { key: 'camp_ship_' + S.fig, good: fig().good, onScore: s => setTimeout(() => finish(s), 900) });
    }
  }

  function doDrill() {
    const stage = document.getElementById('camp-stage');
    lockActions();
    stage.innerHTML = '<canvas id="camp-canvas" width="640" height="380"></canvas>';
    Games.start('range', document.getElementById('camp-canvas'), {
      key: 'camp_drill_' + S.fig, title: fig().drillTitle,
      onScore: s => setTimeout(() => {
        S.ready = s;
        log(season() + ' ' + year() + ': ' + fig().drillTitle.toLowerCase() + ' — readiness now ' + s + '.');
        advance();
      }, 900)
    });
  }

  // ---------------------------------------------------------- counsel quiz

  function doCounsel() {
    const terms = fig().chapters.flatMap(n =>
      ((window.APUSH.chapters[String(n)] || {}).key_terms || []));
    if (terms.length < 4) { log('No counsel to be had.'); advance(); return; }
    lockActions();
    const picked = [];
    const pool = terms.slice();
    for (let i = 0; i < 3; i++) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    let qi = 0, correct = 0;
    const stage = document.getElementById('camp-stage');

    function ask() {
      const q = picked[qi];
      const wrong = [];
      while (wrong.length < 2) {
        const w = terms[Math.floor(Math.random() * terms.length)];
        if (w.term !== q.term && !wrong.includes(w)) wrong.push(w);
      }
      const opts = [q, ...wrong].sort(() => Math.random() - 0.5);
      stage.innerHTML = '<div class="quiz-card"><p class="quiz-q">Counsel ' + (qi + 1) + ' of 3 — what is <strong>' + esc(q.term) + '</strong>?</p>' +
        opts.map(o => '<button class="quiz-opt" data-term="' + esc(o.term) + '">' + esc(o.def) + '</button>').join('') +
        '</div>';
      stage.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
        const right = btn.dataset.term === q.term;
        if (right) correct += 1;
        btn.classList.add(right ? 'right' : 'wrong');
        stage.querySelectorAll('.quiz-opt').forEach(b => { b.disabled = true; });
        setTimeout(() => {
          qi += 1;
          if (qi < 3) ask();
          else {
            S.know += correct;
            S.bonus = 1 + 0.15 * correct;
            log(season() + ' ' + year() + ': counsel taken — ' + correct + ' of 3 right. Next shipment ×' + S.bonus.toFixed(2) + '.');
            advance();
          }
        }, 800);
      }));
    }
    ask();
  }

  // ---------------------------------------------------------- events

  function eventHtml(ev) {
    return '<div class="camp-event"><h2>' + esc(ev.title) + '</h2>' +
      '<p>' + esc(ev.text) + '</p>' +
      '<div class="camp-event-choices">' +
      ev.choices.map((c, i) => '<button class="btn" data-choice="' + i + '">' + esc(c.label) + '</button>').join('') +
      '</div></div>';
  }

  function pickChoice(i) {
    const ev = fig().events[S.pending];
    const c = ev.choices[i];
    if (c.skirmish) {
      const stage = document.getElementById('camp-stage');
      document.querySelectorAll('[data-choice]').forEach(b => { b.disabled = true; });
      stage.innerHTML = '<canvas id="camp-canvas" width="640" height="380"></canvas>';
      const threshold = Math.max(15, 25 - Math.floor(S.ready / 4));
      Games.start('range', document.getElementById('camp-canvas'), {
        key: 'camp_skirmish_' + S.fig, title: c.skirmish.prompt,
        onScore: s => setTimeout(() => {
          const won = s >= threshold;
          applyEffect(won ? c.skirmish.win : c.skirmish.lose);
          log((won ? 'Held. ' : 'Overrun. ') + '(' + s + ' against ' + threshold + ' needed — readiness helped by ' + S.ready + '.)');
          S.pending = null; save(); paint();
        }, 900)
      });
    } else {
      applyEffect(c.effect);
      S.pending = null; save(); paint();
    }
  }

  // ---------------------------------------------------------- ending

  function rank(total) {
    if (total < 60) return 'Lost to the archives';
    if (total < 120) return 'A footnote';
    if (total < 200) return 'A chapter heading';
    return 'An American icon';
  }

  function endHtml(F) {
    const total = S.cash + S.legacy * 8 + S.know * 4;
    return '<div class="camp-end">' +
      '<h2>' + year() + ' — the run ends</h2>' +
      '<p class="camp-rank">' + rank(total) + '</p>' +
      '<p class="camp-tally">purse ' + S.cash + ' · legacy ' + S.legacy + ' ×8 · knowledge ' + S.know + ' ×4 — <strong>' + total + '</strong></p>' +
      '<p class="camp-real">' + esc(F.ending) + '</p>' +
      '<p class="camp-endnav"><button class="btn" data-endnav="' + esc(S.fig) + '">Run it again</button> ' +
      '<a class="btn ghost" href="#/play">Choose another figure</a> ' +
      F.chapters.map(n => '<a class="btn small ghost" href="#/ch/' + n + '">Ch ' + n + '</a>').join(' ') +
      '</p></div>';
  }

  return { html, wire };
})();
