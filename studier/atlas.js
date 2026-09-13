// Atlantic world map — a real political map (country borders) with the places
// of the colonial story dropped on by coordinates: the 13 colonies with a
// goods emoji, plus England, Iberia, West Africa, the Caribbean, and the Aztec
// & Inca lands. Each place has a clickable ⭐ and keywords, so a panel's
// "Learn more" opens the map focused on exactly the places it mentions.
window.Atlas = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const SPOTS = [
    { id: 'MA', name: 'Massachusetts', lon: -71.1, lat: 42.4, emoji: '🐟', keys: ['massachusetts', 'boston', 'puritan', 'plymouth', 'pilgrim', 'new england', 'winthrop'], fact: 'Massachusetts Bay (1630) — the Puritan “city upon a hill”; cod, timber, shipbuilding, and Boston’s Atlantic trade.' },
    { id: 'NH', name: 'New Hampshire', lon: -71.5, lat: 43.6, emoji: '🌲', keys: ['new hampshire'], fact: 'New Hampshire (1623) — fishing, timber, and tall mast pines for the Royal Navy.' },
    { id: 'RI', name: 'Rhode Island', lon: -71.4, lat: 41.6, emoji: '🥃', keys: ['rhode island', 'roger williams', 'newport'], fact: 'Rhode Island (1636) — Roger Williams’s refuge of religious liberty; Newport’s rum-and-molasses merchants.' },
    { id: 'CT', name: 'Connecticut', lon: -72.7, lat: 41.5, emoji: '🐄', keys: ['connecticut', 'fundamental orders', 'hooker'], fact: 'Connecticut (1636) — river-valley farms; the Fundamental Orders, an early written frame of government.' },
    { id: 'NY', name: 'New York', lon: -74.6, lat: 42.6, emoji: '🦫', keys: ['new york', 'new netherland', 'dutch', 'new amsterdam', 'hudson', 'manhattan'], fact: 'New York (Dutch 1624, English 1664) — the former New Netherland; furs upriver, flour and shipping through Manhattan.' },
    { id: 'NJ', name: 'New Jersey', lon: -74.6, lat: 40.1, emoji: '🌾', keys: ['new jersey'], fact: 'New Jersey (1664) — grain farms between two great ports; a proprietary colony turned royal.' },
    { id: 'PA', name: 'Pennsylvania', lon: -77.6, lat: 40.9, emoji: '🌾', keys: ['pennsylvania', 'penn', 'quaker', 'philadelphia'], fact: 'Pennsylvania (1681) — Penn’s Quaker “holy experiment”; wheat and flour through Philadelphia, the largest colonial city.' },
    { id: 'DE', name: 'Delaware', lon: -75.5, lat: 39.0, emoji: '🌾', keys: ['delaware'], fact: 'Delaware (1638/1682) — grain and trade on the Delaware River.' },
    { id: 'MD', name: 'Maryland', lon: -76.8, lat: 39.2, emoji: '🍂', keys: ['maryland', 'calvert', 'baltimore', 'catholic'], fact: 'Maryland (1634) — the Calverts’ Catholic refuge; tobacco worked first by servants, then by enslaved Africans.' },
    { id: 'VA', name: 'Virginia', lon: -78.6, lat: 37.6, emoji: '🍂', keys: ['virginia', 'jamestown', 'tobacco', 'burgesses', 'bacon', 'chesapeake', 'rolfe', 'powhatan'], fact: 'Virginia (1607) — the first lasting English colony; Jamestown, tobacco, the House of Burgesses, and Bacon’s Rebellion.' },
    { id: 'NC', name: 'North Carolina', lon: -79.4, lat: 35.6, emoji: '⚓', keys: ['north carolina', 'naval stores', 'regulator', 'roanoke'], fact: 'North Carolina (1663) — naval stores (tar, pitch, turpentine) and small farms; the backcountry Regulators.' },
    { id: 'SC', name: 'South Carolina', lon: -80.9, lat: 33.8, emoji: '🌾', keys: ['south carolina', 'charleston', 'rice', 'indigo', 'stono', 'task system'], fact: 'South Carolina (1670) — Barbadian planters, an enslaved majority, rice and indigo under the task system; the Stono Rebellion.' },
    { id: 'GA', name: 'Georgia', lon: -83.4, lat: 32.7, emoji: '🌾', keys: ['georgia', 'oglethorpe', 'debtor'], fact: 'Georgia (1733) — Oglethorpe’s debtor colony and a buffer against Spanish Florida.' },
    { id: 'england', name: 'England', lon: -1.5, lat: 52.5, emoji: '👑', keys: ['england', 'english', 'britain', 'british', 'london', 'crown', 'parliament', 'navigation act'], fact: 'England — the imperial metropole. It shipped manufactured goods out, drew in colonial staples, and enforced the Navigation Acts.' },
    { id: 'iberia', name: 'Spain & Portugal', lon: -6, lat: 40, emoji: '⛵', keys: ['spain', 'spanish', 'portugal', 'portuguese', 'caravel', 'columbus', 'reconquista', 'iberia', 'lisbon', 'seville', 'las casas'], fact: 'Spain & Portugal — the Iberian pioneers. Portugal developed the caravel and rounded Africa; Spain funded Columbus and built a vast American empire. Portuguese sugar islands off Africa previewed New World slave plantations.' },
    { id: 'africa', name: 'West Africa', lon: -2, lat: 6.5, emoji: '⛓️', keys: ['africa', 'african', 'slave', 'slavery', 'enslaved', 'middle passage', 'gold coast', 'guinea'], fact: 'West Africa — the origin of the Middle Passage. European ships traded goods for captive Africans sold into slavery across the Atlantic. Portugal’s African coastal trade began it.' },
    { id: 'caribbean', name: 'The Caribbean', lon: -76, lat: 18, emoji: '🍬', keys: ['caribbean', 'barbados', 'jamaica', 'sugar', 'west indies', 'hispaniola'], fact: 'The Caribbean — England’s sugar islands. Their plantation model and slave codes shaped the southern mainland colonies.' },
    { id: 'mexico', name: 'Mexico (Aztec Empire)', lon: -99.1, lat: 19.4, emoji: '🏛️', keys: ['aztec', 'tenochtitlan', 'cortes', 'mexico', 'moctezuma', 'conquistador'], fact: 'Mexico — the Aztec empire and its capital Tenochtitlan, one of the world’s largest cities, toppled by Cortés (aided by disease and Indian allies) and rebuilt as Mexico City.' },
    { id: 'peru', name: 'Peru (Inca Empire)', lon: -72, lat: -13.5, emoji: '⛰️', keys: ['inca', 'pizarro', 'peru', 'andes'], fact: 'Peru — the Inca empire of the Andes, conquered by Pizarro; its silver would fund the Spanish empire.' }
  ];
  const BY = {};
  SPOTS.forEach(s => { BY[s.id] = s; });

  const ROUTES = [
    { a: [-1.5, 52.5], b: [-2, 6.5], color: '#8b6f47' },
    { a: [-2, 6.5], b: [-76, 18], color: '#8c1c13' },
    { a: [-76, 18], b: [-1.5, 52.5], color: '#33506b' }
  ];

  const P = (lon, lat) => [lon, -lat];
  const DEFAULT_VIEW = [-108, -60, 128, 78];
  let view = DEFAULT_VIEW.slice();

  // which spots a caption mentions, by keyword
  function spotsFor(text) {
    const lc = ' ' + String(text).toLowerCase() + ' ';
    return SPOTS.filter(s => s.keys.some(k => lc.indexOf(k) !== -1)).map(s => s.id);
  }

  function fitTo(ids) {
    const spots = ids.map(id => BY[id]).filter(Boolean);
    if (!spots.length) return DEFAULT_VIEW.slice();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    spots.forEach(s => {
      const [x, y] = P(s.lon, s.lat);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    const padX = Math.max(14, (maxX - minX) * 0.4), padY = Math.max(11, (maxY - minY) * 0.4);
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    let w = maxX - minX, h = maxY - minY;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    if (w / h < 1.3) { w = h * 1.3; } else { h = w / 1.3; }
    return [cx - w / 2, cy - h / 2, w, h];
  }

  function html(arg) {
    const focus = (arg ? decodeURIComponent(arg).split(',') : []).filter(id => BY[id]);
    view = focus.length ? fitTo(focus) : DEFAULT_VIEW.slice();
    const C = window.WORLD_COUNTRIES || [];
    const countries = C.map(ring =>
      'M' + ring.map(p => P(p[0], p[1]).map(v => v.toFixed(1)).join(',')).join('L') + 'Z'
    ).join('');
    const routes = ROUTES.map(r => {
      const [ax, ay] = P(r.a[0], r.a[1]), [bx, by] = P(r.b[0], r.b[1]);
      const mx = (ax + bx) / 2, my = (ay + by) / 2 - Math.abs(bx - ax) * 0.18;
      return `<path class="wm-route" d="M${ax},${ay} Q${mx},${my} ${bx},${by}" stroke="${r.color}" marker-end="url(#wmArrow)"/>`;
    }).join('');
    const marks = SPOTS.map(s => {
      const [x, y] = P(s.lon, s.lat);
      return `<g class="wm-mark${focus.indexOf(s.id) !== -1 ? ' focus' : ''}" data-spot="${s.id}"><title>${esc(s.name)}</title>
        <circle cx="${x}" cy="${y}" r="2.4" fill="transparent"/>
        <text class="wm-emoji" x="${x}" y="${(y - 1.7).toFixed(1)}">${s.emoji}</text>
        <text class="wm-star" x="${x}" y="${(y + 1.3).toFixed(1)}">⭐</text></g>`;
    }).join('');
    return `<h1>The Atlantic world</h1>
      <p class="cover-note">Drag to pan, scroll or pinch to zoom. Each ⭐ is a place — tap it for the story. The emoji shows what a colony exported.</p>
      <div class="atlas-layout">
        <div class="wm-wrap">
          <svg viewBox="${view.join(' ')}" class="wm-svg" id="wm-svg" role="img" aria-label="Map of the colonial Atlantic world">
            <defs><marker id="wmArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#2b2118"/></marker></defs>
            <rect x="-200" y="-120" width="400" height="240" fill="#c3d3dc"/>
            <path d="${countries}" fill="#e7dcc2" stroke="#8b6f47" stroke-width="0.12"/>
            ${routes}${marks}
          </svg>
          <p class="wm-zoom"><button class="btn small" id="wm-in">＋</button> <button class="btn small" id="wm-out">－</button> <button class="btn small ghost" id="wm-reset">Reset</button></p>
        </div>
        <aside class="atlas-info" id="atlas-info"><p class="atlas-hint">Tap a ⭐ on the map →</p></aside>
      </div>`;
  }

  function showInfo(id) {
    const info = document.getElementById('atlas-info');
    const s = BY[id];
    if (!info || !s) return;
    const src = (window.CH_IMAGES && window.CH_IMAGES.atlas && window.CH_IMAGES.atlas[id]) || null;
    info.innerHTML = `<h2>${s.emoji} ${esc(s.name)}</h2>` +
      (src ? `<img class="atlas-img" src="${src}" alt="">` : '') + `<p>${esc(s.fact)}</p>`;
  }

  function wire(arg) {
    const svg = document.getElementById('wm-svg');
    if (!svg) return;
    const focus = (arg ? decodeURIComponent(arg).split(',') : []).filter(id => BY[id]);
    const apply = () => svg.setAttribute('viewBox', view.map(v => v.toFixed(2)).join(' '));
    if (focus.length) {
      svg.querySelectorAll('.wm-mark').forEach(m => {
        if (focus.indexOf(m.getAttribute('data-spot')) !== -1) m.classList.add('sel');
      });
      showInfo(focus[0]);
    }

    svg.addEventListener('click', e => {
      const g = e.target.closest('.wm-mark');
      if (!g) return;
      svg.querySelectorAll('.wm-mark.sel').forEach(m => m.classList.remove('sel'));
      g.classList.add('sel');
      showInfo(g.getAttribute('data-spot'));
    });

    const zoom = (factor, cx, cy) => {
      const nw = Math.max(6, Math.min(340, view[2] * factor));
      const nh = nw * (view[3] / view[2]);
      view[0] = cx - (cx - view[0]) * (nw / view[2]);
      view[1] = cy - (cy - view[1]) * (nh / view[3]);
      view[2] = nw; view[3] = nh; apply();
    };
    const svgPt = e => {
      const r = svg.getBoundingClientRect();
      return [view[0] + (e.clientX - r.left) / r.width * view[2],
              view[1] + (e.clientY - r.top) / r.height * view[3]];
    };
    svg.addEventListener('wheel', e => { e.preventDefault(); const [cx, cy] = svgPt(e); zoom(e.deltaY > 0 ? 1.12 : 0.89, cx, cy); }, { passive: false });

    let dragging = false, lx = 0, ly = 0;
    svg.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = svg.getBoundingClientRect();
      view[0] -= (e.clientX - lx) / r.width * view[2];
      view[1] -= (e.clientY - ly) / r.height * view[3];
      lx = e.clientX; ly = e.clientY; apply();
    });
    window.addEventListener('pointerup', () => { dragging = false; });

    const g = id => document.getElementById(id);
    if (g('wm-in')) g('wm-in').addEventListener('click', () => zoom(0.8, view[0] + view[2] / 2, view[1] + view[3] / 2));
    if (g('wm-out')) g('wm-out').addEventListener('click', () => zoom(1.25, view[0] + view[2] / 2, view[1] + view[3] / 2));
    if (g('wm-reset')) g('wm-reset').addEventListener('click', () => { view = DEFAULT_VIEW.slice(); apply(); });
  }

  return { html, wire, spotsFor };
})();
