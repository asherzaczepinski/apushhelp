// 3D harbor: the export run in three.js. Click barrels to load the ship,
// leave the crown customs crates alone. Falls back to the 2D game when
// WebGL or three.js is unavailable.
window.Harbor3D = (function () {
  const C = {
    parchment: 0xf5ecd7, cream: 0xfffaf0, ink: 0x2b2118, navy: 0x1b2a38,
    patriot: 0x8c1c13, brass: 0x8b6f47, sea: 0x5a6b7a, deck: 0x6e5636
  };
  let raf = 0, renderer = null, host = null, listeners = [];

  function supported() {
    if (!window.THREE) return false;
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function destroy() {
    cancelAnimationFrame(raf);
    listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    listeners = [];
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    if (host) {
      const hud = host.querySelector('.h3d-hud');
      if (hud) hud.remove();
      host = null;
    }
  }
  function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }

  function start(container, opts) {
    destroy();
    host = container;
    const W = Math.min(680, container.clientWidth || 640), H = 400;
    const T = window.THREE;

    renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    container.appendChild(renderer.domElement);

    const hud = document.createElement('div');
    hud.className = 'h3d-hud';
    container.appendChild(hud);

    const scene = new T.Scene();
    scene.background = new T.Color(C.parchment);
    scene.fog = new T.Fog(C.parchment, 22, 42);

    const camera = new T.PerspectiveCamera(52, W / H, 0.1, 100);
    camera.position.set(0, 7, 12);
    camera.lookAt(0, 0.8, 0);

    scene.add(new T.HemisphereLight(C.cream, C.brass, 1.05));
    const sun = new T.DirectionalLight(0xfff2d5, 0.8);
    sun.position.set(-6, 10, 6);
    scene.add(sun);

    const mat = c => new T.MeshLambertMaterial({ color: c });

    const water = new T.Mesh(new T.PlaneGeometry(80, 40), mat(C.sea));
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // the pier
    const dock = new T.Mesh(new T.BoxGeometry(17, 0.5, 4.2), mat(C.deck));
    dock.position.set(1.5, 0.85, 0);
    scene.add(dock);
    for (let px = -6; px <= 9; px += 3) {
      const post = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 1.6, 8), mat(C.brass));
      post.position.set(px, 0.4, 2.0);
      scene.add(post);
      const post2 = post.clone(); post2.position.z = -2.0; scene.add(post2);
    }

    // the ship
    const ship = new T.Group();
    const hull = new T.Mesh(new T.BoxGeometry(3.4, 1.7, 2.6), mat(C.navy));
    hull.position.y = 0.85;
    const bow = new T.Mesh(new T.ConeGeometry(1.3, 2, 4), mat(C.navy));
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 0.85, 1.9);
    const mast = new T.Mesh(new T.CylinderGeometry(0.09, 0.12, 5, 8), mat(C.brass));
    mast.position.y = 3.6;
    const sail = new T.Mesh(new T.PlaneGeometry(2.2, 2.6),
      new T.MeshLambertMaterial({ color: C.cream, side: T.DoubleSide }));
    sail.position.set(0, 3.8, 0.05);
    const stripe = new T.Mesh(new T.PlaneGeometry(2.2, 0.35),
      new T.MeshLambertMaterial({ color: C.patriot, side: T.DoubleSide }));
    stripe.position.set(0, 3.1, 0.06);
    ship.add(hull, bow, mast, sail, stripe);
    ship.rotation.y = Math.PI / 2;
    ship.position.set(-7.5, 0, 0);
    scene.add(ship);

    // cargo
    const barrels = [];
    const barrelGeo = new T.CylinderGeometry(0.42, 0.42, 0.85, 12);
    const crateGeo = new T.BoxGeometry(0.85, 0.85, 0.85);
    function spawn() {
      const crown = Math.random() < 0.22;
      const mesh = crown
        ? new T.Mesh(crateGeo, mat(C.patriot))
        : new T.Mesh(barrelGeo, mat(C.brass));
      mesh.position.set(10, 1.55, -1.3 + Math.random() * 2.6);
      mesh.userData = { crown, state: 'roll' };
      scene.add(mesh);
      barrels.push(mesh);
    }

    let t = 45, score = 0, speed = 3.4, spawnIn = 0.4, flash = '', flashTtl = 0;
    let last = performance.now(), ended = false;

    const ray = new T.Raycaster(), ptr = new T.Vector2();
    on(renderer.domElement, 'pointerdown', e => {
      if (ended) return;
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(barrels.filter(b => b.userData.state === 'roll'));
      if (!hits.length) return;
      const m = hits[0].object;
      if (m.userData.crown) {
        score = Math.max(0, score - 3);
        flash = 'customs! -3'; flashTtl = 0.9;
        m.userData.state = 'sink';
      } else {
        score += 2;
        flash = '+2'; flashTtl = 0.5;
        m.userData.state = 'fly';
      }
    });

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!ended) {
        t -= dt; speed += dt * 0.12; spawnIn -= dt;
        if (spawnIn <= 0) { spawn(); spawnIn = 0.55 + Math.random() * 0.6; }
        for (let i = barrels.length - 1; i >= 0; i--) {
          const b = barrels[i], s = b.userData.state;
          if (s === 'roll') {
            b.position.x -= speed * dt;
            b.rotation.z += speed * dt * 1.4;
            if (b.position.x < -5.2) b.userData.state = 'sink';
          } else if (s === 'fly') {
            b.position.x += (-7.5 - b.position.x) * 6 * dt;
            b.position.y += (2.6 - b.position.y) * 6 * dt;
            if (b.position.x < -6.8) { scene.remove(b); barrels.splice(i, 1); }
          } else {
            b.position.y -= 3 * dt;
            if (b.position.y < -1.4) { scene.remove(b); barrels.splice(i, 1); }
          }
        }
        camera.position.x = Math.sin(now / 2400) * 0.5;
        camera.lookAt(0, 0.8, 0);
        ship.position.y = Math.sin(now / 900) * 0.06;
        if (flashTtl > 0) flashTtl -= dt;
        hud.innerHTML =
          '<span>loaded: ' + score + '</span>' +
          '<span>' + (opts.title || opts.good || '') + '</span>' +
          '<span>' + Math.ceil(t) + 's</span>' +
          (flashTtl > 0 ? '<em class="' + (flash[0] === 'c' ? 'bad' : 'good') + '">' + flash + '</em>' : '');
        if (t <= 0) {
          ended = true;
          hud.innerHTML = '<span class="h3d-end">Run over — ' + score + ' loaded</span>';
          if (opts.onScore) opts.onScore(score);
        }
      }
      renderer.render(scene, camera);
      if (!ended) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  return { start, destroy, supported };
})();
