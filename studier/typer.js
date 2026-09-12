// Word Drop — a gravity typing game. This chapter's key terms fall from the
// top; type one before it lands. ZType-style targeting: your first matching
// keystroke locks onto the lowest matching term, then finish it to clear it.
window.Typer = (function () {
  const P = {
    parchment: '#f5ecd7', cream: '#fffaf0', ink: '#2b2118',
    navy: '#1b2a38', patriot: '#8c1c13', brass: '#8b6f47'
  };
  let raf = 0, listeners = [], S = null;

  function destroy() {
    cancelAnimationFrame(raf);
    listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    listeners = [];
    S = null;
  }
  function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }

  function html(n) {
    const c = (window.APUSH.chapters || {})[String(n)];
    if (!c) return '<h1>Not here</h1><p><a href="#/">Back</a></p>';
    return `<p class="crumb"><a href="#/">All periods</a> / <a href="#/ch/${n}">Ch ${n}</a></p>
      <h1>Word Drop — Chapter ${n}</h1>
      <p class="cover-note">Type each falling term before it hits the ground. The words are this chapter's key terms, so quick fingers mean quick recall.</p>
      <div class="typer-wrap"><canvas id="typer" width="720" height="470" tabindex="0"></canvas></div>
      <p class="typer-help">Click the board, then start typing. Backspace fixes a slip; Enter replays.</p>`;
  }

  function wire(n) {
    const c = (window.APUSH.chapters || {})[String(n)];
    const canvas = document.getElementById('typer');
    if (!canvas || !c) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pool = (c.key_terms || []).map(t => t.term).filter(t => t.length >= 3);
    if (!pool.length) return;

    const fresh = () => ({
      words: [], score: 0, cleared: 0, lives: 3, spawnIn: 0.4, speed: 24,
      active: null, prog: 0, over: false, last: performance.now()
    });
    S = fresh();
    canvas.focus();
    on(canvas, 'click', () => canvas.focus());

    on(canvas, 'keydown', e => {
      if (S.over) { if (e.key === 'Enter') { S = fresh(); } return; }
      if (e.key === 'Backspace') {
        if (S.active) { S.prog = Math.max(0, S.prog - 1); if (!S.prog) S.active = null; }
        e.preventDefault(); return;
      }
      if (e.key.length !== 1) return;
      e.preventDefault();
      typeChar(e.key.toLowerCase());
    });

    function typeChar(ch) {
      if (!S.active) {
        let best = null;
        S.words.forEach(w => {
          if (w.text[0].toLowerCase() === ch && (!best || w.y > best.y)) best = w;
        });
        if (best) { S.active = best; S.prog = 1; if (best.text.length === 1) clear(best); }
      } else {
        const expected = (S.active.text[S.prog] || '').toLowerCase();
        if (expected === ch) { S.prog++; if (S.prog >= S.active.text.length) clear(S.active); }
      }
    }
    function clear(w) {
      S.score += w.text.replace(/\s/g, '').length;
      S.cleared++;
      const i = S.words.indexOf(w);
      if (i >= 0) S.words.splice(i, 1);
      S.active = null; S.prog = 0;
    }
    function spawn() {
      const text = pool[Math.floor(Math.random() * pool.length)];
      ctx.font = 'bold 20px Georgia';
      const tw = ctx.measureText(text).width;
      S.words.push({ text, x: 16 + Math.random() * Math.max(1, W - 32 - tw), y: 6, tw });
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - S.last) / 1000); S.last = now;
      if (!S.over) {
        S.speed += dt * 0.7; S.spawnIn -= dt;
        if (S.spawnIn <= 0) { spawn(); S.spawnIn = Math.max(0.75, 2 - S.speed * 0.02); }
        S.words.forEach(w => { w.y += S.speed * dt; });
        for (let i = S.words.length - 1; i >= 0; i--) {
          if (S.words[i].y > H - 26) {
            if (S.active === S.words[i]) { S.active = null; S.prog = 0; }
            S.words.splice(i, 1); S.lives--;
            if (S.lives <= 0) S.over = true;
          }
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function draw() {
      ctx.fillStyle = P.parchment; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c8b88f'; ctx.fillRect(0, H - 22, W, 22);
      ctx.font = 'bold 20px Georgia'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      S.words.forEach(w => {
        if (w === S.active) {
          ctx.fillStyle = P.patriot;
          ctx.fillText(w.text.slice(0, S.prog), w.x, w.y);
          const done = ctx.measureText(w.text.slice(0, S.prog)).width;
          ctx.fillStyle = P.ink;
          ctx.fillText(w.text.slice(S.prog), w.x + done, w.y);
        } else {
          ctx.fillStyle = P.navy; ctx.fillText(w.text, w.x, w.y);
        }
      });
      ctx.fillStyle = P.navy; ctx.fillRect(0, 0, W, 30);
      ctx.fillStyle = P.cream; ctx.font = 'bold 15px Georgia';
      ctx.textAlign = 'left'; ctx.fillText('score ' + S.score, 12, 20);
      ctx.textAlign = 'center'; ctx.fillText('Word Drop', W / 2, 20);
      ctx.textAlign = 'right'; ctx.fillText('lives ' + (S.lives > 0 ? '★'.repeat(S.lives) : '—'), W - 12, 20);
      if (S.over) {
        ctx.fillStyle = 'rgba(27,42,56,0.88)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = P.cream; ctx.textAlign = 'center';
        ctx.font = 'bold 30px Georgia'; ctx.fillText('Game over', W / 2, H / 2 - 22);
        ctx.font = '18px Georgia';
        ctx.fillText('score ' + S.score + '  ·  ' + S.cleared + ' terms cleared', W / 2, H / 2 + 8);
        ctx.fillText('press Enter to play again', W / 2, H / 2 + 40);
        ctx.textAlign = 'left';
      }
    }
    raf = requestAnimationFrame(frame);
  }

  return { html, wire, destroy };
})();
