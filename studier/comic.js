// Graphic-novel mode: turn a chapter's summary into animated comic panels.
// SVG cartoon actors + living era scenes, chosen per sentence by keywords.
// Figures are generic and prop-based (hats, tools, flags) — no caricature.
window.Comic = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const FACE = '#e9c9a0';
  const COSTUME = {
    scholar: '#5a4632', soldier: '#8c1c13', farmer: '#7d6a45', king: '#5b2a6b',
    sailor: '#33506b', worker: '#3f5566', protester: '#a5642a',
    statesman: '#2b3b4a', preacher: '#33322f', settler: '#6b7c4a'
  };

  // -------------------------------------------------- shared scenery bits
  const clouds = () => `
    <g class="cdrift" fill="#fffaf0" opacity="0.9">
      <ellipse cx="60" cy="30" rx="26" ry="12"/><ellipse cx="84" cy="26" rx="17" ry="10"/><ellipse cx="40" cy="34" rx="16" ry="9"/></g>
    <g class="cdrift2" fill="#fffaf0" opacity="0.7">
      <ellipse cx="232" cy="24" rx="22" ry="10"/><ellipse cx="252" cy="28" rx="15" ry="8"/></g>`;
  const birds = () => `
    <g class="cfly" stroke="#4a3b2a" stroke-width="1.6" fill="none" stroke-linecap="round">
      <path d="M116,44 q4,-5 8,0 q4,-5 8,0"/><path d="M148,52 q3,-4 6,0 q3,-4 6,0"/><path d="M132,60 q3,-4 6,0 q3,-4 6,0"/></g>`;
  const sun = (x, y, r) => `<g transform="translate(${x},${y})"><g class="csun"><circle r="${r}" fill="#f3d873"/>
    <g stroke="#f3d873" stroke-width="3">${rays(r)}</g></g></g>`;
  function rays(r) {
    let s = '';
    for (let a = 0; a < 360; a += 45) {
      const t = a * Math.PI / 180, i = r + 4, o = r + 12;
      s += `<line x1="${(i * Math.cos(t)).toFixed(1)}" y1="${(i * Math.sin(t)).toFixed(1)}" x2="${(o * Math.cos(t)).toFixed(1)}" y2="${(o * Math.sin(t)).toFixed(1)}"/>`;
    }
    return s;
  }

  // -------------------------------------------------------------- actors
  function actor(type) {
    const c = COSTUME[type] || '#5a4632';
    const dark = shade(c, -22);
    let hat = '', prop = '', gestureProp = '';
    if (type === 'soldier') {
      hat = tricorn('#2b2118');
      gestureProp = `<rect x="-4" y="-70" width="5" height="92" rx="2" fill="#4a3b2a"/><rect x="-6" y="-72" width="9" height="6" fill="#8b6f47"/>`;
    } else if (type === 'king') {
      hat = `<path d="M-16,-70 L-16,-84 L-8,-75 L0,-88 L8,-75 L16,-84 L16,-70 Z" fill="#d9b44a" stroke="#8a6b1f" stroke-width="1.5"/><circle cx="0" cy="-88" r="2.8" fill="#8c1c13"/>`;
      prop = `<path d="M-26,32 L26,32 L20,64 L-20,64 Z" fill="${dark}" opacity="0.55"/>`;
      gestureProp = `<rect x="-3" y="-40" width="4" height="46" fill="#8a6b1f"/><circle cx="-1" cy="-42" r="5" fill="#d9b44a"/>`;
    } else if (type === 'farmer' || type === 'settler') {
      hat = `<path d="M-23,-66 Q0,-74 23,-66 Q11,-61 0,-61 Q-11,-61 -23,-66 Z" fill="#b79a5e"/><path d="M-13,-66 Q0,-82 13,-66 Z" fill="#a2874f"/>`;
      gestureProp = `<rect x="-2" y="-58" width="4" height="80" fill="#7a5a33"/><path d="M0,-58 l16,-5 l-2,11 z" fill="#8b6f47"/>`;
    } else if (type === 'sailor') {
      hat = `<path d="M-16,-68 h32 v5 h-32 z" fill="#33506b"/><rect x="-6" y="-76" width="12" height="9" fill="#33506b"/>`;
      gestureProp = `<circle cx="0" cy="-8" r="13" fill="none" stroke="#7a5a33" stroke-width="3"/><g stroke="#7a5a33" stroke-width="2"><line x1="0" y1="-21" x2="0" y2="5"/><line x1="-13" y1="-8" x2="13" y2="-8"/></g>`;
    } else if (type === 'worker') {
      hat = `<path d="M-16,-68 Q0,-76 16,-68 l0,4 l-32,0 z" fill="#7a4a2a"/>`;
      gestureProp = `<rect x="-3" y="-52" width="6" height="66" rx="2" fill="#555"/><rect x="-11" y="-58" width="24" height="9" rx="2" fill="#777"/>`;
    } else if (type === 'protester') {
      gestureProp = `<rect x="-2" y="-84" width="4" height="102" fill="#7a5a33"/><rect x="-24" y="-108" width="52" height="30" rx="3" fill="#fffaf0" stroke="#8c1c13" stroke-width="2.5"/><line x1="-16" y1="-98" x2="20" y2="-98" stroke="#8c1c13" stroke-width="2.5"/><line x1="-16" y1="-90" x2="10" y2="-90" stroke="#8c1c13" stroke-width="2.5"/>`;
    } else if (type === 'statesman') {
      hat = `<rect x="-13" y="-88" width="26" height="20" rx="2" fill="#2b2118"/><rect x="-18" y="-70" width="36" height="4" rx="2" fill="#2b2118"/>`;
      gestureProp = `<rect x="-10" y="-14" width="20" height="26" rx="2" fill="#fffaf0" stroke="#8b6f47" stroke-width="1.5"/><g stroke="#8b6f47" stroke-width="1.4"><line x1="-6" y1="-6" x2="6" y2="-6"/><line x1="-6" y1="0" x2="6" y2="0"/><line x1="-6" y1="6" x2="4" y2="6"/></g>`;
    } else if (type === 'preacher') {
      gestureProp = `<rect x="-11" y="-12" width="22" height="26" rx="2" fill="#5b1a14"/><line x1="0" y1="-12" x2="0" y2="14" stroke="#fffaf0" stroke-width="1.5"/>`;
    } else {
      gestureProp = `<path d="M-8,-14 l16,-10 l0,30 l-16,-6 z" fill="#fffaf0" stroke="#8b6f47" stroke-width="1.5"/><line x1="-6,2" x2="6" y1="-6" y2="-11" stroke="#8b6f47" stroke-width="1.2"/>`;
    }
    // torso with a coat seam + two buttons; a back arm, and a front arm that
    // gestures (holds the prop). Whole figure idles with cbob.
    return `<g class="cbob" transform="translate(158,116) scale(1.14)">
      <ellipse cx="0" cy="60" rx="38" ry="7" fill="rgba(43,33,24,0.16)"/>
      <rect x="-14" y="20" width="11" height="40" rx="5" fill="#3a2c1c"/>
      <rect x="3" y="20" width="11" height="40" rx="5" fill="#3a2c1c"/>
      <rect x="-25" y="-34" width="11" height="50" rx="5" fill="${dark}"/>
      <rect x="-23" y="-28" width="46" height="54" rx="14" fill="${c}"/>
      <line x1="0" y1="-26" x2="0" y2="22" stroke="${dark}" stroke-width="1.6"/>
      <circle cx="0" cy="-16" r="2" fill="${dark}"/><circle cx="0" cy="-4" r="2" fill="${dark}"/>
      <g class="cgesture"><rect x="16" y="-32" width="11" height="34" rx="5" fill="${c}"/>
        <g transform="translate(21,-30)">${gestureProp}<circle cx="0" cy="2" r="4.5" fill="${FACE}"/></g></g>
      <circle cx="0" cy="-46" r="17" fill="${FACE}"/>
      <path d="M-17,-48 a17,17 0 0 1 34,0 a17,10 0 0 0 -34,0 z" fill="${shade(FACE, -14)}" opacity="0.35"/>
      <g class="cblink"><circle cx="-6" cy="-48" r="2.5" fill="#2b2118"/><circle cx="6" cy="-48" r="2.5" fill="#2b2118"/></g>
      <path d="M-5,-39 Q0,-35 5,-39" stroke="#2b2118" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${prop}${hat}
    </g>`;
  }
  function tricorn(col) {
    return `<path d="M-20,-58 Q0,-82 20,-58 Q0,-68 -20,-58 Z" fill="${col}"/><path d="M-14,-60 Q0,-66 14,-60 L10,-63 Q0,-68 -10,-63 Z" fill="#e9c9a0" opacity="0.25"/>`;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const cl = v => Math.max(0, Math.min(255, v));
    const r = cl((n >> 16) + amt), g = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // -------------------------------------------------------------- scenes
  function scene(type) {
    const ground = (a, b) => `<rect width="320" height="150" fill="${a}"/><rect y="150" width="320" height="60" fill="${b}"/>`;
    if (type === 'sea') {
      return `<rect width="320" height="132" fill="#bcd3e0"/>${clouds()}${sun(268, 40, 15)}${birds()}
        <rect y="132" width="320" height="78" fill="#33506b"/>
        <g class="cship" transform="translate(-40,104)"><rect x="-18" y="0" width="40" height="14" rx="3" fill="#5a4632"/>
          <rect x="-1" y="-34" width="3" height="34" fill="#3a2c1c"/><path d="M2,-32 l22,12 l-22,9 z" fill="#fffaf0"/>
          <rect x="-14" y="-24" width="2.4" height="24" fill="#3a2c1c"/><path d="M-12,-22 l12,8 l-12,6 z" fill="#efe4c8"/></g>
        <g class="cwaves" stroke="#5a7288" stroke-width="3" fill="none" stroke-linecap="round">
          <path d="M-40,154 q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0"/>
          <path d="M-40,172 q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0"/></g>`;
    }
    if (type === 'battle') {
      return ground('#c9d6d0', '#8ca86a') + clouds() +
        `<path d="M0,150 q80,-24 160,0 t160,0 v60 H0 z" fill="#7d986a"/>
         <g class="cmarch" transform="translate(0,132)" fill="#4a3b2a">${[0, 26, 52].map(x => `<g transform="translate(${x},0)"><rect x="-3" y="-16" width="6" height="16"/><circle cx="0" cy="-19" r="3"/><rect x="1" y="-28" width="2" height="14" transform="rotate(18 2 -20)"/></g>`).join('')}</g>
         <g class="cflash" transform="translate(250,120)"><rect x="-16" y="-6" width="26" height="10" rx="3" fill="#3a2c1c"/><circle cx="14" cy="-1" r="9" fill="#f6c14b"/><circle cx="14" cy="-1" r="4" fill="#fff3c4"/></g>
         <g class="csmoke"><circle cx="264" cy="104" r="12" fill="#cfc6ba" opacity="0.7"/><circle cx="276" cy="92" r="8" fill="#dfd8cd" opacity="0.6"/></g>
         <g transform="translate(40,96)"><rect x="0" y="-42" width="3.5" height="72" fill="#3a2c1c"/><path class="cflag" d="M3.5,-42 l36,6 l-6,8 l6,8 l-36,4 z" fill="#8c1c13"/></g>`;
    }
    if (type === 'field') {
      return `<rect width="320" height="140" fill="#cfe0e6"/>${clouds()}${sun(54, 42, 16)}${birds()}
        <rect y="140" width="320" height="70" fill="#a98d54"/>
        <g stroke="#8a6b3f" stroke-width="3">${[152, 170, 188].map(y => `<line x1="0" y1="${y}" x2="320" y2="${y}"/>`).join('')}</g>
        <g class="cbarn" transform="translate(250,108)"><rect x="0" y="0" width="46" height="34" fill="#8c3b2f"/><path d="M-3,0 l25,-16 l25,16 z" fill="#6e2a20"/><rect x="16" y="12" width="14" height="22" fill="#5a2018"/></g>
        <g fill="#7d9a4e" class="csway">${[24, 60, 96, 132, 300].map(x => `<path d="M${x},152 l4,-18 l4,18 z"/>`).join('')}</g>
        <g fill="#7d9a4e" class="csway2">${[42, 78, 114, 282].map(x => `<path d="M${x},152 l4,-18 l4,18 z"/>`).join('')}</g>`;
    }
    if (type === 'throne') {
      return `<rect width="320" height="210" fill="#6b4f6f"/><rect width="320" height="60" y="150" fill="#4a3550"/>
        <path class="cflag" d="M34,16 v96 h44 l-9,-48 l9,-48 z" fill="#5b2a6b" opacity="0.6"/>
        <path class="cflag2" d="M286,16 v96 h-44 l9,-48 l-9,-48 z" fill="#5b2a6b" opacity="0.6"/>
        <g transform="translate(158,150)"><rect x="-34" y="-70" width="68" height="70" rx="6" fill="#8a6b1f"/><rect x="-34" y="-92" width="68" height="26" rx="6" fill="#d9b44a"/></g>
        <g transform="translate(64,150)"><rect x="-4" y="-46" width="8" height="46" fill="#c9b78c"/><g class="cflame"><path d="M0,-46 q-6,-8 0,-16 q6,8 0,16z" fill="#f6c14b"/></g></g>
        <g transform="translate(256,150)"><rect x="-4" y="-46" width="8" height="46" fill="#c9b78c"/><g class="cflame2"><path d="M0,-46 q-6,-8 0,-16 q6,8 0,16z" fill="#f6c14b"/></g></g>`;
    }
    if (type === 'factory') {
      return ground('#b9c2c8', '#7c766e') +
        `<g fill="#5b5750">${[[8, 90], [58, 70], [206, 82], [268, 62]].map(([x, h]) => `<rect x="${x}" y="${150 - h}" width="44" height="${h}"/>`).join('')}</g>
         <g fill="#f3d873" class="cwindow" opacity="0.85">${[16, 24, 66, 74, 214, 222, 276].map(x => `<rect x="${x}" y="108" width="8" height="10"/>`).join('')}</g>
         <g transform="translate(96,54)"><rect x="0" y="0" width="18" height="96" fill="#4a463f"/><g class="csmoke"><circle cx="9" cy="-6" r="12" fill="#cfc6ba" opacity="0.7"/><circle cx="20" cy="-18" r="9" fill="#dfd8cd" opacity="0.55"/></g></g>
         <g transform="translate(150,70)"><rect x="0" y="0" width="14" height="80" fill="#413d37"/><g class="csmoke2"><circle cx="7" cy="-6" r="10" fill="#cfc6ba" opacity="0.6"/></g></g>
         <g class="cgear" transform="translate(300,120)"><circle r="14" fill="#6e675d"/><circle r="6" fill="#4a463f"/><g fill="#6e675d">${gearTeeth(16)}</g></g>`;
    }
    if (type === 'capitol') {
      return ground('#c6d7e2', '#9aa886') + clouds() + birds() +
        `<g transform="translate(158,150)" fill="#e7dcc2" stroke="#8b6f47" stroke-width="1.5">
           <rect x="-72" y="-40" width="144" height="40"/><path d="M-72,-40 L0,-94 L72,-40 Z"/>
           <path d="M-16,-40 a16,42 0 0 1 32,0" fill="#dcd0b4"/>
           <g stroke="#8b6f47" stroke-width="3">${[-58, -42, -26, 26, 42, 58].map(x => `<line x1="${x}" y1="-40" x2="${x}" y2="0"/>`).join('')}</g></g>
         <g transform="translate(158,58)"><rect x="-1.5" y="-14" width="3" height="14" fill="#3a2c1c"/><path class="cflag" d="M1.5,-14 l26,4 v10 l-26,3 z" fill="#8c1c13"/></g>`;
    }
    if (type === 'rally') {
      return ground('#cdd8e0', '#93a377') + clouds() +
        `<g fill="#4a5568" opacity="0.55">${[16, 48, 80, 210, 244, 276].map(x => `<circle cx="${x}" cy="150" r="15"/><rect x="${x - 9}" y="150" width="18" height="42"/>`).join('')}</g>
         <g class="csway" fill="#8c1c13">${[30, 262].map(x => `<g transform="translate(${x},112)"><rect x="-1.5" y="0" width="3" height="40" fill="#7a5a33"/><rect x="-14" y="-14" width="28" height="16" rx="2"/></g>`).join('')}</g>
         <g class="csway2" fill="#a5642a">${[88, 205].map(x => `<g transform="translate(${x},118)"><rect x="-1.5" y="0" width="3" height="36" fill="#7a5a33"/><rect x="-12" y="-12" width="24" height="14" rx="2"/></g>`).join('')}</g>
         <g transform="translate(158,116)"><rect x="0" y="-46" width="3.5" height="70" fill="#3a2c1c"/><path class="cflag" d="M3.5,-46 l40,6 v22 l-40,4 z" fill="#8c1c13"/></g>`;
    }
    if (type === 'town') {
      return ground('#c6d3dc', '#98a880') + clouds() + birds() +
        `<g fill="#8b6f47">${[[10, 46], [60, 62], [244, 52]].map(([x, h]) => `<rect x="${x}" y="${150 - h}" width="46" height="${h}"/><path d="M${x - 4},${150 - h} l25,-18 l25,18 z" fill="#6e553a"/>`).join('')}</g>
         <g transform="translate(150,50)"><rect x="-12" y="0" width="24" height="100" fill="#e7dcc2" stroke="#8b6f47"/><path d="M-12,0 l12,-28 l12,28 z" fill="#8c1c13"/><g class="cbell"><rect x="-2" y="-12" width="4" height="8" fill="#8a6b1f"/></g></g>
         <g transform="translate(74,90)"><rect x="0" y="0" width="8" height="8" fill="#4a463f"/><g class="csmoke2"><circle cx="4" cy="-4" r="7" fill="#cfc6ba" opacity="0.6"/></g></g>`;
    }
    if (type === 'plains') {
      return `<rect width="320" height="150" fill="#cfe0e6"/>${clouds()}${sun(266, 38, 14)}
        <path d="M0,150 L60,92 L120,150 Z M110,150 L200,74 L288,150 Z" fill="#9aa6ad"/>
        <path d="M0,150 L60,108 L128,150 Z" fill="#87939a"/>
        <rect y="150" width="320" height="60" fill="#b79a5e"/>
        <g class="cwagon" transform="translate(-40,140)"><rect x="0" y="-16" width="34" height="14" rx="2" fill="#7a5a33"/><path d="M0,-16 q17,-14 34,0 z" fill="#efe4c8"/><circle cx="7" cy="2" r="6" fill="none" stroke="#3a2c1c" stroke-width="2"/><circle cx="27" cy="2" r="6" fill="none" stroke="#3a2c1c" stroke-width="2"/></g>
        <g class="ctumble" transform="translate(300,186)"><circle r="8" fill="none" stroke="#8a6b3f" stroke-width="2"/><path d="M-8,0 L8,0 M0,-8 L0,8 M-6,-6 L6,6 M-6,6 L6,-6" stroke="#8a6b3f" stroke-width="1.5"/></g>`;
    }
    // parchment default — a study desk with a floating quill
    return `<rect width="320" height="210" fill="#efe4c8"/>
      <g stroke="#d9c9a3" stroke-width="1.4">${[34, 58, 82, 106, 162, 186].map(y => `<line x1="18" y1="${y}" x2="302" y2="${y}"/>`).join('')}</g>
      <rect x="6" y="6" width="308" height="198" fill="none" stroke="#c9b78c" stroke-width="2"/>
      <g class="cquill" transform="translate(70,60)"><path d="M0,0 l22,-30 l4,4 l-22,30 z" fill="#8c1c13"/><path d="M0,0 l-4,8 l8,-2 z" fill="#3a2c1c"/></g>
      <g class="cquill2" transform="translate(250,150)"><path d="M0,0 l-20,-26 l-4,4 l20,26 z" fill="#33506b"/></g>`;
  }
  function gearTeeth(r) {
    let s = '';
    for (let a = 0; a < 360; a += 45) {
      const t = a * Math.PI / 180;
      s += `<rect x="-3" y="${-r - 4}" width="6" height="7" transform="rotate(${a})"/>`;
    }
    return s;
  }

  // -------------------------------------------------- sentence -> scene
  const MAP = [
    { re: /\b(war|battle|militia|army|troops?|soldier|revolution|fought|siege|combat|invas|musket|redcoat|rebellion)\b/i, s: 'battle', a: 'soldier' },
    { re: /\b(slav|enslav|plantation|cotton|tobacco|rice|indigo|harvest|crop|planter|farm)\b/i, s: 'field', a: 'farmer' },
    { re: /\b(king|crown|parliament|britain|british|monarch|royal|empire|taxe?s?|stamp act|colonial rule)\b/i, s: 'throne', a: 'king' },
    { re: /\b(ship|sail|atlantic|voyage|ocean|explor|columbus|fleet|navy|port|coast|trade route)\b/i, s: 'sea', a: 'sailor' },
    { re: /\b(factor(y|ies)|industr|railroad|mill|steel|machine|worker|strike|urban|immigr|labor)\b/i, s: 'factory', a: 'worker' },
    { re: /\b(vote|democracy|election|suffrage|protest|march|reform|movement|abolition|rights|union organiz)\b/i, s: 'rally', a: 'protester' },
    { re: /\b(president|congress|constitution|federal|senate|supreme court|government|amendment|nation|republic)\b/i, s: 'capitol', a: 'statesman' },
    { re: /\b(church|religio|puritan|revival|missionar|faith|preach|great awakening)\b/i, s: 'town', a: 'preacher' },
    { re: /\b(frontier|west(ward)?|plains|territor|settler|pioneer|migrat)\b/i, s: 'plains', a: 'settler' }
  ];
  const ACTION = /\b(war|battle|attack|revolt|rebellion|fought|burn|strike|clash|riot|invas|killed|died|crushed|seized)\b/i;
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
  function panelSVG(m, action) {
    return `<svg viewBox="0 0 320 210" class="cart-svg${action ? ' act' : ''}" aria-hidden="true">${scene(m.s)}${actor(m.a)}</svg>`;
  }

  // ---------------------------------------------------------------- view
  function html(n) {
    const c = (window.APUSH.chapters || {})[String(n)];
    if (!c) return '<h1>Not here</h1><p><a href="#/">Back</a></p>';
    const ss = sentences(c);
    const first = pick(ss[0] || c.title);
    const imgs = (window.CH_IMAGES || {})[String(n)] || {};
    const panelArt = (i, m, action) => (imgs.comic && imgs.comic[i])
      ? `<img class="cart-img" src="${imgs.comic[i]}" alt="" loading="lazy">`
      : panelSVG(m, action);
    const splashArt = imgs.cover
      ? `<img class="cart-img" src="${imgs.cover}" alt="" loading="lazy">`
      : panelSVG(first, false);
    const splash = `<figure class="cpanel splash" data-i="-1">
      <div class="cart cart-wide">${splashArt}
        <div class="splash-title"><span class="splash-ch">Chapter ${n}</span><strong>${esc(c.title)}</strong><span class="splash-yr">${esc(c.years)}</span></div></div>
    </figure>`;
    const panels = ss.map((sen, i) => {
      const m = pick(sen);
      const action = ACTION.test(sen);
      const side = i % 2 ? 'right' : 'left';
      return `<figure class="cpanel ${side}${action ? ' action' : ''}" data-i="${i}">
        <div class="cart">${panelArt(i, m, action)}<span class="cpanel-no">${i + 1}</span></div>
        <div class="cbubble"><p data-text="${esc(sen)}"></p></div>
      </figure>`;
    }).join('');
    return `<p class="crumb"><a href="#/">All periods</a> / <a href="#/ch/${n}">Ch ${n}</a></p>
      <div class="comic-strip">${splash}${panels}</div>
      <p class="comic-end"><a class="btn" href="#/ch/${n}">Back to the chapter</a>
        <a class="btn ghost" href="#/comic/${Number(n) + 1}">Next chapter ›</a></p>`;
  }

  function wire() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const panels = Array.prototype.slice.call(document.querySelectorAll('.cpanel'));
    if (!panels.length) return;
    if (!('IntersectionObserver' in window) || reduce) {
      panels.forEach(p => p.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    panels.forEach(p => io.observe(p));
  }

  // small matched cartoon for a flashcard, keyed off the term text
  function mini(text) {
    const m = pick(String(text || ''));
    return `<svg viewBox="0 0 320 210" class="fc-art" aria-hidden="true">${scene(m.s)}${actor(m.a)}</svg>`;
  }

  // split a paragraph into sentences (same rule the comic uses)
  function splitPara(p) {
    return String(p).split(/(?<=[.!?])\s+(?=[A-Z"'])/).map(s => s.trim()).filter(s => s.length > 4);
  }

  // one comic panel: a caption + an image (AI art if given, else animated SVG)
  function panel(caption, imgSrc, i) {
    const action = ACTION.test(caption);
    const side = i % 2 ? 'right' : 'left';
    const art = imgSrc
      ? `<img class="cart-img" src="${imgSrc}" alt="" loading="lazy">`
      : panelSVG(pick(caption), action);
    return `<figure class="cpanel ${side}${action ? ' action' : ''}" data-i="${i}">
      <div class="cart">${art}<span class="cpanel-no">${i + 1}</span></div>
      <div class="cbubble"><p>${esc(caption)}</p><a class="panel-more" href="#/atlas">🗺 Learn more on the map →</a></div>
    </figure>`;
  }

  return { html, wire, mini, splitPara, panel };
})();
