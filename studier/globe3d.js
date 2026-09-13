// Gilded Globe renderer: a three.js Earth drawn as an antique chart,
// with clickable territory markers. Drag to spin, scroll to zoom.
window.Globe3D = (function () {
  const R = 5;
  let renderer = null, raf = 0, listeners = [], markers = {}, controls = null;

  function destroy() {
    cancelAnimationFrame(raf);
    listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    listeners = [];
    markers = {};
    if (controls && controls.dispose) controls.dispose();
    controls = null;
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer = null;
    }
  }
  function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }

  function lonLatToXY(lon, lat, W, H) {
    return [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  }
  function lonLatToVec3(lon, lat, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta));
  }

  function makeChartTexture() {
    const W = 2048, H = 1024;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#28394b';                       // ocean
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(217,201,163,0.13)';      // graticule
    g.lineWidth = 2;
    for (let lon = -180; lon <= 180; lon += 15) {
      const [x] = lonLatToXY(lon, 0, W, H);
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const [, y] = lonLatToXY(0, lat, W, H);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    (window.WORLD_LAND || []).forEach(poly => {
      g.beginPath();
      poly.forEach(([lon, lat], i) => {
        const [x, y] = lonLatToXY(lon, lat, W, H);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath();
      g.fillStyle = '#e7dcc2';
      g.fill();
      g.strokeStyle = '#8b6f47';
      g.lineWidth = 3;
      g.stroke();
    });
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function start(container, opts) {
    destroy();
    const W = Math.min(700, container.clientWidth || 660), H = 440;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5ecd7);

    // start pulled back, facing North America
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(-1.2, 7, 12.5);

    scene.add(new THREE.HemisphereLight(0xfffaf0, 0x8b6f47, 1.15));
    const sun = new THREE.DirectionalLight(0xfff2d5, 0.55);
    sun.position.set(-8, 6, 8);
    scene.add(sun);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 48),
      new THREE.MeshLambertMaterial({ map: makeChartTexture() }));
    scene.add(globe);

    const pickables = [];
    (opts.territories || []).forEach(t => {
      const group = new THREE.Group();
      const surface = lonLatToVec3(t.lon, t.lat, R);
      const out = surface.clone().normalize();

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6),
        new THREE.MeshLambertMaterial({ color: 0x2b2118 }));
      pole.position.copy(surface.clone().add(out.clone().multiplyScalar(0.27)));
      pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xfffaf0 }));
      head.position.copy(surface.clone().add(out.clone().multiplyScalar(0.6)));

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 8, 6),
        new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(head.position);
      hit.userData.tid = t.id;

      group.add(pole, head, hit);
      scene.add(group);
      pickables.push(hit);
      markers[t.id] = { head, pole };
    });

    // trade-route arcs bowing out over the globe, with an arrowhead
    (opts.routes || []).forEach(rt => {
      const a = lonLatToVec3(rt.from[0], rt.from[1], R).normalize();
      const b = lonLatToVec3(rt.to[0], rt.to[1], R).normalize();
      const pts = [];
      const N = 50;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const v = a.clone().lerp(b, t).normalize();
        v.multiplyScalar(R * (1 + 0.22 * Math.sin(Math.PI * t)));
        pts.push(v);
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const col = rt.color || 0x8c1c13;
      scene.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve, 60, 0.035, 6, false),
        new THREE.MeshBasicMaterial({ color: col })));
      const tip = pts[pts.length - 1];
      const dir = tip.clone().sub(pts[pts.length - 3]).normalize();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 8),
        new THREE.MeshBasicMaterial({ color: col }));
      cone.position.copy(tip);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      scene.add(cone);
    });

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 16;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let downX = 0, downY = 0;
    on(renderer.domElement, 'pointerdown', e => { downX = e.clientX; downY = e.clientY; });
    on(renderer.domElement, 'pointerup', e => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(pickables);
      if (hits.length && opts.onPick) opts.onPick(hits[0].object.userData.tid);
    });

    function frame() {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  function setOwners(colorById, selectedId) {
    Object.entries(markers).forEach(([id, m]) => {
      const hex = colorById[id] || '#fffaf0';
      m.head.material.color.set(hex);
      const s = id === selectedId ? 1.55 : 1;
      m.head.scale.set(s, s, s);
    });
  }

  return { start, destroy, setOwners };
})();
