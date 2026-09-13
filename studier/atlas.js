// The Atlantic world on a movable 3D globe: colonial-region markers, England
// and West Africa, the triangular-trade route arcs, and tap-a-marker-for-its-
// story. Falls back to a note if WebGL/three.js is unavailable.
window.Atlas = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // [id, name, lon, lat, marker color]
  const NODES = [
    { id: 'newengland', name: 'New England', lon: -70.5, lat: 43, color: '#33506b' },
    { id: 'middle', name: 'The Middle Colonies', lon: -75, lat: 40, color: '#8b6f47' },
    { id: 'chesapeake', name: 'The Chesapeake', lon: -76.5, lat: 38, color: '#8c1c13' },
    { id: 'lowersouth', name: 'The Lower South', lon: -80, lat: 32.5, color: '#a5342a' },
    { id: 'caribbean', name: 'The Caribbean', lon: -76, lat: 18, color: '#9c755f' },
    { id: 'africa', name: 'West Africa', lon: -2, lat: 6.5, color: '#5a4632' },
    { id: 'england', name: 'England', lon: -0.1, lat: 51.5, color: '#c9b78c' }
  ];

  const ROUTES = [
    { from: [-0.1, 51.5], to: [-2, 6.5], color: 0x8b6f47 },    // goods → Africa
    { from: [-2, 6.5], to: [-76, 18], color: 0x8c1c13 },       // Middle Passage
    { from: [-76, 18], to: [-0.1, 51.5], color: 0x33506b },    // staples → England
    { from: [-76.5, 38], to: [-0.1, 51.5], color: 0x33506b }   // Chesapeake tobacco
  ];

  const FACT = {
    newengland: 'New England — cod, timber, shipbuilding, and Boston’s Atlantic trade, worked by small farms and Puritan towns. Its merchant fleets carried much of the empire’s commerce.',
    middle: 'The Middle Colonies — New York and Philadelphia; wheat and flour, furs, and the most religiously and ethnically diverse population in British America.',
    chesapeake: 'The Chesapeake — Virginia and Maryland; a tobacco economy worked first by indentured servants and then, increasingly, by enslaved Africans.',
    lowersouth: 'The Lower South — the Carolinas and Georgia; rice and indigo grown by an enslaved Black majority under the brutal task system.',
    caribbean: 'The Caribbean — England’s sugar islands (Barbados, Jamaica). Their plantation model and slave codes shaped the southern mainland colonies.',
    africa: 'West Africa — the origin of the Middle Passage. European ships traded cloth, guns, iron, and rum for captive Africans sold into slavery across the Atlantic.',
    england: 'England — the imperial metropole. It shipped manufactured goods out, drew in colonial tobacco, rice, sugar, and fish, and enforced the Navigation Acts to keep the trade in English ships.'
  };

  const COLORS = {};
  NODES.forEach(n => { COLORS[n.id] = n.color; });

  function html() {
    return `<h1>The Atlantic world</h1>
      <p class="cover-note">Drag to spin the globe, scroll to zoom. The arrows trace the triangular trade — tap a glowing marker to read its story.</p>
      <div class="atlas-layout">
        <div class="globe-host" id="atlas-globe"><p class="globe-fallback">Loading the globe…</p></div>
        <aside class="atlas-info" id="atlas-info">
          <p class="atlas-hint">Tap a marker on the globe →</p>
          <ul class="atlas-legend">
            <li><span class="sw" style="background:#8b6f47"></span>goods → West Africa</li>
            <li><span class="sw" style="background:#8c1c13"></span>the Middle Passage</li>
            <li><span class="sw" style="background:#33506b"></span>staples → England</li>
          </ul>
        </aside>
      </div>`;
  }

  function wire() {
    const host = document.getElementById('atlas-globe');
    if (!host) return;
    if (!window.Globe3D || !window.THREE) {
      host.innerHTML = '<p class="globe-fallback">This globe needs WebGL, which isn’t available here.</p>';
      return;
    }
    host.innerHTML = '';
    Globe3D.start(host, {
      territories: NODES.map(n => ({ id: n.id, lon: n.lon, lat: n.lat })),
      routes: ROUTES,
      onPick: id => {
        Globe3D.setOwners(COLORS, id);
        const info = document.getElementById('atlas-info');
        if (!info) return;
        const node = NODES.find(n => n.id === id);
        const src = (window.CH_IMAGES && window.CH_IMAGES.atlas && window.CH_IMAGES.atlas[id]) || null;
        info.innerHTML = `<h2>${esc(node ? node.name : id)}</h2>` +
          (src ? `<img class="atlas-img" src="${src}" alt="">` : '') +
          `<p>${esc(FACT[id] || '')}</p>`;
      }
    });
    Globe3D.setOwners(COLORS, null);
  }

  return { html, wire };
})();
