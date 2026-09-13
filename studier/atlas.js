// The map, opened from a panel's "See these places on the map": a real 3D
// Earth (globe.gl, blue-marble) with split country areas (AP-World style).
// The highlighted areas AND the trade paths are built from the panel's own
// notes — the places it names get their countries colored and chained by arcs.
window.Atlas = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // id, name, lat, lng, emoji, color, countries (Natural-Earth NAME), keywords
  const SPOTS = [
    { id: 'MA', name: 'Massachusetts', lat: 42.4, lng: -71.1, emoji: '🐟', color: '#8c1c13', co: ['United States of America'], keys: ['massachusetts', 'boston', 'puritan', 'plymouth', 'pilgrim', 'new england', 'winthrop'] },
    { id: 'RI', name: 'Rhode Island', lat: 41.6, lng: -71.4, emoji: '🥃', color: '#8c1c13', co: ['United States of America'], keys: ['rhode island', 'roger williams', 'newport'] },
    { id: 'CT', name: 'Connecticut', lat: 41.5, lng: -72.7, emoji: '🐄', color: '#8c1c13', co: ['United States of America'], keys: ['connecticut', 'fundamental orders', 'hooker'] },
    { id: 'NY', name: 'New York', lat: 42.6, lng: -74.6, emoji: '🦫', color: '#8c1c13', co: ['United States of America'], keys: ['new york', 'new netherland', 'dutch', 'new amsterdam', 'hudson', 'manhattan'] },
    { id: 'PA', name: 'Pennsylvania', lat: 40.9, lng: -77.6, emoji: '🌾', color: '#8c1c13', co: ['United States of America'], keys: ['pennsylvania', 'penn', 'quaker', 'philadelphia'] },
    { id: 'MD', name: 'Maryland', lat: 39.2, lng: -76.8, emoji: '🍂', color: '#8c1c13', co: ['United States of America'], keys: ['maryland', 'calvert', 'baltimore', 'catholic'] },
    { id: 'VA', name: 'Virginia', lat: 37.6, lng: -78.6, emoji: '🍂', color: '#8c1c13', co: ['United States of America'], keys: ['virginia', 'jamestown', 'tobacco', 'burgesses', 'bacon', 'chesapeake', 'rolfe', 'powhatan'] },
    { id: 'NC', name: 'North Carolina', lat: 35.6, lng: -79.4, emoji: '⚓', color: '#8c1c13', co: ['United States of America'], keys: ['north carolina', 'naval stores', 'regulator', 'roanoke'] },
    { id: 'SC', name: 'South Carolina', lat: 33.8, lng: -80.9, emoji: '🌾', color: '#8c1c13', co: ['United States of America'], keys: ['south carolina', 'charleston', 'rice', 'indigo', 'stono', 'task system'] },
    { id: 'GA', name: 'Georgia', lat: 32.7, lng: -83.4, emoji: '🌾', color: '#8c1c13', co: ['United States of America'], keys: ['georgia', 'oglethorpe', 'debtor'] },
    { id: 'england', name: 'England', lat: 52.5, lng: -1.5, emoji: '👑', color: '#33506b', co: ['United Kingdom'], keys: ['england', 'english', 'britain', 'british', 'london', 'crown', 'parliament', 'navigation act'] },
    { id: 'iberia', name: 'Spain & Portugal', lat: 40, lng: -5, emoji: '⛵', color: '#c07a2a', co: ['Spain', 'Portugal'], keys: ['spain', 'spanish', 'portugal', 'portuguese', 'caravel', 'columbus', 'reconquista', 'iberia', 'lisbon', 'seville', 'las casas'] },
    { id: 'africa', name: 'West Africa', lat: 6.5, lng: -2, emoji: '⛓️', color: '#6e5636', co: ['Ghana', 'Nigeria', 'Guinea', 'Senegal', 'Sierra Leone', 'Liberia', 'Benin', 'Togo', 'Burkina Faso', 'Mali'], keys: ['africa', 'african', 'slave', 'slavery', 'enslaved', 'middle passage', 'gold coast', 'guinea'] },
    { id: 'caribbean', name: 'The Caribbean', lat: 18, lng: -76, emoji: '🍬', color: '#b0842f', co: ['Cuba', 'Haiti', 'Dominican Rep.', 'Jamaica'], keys: ['caribbean', 'barbados', 'jamaica', 'sugar', 'west indies', 'hispaniola'] },
    { id: 'mexico', name: 'Aztec Empire', lat: 19.4, lng: -99.1, color: '#6b4f6f', co: ['Mexico'], keys: ['aztec', 'tenochtitlan', 'cortes', 'mexico', 'moctezuma', 'conquistador'] },
    { id: 'peru', name: 'Inca Empire', lat: -13.5, lng: -72, color: '#7d6a45', co: ['Peru'], keys: ['inca', 'pizarro', 'peru', 'andes'] },
    { id: 'cahokia', name: 'Cahokia', lat: 38.65, lng: -90.06, color: '#8b6f47', co: [], keys: ['cahokia', 'mound', 'mississippian'] },
    { id: 'povertypoint', name: 'Poverty Point', lat: 32.6, lng: -91.4, color: '#8b6f47', co: [], keys: ['poverty point'] },
    { id: 'pueblo', name: 'Hopi, Zuni & Pueblo', lat: 35.7, lng: -108, color: '#c07a2a', co: [], keys: ['hopi', 'zuni', 'pueblo', 'southwest', 'anasazi', 'ancestral'] },
    { id: 'iroquois', name: 'Iroquois Confederacy', lat: 43, lng: -76, color: '#33506b', co: [], keys: ['iroquois', 'haudenosaunee', 'five nations', 'mohawk', 'confederacy'] }
  ];
  const BY = {};
  SPOTS.forEach(s => { BY[s.id] = s; });

  let globe = null;

  function spotsFor(text) {
    const lc = ' ' + String(text).toLowerCase() + ' ';
    return SPOTS.filter(s => s.keys.some(k => lc.indexOf(k) !== -1)).map(s => s.id);
  }

  function panelData(chStr, idxStr) {
    const n = Number(chStr);
    const c = (window.APUSH.chapters || {})[String(n)];
    if (!c) return null;
    // no panel index → the whole chapter's places
    if (idxStr === undefined || idxStr === '') {
      const whole = (c.summary || []).join(' ');
      return { n, idx: null, caption: whole, src: null, whole: true, spots: spotsFor(whole) };
    }
    const idx = Number(idxStr);
    const story = (window.STORY || {})[String(n)];
    if (story && story[idx]) {
      return { n, idx, caption: story[idx].cap, src: story[idx].img, spots: spotsFor(story[idx].cap) };
    }
    const sents = [];
    (c.summary || []).forEach(p => (window.Comic ? Comic.splitPara(p) : [p]).forEach(s => sents.push(s)));
    const caption = sents[idx] || '';
    const comic = ((window.CH_IMAGES || {})[String(n)] || {}).comic || [];
    return { n, idx, caption, src: comic[idx] || null, spots: spotsFor(caption) };
  }

  function html(chStr, idxStr) {
    const pd = panelData(chStr, idxStr);
    let cartoon;
    if (!pd) cartoon = '<h1>The Atlantic world</h1>';
    else if (pd.whole) cartoon = `<h1>Chapter ${pd.n} on the map</h1><p class="cover-note">Every place this chapter names, on the globe.</p>`;
    else cartoon = `<div class="map-panel">
          ${pd.src ? `<img class="map-panel-img" src="${pd.src}" alt="">` : ''}
          <p class="map-panel-text">${esc(pd.caption)}</p>
        </div>`;
    return `${cartoon}
      <div class="globe-host" id="globe-host"><p class="globe-fallback">Loading the globe…</p></div>`;
  }

  function wire(chStr, idxStr) {
    const host = document.getElementById('globe-host');
    if (!host) return;
    if (!window.Globe) { host.innerHTML = '<p class="globe-fallback">The globe needs WebGL, which isn’t available here.</p>'; return; }
    host.innerHTML = '';
    const pd = panelData(chStr, idxStr);
    const focus = (pd ? pd.spots : []).map(id => BY[id]).filter(Boolean);
    const markers = focus.length ? focus : SPOTS;

    // areas from the notes: color the matched spots' countries
    const areaColor = {};
    focus.forEach(s => s.co.forEach(name => { areaColor[name] = s.color; }));
    // paths from the notes — only for passages about movement/trade, not lists
    const journey = /trade|route|sail|ship|voyage|exchange|passage|explor|import|export|carr|migrat|navigat|fleet|expedition/i.test(pd ? pd.caption : '');
    const arcs = [];
    if (journey) {
      for (let i = 0; i < focus.length - 1; i++) {
        arcs.push({ startLat: focus[i].lat, startLng: focus[i].lng, endLat: focus[i + 1].lat, endLng: focus[i + 1].lng, color: focus[i].color });
      }
    }

    globe = window.Globe()(host)
      .globeImageUrl('vendor/earth-blue-marble.jpg')
      .backgroundColor('#f5ecd7')
      .showAtmosphere(true).atmosphereColor('#9ab0c4').atmosphereAltitude(0.2)
      .width(host.clientWidth || 660).height(460)
      .polygonsData(window.COUNTRIES_GEO || [])
      .polygonAltitude(d => areaColor[d.properties.NAME] ? 0.02 : 0.006)
      .polygonCapColor(d => areaColor[d.properties.NAME] ? hexA(areaColor[d.properties.NAME], 0.72) : 'rgba(0,0,0,0)')
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(() => '#d9c9a3')
      .arcsData(arcs)
      .arcColor(d => d.color).arcStroke(0.7)
      .arcDashLength(0.5).arcDashGap(0.25).arcDashAnimateTime(3500).arcAltitudeAutoScale(0.6)
      .htmlElementsData(markers)
      .htmlElement(d => {
        const el = document.createElement('div');
        el.className = 'globe-mark';
        el.innerHTML = `<span class="gm-dot" style="background:${d.color}"></span><span class="gm-label">${esc(d.name)}</span>`;
        return el;
      });

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    if (focus.length) {
      const lat = focus.reduce((a, s) => a + s.lat, 0) / focus.length;
      const lng = focus.reduce((a, s) => a + s.lng, 0) / focus.length;
      const spread = Math.max.apply(null, focus.map(s => Math.abs(s.lat - lat) + Math.abs(s.lng - lng))) || 10;
      globe.pointOfView({ lat, lng, altitude: Math.max(1.1, Math.min(2.5, spread / 40)) }, 1200);
    } else {
      globe.pointOfView({ lat: 25, lng: -45, altitude: 2.2 });
    }
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function destroy() {
    if (globe) { try { globe._destructor && globe._destructor(); } catch (e) { } globe = null; }
  }

  return { html, wire, spotsFor, destroy };
})();
