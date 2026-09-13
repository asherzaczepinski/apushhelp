// Seterra-style map guesser for the homepage: click the map to learn U.S.
// states, the 13 colonies, and major rivers. Renders real state polygons
// (us_states.js) via a simple equirectangular projection.
window.GeoQuiz = (function () {
  const COLONIES = ['Massachusetts', 'Rhode Island', 'Connecticut', 'New Hampshire',
    'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland', 'Virginia',
    'North Carolina', 'South Carolina', 'Georgia'];

  const RIVERS = [
    { name: 'Mississippi River', pts: [[-95.2, 47.2], [-94.9, 44.9], [-91.2, 43.5], [-90.2, 38.6], [-91.1, 32.3], [-90.1, 29.95], [-89.4, 29.2]] },
    { name: 'Missouri River', pts: [[-111.5, 47.6], [-104.8, 47.9], [-100.8, 46.9], [-96.1, 42.8], [-95.9, 40.7], [-92.3, 38.7], [-90.2, 38.8]] },
    { name: 'Ohio River', pts: [[-80.0, 40.44], [-82.0, 38.7], [-85.7, 38.3], [-88.0, 37.9], [-89.1, 37.0]] },
    { name: 'Rio Grande', pts: [[-106.6, 37.8], [-106.5, 35.1], [-106.0, 31.8], [-102.3, 29.8], [-99.5, 27.5], [-97.4, 25.9]] },
    { name: 'Colorado River', pts: [[-105.7, 40.4], [-108.6, 39.1], [-111.6, 37.0], [-113.0, 36.0], [-114.6, 34.5], [-114.7, 32.7]] },
    { name: 'Hudson River', pts: [[-73.6, 43.3], [-73.8, 42.3], [-73.9, 41.3], [-74.0, 40.7]] },
    { name: 'Columbia River', pts: [[-118.0, 46.2], [-119.6, 46.0], [-121.2, 45.6], [-123.1, 46.2], [-124.0, 46.25]] },
  ];

  const SVGNS = 'http://www.w3.org/2000/svg';
  let proj = null;

  function computeProj(states, W) {
    let minLng = 1e9, maxLng = -1e9, minLat = 1e9, maxLat = -1e9;
    states.forEach(s => s.rings.forEach(r => r.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    })));
    const midLat = (minLat + maxLat) / 2;
    const kx = Math.cos(midLat * Math.PI / 180);
    const scale = W / ((maxLng - minLng) * kx);
    return {
      W, H: (maxLat - minLat) * scale, minLng, maxLat, kx, scale,
      px: (lng) => (lng - minLng) * kx * scale,
      py: (lat) => (maxLat - lat) * scale,
    };
  }

  function ringPath(ring) {
    let d = '';
    for (let i = 0; i < ring.length; i++) {
      const x = proj.px(ring[i][0]).toFixed(1), y = proj.py(ring[i][1]).toFixed(1);
      d += (i ? 'L' : 'M') + x + ' ' + y + ' ';
    }
    return d + 'Z';
  }

  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function mount(host) {
    const states = window.US_STATES;
    if (!host || !states) return;
    const W = 760;
    proj = computeProj(states, W);

    host.innerHTML = `
      <div class="gq-head">
        <h2>Map drill</h2>
        <p class="gq-sub">Click the map to learn the states, the 13 colonies, and the great rivers.</p>
        <div class="gq-modes">
          <button class="gq-mode is-on" data-mode="colonies">13 Colonies</button>
          <button class="gq-mode" data-mode="states">States</button>
          <button class="gq-mode" data-mode="rivers">Rivers</button>
        </div>
      </div>
      <div class="gq-prompt"><span id="gq-ask">—</span><span class="gq-score" id="gq-score"></span></div>
      <div class="gq-mapwrap" id="gq-mapwrap"></div>
      <p class="gq-tip">Green = correct. Red = try again; the right one flashes.</p>`;

    const svg = el('svg', { viewBox: `0 0 ${proj.W} ${proj.H}`, class: 'gq-svg' });
    svg.style.width = '100%'; svg.style.height = 'auto';

    const byName = {};
    states.forEach(s => {
      const p = el('path', { d: s.rings.map(ringPath).join(' '), class: 'gq-state', 'data-name': s.name });
      svg.appendChild(p); byName[s.name] = p;
    });
    // rivers (thin visible line + fat invisible hit line)
    const riverEls = {};
    RIVERS.forEach(rv => {
      const d = rv.pts.map((p, i) => (i ? 'L' : 'M') + proj.px(p[0]).toFixed(1) + ' ' + proj.py(p[1]).toFixed(1)).join(' ');
      const hit = el('path', { d, class: 'gq-river-hit', 'data-name': rv.name });
      const line = el('path', { d, class: 'gq-river', 'data-name': rv.name });
      svg.appendChild(line); svg.appendChild(hit);
      riverEls[rv.name] = [line, hit];
    });
    host.querySelector('#gq-mapwrap').appendChild(svg);

    let mode = 'colonies', target = null, score = 0, total = 0, locked = false;
    const ask = host.querySelector('#gq-ask'), scoreEl = host.querySelector('#gq-score');

    function list() {
      if (mode === 'colonies') return COLONIES;
      if (mode === 'rivers') return RIVERS.map(r => r.name);
      return states.map(s => s.name).filter(n => n !== 'District of Columbia');
    }
    function paint() {
      svg.classList.toggle('gq-rivers-on', mode === 'rivers');
      states.forEach(s => byName[s.name].classList.toggle('is-colony',
        mode === 'colonies' && COLONIES.indexOf(s.name) !== -1));
    }
    function next() {
      locked = false;
      const opts = list();
      let t; do { t = opts[Math.floor(Math.random() * opts.length)]; } while (t === target && opts.length > 1);
      target = t;
      ask.textContent = (mode === 'rivers' ? 'Find the ' : 'Find ') + target;
      scoreEl.textContent = total ? `${score}/${total}` : '';
    }
    function flash(node, cls) {
      if (!node) return;
      node.classList.add(cls);
      setTimeout(() => node.classList.remove(cls), 750);
    }
    function guess(name, node) {
      if (locked || !name) return;
      total++;
      if (name === target) {
        score++; flash(node, 'is-right'); locked = true; setTimeout(next, 800);
      } else {
        flash(node, 'is-wrong');
        const correct = mode === 'rivers' ? riverEls[target] && riverEls[target][0] : byName[target];
        flash(correct, 'is-answer');
      }
      scoreEl.textContent = `${score}/${total}`;
    }

    svg.addEventListener('click', (e) => {
      const t = e.target.closest('[data-name]');
      if (!t) return;
      const isRiver = t.classList.contains('gq-river') || t.classList.contains('gq-river-hit');
      if (mode === 'rivers' && !isRiver) return;
      if (mode !== 'rivers' && isRiver) return;
      guess(t.getAttribute('data-name'), isRiver ? riverEls[t.getAttribute('data-name')][0] : t);
    });

    host.querySelectorAll('.gq-mode').forEach(b => b.addEventListener('click', () => {
      host.querySelectorAll('.gq-mode').forEach(x => x.classList.remove('is-on'));
      b.classList.add('is-on');
      mode = b.getAttribute('data-mode'); score = 0; total = 0; paint(); next();
    }));

    paint(); next();
  }

  return { mount };
})();
