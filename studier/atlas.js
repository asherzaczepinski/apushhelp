// Atlantic world map — a real political map (country borders) with the 13
// colonies placed by coordinates, a goods emoji + clickable star at each,
// plus England, West Africa, and the Caribbean. Drag to pan, scroll to zoom,
// tap a star for its story.
window.Atlas = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // id, name, lon, lat, goods emoji, story
  const SPOTS = [
    { id: 'MA', name: 'Massachusetts', lon: -71.1, lat: 42.4, emoji: '🐟', fact: 'Massachusetts Bay (1630) — the Puritan “city upon a hill”; cod, timber, shipbuilding, and Boston’s Atlantic trade.' },
    { id: 'NH', name: 'New Hampshire', lon: -71.5, lat: 43.6, emoji: '🌲', fact: 'New Hampshire (1623) — fishing, timber, and tall mast pines for the Royal Navy; a small royal colony in New England’s orbit.' },
    { id: 'RI', name: 'Rhode Island', lon: -71.4, lat: 41.6, emoji: '🥃', fact: 'Rhode Island (1636) — Roger Williams’s refuge of religious liberty; Newport’s rum-and-molasses merchants.' },
    { id: 'CT', name: 'Connecticut', lon: -72.7, lat: 41.5, emoji: '🐄', fact: 'Connecticut (1636) — river-valley farms and livestock; the Fundamental Orders, an early written frame of government.' },
    { id: 'NY', name: 'New York', lon: -74.6, lat: 42.6, emoji: '🦫', fact: 'New York (Dutch 1624, English 1664) — the former New Netherland; furs upriver, flour and shipping through Manhattan.' },
    { id: 'NJ', name: 'New Jersey', lon: -74.6, lat: 40.1, emoji: '🌾', fact: 'New Jersey (1664) — grain farms between two great ports; a proprietary colony turned royal.' },
    { id: 'PA', name: 'Pennsylvania', lon: -77.6, lat: 40.9, emoji: '🌾', fact: 'Pennsylvania (1681) — Penn’s Quaker “holy experiment”; wheat and flour through Philadelphia, the largest colonial city.' },
    { id: 'DE', name: 'Delaware', lon: -75.5, lat: 39.0, emoji: '🌾', fact: 'Delaware (New Sweden 1638, Penn’s lower counties 1682) — grain and trade on the Delaware River.' },
    { id: 'MD', name: 'Maryland', lon: -76.8, lat: 39.2, emoji: '🍂', fact: 'Maryland (1634) — the Calverts’ Catholic refuge; tobacco worked first by servants, then by enslaved Africans.' },
    { id: 'VA', name: 'Virginia', lon: -78.6, lat: 37.6, emoji: '🍂', fact: 'Virginia (1607) — the first lasting English colony; Jamestown, tobacco, the House of Burgesses, and Bacon’s Rebellion.' },
    { id: 'NC', name: 'North Carolina', lon: -79.4, lat: 35.6, emoji: '⚓', fact: 'North Carolina (1663) — naval stores (tar, pitch, turpentine) and small farms; the backcountry Regulators.' },
    { id: 'SC', name: 'South Carolina', lon: -80.9, lat: 33.8, emoji: '🌾', fact: 'South Carolina (1670) — Barbadian planters, an enslaved majority, rice and indigo under the brutal task system; the Stono Rebellion.' },
    { id: 'GA', name: 'Georgia', lon: -83.4, lat: 32.7, emoji: '🌾', fact: 'Georgia (1733) — Oglethorpe’s debtor colony and a buffer against Spanish Florida; slavery banned, then allowed.' },
    { id: 'england', name: 'England', lon: -1.5, lat: 52.5, emoji: '👑', fact: 'England — the imperial metropole. It shipped manufactured goods out, drew in colonial tobacco, rice, sugar, and fish, and enforced the Navigation Acts.' },
    { id: 'africa', name: 'West Africa', lon: -2, lat: 6.5, emoji: '⛓️', fact: 'West Africa — the origin of the Middle Passage. European ships traded cloth, guns, iron, and rum for captive Africans sold into slavery across the Atlantic.' },
    { id: 'caribbean', name: 'The Caribbean', lon: -76, lat: 18, emoji: '🍬', fact: 'The Caribbean — England’s sugar islands (Barbados, Jamaica). Their plantation model and slave codes shaped the southern mainland colonies.' }
  ];

  // triangular-trade routes: [from lon,lat] -> [to lon,lat], color
  const ROUTES = [
    { a: [-1.5, 52.5], b: [-2, 6.5], color: '#8b6f47' },
    { a: [-2, 6.5], b: [-76, 18], color: '#8c1c13' },
    { a: [-76, 18], b: [-1.5, 52.5], color: '#33506b' }
  ];

  const P = (lon, lat) => [lon, -lat];
  const DEFAULT_VIEW = [-92, -56, 100, 62]; // Atlantic world
  let view = DEFAULT_VIEW.slice();

  function html() {
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
      return `<g class="wm-mark" data-spot="${s.id}"><title>${esc(s.name)}</title>
        <circle cx="${x}" cy="${y}" r="2.2" fill="transparent"/>
        <text class="wm-emoji" x="${x}" y="${(y - 1.7).toFixed(1)}">${s.emoji}</text>
        <text class="wm-star" x="${x}" y="${(y + 1.3).toFixed(1)}">⭐</text></g>`;
    }).join('');
    return `<h1>The Atlantic world</h1>
      <p class="cover-note">A real map of the colonial Atlantic. Drag to pan, scroll or pinch to zoom. Each ⭐ is a place — tap it for the story. The emoji shows what each colony exported.</p>
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

  function wire() {
    const svg = document.getElementById('wm-svg');
    const info = document.getElementById('atlas-info');
    if (!svg || !info) return;
    view = DEFAULT_VIEW.slice();
    const apply = () => svg.setAttribute('viewBox', view.map(v => v.toFixed(2)).join(' '));

    svg.addEventListener('click', e => {
      const g = e.target.closest('.wm-mark');
      if (!g) return;
      const s = SPOTS.find(x => x.id === g.getAttribute('data-spot'));
      if (!s) return;
      svg.querySelectorAll('.wm-mark.sel').forEach(m => m.classList.remove('sel'));
      g.classList.add('sel');
      const src = (window.CH_IMAGES && window.CH_IMAGES.atlas && window.CH_IMAGES.atlas[s.id]) || null;
      info.innerHTML = `<h2>${s.emoji} ${esc(s.name)}</h2>` +
        (src ? `<img class="atlas-img" src="${src}" alt="">` : '') + `<p>${esc(s.fact)}</p>`;
    });

    const zoom = (factor, cx, cy) => {
      const nw = Math.max(6, Math.min(320, view[2] * factor));
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
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const [cx, cy] = svgPt(e);
      zoom(e.deltaY > 0 ? 1.12 : 0.89, cx, cy);
    }, { passive: false });

    let dragging = false, moved = false, lx = 0, ly = 0;
    svg.addEventListener('pointerdown', e => { dragging = true; moved = false; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = svg.getBoundingClientRect();
      const dx = (e.clientX - lx) / r.width * view[2];
      const dy = (e.clientY - ly) / r.height * view[3];
      if (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) > 3) moved = true;
      view[0] -= dx; view[1] -= dy; lx = e.clientX; ly = e.clientY; apply();
    });
    window.addEventListener('pointerup', () => { dragging = false; });

    const g = id => document.getElementById(id);
    if (g('wm-in')) g('wm-in').addEventListener('click', () => zoom(0.8, view[0] + view[2] / 2, view[1] + view[3] / 2));
    if (g('wm-out')) g('wm-out').addEventListener('click', () => zoom(1.25, view[0] + view[2] / 2, view[1] + view[3] / 2));
    if (g('wm-reset')) g('wm-reset').addEventListener('click', () => { view = DEFAULT_VIEW.slice(); apply(); });
  }

  return { html, wire };
})();
