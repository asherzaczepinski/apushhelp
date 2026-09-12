// Colonial Atlantic Atlas — a styled interactive map: the 13 colony areas,
// England and West Africa across the ocean, the triangular-trade routes, and
// click-a-spot-for-its-story. Pre-expansion (colonial) view.
window.Atlas = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const REGION = { newengland: '#33506b', middle: '#8b6f47', southern: '#8c1c13' };

  // clickable non-colony landmasses (schematic Atlantic layout, screen coords)
  const LANDS = {
    england: {
      name: 'England', fill: '#5a4632',
      poly: [[44, -7], [48, -9], [52, -7], [54, -3], [53, 1], [55, 4], [51, 7], [47, 6], [44, 2], [45, -3]],
      label: [49, 0]
    },
    africa: {
      name: 'West Africa', fill: '#7d6a45',
      poly: [[33, 19], [40, 18], [48, 20], [53, 24], [51, 30], [46, 35], [39, 37], [35, 33], [32, 26]],
      label: [43, 28]
    },
    caribbean: {
      name: 'The Caribbean', fill: '#9c755f',
      poly: [[-6, 24], [-1, 23], [4, 25], [8, 24], [6, 28], [1, 29], [-4, 28]],
      label: [1, 33]
    }
  };

  const FACT = {
    NH: 'New Hampshire (1623) — fishing, timber, and tall mast pines for the Royal Navy; a small royal colony in Puritan New England’s orbit.',
    MA: 'Massachusetts Bay (1630) — the Puritan “city upon a hill”; cod, timber, shipbuilding, and Boston’s Atlantic trade.',
    RI: 'Rhode Island (1636) — Roger Williams’s refuge of religious liberty; Newport’s rum-and-molasses merchants.',
    CT: 'Connecticut (1636) — river-valley farms; the Fundamental Orders, an early written frame of government.',
    NY: 'New York (Dutch 1624, English 1664) — the former New Netherland; furs upriver, flour and shipping through Manhattan.',
    NJ: 'New Jersey (1664) — grain farms between two great ports; a proprietary colony turned royal.',
    PA: 'Pennsylvania (1681) — Penn’s Quaker “holy experiment”; wheat and flour through Philadelphia, the largest colonial city.',
    DE: 'Delaware (New Sweden 1638, Penn’s lower counties 1682) — grain and trade on the Delaware River.',
    MD: 'Maryland (1634) — the Calverts’ Catholic refuge; tobacco worked first by servants, then by enslaved labor.',
    VA: 'Virginia (1607) — the first lasting English colony; Jamestown, tobacco, the House of Burgesses, and Bacon’s Rebellion.',
    NC: 'North Carolina (1663) — naval stores (tar, pitch, turpentine) and small farms; the backcountry Regulators.',
    SC: 'South Carolina (1670) — Barbadian planters, an enslaved majority, rice and indigo under the task system; the Stono Rebellion.',
    GA: 'Georgia (1733) — Oglethorpe’s debtor colony and a military buffer against Spanish Florida; slavery banned, then allowed.',
    england: 'England — the imperial metropole. It shipped manufactured goods out, drew in colonial tobacco, rice, sugar, and fish, and passed the Navigation Acts to keep the carrying trade in English ships.',
    africa: 'West Africa — the origin of the Middle Passage. European ships traded cloth, guns, and rum for captive Africans, sold into slavery across the Atlantic.',
    caribbean: 'The Caribbean — England’s sugar islands (Barbados, Jamaica). Their brutal plantation model and slave codes shaped the southern mainland colonies.',
    r_goods: 'Outbound leg — England shipped cloth, guns, iron, and rum to the West African coast.',
    r_middle: 'The Middle Passage — enslaved Africans carried across the Atlantic to the Caribbean and the mainland colonies.',
    r_staple: 'Homeward leg — tobacco, rice, sugar, and fish shipped back to English ports.'
  };

  const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('') + 'Z';

  function html() {
    const B = window.MAP_BASES;
    if (!B || !B.colonies) return '<h1>Map data missing.</h1>';
    const colonies = Object.entries(B.colonies).map(([id, c]) => {
      const d = c.polys.map(r => r.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + (-p[1]).toFixed(1)).join('') + 'Z').join('');
      return `<path class="atlas-colony" data-spot="${id}" d="${d}" fill="${REGION[c.region] || '#8b6f47'}"><title>${esc(c.name)}</title></path>`;
    }).join('');
    const lands = Object.entries(LANDS).map(([id, L]) =>
      `<path class="atlas-land" data-spot="${id}" d="${path(L.poly)}" fill="${L.fill}"><title>${esc(L.name)}</title></path>
       <text class="atlas-lbl" x="${L.label[0]}" y="${L.label[1]}">${esc(L.name)}</text>`).join('');

    // triangular-trade route arrows
    const routes = `
      <path class="atlas-route" data-spot="r_staple" d="M14,-3 Q30,-10 44,-2" />
      <path class="atlas-route" data-spot="r_goods" d="M50,7 Q54,15 46,20" />
      <path class="atlas-route" data-spot="r_middle" d="M33,29 Q16,34 5,28" />
      <text class="atlas-route-lbl" x="29" y="-9">staples → England</text>
      <text class="atlas-route-lbl" x="53" y="15">goods → Africa</text>
      <text class="atlas-route-lbl" x="17" y="36">the Middle Passage</text>`;

    return `<h1>The Atlantic world</h1>
      <p class="cover-note">The colonies, England, and West Africa bound together by the triangular trade. Tap any colony, land, or route to read its story.</p>
      <div class="atlas-layout">
        <div class="atlas-wrap">
          <svg viewBox="-16 -13 76 55" class="atlas-svg" id="atlas-svg" role="img" aria-label="Interactive map of the colonial Atlantic world">
            <defs><marker id="atlasArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#2b2118"/></marker></defs>
            <rect x="-16" y="-13" width="76" height="55" fill="#c3d3dc"/>
            ${colonies}${lands}${routes}
          </svg>
          <ul class="atlas-legend">
            <li><span class="sw" style="background:${REGION.newengland}"></span>New England</li>
            <li><span class="sw" style="background:${REGION.middle}"></span>Middle</li>
            <li><span class="sw" style="background:${REGION.southern}"></span>Southern</li>
          </ul>
        </div>
        <aside class="atlas-info" id="atlas-info"><p class="atlas-hint">Tap a spot on the map →</p></aside>
      </div>`;
  }

  function nameOf(id) {
    const B = window.MAP_BASES;
    if (LANDS[id]) return LANDS[id].name;
    if (id.indexOf('r_') === 0) return { r_goods: 'Outbound goods', r_middle: 'The Middle Passage', r_staple: 'Homeward staples' }[id];
    return (B && B.colonies[id]) ? B.colonies[id].name : id;
  }

  function wire() {
    const svg = document.getElementById('atlas-svg');
    const info = document.getElementById('atlas-info');
    if (!svg || !info) return;
    svg.addEventListener('click', e => {
      const el = e.target.closest('[data-spot]');
      if (!el) return;
      const id = el.getAttribute('data-spot');
      svg.querySelectorAll('.sel').forEach(s => s.classList.remove('sel'));
      el.classList.add('sel');
      const src = (window.CH_IMAGES && window.CH_IMAGES.atlas && window.CH_IMAGES.atlas[id]) || null;
      info.innerHTML = `<h2>${esc(nameOf(id))}</h2>` +
        (src ? `<img class="atlas-img" src="${src}" alt="">` : '') +
        `<p>${esc(FACT[id] || '')}</p>`;
      info.scrollIntoView({ block: 'nearest' });
    });
  }

  return { html, wire };
})();
