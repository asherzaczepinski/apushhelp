// Gilded Globe — mogul tycoon on the 3D Earth. Twenty rounds against
// Vanderbilt, Rockefeller, and Carnegie: claim territories, upgrade
// them, and study the book for an edge.
window.Tycoon = (function () {
  const LS = 'gml_tycoon';
  const ROUNDS = 20;
  const PLAYER_COLOR = '#8c1c13';
  let S = null;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const terr = id => TYCOON_TERR.find(t => t.id === id);

  function load() { try { S = JSON.parse(localStorage.getItem(LS)); } catch (e) { S = null; } }
  function save() { localStorage.setItem(LS, JSON.stringify(S)); }
  function fresh() {
    S = {
      round: 1, cash: 100, know: 0, discount: 1, actions: 2, study: 1,
      owned: {}, selected: null, done: false,
      rivals: TYCOON_RIVALS.map(r => ({ id: r.id, cash: 100, owned: {} })),
      log: ['1865. The war is over, the rails are hungry, and three moguls are ahead of you. Twenty seasons to catch them.']
    };
    save();
  }
  function log(m) { S.log.unshift(m); S.log = S.log.slice(0, 30); }

  function ownerOf(id) {
    if (S.owned[id]) return 'you';
    const r = S.rivals.find(rv => rv.owned[id]);
    return r ? r.id : null;
  }
  function colorMap() {
    const map = {};
    TYCOON_TERR.forEach(t => {
      const o = ownerOf(t.id);
      if (o === 'you') map[t.id] = PLAYER_COLOR;
      else if (o) map[t.id] = TYCOON_RIVALS.find(r => r.id === o).color;
    });
    return map;
  }
  function worthOf(owned) {
    return Object.entries(owned).reduce((sum, [id, lv]) => sum + terr(id).cost * lv, 0);
  }
  function incomeOf(owned) {
    return Object.entries(owned).reduce((sum, [id, lv]) => sum + terr(id).income * lv, 0);
  }

  // ---------------------------------------------------------- shell

  function html() { return '<div id="tycoon-root"></div>'; }

  function wire() {
    load();
    if (!S) fresh();
    const root = document.getElementById('tycoon-root');
    root.innerHTML =
      '<p class="crumb"><a href="#/">All periods</a></p>' +
      '<header class="camp-head"><h1>The gilded globe</h1>' +
      '<p class="ch-years">1865–1885 · you against Vanderbilt, Rockefeller, and Carnegie</p></header>' +
      '<div class="tycoon-layout">' +
      '<div class="globe-host" id="globe-host"></div>' +
      '<div class="tycoon-panel" id="tycoon-panel"></div>' +
      '</div>' +
      '<div id="tycoon-log"></div>';
    Globe3D.start(document.getElementById('globe-host'), {
      territories: TYCOON_TERR,
      onPick: id => { if (!S.done) { S.selected = id; save(); paintPanel(); } }
    });
    paintPanel();
  }

  // ---------------------------------------------------------- panel

  function paintPanel() {
    Globe3D.setOwners(colorMap(), S.selected);
    const panel = document.getElementById('tycoon-panel');
    const logEl = document.getElementById('tycoon-log');
    if (!panel) return;
    if (S.done) { panel.innerHTML = endHtml(); logEl.innerHTML = logHtml(); bindEnd(); return; }

    panel.innerHTML =
      '<div class="camp-status tycoon-status">' +
      '<span>round <strong>' + S.round + '</strong>/' + ROUNDS + '</span>' +
      '<span>cash <strong>' + S.cash + '</strong></span>' +
      '<span>income <strong>+' + incomeOf(S.owned) + '</strong></span>' +
      '<span>actions <strong>' + S.actions + '</strong></span>' +
      '<span>knowledge <strong>' + S.know + '</strong>' + (S.discount < 1 ? ' · next claim −15%' : '') + '</span>' +
      '</div>' +
      selectedHtml() +
      standingsHtml() +
      '<div class="tycoon-endturn"><button class="btn" id="end-turn">End round ' + S.round + '</button> ' +
      '<button class="btn ghost" id="ty-restart">Start over</button></div>';
    logEl.innerHTML = logHtml();
    bind();
  }

  function selectedHtml() {
    if (!S.selected) {
      return '<div class="terr-card"><p class="game-note">Spin the globe and click a marker. ' +
        'Cream markers are unclaimed; red are yours.</p></div>';
    }
    const t = terr(S.selected);
    const o = ownerOf(t.id);
    const price = Math.round(t.cost * S.discount);
    let body = '<strong>' + esc(t.name) + '</strong> — ' + esc(t.industry) +
      '<span class="terr-meta">cost ' + t.cost + ' · income ' + t.income + '/round · era: ch ' + t.chapters.join(', ') + '</span>';
    if (o === 'you') {
      const lv = S.owned[t.id];
      const up = Math.round(t.cost * 0.5 * lv);
      body += '<span class="terr-owner you">Yours — level ' + lv + ', paying ' + (t.income * lv) + '/round</span>' +
        '<button class="btn small" id="do-upgrade" ' + ((S.actions < 1 || S.cash < up) ? 'disabled' : '') + '>Upgrade for ' + up + '</button>';
    } else if (o) {
      const rv = TYCOON_RIVALS.find(r => r.id === o);
      body += '<span class="terr-owner">Held by ' + esc(rv.name) + '</span>';
    } else {
      body += '<button class="btn small" id="do-claim" ' + ((S.actions < 1 || S.cash < price) ? 'disabled' : '') + '>Claim for ' + price + '</button>';
    }
    body += ' <button class="btn small ghost" id="do-study" ' + (S.study < 1 ? 'disabled' : '') + '>Study this era</button>';
    return '<div class="terr-card" id="terr-card">' + body + '<div id="ty-quiz"></div></div>';
  }

  function standingsHtml() {
    const rows = [{ name: 'You', color: PLAYER_COLOR, worth: S.cash + worthOf(S.owned), n: Object.keys(S.owned).length }]
      .concat(S.rivals.map(rv => ({
        name: TYCOON_RIVALS.find(r => r.id === rv.id).name.split(' ').pop(),
        color: TYCOON_RIVALS.find(r => r.id === rv.id).color,
        worth: rv.cash + worthOf(rv.owned), n: Object.keys(rv.owned).length
      })));
    const max = Math.max.apply(null, rows.map(r => r.worth).concat([1]));
    return '<div class="standings">' + rows.map(r =>
      '<div class="stand-row"><span class="stand-name">' + esc(r.name) + '</span>' +
      '<span class="stand-bar"><span style="width:' + Math.round(100 * r.worth / max) + '%;background:' + r.color + '"></span></span>' +
      '<span class="stand-num">' + r.worth + ' · ' + r.n + ' terr.</span></div>').join('') + '</div>';
  }

  function logHtml() {
    return '<h2 class="camp-log-head">The ledger</h2><ol class="camp-log">' +
      S.log.map(l => '<li>' + esc(l) + '</li>').join('') + '</ol>';
  }

  // ---------------------------------------------------------- actions

  function bind() {
    const g = id => document.getElementById(id);
    if (g('do-claim')) g('do-claim').addEventListener('click', doClaim);
    if (g('do-upgrade')) g('do-upgrade').addEventListener('click', doUpgrade);
    if (g('do-study')) g('do-study').addEventListener('click', doStudy);
    if (g('end-turn')) g('end-turn').addEventListener('click', endRound);
    if (g('ty-restart')) g('ty-restart').addEventListener('click', () => { fresh(); wire(); });
  }
  function bindEnd() {
    const b = document.getElementById('ty-restart');
    if (b) b.addEventListener('click', () => { fresh(); wire(); });
  }

  function doClaim() {
    const t = terr(S.selected);
    const price = Math.round(t.cost * S.discount);
    if (S.cash < price || S.actions < 1 || ownerOf(t.id)) return;
    S.cash -= price; S.actions -= 1;
    S.owned[t.id] = 1;
    if (S.discount < 1) { S.discount = 1; }
    log('You claim ' + t.name + ' (' + t.industry + ') for ' + price + '.');
    save(); paintPanel();
  }

  function doUpgrade() {
    const t = terr(S.selected);
    const lv = S.owned[t.id];
    const up = Math.round(t.cost * 0.5 * lv);
    if (!lv || S.cash < up || S.actions < 1) return;
    S.cash -= up; S.actions -= 1;
    S.owned[t.id] = lv + 1;
    log('You upgrade ' + t.name + ' to level ' + (lv + 1) + ' for ' + up + '.');
    save(); paintPanel();
  }

  function doStudy() {
    if (S.study < 1) return;
    const t = terr(S.selected);
    const terms = t.chapters.flatMap(n =>
      ((window.APUSH.chapters[String(n)] || {}).key_terms || []));
    if (terms.length < 4) return;
    S.study = 0;
    const q = terms[Math.floor(Math.random() * terms.length)];
    const wrong = [];
    while (wrong.length < 2) {
      const w = terms[Math.floor(Math.random() * terms.length)];
      if (w.term !== q.term && !wrong.includes(w)) wrong.push(w);
    }
    const opts = [q, ...wrong].sort(() => Math.random() - 0.5);
    const box = document.getElementById('ty-quiz');
    box.innerHTML = '<p class="quiz-q">What is <strong>' + esc(q.term) + '</strong>?</p>' +
      opts.map(o => '<button class="quiz-opt" data-term="' + esc(o.term) + '">' + esc(o.def) + '</button>').join('');
    box.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => {
      const right = btn.dataset.term === q.term;
      btn.classList.add(right ? 'right' : 'wrong');
      box.querySelectorAll('.quiz-opt').forEach(b => { b.disabled = true; });
      if (right) {
        S.know += 1; S.cash += 8; S.discount = 0.85;
        log('Study pays: +8 cash and 15% off your next claim (' + q.term + ').');
      } else {
        log('Missed one — look up ' + q.term + ' in chapter ' + t.chapters[0] + '.');
      }
      setTimeout(() => { save(); paintPanel(); }, 900);
    }));
  }

  // ---------------------------------------------------------- rivals + rounds

  function rivalTurn(rv) {
    const R = TYCOON_RIVALS.find(r => r.id === rv.id);
    const open = TYCOON_TERR.filter(t => !ownerOf(t.id) && rv.cash >= t.cost);
    const preferred = open.filter(t => R.prefs.includes(t.industry));
    const pick = (preferred.length ? preferred : open)
      .sort((a, b) => (b.income / b.cost) - (a.income / a.cost))[0];
    if (pick && Math.random() < 0.85) {
      rv.cash -= pick.cost;
      rv.owned[pick.id] = 1;
      log(R.name + ' claims ' + pick.name + ' (' + pick.industry + ').');
      return;
    }
    const holdings = Object.entries(rv.owned)
      .map(([id, lv]) => ({ t: terr(id), lv, up: Math.round(terr(id).cost * 0.5 * lv) }))
      .filter(h => rv.cash >= h.up)
      .sort((a, b) => b.t.income - a.t.income)[0];
    if (holdings) {
      rv.cash -= holdings.up;
      rv.owned[holdings.t.id] = holdings.lv + 1;
      log(R.name + ' upgrades ' + holdings.t.name + ' to level ' + (holdings.lv + 1) + '.');
    }
  }

  function endRound() {
    S.rivals.forEach(rivalTurn);
    S.cash += incomeOf(S.owned);
    S.rivals.forEach(rv => { rv.cash += incomeOf(rv.owned); });
    S.round += 1;
    S.actions = 2; S.study = 1;
    if (S.round > ROUNDS) S.done = true;
    else log('Round ' + S.round + ': the books close. Income paid to every house.');
    save(); paintPanel();
  }

  // ---------------------------------------------------------- ending

  function endHtml() {
    const rows = [{ name: 'You', worth: S.cash + worthOf(S.owned) }]
      .concat(S.rivals.map(rv => ({
        name: TYCOON_RIVALS.find(r => r.id === rv.id).name,
        worth: rv.cash + worthOf(rv.owned)
      }))).sort((a, b) => b.worth - a.worth);
    const place = rows.findIndex(r => r.name === 'You') + 1;
    const titles = ['Mogul of the age', 'A robber baron of note', 'A respectable fortune', 'Ruined — but educated'];
    return '<div class="camp-end"><h2>1885 — the books close</h2>' +
      '<p class="camp-rank">' + titles[place - 1] + '</p>' +
      '<p class="camp-tally">You finished #' + place + ' with ' + rows.find(r => r.name === 'You').worth +
      ' · knowledge ' + S.know + '</p>' +
      '<ol class="end-rank">' + rows.map(r => '<li>' + esc(r.name) + ' — ' + r.worth + '</li>').join('') + '</ol>' +
      '<p class="camp-real">The real Gilded Age worked the same way: control the chokepoints — rails, oil, steel, credit — ' +
      'and the income compounds until someone writes an antitrust law about you (chapter 16).</p>' +
      '<p class="camp-endnav"><button class="btn" id="ty-restart">Run it back</button> ' +
      '<a class="btn ghost" href="#/ch/16">Ch 16. America’s Gilded Age</a></p></div>';
  }

  return { html, wire };
})();
