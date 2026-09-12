// Graphic-novel mode: turn a chapter's summary into animated comic panels.
// SVG cartoon actors + era scenes, chosen per sentence by keywords. All art
// is generic and prop-based (hats, tools, flags) — no ethnic caricature.
window.Comic = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const FACE = '#e9c9a0';
  const COSTUME = {
    scholar: '#5a4632', soldier: '#8c1c13', farmer: '#7d6a45', king: '#5b2a6b',
    sailor: '#33506b', worker: '#3f5566', protester: '#a5642a',
    statesman: '#2b3b4a', preacher: '#33322f', settler: '#6b7c4a'
  };

  // ---------------------------------------------------------------- actors
  function actor(type) {
    const c = COSTUME[type] || '#5a4632';
    let hat = '', prop = '';
    if (type === 'soldier') {
      hat = tricorn('#2b2118');
      prop = `<rect x="20" y="-58" width="4" height="86" rx="2" fill="#4a3b2a" transform="rotate(12 22 -10)"/>`;
    } else if (type === 'king') {
      hat = `<path d="M-15,-66 L-15,-78 L-8,-70 L0,-82 L8,-70 L15,-78 L15,-66 Z" fill="#d9b44a" stroke="#8a6b1f" stroke-width="1.5"/>
             <circle cx="0" cy="-82" r="2.6" fill="#8c1c13"/>`;
    } else if (type === 'farmer' || type === 'settler') {
      hat = `<path d="M-22,-62 Q0,-70 22,-62 Q10,-58 0,-58 Q-10,-58 -22,-62 Z" fill="#b79a5e"/>
             <path d="M-13,-62 Q0,-78 13,-62 Z" fill="#a2874f"/>`;
      prop = `<rect x="22" y="-52" width="3.5" height="80" fill="#7a5a33" transform="rotate(8 23 -12)"/>
              <path d="M24,-52 l14,-4 l-2,10 z" fill="#8b6f47" transform="rotate(8 23 -12)"/>`;
    } else if (type === 'sailor') {
      hat = `<path d="M-16,-64 h32 v5 h-32 z" fill="#33506b"/><rect x="-6" y="-72" width="12" height="9" fill="#33506b"/>`;
      prop = `<circle cx="26" cy="4" r="13" fill="none" stroke="#7a5a33" stroke-width="3"/>
              <g stroke="#7a5a33" stroke-width="2"><line x1="26" y1="-9" x2="26" y2="17"/><line x1="13" y1="4" x2="39" y2="4"/></g>`;
    } else if (type === 'worker') {
      hat = `<path d="M-16,-64 Q0,-72 16,-64 l0,4 l-32,0 z" fill="#7a4a2a"/>`;
      prop = `<rect x="20" y="-40" width="5" height="60" rx="2" fill="#555" transform="rotate(20 22 -10)"/>
              <rect x="12" y="-46" width="22" height="9" rx="2" fill="#777" transform="rotate(20 22 -10)"/>`;
    } else if (type === 'protester') {
      prop = `<rect x="16" y="-70" width="4" height="96" fill="#7a5a33"/>
              <rect x="-2" y="-92" width="52" height="30" rx="3" fill="#fffaf0" stroke="#8c1c13" stroke-width="2.5"/>
              <line x1="6" y1="-82" x2="42" y2="-82" stroke="#8c1c13" stroke-width="2.5"/>
              <line x1="6" y1="-74" x2="34" y2="-74" stroke="#8c1c13" stroke-width="2.5"/>`;
    } else if (type === 'statesman') {
      hat = `<rect x="-13" y="-84" width="26" height="20" rx="2" fill="#2b2118"/><rect x="-18" y="-66" width="36" height="4" rx="2" fill="#2b2118"/>`;
      prop = `<rect x="16" y="-6" width="20" height="26" rx="2" fill="#fffaf0" stroke="#8b6f47" stroke-width="1.5"/>
              <g stroke="#8b6f47" stroke-width="1.4"><line x1="20" y1="2" x2="32" y2="2"/><line x1="20" y1="8" x2="32" y2="8"/><line x1="20" y1="14" x2="30" y2="14"/></g>`;
    } else if (type === 'preacher') {
      prop = `<rect x="14" y="-4" width="22" height="26" rx="2" fill="#5b1a14"/><line x1="25" y1="-4" x2="25" y2="22" stroke="#fffaf0" stroke-width="1.5"/>`;
    } else {
      hat = '';
      prop = `<path d="M20,-6 l16,-10 l0,30 l-16,-6 z" fill="#fffaf0" stroke="#8b6f47" stroke-width="1.5"/>
              <line x1="22" y1="2" x2="34" y2="-3" stroke="#8b6f47" stroke-width="1.3"/>
              <line x1="22" y1="8" x2="34" y2="4" stroke="#8b6f47" stroke-width="1.3"/>`;
    }
    return `<g class="cbob" transform="translate(158,118)">
      <ellipse cx="0" cy="66" rx="40" ry="7" fill="rgba(43,33,24,0.14)"/>
      <rect x="-15" y="22" width="12" height="42" rx="5" fill="#3a2c1c"/>
      <rect x="3" y="22" width="12" height="42" rx="5" fill="#3a2c1c"/>
      <rect x="-26" y="-40" width="12" height="52" rx="6" fill="${c}"/>
      <rect x="14" y="-40" width="12" height="52" rx="6" fill="${c}"/>
      <rect x="-24" y="-30" width="48" height="58" rx="15" fill="${c}"/>
      <circle cx="0" cy="-50" r="18" fill="${FACE}"/>
      <g class="cblink"><circle cx="-6" cy="-52" r="2.5" fill="#2b2118"/><circle cx="6" cy="-52" r="2.5" fill="#2b2118"/></g>
      <path d="M-5,-43 Q0,-39 5,-43" stroke="#2b2118" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${hat}${prop}
    </g>`;
  }
  function tricorn(col) {
    return `<path d="M-20,-60 Q0,-84 20,-60 Q0,-70 -20,-60 Z" fill="${col}"/>
            <path d="M-20,-60 Q0,-66 20,-60 L14,-64 Q0,-70 -14,-64 Z" fill="#e9c9a0" opacity="0.25"/>`;
  }

  // ---------------------------------------------------------------- scenes
  function scene(type) {
    const sky = (a, b) => `<rect width="320" height="150" fill="${a}"/><rect y="150" width="320" height="60" fill="${b}"/>`;
    if (type === 'sea') {
      return `<rect width="320" height="130" fill="#bcd3e0"/><circle cx="262" cy="42" r="20" fill="#f3e2b0"/>
        <rect y="130" width="320" height="80" fill="#33506b"/>
        <g class="cwaves" stroke="#5a7288" stroke-width="3" fill="none" stroke-linecap="round">
          <path d="M-20,150 q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0"/>
          <path d="M-20,168 q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0"/></g>
        <g transform="translate(70,112)"><rect x="-16" y="0" width="34" height="12" rx="3" fill="#5a4632"/>
          <rect x="-2" y="-30" width="3" height="30" fill="#3a2c1c"/><path d="M1,-28 l18,10 l-18,8 z" fill="#fffaf0"/></g>`;
    }
    if (type === 'battle') {
      return sky('#c9d6d0', '#8ca86a') +
        `<path d="M0,150 q80,-24 160,0 t160,0 v60 H0 z" fill="#7d986a"/>
         <g class="csmoke"><circle cx="240" cy="70" r="14" fill="#cfc6ba" opacity="0.7"/><circle cx="256" cy="58" r="10" fill="#dfd8cd" opacity="0.6"/></g>
         <g transform="translate(250,96)"><rect x="0" y="-40" width="3.5" height="70" fill="#3a2c1c"/>
           <path class="cflag" d="M3,-40 l34,6 l-6,8 l6,8 l-34,4 z" fill="#8c1c13"/></g>`;
    }
    if (type === 'field') {
      return `<rect width="320" height="140" fill="#cfe0e6"/>
        <g class="csun" transform="translate(52,44)"><circle r="16" fill="#f3d873"/>
          <g stroke="#f3d873" stroke-width="3">${rays()}</g></g>
        <rect y="140" width="320" height="70" fill="#a98d54"/>
        <g stroke="#8a6b3f" stroke-width="3">${[150,168,186].map(y => `<line x1="0" y1="${y}" x2="320" y2="${y}"/>`).join('')}</g>
        <g fill="#7d9a4e">${[30,90,150,210,270].map(x => `<path d="M${x},150 l4,-16 l4,16 z"/>`).join('')}</g>`;
    }
    if (type === 'throne') {
      return `<rect width="320" height="210" fill="#6b4f6f"/><rect width="320" height="60" y="150" fill="#4a3550"/>
        <g transform="translate(158,150)"><rect x="-34" y="-70" width="68" height="70" rx="6" fill="#8a6b1f"/>
          <rect x="-34" y="-92" width="68" height="26" rx="6" fill="#d9b44a"/></g>
        <path class="cflag" d="M40,20 v90 h50 l-10,-45 l10,-45 z" fill="#5b2a6b" opacity="0.5"/>`;
    }
    if (type === 'factory') {
      return sky('#b9c2c8', '#7c766e') +
        `<g fill="#5b5750">${[[20,90],[70,70],[210,80],[268,60]].map(([x, h]) => `<rect x="${x}" y="${150 - h}" width="42" height="${h}"/>`).join('')}</g>
         <g transform="translate(96,60)"><rect x="0" y="0" width="18" height="90" fill="#4a463f"/>
           <g class="csmoke"><circle cx="9" cy="-6" r="12" fill="#cfc6ba" opacity="0.7"/><circle cx="20" cy="-18" r="9" fill="#dfd8cd" opacity="0.6"/></g></g>
         <g fill="#f3d873" opacity="0.8">${[26,34,76,84,216,224].map(x => `<rect x="${x}" y="110" width="8" height="10"/>`).join('')}</g>`;
    }
    if (type === 'capitol') {
      return sky('#c6d7e2', '#9aa886') +
        `<g transform="translate(158,150)" fill="#e7dcc2" stroke="#8b6f47" stroke-width="1.5">
           <rect x="-70" y="-40" width="140" height="40"/><path d="M-70,-40 L0,-92 L70,-40 Z"/>
           <path d="M-16,-40 a16,40 0 0 1 32,0" fill="#dcd0b4"/>
           <g stroke="#8b6f47" stroke-width="3">${[-56, -40, -24, 24, 40, 56].map(x => `<line x1="${x}" y1="-40" x2="${x}" y2="0"/>`).join('')}</g></g>`;
    }
    if (type === 'rally') {
      return sky('#cdd8e0', '#93a377') +
        `<g fill="#4a5568" opacity="0.55">${[20,55,90,200,235,270].map(x => `<circle cx="${x}" cy="150" r="16"/><rect x="${x - 10}" y="150" width="20" height="40"/>`).join('')}</g>
         <g transform="translate(158,120)"><rect x="0" y="-46" width="3.5" height="70" fill="#3a2c1c"/>
           <path class="cflag" d="M3.5,-46 l40,6 v22 l-40,4 z" fill="#8c1c13"/></g>`;
    }
    if (type === 'town') {
      return sky('#c6d3dc', '#98a880') +
        `<g fill="#8b6f47">${[[16,44],[64,60],[240,52]].map(([x, h]) => `<rect x="${x}" y="${150 - h}" width="46" height="${h}"/><path d="M${x - 4},${150 - h} l25,-18 l25,18 z" fill="#6e553a"/>`).join('')}</g>
         <g transform="translate(150,50)"><rect x="-11" y="0" width="22" height="100" fill="#e7dcc2" stroke="#8b6f47"/><path d="M-11,0 l11,-26 l11,26 z" fill="#8c1c13"/></g>`;
    }
    if (type === 'plains') {
      return `<rect width="320" height="150" fill="#cfe0e6"/>
        <path d="M0,150 L60,96 L120,150 Z M120,150 L200,80 L280,150 Z" fill="#9aa6ad"/>
        <rect y="150" width="320" height="60" fill="#b79a5e"/>
        <g class="csun" transform="translate(268,40)"><circle r="14" fill="#f3d873"/></g>`;
    }
    // parchment default
    return `<rect width="320" height="210" fill="#efe4c8"/>
      <g stroke="#d9c9a3" stroke-width="1.4">${[36,60,84,108,150,174].map(y => `<line x1="18" y1="${y}" x2="302" y2="${y}"/>`).join('')}</g>
      <rect x="6" y="6" width="308" height="198" fill="none" stroke="#c9b78c" stroke-width="2"/>`;
  }
  function rays() {
    let r = '';
    for (let a = 0; a < 360; a += 45) {
      const t = a * Math.PI / 180;
      r += `<line x1="${(22 * Math.cos(t)).toFixed(1)}" y1="${(22 * Math.sin(t)).toFixed(1)}" x2="${(30 * Math.cos(t)).toFixed(1)}" y2="${(30 * Math.sin(t)).toFixed(1)}"/>`;
    }
    return r;
  }

  // ---------------------------------------------------------- sentence -> scene
  const MAP = [
    { re: /\b(war|battle|militia|army|troops?|soldier|revolution|fought|siege|combat|invas|musket|redcoat)\b/i, s: 'battle', a: 'soldier' },
    { re: /\b(slav|enslav|plantation|cotton|tobacco|rice|indigo|harvest|crop|planter)\b/i, s: 'field', a: 'farmer' },
    { re: /\b(king|crown|parliament|britain|british|monarch|royal|empire|taxe?s?|stamp act)\b/i, s: 'throne', a: 'king' },
    { re: /\b(ship|sail|atlantic|voyage|ocean|explor|columbus|fleet|navy|port|trade route|coast)\b/i, s: 'sea', a: 'sailor' },
    { re: /\b(factor(y|ies)|industr|railroad|mill|steel|machine|worker|strike|urban|immigr|labor)\b/i, s: 'factory', a: 'worker' },
    { re: /\b(vote|democracy|election|suffrage|protest|march|reform|movement|abolition|rights)\b/i, s: 'rally', a: 'protester' },
    { re: /\b(president|congress|constitution|federal|senate|supreme court|government|union|amendment|nation)\b/i, s: 'capitol', a: 'statesman' },
    { re: /\b(church|religio|puritan|revival|missionar|faith|preach|great awakening)\b/i, s: 'town', a: 'preacher' },
    { re: /\b(frontier|west(ward)?|plains|territor|settler|pioneer|land)\b/i, s: 'plains', a: 'settler' }
  ];
  function pick(sentence) {
    for (const m of MAP) if (m.re.test(sentence)) return m;
    return { s: 'parchment', a: 'scholar' };
  }

  function sentences(c) {
    const out = [];
    (c.summary || []).forEach(p => {
      String(p).split(/(?<=[.!?])\s+(?=[A-Z"'])/).forEach(s => {
        const t = s.trim();
        if (t.length > 4) out.push(t);
      });
    });
    return out.slice(0, 16);
  }

  function panelSVG(m) {
    return `<svg viewBox="0 0 320 210" class="cart-svg" aria-hidden="true">${scene(m.s)}${actor(m.a)}</svg>`;
  }

  // ---------------------------------------------------------------- view
  function html(n) {
    const c = (window.APUSH.chapters || {})[String(n)];
    if (!c) return '<h1>Not here</h1><p><a href="#/">Back</a></p>';
    const ss = sentences(c);
    const panels = ss.map((sen, i) => {
      const m = pick(sen);
      const side = i % 2 ? 'right' : 'left';
      return `<figure class="cpanel ${side}" data-i="${i}">
        <div class="cart">${panelSVG(m)}<span class="cpanel-no">${i + 1}</span></div>
        <div class="cbubble"><p data-text="${esc(sen)}"></p></div>
      </figure>`;
    }).join('');
    return `<p class="crumb"><a href="#/">All periods</a> / <a href="#/ch/${n}">Ch ${n}</a></p>
      <header class="comic-head"><h1>Chapter ${n}: ${esc(c.title)}</h1>
        <p class="ch-years">${esc(c.years)} · the graphic novel</p></header>
      <div class="comic-strip">${panels}</div>
      <p class="comic-end"><a class="btn" href="#/ch/${n}">Back to the chapter</a>
        <a class="btn ghost" href="#/comic/${Number(n) + 1}">Next chapter ›</a></p>`;
  }

  function wire() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const panels = Array.prototype.slice.call(document.querySelectorAll('.cpanel'));
    if (!panels.length) return;
    const type = (p) => {
      const el = p.querySelector('.cbubble p');
      const full = el.getAttribute('data-text') || '';
      if (reduce) { el.textContent = full; return; }
      let i = 0;
      el.textContent = '';
      const step = () => {
        el.textContent = full.slice(0, i);
        if (i++ <= full.length) setTimeout(step, 14);
      };
      step();
    };
    if (!('IntersectionObserver' in window) || reduce) {
      panels.forEach(p => { p.classList.add('in'); type(p); });
      return;
    }
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !seen.has(e.target)) {
          seen.add(e.target);
          e.target.classList.add('in');
          setTimeout(() => type(e.target), 260);
        }
      });
    }, { threshold: 0.35 });
    panels.forEach(p => io.observe(p));
  }

  return { html, wire };
})();
