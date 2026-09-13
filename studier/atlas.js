// The map, opened from a panel's "See these places on the map": a real 3D
// Earth (globe.gl, blue-marble) that shows the panel's cartoon and text, then
// spins to focus on the places the panel names, with emoji markers and the
// triangular-trade arcs. No extra write-up — just the story and the geography.
window.Atlas = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // id, name, lat, lng, emoji, keywords
  const SPOTS = [
    { id: 'MA', name: 'Massachusetts', lat: 42.4, lng: -71.1, emoji: '🐟', keys: ['massachusetts', 'boston', 'puritan', 'plymouth', 'pilgrim', 'new england', 'winthrop'] },
    { id: 'RI', name: 'Rhode Island', lat: 41.6, lng: -71.4, emoji: '🥃', keys: ['rhode island', 'roger williams', 'newport'] },
    { id: 'CT', name: 'Connecticut', lat: 41.5, lng: -72.7, emoji: '🐄', keys: ['connecticut', 'fundamental orders', 'hooker'] },
    { id: 'NY', name: 'New York', lat: 42.6, lng: -74.6, emoji: '🦫', keys: ['new york', 'new netherland', 'dutch', 'new amsterdam', 'hudson', 'manhattan'] },
    { id: 'PA', name: 'Pennsylvania', lat: 40.9, lng: -77.6, emoji: '🌾', keys: ['pennsylvania', 'penn', 'quaker', 'philadelphia'] },
    { id: 'MD', name: 'Maryland', lat: 39.2, lng: -76.8, emoji: '🍂', keys: ['maryland', 'calvert', 'baltimore', 'catholic'] },
    { id: 'VA', name: 'Virginia', lat: 37.6, lng: -78.6, emoji: '🍂', keys: ['virginia', 'jamestown', 'tobacco', 'burgesses', 'bacon', 'chesapeake', 'rolfe', 'powhatan'] },
    { id: 'NC', name: 'North Carolina', lat: 35.6, lng: -79.4, emoji: '⚓', keys: ['north carolina', 'naval stores', 'regulator', 'roanoke'] },
    { id: 'SC', name: 'South Carolina', lat: 33.8, lng: -80.9, emoji: '🌾', keys: ['south carolina', 'charleston', 'rice', 'indigo', 'stono', 'task system'] },
    { id: 'GA', name: 'Georgia', lat: 32.7, lng: -83.4, emoji: '🌾', keys: ['georgia', 'oglethorpe', 'debtor'] },
    { id: 'england', name: 'England', lat: 52.5, lng: -1.5, emoji: '👑', keys: ['england', 'english', 'britain', 'british', 'london', 'crown', 'parliament', 'navigation act'] },
    { id: 'iberia', name: 'Spain & Portugal', lat: 40, lng: -5, emoji: '⛵', keys: ['spain', 'spanish', 'portugal', 'portuguese', 'caravel', 'columbus', 'reconquista', 'iberia', 'lisbon', 'seville', 'las casas'] },
    { id: 'africa', name: 'West Africa', lat: 6.5, lng: -2, emoji: '⛓️', keys: ['africa', 'african', 'slave', 'slavery', 'enslaved', 'middle passage', 'gold coast', 'guinea'] },
    { id: 'caribbean', name: 'The Caribbean', lat: 18, lng: -76, emoji: '🍬', keys: ['caribbean', 'barbados', 'jamaica', 'sugar', 'west indies', 'hispaniola'] },
    { id: 'mexico', name: 'Mexico (Aztecs)', lat: 19.4, lng: -99.1, emoji: '🏛️', keys: ['aztec', 'tenochtitlan', 'cortes', 'mexico', 'moctezuma', 'conquistador'] },
    { id: 'peru', name: 'Peru (Inca)', lat: -13.5, lng: -72, emoji: '⛰️', keys: ['inca', 'pizarro', 'peru', 'andes'] }
  ];
  const BY = {};
  SPOTS.forEach(s => { BY[s.id] = s; });

  const ROUTES = [
    { startLat: 52.5, startLng: -1.5, endLat: 6.5, endLng: -2, color: '#c9a24a' },
    { startLat: 6.5, startLng: -2, endLat: 18, endLng: -76, color: '#d05a4a' },
    { startLat: 18, startLng: -76, endLat: 52.5, endLng: -1.5, color: '#5a86b0' }
  ];

  let globe = null;

  function spotsFor(text) {
    const lc = ' ' + String(text).toLowerCase() + ' ';
    return SPOTS.filter(s => s.keys.some(k => lc.indexOf(k) !== -1)).map(s => s.id);
  }

  function panelData(chStr, idxStr) {
    const n = Number(chStr), idx = Number(idxStr);
    const c = (window.APUSH.chapters || {})[String(n)];
    if (!c) return null;
    const sents = [];
    (c.summary || []).forEach(p => (window.Comic ? Comic.splitPara(p) : [p]).forEach(s => sents.push(s)));
    const caption = sents[idx] || '';
    const comic = ((window.CH_IMAGES || {})[String(n)] || {}).comic || [];
    return { n, idx, caption, src: comic[idx] || null, spots: spotsFor(caption) };
  }

  function html(chStr, idxStr) {
    const pd = panelData(chStr, idxStr);
    const cartoon = pd
      ? `<div class="map-panel">
          ${pd.src ? `<img class="map-panel-img" src="${pd.src}" alt="">` : ''}
          <p class="map-panel-text">${esc(pd.caption)}</p>
        </div>`
      : '<h1>The Atlantic world</h1>';
    return `${cartoon}
      <div class="globe-host" id="globe-host"><p class="globe-fallback">Loading the globe…</p></div>`;
  }

  function wire(chStr, idxStr) {
    const host = document.getElementById('globe-host');
    if (!host) return;
    if (!window.Globe) { host.innerHTML = '<p class="globe-fallback">The globe needs WebGL, which isn’t available here.</p>'; return; }
    host.innerHTML = '';
    const pd = panelData(chStr, idxStr);
    const focusIds = pd ? pd.spots : [];
    const markers = focusIds.length ? SPOTS.filter(s => focusIds.indexOf(s.id) !== -1) : SPOTS;

    globe = window.Globe()(host)
      .globeImageUrl('vendor/earth-blue-marble.jpg')
      .backgroundColor('#f5ecd7')
      .showAtmosphere(true).atmosphereColor('#9ab0c4').atmosphereAltitude(0.2)
      .width(host.clientWidth || 660).height(460)
      .arcsData(ROUTES)
      .arcColor(d => d.color).arcStroke(0.6)
      .arcDashLength(0.5).arcDashGap(0.25).arcDashAnimateTime(3500).arcAltitudeAutoScale(0.5)
      .htmlElementsData(markers)
      .htmlElement(d => {
        const el = document.createElement('div');
        el.className = 'globe-mark';
        el.innerHTML = `<span class="gm-emoji">${d.emoji}</span><span class="gm-label">${esc(d.name)}</span>`;
        return el;
      });

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    if (focusIds.length) {
      const fs = SPOTS.filter(s => focusIds.indexOf(s.id) !== -1);
      const lat = fs.reduce((a, s) => a + s.lat, 0) / fs.length;
      const lng = fs.reduce((a, s) => a + s.lng, 0) / fs.length;
      const spread = Math.max.apply(null, fs.map(s => Math.abs(s.lat - lat) + Math.abs(s.lng - lng))) || 10;
      globe.pointOfView({ lat, lng, altitude: Math.max(1.1, Math.min(2.5, spread / 40)) }, 1200);
    } else {
      globe.pointOfView({ lat: 25, lng: -45, altitude: 2.2 });
    }
  }

  function destroy() {
    if (globe) {
      try { globe._destructor && globe._destructor(); } catch (e) { }
      globe = null;
    }
  }

  return { html, wire, spotsFor, destroy };
})();
