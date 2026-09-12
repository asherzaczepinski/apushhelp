// Colony mini-games: Dockside run (export loading) and Militia range
// (target drill). Canvas, no libraries, palette matched to the studier.
window.Games = (function () {
  const P = {
    parchment: '#f5ecd7', cream: '#fffaf0', ink: '#2b2118', navy: '#1b2a38',
    patriot: '#8c1c13', brass: '#8b6f47', pale: '#d9c9a3', sea: '#5a6b7a'
  };
  let raf = 0, listeners = [], activeBtn = null;

  const coins = () => Number(localStorage.getItem('gml_coins') || 0);
  function addCoins(n) {
    localStorage.setItem('gml_coins', String(Math.max(0, coins() + n)));
    document.querySelectorAll('[data-coins]').forEach(el => { el.textContent = coins(); });
  }
  const best = k => Number(localStorage.getItem('gml_best_' + k) || 0);
  const setBest = (k, v) => { if (v > best(k)) localStorage.setItem('gml_best_' + k, String(v)); };

  function destroy() {
    cancelAnimationFrame(raf);
    listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    listeners = [];
    if (activeBtn) { activeBtn.disabled = false; activeBtn = null; }
  }
  function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }
  function pos(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * canvas.width / r.width,
      y: (e.clientY - r.top) * canvas.height / r.height
    };
  }
  function hud(ctx, W, left, mid, right) {
    ctx.fillStyle = P.navy;
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = P.cream;
    ctx.font = 'bold 15px Georgia';
    ctx.textAlign = 'left'; ctx.fillText(left, 12, 22);
    ctx.textAlign = 'center'; ctx.fillText(mid, W / 2, 22);
    ctx.textAlign = 'right'; ctx.fillText(right, W - 12, 22);
  }
  function endPanel(ctx, W, H, lines) {
    ctx.fillStyle = 'rgba(27,42,56,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.cream;
    ctx.textAlign = 'center';
    lines.forEach((ln, i) => {
      ctx.font = i === 0 ? 'bold 26px Georgia' : '17px Georgia';
      ctx.fillText(ln, W / 2, H / 2 - 24 + i * 30);
    });
  }
  function idle(canvas, title, sub) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = P.parchment;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = P.brass; ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.fillStyle = P.ink; ctx.textAlign = 'center';
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = 'italic 15px Georgia'; ctx.fillStyle = P.brass;
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 20);
  }

  // ── Dockside run: click barrels onto the ship, dodge customs crates ──
  function exportRun(canvas, opts, onEnd) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const lanes = [150, 225, 300];
    let barrels = [], t = 45, score = 0, spawnIn = 0.4, speed = 95;
    let flash = null, last = performance.now();

    on(canvas, 'click', e => {
      const p = pos(canvas, e);
      for (let i = barrels.length - 1; i >= 0; i--) {
        const b = barrels[i], by = lanes[b.lane];
        if (Math.abs(p.x - b.x) < 28 && Math.abs(p.y - by) < 30) {
          barrels.splice(i, 1);
          if (b.crown) { score = Math.max(0, score - 3); flash = { txt: 'customs! -3', x: b.x, y: by - 34, ttl: 0.9, bad: true }; }
          else { score += 2; flash = { txt: '+2', x: b.x, y: by - 34, ttl: 0.6 }; }
          return;
        }
      }
    });

    function drawShip() {
      ctx.fillStyle = P.navy;
      ctx.beginPath();
      ctx.moveTo(14, 130); ctx.lineTo(96, 130); ctx.lineTo(88, 330); ctx.lineTo(30, 330);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.brass; ctx.fillRect(52, 60, 5, 74);
      ctx.fillStyle = P.cream;
      ctx.beginPath(); ctx.moveTo(57, 64); ctx.lineTo(92, 100); ctx.lineTo(57, 118); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.patriot; ctx.fillRect(57, 96, 27, 5);
    }
    function drawBarrel(b) {
      const y = lanes[b.lane];
      if (b.crown) {
        ctx.fillStyle = P.patriot; ctx.fillRect(b.x - 22, y - 22, 44, 44);
        ctx.strokeStyle = P.cream; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(b.x - 22, y); ctx.lineTo(b.x + 22, y);
        ctx.moveTo(b.x, y - 22); ctx.lineTo(b.x, y + 22);
        ctx.stroke();
      } else {
        ctx.fillStyle = P.brass;
        ctx.beginPath(); ctx.ellipse(b.x, y, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(b.x - 21, y - 9); ctx.lineTo(b.x + 21, y - 9);
        ctx.moveTo(b.x - 21, y + 9); ctx.lineTo(b.x + 21, y + 9); ctx.stroke();
      }
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t -= dt; speed += dt * 2.5; spawnIn -= dt;
      if (spawnIn <= 0) {
        barrels.push({ x: W + 26, lane: Math.floor(Math.random() * 3), crown: Math.random() < 0.22 });
        spawnIn = 0.5 + Math.random() * 0.65;
      }
      barrels.forEach(b => { b.x -= speed * dt; });
      barrels = barrels.filter(b => b.x > 108);

      ctx.fillStyle = P.parchment; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.sea; ctx.fillRect(0, 336, W, H - 336);
      ctx.strokeStyle = P.brass; ctx.lineWidth = 10;
      lanes.forEach(y => {
        ctx.beginPath(); ctx.moveTo(100, y + 30); ctx.lineTo(W, y + 30); ctx.stroke();
      });
      drawShip();
      barrels.forEach(drawBarrel);
      if (flash) {
        flash.ttl -= dt;
        ctx.fillStyle = flash.bad ? P.patriot : P.navy;
        ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center';
        ctx.fillText(flash.txt, flash.x, flash.y);
        if (flash.ttl <= 0) flash = null;
      }
      hud(ctx, W, 'loaded: ' + score, opts.good || '', Math.ceil(t) + 's');
      if (t <= 0) {
        setBest(opts.key, score); addCoins(score);
        endPanel(ctx, W, H, ['Run over', score + ' coins earned', 'best: ' + best(opts.key) + ' · treasury: ' + coins()]);
        onEnd(score);
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  // ── Militia range: targets pop and shrink, rings score 1/2/3 ──
  function range(canvas, opts, onEnd) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let targets = [], t = 30, score = 0, streak = 0, spawnIn = 0.3;
    let flash = null, last = performance.now();

    on(canvas, 'click', e => {
      const p = pos(canvas, e);
      for (let i = targets.length - 1; i >= 0; i--) {
        const g = targets[i], d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < g.r) {
          targets.splice(i, 1);
          let pts = d < g.r / 3 ? 3 : d < g.r * 2 / 3 ? 2 : 1;
          streak += 1;
          const doubled = streak >= 3;
          if (doubled) pts *= 2;
          score += pts;
          flash = { txt: '+' + pts + (doubled ? ' (streak)' : ''), x: g.x, y: g.y - g.r - 8, ttl: 0.6 };
          return;
        }
      }
      streak = 0;
    });

    function drawTarget(g) {
      ctx.fillStyle = P.ink;
      ctx.fillRect(g.x - 4, g.y, 8, g.r + 26);
      [[1, P.cream], [0.66, P.patriot], [0.33, P.cream]].forEach(([f, c]) => {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r * f, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = P.patriot;
      ctx.beginPath(); ctx.arc(g.x, g.y, Math.max(2, g.r * 0.1), 0, Math.PI * 2); ctx.fill();
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t -= dt; spawnIn -= dt;
      if (spawnIn <= 0) {
        targets.push({
          x: 60 + Math.random() * (W - 120), y: 100 + Math.random() * (H - 180),
          r: 0, max: 26 + Math.random() * 14, age: 0, life: 2.4
        });
        spawnIn = 0.5 + Math.random() * 0.5;
      }
      targets.forEach(g => {
        g.age += dt;
        g.r = g.age < 0.3 ? g.max * (g.age / 0.3)
          : g.max * Math.max(0, 1 - (g.age - 0.3) / g.life);
      });
      targets = targets.filter(g => g.r > 3);

      ctx.fillStyle = P.parchment; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.pale; ctx.fillRect(0, H - 46, W, 46);
      ctx.strokeStyle = P.brass; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H - 46); ctx.lineTo(W, H - 46); ctx.stroke();
      targets.forEach(drawTarget);
      if (flash) {
        flash.ttl -= dt;
        ctx.fillStyle = P.navy; ctx.font = 'bold 16px Georgia'; ctx.textAlign = 'center';
        ctx.fillText(flash.txt, flash.x, flash.y);
        if (flash.ttl <= 0) flash = null;
      }
      hud(ctx, W, 'score: ' + score, 'streak: ' + streak, Math.ceil(t) + 's');
      if (t <= 0) {
        setBest(opts.key, score); addCoins(score);
        endPanel(ctx, W, H, ['Drill over', score + ' coins earned', 'best: ' + best(opts.key) + ' · treasury: ' + coins()]);
        onEnd(score);
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  function start(kind, canvas, opts) {
    destroy();
    if (opts.button) { opts.button.disabled = true; activeBtn = opts.button; }
    const done = () => {
      if (opts.button) { opts.button.disabled = false; opts.button.textContent = 'Play again'; }
      activeBtn = null;
    };
    (kind === 'export' ? exportRun : range)(canvas, opts, done);
  }

  return { start, destroy, idle, coins, best };
})();
